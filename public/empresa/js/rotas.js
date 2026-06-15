// ═══════════════════════════════════════════════════════
//  R.O.M.A — rotas.js  |  Integração completa com backend
// ═══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {

    // Carrega as rotas do banco ao abrir a página
    carregarRotas();

    // Botão Nova Rota
   const novaRotaBtn = document.getElementById("btnNovaRota");
    if (novaRotaBtn) {
        novaRotaBtn.addEventListener("click", function () {
            window.location.href = "nova-rota.html";
        });
    }

    // Logout
    const sairBtn = document.querySelector(".logout a");
    if (sairBtn) {
        sairBtn.addEventListener("click", function (event) {
            const confirmar = confirm("Deseja realmente sair do sistema R.O.M.A?");
            if (!confirmar) {
                event.preventDefault();
            } else {
                localStorage.removeItem("roma_token");
                localStorage.removeItem("roma_user_tipo");
            }
        });
    }

});


// ───────────────────────────────────────────────────────
//  BUSCA AS ROTAS NO BACKEND E RENDERIZA OS CARDS
// ───────────────────────────────────────────────────────

async function carregarRotas() {
    const token = localStorage.getItem("roma_token");

    if (!token) {
        exibirErroLista("Usuário não autenticado. Faça login novamente.");
        return;
    }

    const listaContainer = document.querySelector(".lista-rotas");
    listaContainer.innerHTML = `<p style="color:#666; text-align:center; padding:30px;">Carregando rotas...</p>`;

    try {
        const response = await fetch("http://localhost:3000/rotas", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error("Sessão expirada. Faça login novamente.");
        }

        if (!response.ok) {
            throw new Error(`Erro ao buscar rotas: ${response.status}`);
        }

        const rotas = await response.json();
        console.log("Rotas recebidas do backend:", rotas);

        // Se vier dentro de uma propriedade (ex: { rotas: [...] }), ajuste aqui:
        const lista = Array.isArray(rotas) ? rotas : rotas.rotas ?? [];

        if (lista.length === 0) {
            listaContainer.innerHTML = `<p style="color:#666; text-align:center; padding:30px;">Nenhuma rota cadastrada ainda.</p>`;
            return;
        }

        // Renderiza os cards dinamicamente
        listaContainer.innerHTML = lista.map(rota => criarCardHTML(rota)).join("");

        // Ativa pesquisa após renderizar
        ativarPesquisa();

        // Ativa botões após renderizar
        ativarBotoesDetalhes();
        ativarBotoesEditar();

    } catch (error) {
        console.error("Erro ao carregar rotas:", error);
        exibirErroLista(error.message || "Falha ao conectar com o banco de dados.");
    }
}


// ───────────────────────────────────────────────────────
//  GERA O HTML DE CADA CARD DE ROTA
// ───────────────────────────────────────────────────────

function criarCardHTML(rota) {
    const statusTexto = (rota.status || "pendente").toLowerCase();

    // Mapeia o status para a classe CSS e texto exibido
    let statusClasse = "pendente";
    let statusLabel  = "Pendente";

    if (statusTexto === "em andamento" || statusTexto === "andamento") {
        statusClasse = "andamento";
        statusLabel  = "Em andamento";
    } else if (statusTexto === "concluida" || statusTexto === "concluída") {
        statusClasse = "concluida";
        statusLabel  = "Concluída";
    }

    const entregador = rota.entregador || "Não atribuído";
    const destino    = rota.destino    || "Destino não informado";
    const distancia  = rota.distancia  ? `${rota.distancia} km` : "—";

    return `
        <div class="rota-card" data-id="${rota.id}">

            <div class="rota-info">
                <h2>Rota #${rota.id}</h2>
                <p><strong>Entregador:</strong> ${entregador}</p>
                <p><strong>Destino:</strong> ${destino}</p>
                <p><strong>Distância:</strong> ${distancia}</p>
            </div>

            <div class="status ${statusClasse}">
                ${statusLabel}
            </div>

            <div class="acoes">
                <button class="detalhes" data-id="${rota.id}">
                    Ver detalhes
                </button>
                <button class="editar" data-id="${rota.id}">
                    Editar
                </button>
            </div>

        </div>
    `;
}


// ───────────────────────────────────────────────────────
//  BOTÕES DETALHES — redireciona com o ID correto
// ───────────────────────────────────────────────────────

function ativarBotoesDetalhes() {
    const detalhesBtns = document.querySelectorAll(".detalhes");

    detalhesBtns.forEach(function (botao) {
        botao.addEventListener("click", function () {
            const id = this.getAttribute("data-id");
            window.location.href = `detalhes-rota.html?id=${id}`;
        });
    });
}


// ───────────────────────────────────────────────────────
//  BOTÕES EDITAR — redireciona com o ID correto
// ───────────────────────────────────────────────────────

function ativarBotoesEditar() {
    const editarBtns = document.querySelectorAll(".editar");

    editarBtns.forEach(function (botao) {
        botao.addEventListener("click", function () {
            const id = this.getAttribute("data-id");
            window.location.href = `editar-rota.html?id=${id}`;
        });
    });
}


// ───────────────────────────────────────────────────────
//  PESQUISA — filtra os cards pelo texto digitado
// ───────────────────────────────────────────────────────

function ativarPesquisa() {
    const pesquisaInput = document.querySelector(".pesquisa input");

    if (!pesquisaInput) return;

    pesquisaInput.addEventListener("input", function () {
        const valor = this.value.toLowerCase();
        const cards = document.querySelectorAll(".rota-card");

        cards.forEach(function (card) {
            const texto = card.innerText.toLowerCase();
            card.style.display = texto.includes(valor) ? "flex" : "none";
        });
    });
}


// ───────────────────────────────────────────────────────
//  EXIBE ERRO NA LISTA
// ───────────────────────────────────────────────────────

function exibirErroLista(mensagem) {
    const listaContainer = document.querySelector(".lista-rotas");
    if (listaContainer) {
        listaContainer.innerHTML = `
            <div style="
                background: #fee2e2;
                border-left: 4px solid #dc2626;
                padding: 20px 25px;
                border-radius: 12px;
                color: #991b1b;
                font-weight: bold;
            ">
                ⚠️ ${mensagem}
            </div>
        `;
    }
}
