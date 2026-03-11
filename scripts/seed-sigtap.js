#!/usr/bin/env node
/**
 * Seed script: Populate sus_procedures with SIGTAP data from DATASUS
 *
 * Data source: rdsilva/SIGTAP consolidated CSV on GitHub
 * Contains ~4,500 SUS procedures with codes, names, values, and classifications
 *
 * Usage:
 *   node scripts/seed-sigtap.js
 *
 * Environment variables (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_KEY     - Service role key (bypasses RLS)
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// --- Load .env.local ---
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  console.error('[seed-sigtap] Could not read .env.local - set env vars manually');
}

// --- Config ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CSV_URL = 'https://raw.githubusercontent.com/rdsilva/SIGTAP/master/Resultado/tabela-sigtap-2025-10-22.csv';
const BATCH_SIZE = 500;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[seed-sigtap] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Mappings ---
const COMPLEXIDADE_MAP = {
  '0': 'nao_se_aplica',
  '1': 'basica',
  '2': 'media',
  '3': 'alta',
};

const TIPO_MAP = {
  '01': 'procedimento',  // Acoes de promocao e prevencao em saude
  '02': 'exame',         // Procedimentos com finalidade diagnostica
  '03': 'consulta',      // Procedimentos clinicos
  '04': 'cirurgia',      // Procedimentos cirurgicos
  '05': 'cirurgia',      // Transplantes de orgaos, tecidos e celulas
  '06': 'medicamento',   // Medicamentos
  '07': 'procedimento',  // Orteses, proteses e materiais especiais
  '08': 'terapia',       // Acoes complementares da atencao a saude
};

// --- Helpers ---
function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    const request = (targetUrl) => {
      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} fetching CSV`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        res.on('error', reject);
      }).on('error', reject);
    };
    request(url);
  });
}

function parseValue(raw) {
  // SIGTAP stores values as 12-digit zero-padded centavos: 000000000270 = R$ 2.70
  const n = parseInt(raw, 10);
  return isNaN(n) ? 0 : n / 100;
}

function parseCompetencia(raw) {
  // Transform 202510 -> 2025-10
  if (!raw || raw.length < 6) return null;
  const cleaned = raw.replace(/"/g, '').trim();
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}`;
}

function cleanField(val) {
  if (!val) return null;
  const cleaned = val.replace(/^"|"$/g, '').trim();
  return cleaned || null;
}

function deriveModalidade(vl_sa, vl_sh) {
  const sa = parseValue(vl_sa);
  const sh = parseValue(vl_sh);
  if (sa > 0 && sh > 0) return 'ambos';
  if (sa > 0) return 'ambulatorial';
  if (sh > 0) return 'hospitalar';
  return null;
}

// --- Main ---
async function run() {
  console.log('[seed-sigtap] Starting SIGTAP seed...');
  console.log(`[seed-sigtap] Supabase URL: ${SUPABASE_URL}`);

  // 1. Fetch CSV
  console.log('[seed-sigtap] Fetching CSV from GitHub...');
  let csvContent;
  try {
    csvContent = await fetchCSV(CSV_URL);
  } catch (err) {
    console.error(`[seed-sigtap] Failed to fetch CSV: ${err.message}`);
    process.exit(1);
  }

  // 2. Parse CSV
  const lines = csvContent.split('\n').filter((l) => l.trim());
  if (lines.length < 2) {
    console.error('[seed-sigtap] CSV is empty or has no data rows');
    process.exit(1);
  }

  const header = lines[0].split(';').map((h) => h.replace(/^"|"$/g, '').trim());
  console.log(`[seed-sigtap] CSV header: ${header.join(', ')}`);
  console.log(`[seed-sigtap] Total CSV rows: ${lines.length - 1}`);

  // Column index lookup
  const col = {};
  header.forEach((name, idx) => { col[name] = idx; });

  const required = ['co_procedimento', 'no_procedimento', 'dt_competencia', 'vl_sa', 'vl_sh'];
  for (const r of required) {
    if (col[r] === undefined) {
      console.error(`[seed-sigtap] Missing required CSV column: ${r}`);
      process.exit(1);
    }
  }

  // 3. Parse rows and deduplicate by co_procedimento
  // Multiple rows per procedure exist (different financiamento/rubrica).
  // We keep the max values for vl_sa and vl_sh across all rows.
  const procedureMap = new Map();
  let parseErrors = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(';');
    if (fields.length < header.length - 1) {
      parseErrors++;
      continue;
    }

    const codigo = cleanField(fields[col['co_procedimento']]);
    if (!codigo) {
      parseErrors++;
      continue;
    }

    const competencia = parseCompetencia(fields[col['dt_competencia']]);
    if (!competencia) {
      parseErrors++;
      continue;
    }

    const vl_sa = parseValue(fields[col['vl_sa']]);
    const vl_sh = parseValue(fields[col['vl_sh']]);
    const key = codigo;

    if (procedureMap.has(key)) {
      // Keep max values across financiamento rows
      const existing = procedureMap.get(key);
      existing.valor_ambulatorial = Math.max(existing.valor_ambulatorial, vl_sa);
      existing.valor_hospitalar = Math.max(existing.valor_hospitalar, vl_sh);
    } else {
      const coGrupo = cleanField(fields[col['co_grupo']]) || '';
      const tpComplexidade = cleanField(fields[col['tp_complexidade']]) || '0';

      procedureMap.set(key, {
        codigo_sigtap: codigo,
        nome: cleanField(fields[col['no_procedimento']]) || 'SEM NOME',
        competencia,
        valor_ambulatorial: vl_sa,
        valor_hospitalar: vl_sh,
        complexidade: COMPLEXIDADE_MAP[tpComplexidade] || 'nao_se_aplica',
        grupo: cleanField(fields[col['no_grupo']]),
        subgrupo: cleanField(fields[col['no_sub_grupo']]),
        forma_organizacao: cleanField(fields[col['no_forma_organizacao']]),
        tipo: TIPO_MAP[coGrupo] || 'procedimento',
        codigo_grupo: cleanField(fields[col['co_grupo']]),
        codigo_subgrupo: cleanField(fields[col['co_sub_grupo']]),
        codigo_forma_organizacao: cleanField(fields[col['co_forma_organizacao']]),
      });
    }
  }

  // Derive modalidade based on final values
  const records = Array.from(procedureMap.values()).map((rec) => ({
    ...rec,
    modalidade: rec.valor_ambulatorial > 0 && rec.valor_hospitalar > 0
      ? 'ambos'
      : rec.valor_ambulatorial > 0
        ? 'ambulatorial'
        : rec.valor_hospitalar > 0
          ? 'hospitalar'
          : null,
  }));

  console.log(`[seed-sigtap] Parsed ${records.length} unique procedures (${parseErrors} parse errors skipped)`);

  // 4. Upsert in batches
  let inserted = 0;
  let errors = 0;
  const totalBatches = Math.ceil(records.length / BATCH_SIZE);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const { error } = await supabase
      .from('sus_procedures')
      .upsert(batch, { onConflict: 'codigo_sigtap,competencia' });

    if (error) {
      console.error(`[seed-sigtap] Batch ${batchNum}/${totalBatches} error: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`[seed-sigtap] Batch ${batchNum}/${totalBatches} OK (${batch.length} records)`);
    }
  }

  // 5. Summary
  console.log('\n[seed-sigtap] === Summary ===');
  console.log(`[seed-sigtap] Total unique procedures: ${records.length}`);
  console.log(`[seed-sigtap] Inserted/updated: ${inserted}`);
  console.log(`[seed-sigtap] Errors: ${errors}`);
  console.log(`[seed-sigtap] Parse errors skipped: ${parseErrors}`);

  // 6. Verify
  const { count } = await supabase
    .from('sus_procedures')
    .select('*', { count: 'exact', head: true });
  console.log(`[seed-sigtap] Total rows in sus_procedures: ${count}`);

  // Group distribution
  const { data: groups } = await supabase
    .from('sus_procedures')
    .select('codigo_grupo, grupo')
    .order('codigo_grupo');

  if (groups) {
    const groupCounts = {};
    for (const g of groups) {
      const key = `${g.codigo_grupo} - ${g.grupo}`;
      groupCounts[key] = (groupCounts[key] || 0) + 1;
    }
    console.log('\n[seed-sigtap] Distribution by grupo:');
    for (const [name, count] of Object.entries(groupCounts).sort()) {
      console.log(`  ${name}: ${count}`);
    }
  }

  console.log('\n[seed-sigtap] Done!');
}

run().catch((err) => {
  console.error('[seed-sigtap] Fatal error:', err);
  process.exit(1);
});
