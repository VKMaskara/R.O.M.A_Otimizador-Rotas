// public/empresa/js/dashboard.js

document.addEventListener("DOMContentLoaded", function () {

    // ── BOTÃO NOVA ROTA ────────────────────────────────────────────────────────
    const novaRotaBtn = document.getElementById("btnNovaRota");
    if (novaRotaBtn) {
        novaRotaBtn.addEventListener("click", function () {
            window.location.href = "nova-rota.html";
        });
    }

    // ── LOGOUT COM CONFIRMAÇÃO ─────────────────────────────────────────────────
    const sairBtn = document.querySelector(".btn-logout");
    if (sairBtn) {
        sairBtn.addEventListener("click", function (event) {
            if (!confirm("Deseja realmente sair?")) {
                event.preventDefault();
            } else {
                localStorage.removeItem("roma_token");
                localStorage.removeItem("roma_user_tipo");
            }
        });
    }

    // ── CARDS DE RESUMO E TABELA (dados reais da API) ──────────────────────────
    carregarResumo();
});

async function carregarResumo() {
    const token = localStorage.getItem("roma_token");

    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = "login.html";
        return;
    }

    // ── Entregadores cadastrados ──────────────────────────────────────────────
    const elEntregadores = document.getElementById("cardEntregadores");

    try {
        const res = await fetch("http://localhost:3000/entregadores", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) {
            localStorage.removeItem("roma_token");
            alert("Sessão expirada. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        const data = await res.json();
        if (!res.ok || data.status === "error") throw new Error(data.erro || "Erro ao buscar entregadores.");

        if (elEntregadores) {
            elEntregadores.textContent = data.dados.length;
        }

    } catch (err) {
        console.error("Erro ao carregar resumo de entregadores:", err);
        if (elEntregadores) elEntregadores.textContent = "—";
    }

    // ── Rotas (hoje, concluídas, pendentes e tabela) ───────────────────────────
    const elRotasHoje    = document.getElementById("cardRotasHoje");
    const elConcluidas   = document.getElementById("cardConcluidas");
    const elPendentes    = document.getElementById("cardPendentes");

    try {
        const res = await fetch("http://localhost:3000/rotas", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok || data.status === "error") throw new Error(data.erro || "Erro ao buscar rotas.");

        const rotas = data.dados || [];
        const hoje  = new Date().toISOString().split("T")[0];

        // Filtros dos Cards
        const rotasHoje  = rotas.filter(r => (r.criado_em || "").startsWith(hoje));
        const concluidas = rotas.filter(r => r.status === "concluida");
        const pendentes  = rotas.filter(r => r.status === "pendente");

        if (elRotasHoje)  elRotasHoje.textContent  = rotasHoje.length;
        if (elConcluidas) elConcluidas.textContent = concluidas.length;
        if (elPendentes)  elPendentes.textContent  = pendentes.length;

        // ── RENDERIZAR TABELA DE ROTAS RECENTES ───────────────────────────────
        renderizarTabelaRotas(rotas);

    } catch (err) {
        console.error("Erro ao carregar resumo de rotas:", err);
        [elRotasHoje, elConcluidas, elPendentes].forEach(el => {
            if (el) el.textContent = "—";
        });
    }
}

// ── FUNÇÃO PARA PREENCHER A TABELA DINAMICAMENTE ─────────────────────────────
function renderizarTabelaRotas(rotas) {
    // Seleciona o tbody de dentro da tabela existente no seu HTML
    const tbody = document.querySelector(".custom-table tbody");
    if (!tbody) return;

    // Limpa o conteúdo anterior (remover comentários ou dados antigos)
    tbody.innerHTML = "";

    if (rotas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Nenhuma rota encontrada.</td></tr>`;
        return;
    }

    // Ordena as rotas para mostrar as mais recentes primeiro (baseado no ID ou criado_em)
    // Se a sua API já trouxer ordenado, você pode remover o .sort()
    const rotasOrdenadas = rotas.sort((a, b) => b.id - a.id);

    // Pega apenas as 5 mais recentes para não poluir o Dashboard (opcional)
    const ultimasRotas = rotasOrdenadas.slice(0, 5);

    ultimasRotas.forEach(rota => {
        const tr = document.createElement("tr");

        // Formata o badge de status com base na resposta da API
        let statusBadge = "";
        if (rota.status === "concluida") {
            statusBadge = `<span class="badge bg-light-green text-success rounded-pill px-3 py-2">Concluída</span>`;
        } else if (rota.status === "pendente") {
            statusBadge = `<span class="badge bg-light-warning text-warning rounded-pill px-3 py-2">Pendente</span>`;
        } else {
            statusBadge = `<span class="badge bg-secondary rounded-pill px-3 py-2">${rota.status}</span>`;
        }

        // Altere as propriedades 'rota.codigo' e 'rota.entregador_nome' de acordo com os nomes retornados pelo seu banco/API
        tr.innerHTML = `
            <td class="ps-4 fw-bold text-navy">#${rota.id || rota.codigo}</td>
            <td>${rota.entregador_nome || rota.entregador_id || "Não atribuído"}</td>
            <td>${statusBadge}</td>
            <td class="pe-4 text-end">
                <button class="btn btn-sm btn-outline-primary btn-detalhes" data-id="${rota.id}">
                    <i class="bi bi-eye"></i> Detalhes
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Reatribui o evento de clique nos botões de detalhes gerados dinamicamente
    adicionarEventosDetalhes();
}

function adicionarEventosDetalhes() {
    document.querySelectorAll(".btn-detalhes").forEach(function (botao) {
        botao.addEventListener("click", function () {
            const rotaId = this.getAttribute("data-id");
            
         window.location.href = `detalhes-rota.html?id=${rotaId}`;
        });
    });
}