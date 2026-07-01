# 🗺️  R.O.M.A — Rotas Otimizadas de Milha Ágil

<div align="center">

![R.O.M.A Banner](./public/img/logo.jpeg)

**Sistema completo de otimização e gestão de rotas de entrega**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)

</div>

---

## 📋 Sobre o Projeto

O **R.O.M.A** é uma plataforma web para empresas de entrega e seus entregadores autônomos. A empresa cadastra rotas com múltiplos pontos de entrega e o sistema aplica algoritmos de otimização (TSP + 2-Opt) para encontrar o menor caminho possível. O entregador recebe a rota otimizada no celular com mapa interativo e navegação integrada.

### Problema que resolve

Empresas de entrega perdem tempo e dinheiro planejando rotas manualmente. O R.O.M.A automatiza esse processo, calculando a sequência ideal de entregas e reduzindo quilômetros rodados e tempo de deslocamento.

---

## ✨ Funcionalidades

### Para a Empresa
- 📊 **Dashboard** com visão geral de rotas, entregadores e estatísticas
- 🗺️ **Criação de rotas otimizadas** via endereços manuais ou upload de planilha Excel
- 👥 **Gestão de entregadores** — cadastro, perfil e atribuição de rotas
- 📍 **Detalhes de rota** com todas as paradas, status e histórico
- ✏️ **Edição de rotas** — alterar status, entregador e data
- ⚙️ **Configurações** — dados da empresa, senha e exclusão de conta

### Para o Entregador
- 📱 **Tela mobile-first** com lista de rotas atribuídas
- 🗺️ **Mapa interativo** com pins numerados e linha de rota
- 📍 **Rastreamento em tempo real** — ponto azul mostrando localização atual
- 🧭 **Navegação integrada** — abre Waze ou Google Maps com um toque
- ✅ **Confirmação de entrega** por parada individual
- 🏁 **Finalização de rota** com registro automático no banco

---

## 🖥️ Telas do Sistema

### Portal da Empresa
| Tela | Descrição |
|------|-----------|
| Login | Autenticação com JWT por tipo de usuário |
| Dashboard | Visão geral com cards de métricas e rotas recentes |
| Rotas | Listagem com filtro, status colorido e ações |
| Detalhes da Rota | Informações completas, paradas e histórico |
| Editar Rota | Alteração de status, entregador e data |
| Entregadores | Lista de entregadores da empresa |
| Perfil do Entregador | Dados, veículo e estatísticas |
| Configurações | Dados da empresa, senha e exclusão |

### Portal do Entregador
| Tela | Descrição |
|------|-----------|
| Minhas Rotas | Cards com rotas atribuídas e resumo de métricas |
| Mapa da Rota | Mapa Leaflet com navegação e confirmação de entregas |

---

## 🏗️ Arquitetura

```
R.O.M.A_Otimizador-Rotas/
├── src/                          # Backend (Node.js + Express)
│   ├── controllers/              # Controladores das rotas HTTP
│   ├── services/                 # Regras de negócio
│   │   ├── RotaService.js        # Orquestração da otimização
│   │   ├── OtimizacaoService.js  # TSP + 2-Opt
│   │   ├── MatrixService.js      # Matriz de distâncias
│   │   └── GeolocationService.js # Geocodificação de endereços
│   ├── models/                   # Acesso ao banco de dados (Knex)
│   ├── routes/                   # Definição dos endpoints
│   ├── middlewares/              # Auth JWT, upload, validações
│   └── database/
│       ├── db.js                 # Conexão SQLite via Knex
│       └── migrations/           # Estrutura das tabelas
│
├── public/                       # Frontend (HTML + CSS + JS)
│   ├── cadastro/                 # Tela de cadastro de empresa
│   ├── login/                    # Tela de login
│   ├── empresa/                  # Portal da empresa
│   │   ├── *.html
│   │   ├── css/
│   │   └── js/
│   └── entregador/               # Portal do entregador
│       ├── rotas.html
│       ├── rota-entregador.html
│       ├── css/
│       └── js/
```

---

## 🔧 Tecnologias

### Backend
- **Node.js** + **Express.js** — servidor HTTP
- **Knex.js** — query builder e migrations
- **SQLite** — banco de dados relacional
- **JWT** — autenticação stateless por tipo de usuário
- **Multer** — upload de planilhas
- **bcrypt** — hash de senhas

### Frontend
- **HTML5** + **CSS3** + **JavaScript** puro
- **Bootstrap 5.3** — componentes e grid responsivo
- **Bootstrap Icons** — ícones
- **Leaflet.js** — mapas interativos (OpenStreetMap)

