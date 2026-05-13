# R.O.M.A — Roadmap e Checklist de Desenvolvimento

> Marque cada item com `[x]` conforme for concluindo.

---

## Situação atual

O core do sistema está funcionando:
- Leitura de dados (Excel, OCR, Manual)
- Geocodificação (Google Maps API e OpenRouteService)
- Geração de matriz de distâncias e tempos
- Algoritmo de otimização TSP + refinamento 2-Opt
- Saída em JSON com rota otimizada e dados de pacotes vinculados

---

## Fase 1 — Correções urgentes no código atual

- [X] **Corrigir bug de encoding UTF-8 nos endereços**
  - `São Paulo` aparece como `SÃ£o Paulo` no JSON de saída
  - Corrigir em `ExecelService.js` e `GeolocationService.js`
  - Adicionar `{ encoding: 'utf8' }` no `fs.writeFileSync` do controller

- [X] **Adicionar tratamento de erro global no `OtimizacaoController`**
  - Um endereço inválido não pode derrubar todo o fluxo
  - Retornar `{ status: 'error', erro: mensagem }` em vez de crashar

- [X] **Validar entrada mínima antes de rodar**
  - Exigir ao menos 1 depósito + 1 entrega
  - Validar no `InputService` antes de chamar o geocoding

---

## Fase 2 — Banco de dados (SQLite)

> Necessário para o fluxo empresa → entregador → rota → resultado.

- [X] **Instalar `better-sqlite3` e criar `src/database/db.js`**
  - `npm install better-sqlite3`
  - SQLite local, sem servidor — ideal para TCC
  - Criar arquivo com conexão e execução de migrations

- [X] **Criar tabela `empresas`**
  ```sql
  CREATE TABLE empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    senha_has TEXT NOT NULL
  );
  ```

- [X] **Criar tabela `entregadores`**
  ```sql
  CREATE TABLE entregadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    veiculo TEXT,
    cpf TEXT NOT NULL,
    senha_has TEXT NOT NULL
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
  );
  ```

- [X] **Criar tabela `rotas`**
  ```sql
  CREATE TABLE rotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    entregador_id INTEGER,
    data DATE NOT NULL,
    status TEXT DEFAULT 'pendente', -- pendente | em_andamento | concluida
    km_original REAL,
    km_otimizado REAL,
    economia_km REAL,
    tempo_estimado_min INTEGER,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    FOREIGN KEY (entregador_id) REFERENCES entregadores(id)
  );
  ```

- [X] **Criar tabela `paradas`**
  ```sql
  CREATE TABLE paradas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rota_id INTEGER NOT NULL,
    posicao INTEGER NOT NULL,
    endereco TEXT NOT NULL,
    lat REAL,
    lng REAL,
    status_entrega TEXT DEFAULT 'pendente', -- pendente | entregue | falhou
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rota_id) REFERENCES rotas(id)
  );
  ```

- [X] **Criar tabela `pacotes`**
  ```sql
  CREATE TABLE pacotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parada_id INTEGER NOT NULL,
    codigo TEXT,
    destinatario TEXT,
    observacao TEXT,
    FOREIGN KEY (parada_id) REFERENCES paradas(id)
  );
  ```

- [X] **Criar tabela `resultados`**
  ```sql
  CREATE TABLE resultados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rota_id INTEGER NOT NULL UNIQUE,
    km_real REAL,
    tempo_real_min INTEGER,
    entregas_ok INTEGER DEFAULT 0,
    entregas_falha INTEGER DEFAULT 0,
    observacao TEXT,
    registrado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rota_id) REFERENCES rotas(id)
  );
  ```

- [ ] **Criar `src/services/DatabaseService.js`**
  - `salvarRota(dados)` — persiste rota e retorna ID
  - `salvarParadas(rota_id, paradas)` — persiste todas as paradas
  - `atualizarStatusParada(parada_id, status)` — entregador atualiza cada entrega
  - `salvarResultado(rota_id, dados)` — registra resultado final
  - `listarRotas(filtros)` — filtra por empresa, entregador, status, data
  - `buscarRota(id)` — retorna rota com paradas e pacotes

---

## Fase 3 — API REST com Express.js

- [ ] **Instalar dependências e criar `src/server.js`**
  - `npm install express cors multer`
  - `server.js` substitui `main.js` como ponto de entrada
  - Iniciar servidor na porta `3000` (ou `process.env.PORT`)

- [ ] **`POST /api/otimizar`** — recebe endereços e retorna rota otimizada
  - Body: `{ entregador_id, enderecos: [{ endereco, pacote }] }`
  - Resposta: `{ status, rota: [{ posicao, endereco, lat, lng, pacote }], metricas }`
  - Salvar no banco automaticamente após otimizar

