// ═══════════════════════════════════════════════════════
//  R.O.M.A — rotas.js  |  Integração completa com backend
// ═══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {

    carregarRotas();

    // Botão Nova Rota
    const novaRotaBtn = document.getElementById("btnNovaRota");
    if (novaRotaBtn) {
        novaRotaBtn.addEventListener("click", function () {
            window.location.href = "nova-rota.html";
        });
    }

    // Logout
    const sairBtn = document.querySelector(".btn-logout");
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
//  BUSCA AS ROTAS NO BACKEND E RENDERIZA A TABELA
// ───────────────────────────────────────────────────────

async function carregarRotas() {
    const token = localStorage.getItem("roma_token");
    const tbody = document.getElementById("lista-rotas");

    if (!token) {
        exibirErroTabela("Usuário não autenticado. Faça login novamente.");
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center text-muted py-4">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Carregando rotas...
            </td>
        </tr>
    `;

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

        const resposta = await response.json();
        console.log("Rotas recebidas do backend:", resposta);

        // Backend retorna { status: "success", dados: [...] }
        const lista = Array.isArray(resposta) ? resposta : resposta.dados ?? resposta.rotas ?? [];

        // Remove duplicatas por ID (JOIN de paradas no backend duplica linhas)
        const unicas = [];
        const idsVistos = new Set();
        lista.forEach(function (rota) {
            if (!idsVistos.has(rota.id)) {
                idsVistos.add(rota.id);
                unicas.push(rota);
            }
        });

        if (unicas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="estado-vazio">
                            <i class="bi bi-geo-alt"></i>
                            Nenhuma rota cadastrada ainda.
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = unicas.map(rota => criarLinhaHTML(rota)).join("");

        ativarPesquisa();
        ativarBotoesDetalhes();
        ativarBotoesEditar();

    } catch (error) {
        console.error("Erro ao carregar rotas:", error);
        exibirErroTabela(error.message || "Falha ao conectar com o banco de dados.");
    }
}


// ───────────────────────────────────────────────────────
//  GERA O HTML DE CADA LINHA DA TABELA
// ───────────────────────────────────────────────────────

function criarLinhaHTML(rota) {
    const statusTexto = (rota.status || "pendente").toLowerCase();

    let badgeClasse = "badge-pendente";
    let statusLabel = "Pendente";

    if (statusTexto === "em andamento" || statusTexto === "andamento") {
        badgeClasse = "badge-andamento";
        statusLabel = "Em andamento";
    } else if (statusTexto === "concluida" || statusTexto === "concluída") {
        badgeClasse = "badge-concluida";
        statusLabel = "Concluída";
    }

    const entregador = rota.entregador_id
        ? `Entregador #${rota.entregador_id}`
        : '<span class="text-muted fst-italic">Não atribuído</span>';

    const distancia = rota.km_otimizado
        ? `${rota.km_otimizado} km`
        : rota.km_original
            ? `${rota.km_original} km`
            : "—";

    const data = rota.data
        ? new Date(rota.data + "T00:00:00").toLocaleDateString("pt-BR")
        : "—";

    const tempo = rota.tempo_estimado_min
        ? formatarTempo(rota.tempo_estimado_min)
        : "—";

    return `
        <tr>
            <td class="ps-4 fw-bold text-navy">#${rota.id}</td>
            <td>${entregador}</td>
            <td>${data}</td>
            <td>${distancia} <small class="text-muted">(${tempo})</small></td>
            <td>
                <span class="badge-status ${badgeClasse}">${statusLabel}</span>
            </td>
            <td class="pe-4 text-end">
                <button class="btn-detalhes me-2" data-id="${rota.id}">
                    <i class="bi bi-eye me-1"></i> Detalhes
                </button>
                <button class="btn-editar" data-id="${rota.id}">
                    <i class="bi bi-pencil me-1"></i> Editar
                </button>
            </td>
        </tr>
    `;
}


// ───────────────────────────────────────────────────────
//  BOTÕES DETALHES
// ───────────────────────────────────────────────────────

function ativarBotoesDetalhes() {
    document.querySelectorAll(".btn-detalhes").forEach(function (botao) {
        botao.addEventListener("click", function () {
            window.location.href = `detalhes-rota.html?id=${this.getAttribute("data-id")}`;
        });
    });
}


// ───────────────────────────────────────────────────────
//  BOTÕES EDITAR
// ───────────────────────────────────────────────────────

function ativarBotoesEditar() {
    document.querySelectorAll(".btn-editar").forEach(function (botao) {
        botao.addEventListener("click", function () {
            window.location.href = `editar-rota.html?id=${this.getAttribute("data-id")}`;
        });
    });
}


// ───────────────────────────────────────────────────────
//  PESQUISA
// ───────────────────────────────────────────────────────

function ativarPesquisa() {
    const pesquisaInput = document.querySelector(".pesquisa-input");
    if (!pesquisaInput) return;

    pesquisaInput.addEventListener("input", function () {
        const valor = this.value.toLowerCase();
        document.querySelectorAll("#lista-rotas tr").forEach(function (linha) {
            linha.style.display = linha.innerText.toLowerCase().includes(valor) ? "" : "none";
        });
    });
}


// ───────────────────────────────────────────────────────
//  UTILITÁRIOS
// ───────────────────────────────────────────────────────

function formatarTempo(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function exibirErroTabela(mensagem) {
    const tbody = document.getElementById("lista-rotas");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="estado-erro m-3">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>${mensagem}
                    </div>
                </td>
            </tr>
        `;
    }
}