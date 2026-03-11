import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const BASE = 'http://localhost:3000';
const EMAIL = 'test@finhealth.dev';
const PASS = 'FinHealth2026!';
const XML_PATH = resolve('test-tiss-v2.xml');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(icon, msg) {
  console.log(`\n  ${icon}  ${msg}`);
}

(async () => {
  console.log('\n========================================');
  console.log('  BIG BROTHER MODE - FinHealth E2E');
  console.log('========================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
    args: ['--start-maximized']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ===== STEP 1: LOGIN =====
  log('1️⃣', 'Navegando para login...');
  await page.goto(`${BASE}/login`);
  await sleep(1500);

  log('✍️', `Digitando email: ${EMAIL}`);
  await page.fill('input[type="email"]', EMAIL);
  await sleep(500);

  log('🔑', 'Digitando senha...');
  await page.fill('input[type="password"]', PASS);
  await sleep(500);

  log('🚀', 'Clicando Entrar...');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  log('✅', 'Login OK! Dashboard carregado.');
  await sleep(2000);

  // ===== STEP 2: NAVIGATE TO TISS =====
  log('2️⃣', 'Navegando para TISS...');
  await page.click('a[href="/tiss"]');
  await page.waitForURL('**/tiss');
  log('✅', 'Pagina TISS carregada.');
  await sleep(1500);

  // ===== STEP 3: CLICK UPLOAD =====
  log('3️⃣', 'Clicando Upload XML...');
  await page.click('a[href="/tiss/upload"]');
  await page.waitForURL('**/tiss/upload');
  log('✅', 'Pagina de Upload carregada.');
  await sleep(1500);

  // ===== STEP 4: SELECT ACCOUNT =====
  log('4️⃣', 'Selecionando conta medica...');
  await page.click('button[role="combobox"]');
  await sleep(800);
  await page.click('[role="option"]:first-child');
  log('✅', 'Conta CT-2026-001 selecionada.');
  await sleep(1000);

  // ===== STEP 5: UPLOAD XML =====
  log('5️⃣', 'Fazendo upload do XML TISS...');
  const dropzone = page.locator('input[type="file"]');
  await dropzone.setInputFiles(XML_PATH);
  log('📄', 'Arquivo test-tiss-v2.xml anexado.');
  await sleep(1500);

  // ===== STEP 6: CLICK VALIDAR E ENVIAR =====
  log('6️⃣', 'Clicando "Validar e Enviar"...');
  await page.click('button:has-text("Validar e Enviar")');
  log('⏳', 'Aguardando resposta do n8n...');

  // Wait for validation result
  await page.waitForSelector('text=Validacao concluida', { timeout: 30000 });
  log('✅', 'VALIDACAO CONCLUIDA COM SUCESSO!');
  await sleep(1000);

  // Check for guide number
  const guideText = await page.textContent('span.font-mono');
  if (guideText) {
    log('📋', `Guia: ${guideText}`);
  }

  console.log('\n========================================');
  console.log('  E2E COMPLETO - TUDO FUNCIONANDO!');
  console.log('========================================\n');

  log('👁️', 'Big Brother mode ativo. Browser aberto para inspecao.');
  log('⏰', 'Fechando em 30 segundos...');
  await sleep(30000);

  await browser.close();
})();
