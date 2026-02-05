# FinHealth N8N Workflows

Este diretorio contem os workflows do n8n para automacao do FinHealth.

## Workflows

### 1. TISS Upload Webhook (`tiss-upload-webhook.json`)
- **Trigger**: Webhook POST `/tiss-upload`
- **Funcao**: Recebe XML TISS do frontend, valida codigos TUSS e atualiza status da conta
- **Endpoint**: `https://n8n.noxtec.com.br/webhook/tiss-upload`

### 2. Billing Agent Processor (`billing-agent-processor.json`)
- **Trigger**: Webhook POST `/billing-agent`
- **Funcao**: Analisa conta medica usando GPT-4o-mini para validar TUSS e calcular risco de glosa
- **Endpoint**: `https://n8n.noxtec.com.br/webhook/billing-agent`

### 3. Auditor Glosa Detector (`auditor-glosa-detector.json`)
- **Trigger**: Schedule (a cada 6 horas)
- **Funcao**: Busca contas validadas sem score de glosa, analisa com IA e notifica se risco >= 70%
- **Notificacao**: Envia para webhook `/glosa-notification`

### 4. Glosa Notification (`glosa-notification.json`)
- **Trigger**: Webhook POST `/glosa-notification`
- **Funcao**: Recebe alertas de glosa, salva no banco, envia email e atualiza status
- **Endpoint**: `https://n8n.noxtec.com.br/webhook/glosa-notification`

### 5. TUSS ANS Scraper (`tuss-ans-scraper.json`)
- **Trigger**: Schedule (semanal)
- **Funcao**: Busca tabela TUSS atualizada do portal ANS e sincroniza com Supabase
- **Fonte**: https://dadosabertos.ans.gov.br ou portal ANS

## Configuracao de Credenciais

### Supabase Auth (`supabase-auth`)
```
Header Name: apikey
Header Value: ${SUPABASE_SERVICE_KEY}

Header Name: Authorization
Header Value: Bearer ${SUPABASE_SERVICE_KEY}
```

### OpenAI API Key (`openai-key`)
```
API Key: ${OPENAI_API_KEY}
```

### SMTP (para notificacoes por email)
```
Host: smtp.noxtec.com.br
Port: 587
User: finhealth@noxtec.com.br
```

## Importando os Workflows

1. Acesse seu n8n em https://n8n.noxtec.com.br
2. Va em Settings > Import from File
3. Selecione cada arquivo .json desta pasta
4. Configure as credenciais apontando para os IDs corretos
5. Ative os workflows

## Tabelas Supabase Necessarias

Os workflows dependem das seguintes tabelas:
- `medical_accounts` - Contas medicas
- `procedures` - Procedimentos das contas
- `tuss_procedures` - Tabela TUSS de referencia
- `glosa_notifications` - Log de notificacoes de glosa (opcional)
- `sync_logs` - Log de sincronizacoes (opcional)
