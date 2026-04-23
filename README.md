# R.O.M.A — Rotas Otimizadas de Milha Ágil

> Sistema de roteirização inteligente de entregas de última milha, desenvolvido como Trabalho de Conclusão de Curso (TCC).

O R.O.M.A permite que empresas de logística otimizem rotas de entrega, reduzindo quilometragem percorrida e custos operacionais. A empresa cadastra os endereços e pacotes, o sistema gera a rota otimizada e a atribui a um entregador, que registra os resultados ao final da jornada.

---

## Funcionalidades implementadas

- **3 modos de entrada de dados:** planilha Excel, OCR em imagens/PDF e cadastro manual pelo terminal
- **Geocodificação** de endereços com suporte a Google Maps API e OpenRouteService (ORS)
- **Matriz de distâncias e tempos** entre todos os pontos da rota
- **Algoritmo de otimização TSP** (Vizinho Mais Próximo) com refinamento **2-Opt**
- **Vinculação de pacotes** a cada endereço de entrega (código, destinatário, observação)
- **Saída em JSON** com rota otimizada, coordenadas e métricas de desempenho
- **Suporte a múltiplos provedores** de mapas via padrão Adapter (troca sem alterar o core)

---

## Arquitetura do sistema

```
Entrada de dados
  ├── Excel (.xlsx)       → ExecelService
  ├── Imagem/PDF (OCR)    → OcrService
  └── Manual (terminal)   → ManualInputService
          ↓
      InputService  (orquestra os 3 modos)
          ↓
  GeolocationService  (geocodifica endereços)
  ├── GoogleGeocodingAdapter
  └── ORSGeocodingAdapter
          ↓
    MatrizService  (gera matriz de distâncias/tempos)
  ├── GoogleAdapter
  └── ORSAdapter
          ↓
  OtimizacaoService
  ├── TspService     (Vizinho Mais Próximo)
  └── TwoOptService  (refinamento 2-Opt)
          ↓
   OtimizacaoController  (orquestra o fluxo)
          ↓
  output/rota_final_otimizada.json
```

---

## Estrutura de pastas

```
R.O.M.A/
├── data/
│   └── input_enderecos.xlsx       # Planilha de entrada (modelo)
├── output/
│   ├── rota_final_otimizada.json  # Resultado da última otimização
│   └── geolocalizacao_resultados.json
├── src/
│   ├── adapters/
│   │   ├── GoogleAdapter.js           # Matriz via Google Maps
│   │   ├── GoogleGeocodingAdapter.js  # Geocoding via Google
│   │   ├── ORSAdapter.js              # Matriz via OpenRouteService
│   │   └── ORSGeocodingAdapter.js     # Geocoding via ORS
│   ├── config/
│   │   └── mapsConfig.js              # Lê MAPS_PROVIDER do .env
│   ├── controllers/
│   │   └── OtimizacaoController.js    # Orquestra o fluxo completo
│   └── services/
│       ├── ExecelService.js           # Leitura de Excel
│       ├── GeolocationService.js      # Geocodificação
│       ├── InputService.js            # Orquestra os 3 modos de entrada
│       ├── ManualInputService.js      # Entrada interativa pelo terminal
│       ├── MatrixService.js           # Matriz de distâncias
│       ├── OcrService.js              # Extração de texto via OCR
│       ├── OtimizacaoService.js       # Coordena TSP + 2-Opt
│       ├── TspService.js              # Algoritmo Vizinho Mais Próximo
│       └── TwoOptService.js           # Refinamento 2-Opt
├── .env.exemplo                       # Modelo de configuração
├── .gitignore
├── package.json
└── ROADMAP.md                         # Checklist de desenvolvimento
```

---

## Instalação

### Pré-requisitos

