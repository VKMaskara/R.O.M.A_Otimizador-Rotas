// ═══════════════════════════════════════════════════════
//  R.O.M.A — detalhes-rota.js  |  Integração com backend
// ═══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {

    const urlParams = new URLSearchParams(window.location.search);
    const rotaId = urlParams.get("id");

    if (!rotaId) {
        exibirErroNaTela("ID da rota não identificado na URL.");
        return;
    }

    buscarDadosDaRota(rotaId);
    configurarEventosJanela();
});


// ───────────────────────────────────────────────────────
//  BUSCA OS DADOS DA ROTA NO BACKEND
// ───────────────────────────────────────────────────────

async function buscarDadosDaRota(id) {
    const token = localStorage.getItem("roma_token");

    if (!token) {
        exibirErroNaTela("Usuário não autenticado. Faça login novamente.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/rotas/${id}`, {
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
            throw new Error(`Erro ${response.status} — Rota não encontrada.`);
        }

        const resposta = await response.json();
        console.log("Dados recebidos do backend:", resposta);

        // O backend retorna { status: "success", dados: { ... } }
        const dados = resposta.dados ?? resposta;

        renderizarDetalhes(dados);

    } catch (error) {
        console.error("Erro ao buscar rota:", error);
        exibirErroNaTela(error.message || "Falha ao conectar com o banco de dados.");
    }
}


// ───────────────────────────────────────────────────────
//  RENDERIZA TODOS OS CAMPOS NA TELA
// ───────────────────────────────────────────────────────

function renderizarDetalhes(dados) {

    // ── Código ───────────────────────────────────────────
    document.getElementById("codigo-rota").textContent = `#${dados.id}`;

    // ── Status badge ─────────────────────────────────────
    const statusBadge = document.getElementById("status-badge");
    const statusTexto = (dados.status || "pendente").toLowerCase();

    statusBadge.textContent = capitalize(dados.status || "Pendente");
    statusBadge.className   = "badge rounded-pill px-3 py-2 text-capitalize";

    if (statusTexto === "pendente") {
        statusBadge.classList.add("text-bg-warning", "text-dark");
    } else if (statusTexto === "em andamento" || statusTexto === "andamento") {
        statusBadge.classList.add("text-bg-primary");
    } else if (statusTexto === "concluida" || statusTexto === "concluída") {
        statusBadge.classList.add("text-bg-success");
    }

    // ── Distância ────────────────────────────────────────
    const distanciaEl = document.getElementById("prioridade-rota");
    if (dados.km_otimizado) {
        distanciaEl.textContent = `${dados.km_otimizado} km (otimizado)`;
    } else if (dados.km_original) {
        distanciaEl.textContent = `${dados.km_original} km`;
    } else {
        distanciaEl.textContent = "—";
    }
    distanciaEl.className = "badge bg-secondary text-white px-3 py-2";

    // ── Tempo estimado ───────────────────────────────────
    const tempoEl = document.getElementById("horario-rota");
    if (dados.tempo_estimado_min) {
        const horas   = Math.floor(dados.tempo_estimado_min / 60);
        const minutos = dados.tempo_estimado_min % 60;
        const tempoFormatado = horas > 0
            ? `${horas}h ${minutos}min`
            : `${minutos} min`;
        tempoEl.innerHTML = `<i class="bi bi-clock me-1 text-muted"></i>${tempoFormatado}`;
    } else {
        tempoEl.innerHTML = `<i class="bi bi-clock me-1 text-muted"></i>Não definido`;
    }

    // ── Parada de origem (posição 1) ─────────────────────
    const paradas  = dados.paradas || [];
    const origem   = paradas.find(p => p.posicao === 1);
    const entregas = paradas.filter(p => p.pacote_id !== null);

    document.getElementById("endereco-logradouro").textContent =
        origem ? origem.endereco : "Origem não informada";

    document.getElementById("endereco-bairro-cidade").textContent =
        `${entregas.length} entrega(s) | Data: ${formatarData(dados.data)}`;

    // ── Observações / economia ───────────────────────────
    const obsEl = document.getElementById("observacoes-texto");
    if (dados.economia_km) {
        obsEl.innerHTML = `
            <strong>Economia de rota:</strong> ${dados.economia_km} km otimizados 
            (${dados.km_original} km → ${dados.km_otimizado} km)
        `;
    } else {
        obsEl.textContent = "Nenhuma observação cadastrada.";
    }

    // ── Histórico / Timeline ─────────────────────────────
    renderizarHistorico(dados, paradas);

    // ── Tabela de paradas ────────────────────────────────
    renderizarParadas(paradas);
}


// ───────────────────────────────────────────────────────
//  HISTÓRICO DA ROTA
// ───────────────────────────────────────────────────────