### Algoritmos
- **TSP (Travelling Salesman Problem)** — encontra a rota mais curta
- **2-Opt** — melhoria iterativa da solução inicial
- **Geocodificação** — converte endereços em coordenadas lat/lng

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- npm

### Instalação

```bash
# Clone o repositório
git clone https://github.com/VKMaskara/R.O.M.A_Otimizador-Rotas.git
cd R.O.M.A_Otimizador-Rotas

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.exemplo .env
# Edite o .env com suas chaves de API
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz com:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta_aqui
ORS_API_KEY=sua_chave_openrouteservice
```

> A chave ORS é gratuita e pode ser obtida em [openrouteservice.org](https://openrouteservice.org)

### Banco de Dados

```bash
# Cria as tabelas via migrations
npx knex migrate:latest
```

### Iniciando

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

O servidor sobe em `http://localhost:3000`

Para acessar o frontend, use o Live Server do VS Code ou qualquer servidor estático na pasta `public/`.

---

## 📡 API — Principais Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login de empresa ou entregador |

### Empresas
| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/empresas` | Público | Cadastro de empresa |
| GET | `/empresas/:id` | Empresa | Buscar empresa |
| PUT | `/empresas/:id` | Empresa | Atualizar dados |
| DELETE | `/empresas/:id` | Empresa | Desativar empresa |

### Rotas
| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/rotas/otimizar` | Empresa | Criar rota via JSON |
| POST | `/rotas/otimizar-excel` | Empresa | Criar rota via planilha |
| GET | `/rotas` | Empresa | Listar rotas da empresa |
| GET | `/rotas/:id` | Empresa | Detalhar rota com paradas |
| PUT | `/rotas/:id` | Empresa | Editar rota |
| PATCH | `/rotas/:id/entregador` | Empresa | Atribuir entregador |
| POST | `/rotas/:id/resultado` | Entregador | Finalizar rota |

### Paradas
| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| PATCH | `/paradas/:id/status` | Entregador | Marcar entrega como `entregue` ou `falhou` |

### Entregadores
| Método | Endpoint | Acesso | Descrição |
|--------|----------|--------|-----------|
| POST | `/entregadores` | Empresa | Cadastrar entregador |
| GET | `/entregadores` | Empresa | Listar entregadores |
| GET | `/entregadores/:id` | Empresa | Buscar entregador |
| PUT | `/entregadores/:id` | Empresa | Atualizar entregador |
| GET | `/entregadores/minha-rota` | Entregador | Listar rotas do entregador logado |

---

## 🗄️ Banco de Dados

```
usuarios ──────────┐
                   ├── empresas ──── rotas ──── paradas ──── pacotes
                   └── entregadores ──┘              └── resultados
```

### Tabelas principais
- **usuarios** — login e tipo (EMPRESA / ENTREGADOR)
- **empresas** — dados cadastrais da empresa
- **entregadores** — dados do entregador + veículo
- **rotas** — rota otimizada com métricas
- **paradas** — pontos de entrega com lat/lng e status
- **pacotes** — dados do destinatário vinculados à parada
- **resultados** — resultado final da rota

---

## 📱 Portal do Entregador — Mapa

O mapa da rota usa **Leaflet + OpenStreetMap** (100% gratuito) e oferece:

- **Pins coloridos** — laranja (pendente), verde (entregue), azul escuro (depósito)
- **Linha tracejada** — sequência otimizada da rota
- **Ponto azul** — localização atual do entregador via GPS do dispositivo
- **Linha de navegação** — tracejado azul do ponto atual até a próxima entrega
- **Painel swipeable** — arraste para cima para ver a lista completa de paradas
- **Botão Navegar** — abre Waze (se instalado) ou Google Maps com o destino preenchido

---

## 👥 Fluxo de Uso

```
1. Empresa se cadastra
2. Empresa cria entregadores
3. Empresa cria rota (endereços manuais ou planilha)
   └── Sistema geocodifica os endereços
   └── Aplica TSP + 2-Opt
   └── Salva rota otimizada com paradas no banco
4. Empresa atribui entregador à rota
5. Entregador faz login → vê suas rotas
6. Entregador inicia rota → abre mapa
7. Entregador navega por cada parada
   └── Confirma cada entrega (PATCH /paradas/:id/status)
8. Entregador finaliza rota (POST /rotas/:id/resultado)
9. Empresa vê resultado no dashboard
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch: `git checkout -b feat/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: minha feature'`
4. Push para a branch: `git push origin feat/minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

Desenvolvido com ☕ e muito JavaScript

**[⬆ Voltar ao topo](#️-roma--roteirizador-e-otimizador-de-malha-para-autônomos)**

</div>