- [ ] **`POST /api/upload`** — recebe arquivo Excel ou imagem para OCR
  - Multer recebe o arquivo em `multipart/form-data`
  - Passa para o `InputService` e retorna rota otimizada

- [ ] **`PATCH /api/paradas/:id/status`** — entregador atualiza status de cada parada
  - Body: `{ status: 'entregue' | 'falhou' }`
  - Atualiza `status_entrega` na tabela `paradas`

- [ ] **`POST /api/rotas/:id/resultado`** — entregador finaliza e registra o resultado
  - Body: `{ km_real, tempo_real_min, entregas_ok, entregas_falha, observacao }`
  - Atualiza status da rota para `concluida` e salva em `resultados`

- [ ] **`GET /api/rotas`** — lista rotas com filtros
  - Query params: `?empresa_id=1&entregador_id=2&status=pendente&data=2025-01-15`
  - Empresa vê todas. Entregador vê só as suas.

- [ ] **`GET /api/rotas/:id`** — detalhe completo de uma rota
  - Retorna rota + paradas + pacotes + resultado (se já registrado)

- [ ] **Padronizar formato de resposta em todos os endpoints**
  - Sucesso: `{ status: 'success', dados: { ... } }`
  - Erro: `{ status: 'error', erro: 'mensagem legível' }`

---

## Fase 4 — Testes e validação

- [ ] **Testar `POST /api/otimizar` com 5 endereços reais de SP via Postman**
  - Validar que coordenadas, ordem das paradas e economia estão corretos

- [ ] **Testar ciclo completo via API**
  - Otimizar rota → atualizar status de cada parada → registrar resultado final
  - Simular o fluxo real de um entregador do início ao fim

- [ ] **Comparar km R.O.M.A vs rota manual no Google Maps**
  - Documentar com prints e números para a apresentação do TCC

- [ ] **Testar cenários de erro**
  - Endereço inválido, API de mapas offline, Excel vazio, entregador inexistente
  - Garantir que a API retorna `{ status: 'error' }` sem travar

- [ ] **Testar upload de Excel pela rota `/api/upload`**
  - Verificar que o arquivo chega, é lido e a rota é retornada corretamente

---

## Fase 5 — Mapa visual e frontend

- [ ] **Criar `public/index.html` com Leaflet.js consumindo a API**
  - Mapa com pins numerados e linha da rota desenhada
  - Painel lateral com métricas (km original, km otimizado, economia)

- [ ] **Popup nos pins com dados do pacote e status da entrega**
  - Código do pacote, destinatário, observação
  - Botão para marcar como entregue ou falhou (chama `PATCH /api/paradas/:id/status`)

- [ ] **Painel de métricas: planejado vs real**
  - Comparar km planejado vs km real percorrido pelo entregador
  - Mostrar entregas realizadas com sucesso e falhas

- [ ] **Formulário de input unificado**
  - Aba Manual: campos de endereço + dados do pacote
  - Aba Upload: input de arquivo Excel ou imagem
  - Seleção de entregador antes de otimizar

---

## Fase 6 — Deploy e apresentação do TCC

- [ ] **Deploy da API no Railway ou Render (plano gratuito)**
  - URL pública para demonstrar sem depender do notebook
  - Railway recomendado: suporta Node.js e SQLite nativamente

- [ ] **Configurar variáveis de ambiente de produção**
  - Criar `.env.production` separado do `.env` de desenvolvimento
  - Nunca commitar chaves de API no repositório

- [ ] **Documentar as rotas da API no `README.md`**
  - Tabela com endpoint, método, body esperado e resposta de exemplo
  - Instruções de instalação e configuração para a banca avaliar

- [ ] **Preparar demo com dataset real de SP (10–15 endereços)**
  - Rota com pacotes e entregador definido mostrando o ciclo completo
  - Ter prints comparando R.O.M.A vs rota manual para mostrar a economia

---

## Resumo das dependências a instalar

```bash
# API
npm install express cors multer

# Banco de dados
npm install better-sqlite3

# OCR (já previsto)
npm install tesseract.js

# Variáveis de ambiente (já instalado)
npm install dotenv
```

---

## Arquitetura final do sistema

```
App (frontend / mobile)
        ↓  HTTP
API REST — Express.js  (src/server.js)
        ↓
Core R.O.M.A
  ├── InputService     (Excel · OCR · Manual)
  ├── GeolocationService  (Google · ORS)
  ├── MatrizService
  ├── OtimizacaoService   (TSP + 2-Opt)
  └── DatabaseService     (SQLite)
        ↓
Maps API (Google ou OpenRouteService)
```

---

*Última atualização: checklist gerado automaticamente durante o desenvolvimento do TCC.*
