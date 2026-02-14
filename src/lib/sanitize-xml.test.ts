import { describe, it, expect } from 'vitest';
import { sanitizeXml } from './sanitize-xml';

describe('sanitizeXml', () => {
  it('passes through clean XML', () => {
    const xml = '<guia><numero>123</numero></guia>';
    expect(sanitizeXml(xml)).toBe(xml);
  });

  it('removes script tags', () => {
    const xml = '<data><script>alert("xss")</script><item>ok</item></data>';
    expect(sanitizeXml(xml)).toBe('<data><item>ok</item></data>');
  });

  it('removes event handler attributes', () => {
    const xml = '<div onclick="alert(1)">test</div>';
    expect(sanitizeXml(xml)).toBe('<div>test</div>');
  });

  it('removes onerror attributes', () => {
    const xml = '<img onerror="alert(1)" src="x" />';
    expect(sanitizeXml(xml)).toBe('<img src="x" />');
  });

  it('removes javascript: URLs', () => {
    const xml = 'javascript:alert(1)';
    expect(sanitizeXml(xml)).not.toContain('javascript:');
  });

  it('removes data: URLs in href/src', () => {
    const xml = '<a href="data:text/html,<script>alert(1)</script>">click</a>';
    expect(sanitizeXml(xml)).not.toContain('data:');
  });

  it('handles complex TISS XML', () => {
    const xml = `<?xml version="1.0"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
    </ans:identificacaoTransacao>
  </ans:cabecalho>
</ans:mensagemTISS>`;
    expect(sanitizeXml(xml)).toBe(xml);
  });
});