- Node.js 18 ou superior
- Chave de API do [Google Maps](https://developers.google.com/maps) **ou** do [OpenRouteService](https://openrouteservice.org/) (gratuito)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/VKMaskara/TCC_rotas_inteligentes.git
cd TCC_rotas_inteligentes

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.exemplo .env
# Edite o .env com suas chaves de API
```

---

## Configuração (.env)

```env
# Provedor de mapas: google ou ors
MAPS_PROVIDER=ors

# Chaves de API (preencha apenas o do provedor escolhido)
GOOGLE_MAPS_API_KEY=sua_chave_aqui
ORS_API_KEY=sua_chave_aqui

# Modo de entrada de dados: excel | ocr | manual
INPUT_MODE=excel

# Caminho do arquivo de entrada (para os modos excel e ocr)
# INPUT_FILE=data/input_enderecos.xlsx
```

> O OpenRouteService tem plano gratuito com 2.000 requisições/dia — ideal para desenvolvimento e TCC.

---

## Como usar

### Modo Excel (padrão)

Preencha a planilha `data/input_enderecos.xlsx` com os seguintes campos:

| Coluna | Obrigatório | Descrição |
|---|---|---|
| `Endereco` | Sim | Rua ou logradouro |
| `Numero` | Sim | Número do imóvel |
| `Bairro` | Não | Bairro |
| `Cidade` | Sim | Cidade |
| `Estado` | Sim | UF (ex: SP) |
| `Tipo` | Sim | `DEPOSITO` para a origem, `Entrega` para os demais |
| `Pacote` | Não | Código do pacote (ex: PKG-001) |
| `Destinatario` | Não | Nome do destinatário |
| `Observacao` | Não | Instruções de entrega |

> Deve haver exatamente **uma linha** marcada como `DEPOSITO` — ela é o ponto de partida e retorno da rota.

```bash
# Rodar com Excel (padrão)
npm start
```

### Modo manual (terminal interativo)

```bash
INPUT_MODE=manual npm start
```

O sistema irá solicitar os dados de cada endereço e pacote diretamente no terminal.

### Modo OCR (imagem ou PDF)

```bash
INPUT_MODE=ocr INPUT_FILE=data/romaneio.png npm start
```

O documento deve conter blocos de texto no seguinte formato:

```
PACOTE: PKG-001
DESTINATÁRIO: João Silva
ENDEREÇO: Rua Augusta, 2500
BAIRRO: Jardim Paulista
CIDADE: São Paulo
ESTADO: SP
OBS: Entregar na portaria
```

Blocos separados por uma linha em branco. O bloco com `TIPO: DEPOSITO` define a origem.

---

## Resultado gerado

Após a execução, o arquivo `output/rota_final_otimizada.json` contém:

```json
{
  "distanciaOriginal": 42.30,
  "distanciaOtimizada": 30.49,
  "economiaKm": 11.81,
  "tempoEstimadoMinutos": 87,
  "rotaIndices": [0, 2, 1, 4, 3],
  "rotaDetalhada": [
    {
      "posicao": 1,
      "endereco": "Av. Paulista, 1578, Bela Vista, São Paulo, Brasil",
      "tipo": "DEPOSITO",
      "pacote": null,
      "lat": -23.5613,
      "lng": -46.6565
    },
    {
      "posicao": 2,
      "endereco": "Rua Augusta, 2500, Jardim Paulista, São Paulo, Brasil",
      "tipo": "ENTREGA",
      "pacote": {
        "id": "PKG-001",
        "destinatario": "João Silva",
        "observacao": "Entregar na portaria"
      },
      "lat": -23.5551,
      "lng": -46.6671
    }
  ]
}
```

---

## Algoritmo de otimização

O R.O.M.A resolve o **Problema do Caixeiro Viajante (TSP)** em duas etapas:

**1. Vizinho Mais Próximo (TSP guloso)**
Partindo do depósito, sempre escolhe o próximo ponto não visitado com menor tempo de deslocamento. Gera uma solução inicial rápida.

**2. Refinamento 2-Opt**
Testa inversões de segmentos da rota para eliminar cruzamentos. Continua iterando até não encontrar mais melhorias ou atingir 1.000 tentativas.

Em testes com 25 endereços reais de São Paulo, o algoritmo gerou uma economia média de **11,81 km** por rota em relação à ordem original de entrada.

---

## Provedores de mapas suportados

| Funcionalidade | Google Maps | OpenRouteService |
|---|---|---|
| Geocodificação | GoogleGeocodingAdapter | ORSGeocodingAdapter |
| Matriz de distâncias | GoogleAdapter | ORSAdapter |
| Plano gratuito | Limitado (crédito mensal) | 2.000 req/dia |
| Precisão | Alta | Alta |

Para trocar de provedor, basta alterar `MAPS_PROVIDER` no `.env`. Nenhum código precisa ser alterado.

---

## Dependências

| Pacote | Versão | Uso |
|---|---|---|
| `xlsx` | ^0.18.5 | Leitura de planilhas Excel |
| `tesseract.js` | ^5.1.0 | OCR em imagens e PDFs |
| `axios` | ^1.13.6 | Requisições HTTP para as APIs de mapas |
| `@googlemaps/google-maps-services-js` | ^3.4.2 | SDK oficial do Google Maps |
| `dotenv` | ^17.2.3 | Carregamento de variáveis de ambiente |
| `csv-parser` | ^3.2.0 | Suporte a leitura de CSV |

---

## Próximos passos

Veja o arquivo [ROADMAP.md](./ROADMAP.md) para o checklist completo de desenvolvimento, incluindo:

- API REST com Express.js
- Banco de dados SQLite (empresas, entregadores, rotas, resultados)
- Mapa visual interativo com Leaflet.js
- Deploy no Railway

---