function renderizarHistorico(dados, paradas) {
    const container = document.getElementById("historico-lista");
    container.innerHTML = "";

    const itens = [];

    // Criação
    itens.push({
        icon:     "bi-check-circle-fill text-success",
        status:   "Rota criada",
        descricao: `Em ${formatarData(dados.criado_em || dados.data)}`
    });

    // Entregador
    if (dados.entregador_id) {
        itens.push({
            icon:     "bi-person-check-fill text-primary",
            status:   "Entregador atribuído",
            descricao: `ID do entregador: ${dados.entregador_id}`
        });
    } else {
        itens.push({
            icon:     "bi-person-x-fill text-warning",
            status:   "Sem entregador",
            descricao: "Nenhum entregador vinculado ainda"
        });
    }

    // Paradas concluídas
    const concluidas = paradas.filter(p => p.status_entrega === "concluida" || p.status_entrega === "concluída");
    if (concluidas.length > 0) {
        itens.push({
            icon:     "bi-bag-check-fill text-success",
            status:   `${concluidas.length} entrega(s) concluída(s)`,
            descricao: "Entregas realizadas com sucesso"
        });
    }

    itens.forEach(evento => {
        const li = document.createElement("li");
        li.className = "list-group-item bg-transparent border-0 ps-0 d-flex align-items-start mb-2";
        li.innerHTML = `
            <i class="bi ${evento.icon} me-3 mt-1 fs-5"></i>
            <div>
                <p class="mb-0 fw-semibold text-secondary">${evento.status}</p>
                <small class="text-muted">${evento.descricao}</small>
            </div>
        `;
        container.appendChild(li);
    });
}


// ───────────────────────────────────────────────────────
//  TABELA DE PARADAS (se existir o elemento no HTML)
// ───────────────────────────────────────────────────────

function renderizarParadas(paradas) {
    const tabelaContainer = document.getElementById("tabela-paradas");
    if (!tabelaContainer) return; // elemento opcional no HTML

    if (paradas.length === 0) {
        tabelaContainer.innerHTML = `<p class="text-muted">Nenhuma parada cadastrada.</p>`;
        return;
    }

    const linhas = paradas.map(p => {
        const statusParada = p.status_entrega
            ? `<span class="badge ${badgeParada(p.status_entrega)}">${capitalize(p.status_entrega)}</span>`
            : `<span class="badge bg-light text-muted">Ponto de saída</span>`;

        return `
            <tr>
                <td class="ps-3">${p.posicao}</td>
                <td>${p.endereco}</td>
                <td>${p.destinatario || "—"}</td>
                <td>${p.codigo || "—"}</td>
                <td>${p.observacao || "—"}</td>
                <td>${statusParada}</td>
            </tr>
        `;
    }).join("");

    tabelaContainer.innerHTML = `
        <div class="table-responsive mt-3">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light text-secondary">
                    <tr>
                        <th class="ps-3">#</th>
                        <th>Endereço</th>
                        <th>Destinatário</th>
                        <th>Código</th>
                        <th>Observação</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
        </div>
    `;
}


// ───────────────────────────────────────────────────────
//  UTILITÁRIOS
// ───────────────────────────────────────────────────────

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatarData(dataStr) {
    if (!dataStr) return "—";
    const d = new Date(dataStr);
    if (isNaN(d)) return dataStr;
    return d.toLocaleDateString("pt-BR");
}

function badgeParada(status) {
    const s = (status || "").toLowerCase();
    if (s === "concluida" || s === "concluída") return "text-bg-success";
    if (s === "pendente")                        return "text-bg-warning text-dark";
    return "bg-secondary";
}

function exibirErroNaTela(mensagem) {
    const campos = {
        "codigo-rota":         "Erro",
        "endereco-logradouro": mensagem,
    };
    Object.entries(campos).forEach(([id, texto]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = texto;
    });

    const badge = document.getElementById("status-badge");
    if (badge) {
        badge.textContent = "Erro de conexão";
        badge.className   = "badge bg-danger px-3 py-2";
    }
}


// ───────────────────────────────────────────────────────
//  EVENTOS DA JANELA (editar / logout)
// ───────────────────────────────────────────────────────

function configurarEventosJanela() {
    const editarBtn = document.querySelector(".editar-btn");
    if (editarBtn) {
        editarBtn.addEventListener("click", function () {
            const id = new URLSearchParams(window.location.search).get("id");
            window.location.href = `editar-rota.html?id=${id}`;
        });
    }

    const sairBtn = document.querySelector(".btn-logout");
    if (sairBtn) {
        sairBtn.addEventListener("click", function (event) {
            if (!confirm("Deseja realmente sair do sistema R.O.M.A?")) {
                event.preventDefault();
            } else {
                localStorage.removeItem("roma_token");
                localStorage.removeItem("roma_user_tipo");
            }
        });
    }
}