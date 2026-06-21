// ═══════════════════════════════════════════════════════
//  R.O.M.A — entregador-rotas.js  |  Tela do Entregador
// ═══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("roma_token");

    if (!token) {
        window.location.href = ".././login/login.html";
        return;
    }

    // Data de hoje
    const hoje = new Date().toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long"
    });
    document.getElementById("subtitulo-data").textContent = capitalize(hoje);

    // Carrega rotas e nome do entregador
    carregarMinhasRotas(token);

    // Logout
    document.getElementById("btn-sair").addEventListener("click", function () {
        if (confirm("Deseja realmente sair?")) {
            localStorage.removeItem("roma_token");
            localStorage.removeItem("roma_user_tipo");
            window.location.href = ".././login/login.html";
        }
    });
});


// ───────────────────────────────────────────────────────
//  CARREGA AS ROTAS DO ENTREGADOR LOGADO
// ───────────────────────────────────────────────────────

async function carregarMinhasRotas(token) {
    try {
        // Endpoint exclusivo do entregador — retorna suas rotas com paradas
        const res = await fetch("http://localhost:3000/entregadores/minha-rota", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Erro ${res.status}`);

        const resposta = await res.json();
        const rotas    = Array.isArray(resposta.dados) ? resposta.dados : [];

        console.log("Rotas do entregador:", rotas);

        // Tenta pegar nome do entregador pela primeira rota
        if (rotas.length > 0 && rotas[0].entregador_id) {
            carregarNomeEntregador(rotas[0].entregador_id, token);
        }

        // Estatísticas
        document.getElementById("stat-total").textContent      = rotas.length;
        document.getElementById("stat-pendentes").textContent  = rotas.filter(r => r.status === "pendente").length;
        document.getElementById("stat-concluidas").textContent = rotas.filter(r => r.status === "concluida" || r.status === "concluída").length;

        document.getElementById("loading-rotas").style.display = "none";

        if (rotas.length === 0) {
            document.getElementById("estado-vazio").classList.remove("d-none");
            return;
        }

        document.getElementById("secao-rotas").style.display = "block";
        renderizarRotas(rotas);

    } catch (error) {
        console.error("Erro ao carregar rotas:", error);
        document.getElementById("loading-rotas").innerHTML = `
            <div class="alert alert-danger mx-4 rounded-3">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Falha ao carregar rotas. Verifique sua conexão.
            </div>
        `;
    }
}


// ───────────────────────────────────────────────────────
//  CARREGA NOME DO ENTREGADOR (via token → usuario_id)
// ───────────────────────────────────────────────────────

async function carregarNomeEntregador(entregadorId, token) {
    // O nome vem no próprio payload — busca via endpoint da empresa não funciona
    // Usa o nome do localStorage se disponível, senão deixa "Entregador"
    const nomeEl = document.getElementById("header-nome");
    nomeEl.textContent = localStorage.getItem("roma_user_nome") || "Entregador";
}


// ───────────────────────────────────────────────────────
//  RENDERIZA OS CARDS DE ROTAS
// ───────────────────────────────────────────────────────

function renderizarRotas(rotas) {
    const container = document.getElementById("lista-rotas");
    container.innerHTML = "";

    rotas.forEach(function (rota) {
        const status    = (rota.status || "pendente").toLowerCase();
        const concluida = status === "concluida" || status === "concluída";
        const andamento = status === "em andamento" || status === "andamento" || status === "em_andamento";

        let classeCard  = "rota-card ";
        let badgeClasse = "badge-pendente";
        let badgeLabel  = "Pendente";

        if (andamento)      { classeCard += "status-andamento"; badgeClasse = "badge-andamento"; badgeLabel = "Em andamento"; }
        else if (concluida) { classeCard += "status-concluida"; badgeClasse = "badge-concluida"; badgeLabel = "Concluída"; }
        else                { classeCard += "status-pendente"; }

        const distancia  = rota.km_otimizado ? `${rota.km_otimizado} km` : rota.km_original ? `${rota.km_original} km` : "—";
        const tempo      = rota.tempo_estimado_min ? formatarTempo(rota.tempo_estimado_min) : "—";
        const data       = rota.data ? new Date(rota.data + "T00:00:00").toLocaleDateString("pt-BR") : "—";
        const nParadas   = (rota.paradas || []).filter(p => p.pacote_id).length;

        const div = document.createElement("div");
        div.className = classeCard;
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <p class="fw-bold text-navy mb-0" style="font-size:16px;">Rota #${rota.id}</p>
                <span class="badge-status ${badgeClasse}">${badgeLabel}</span>
            </div>

            <div class="rota-info-grid">
                <div class="rota-info-item">
                    <p class="rota-info-label">Data</p>
                    <p class="rota-info-valor">${data}</p>
                </div>
                <div class="rota-info-item">
                    <p class="rota-info-label">Distância</p>
                    <p class="rota-info-valor">${distancia}</p>
                </div>
                <div class="rota-info-item">
                    <p class="rota-info-label">Tempo Est.</p>
                    <p class="rota-info-valor">${tempo}</p>
                </div>
                <div class="rota-info-item">
                    <p class="rota-info-label">Entregas</p>
                    <p class="rota-info-valor">${nParadas} pts</p>
                </div>
            </div>

            <button class="btn-iniciar ${concluida ? "concluida" : ""}" data-id="${rota.id}" ${concluida ? "disabled" : ""}>
                ${concluida
                    ? '<i class="bi bi-check-circle me-2"></i> Concluída'
                    : '<i class="bi bi-play-circle me-2"></i> Iniciar Rota'
                }
            </button>
        `;

        const btnIniciar = div.querySelector(".btn-iniciar");
        if (!concluida) {
            btnIniciar.addEventListener("click", function (e) {
                e.stopPropagation();
                window.location.href = `rota-entregador.html?id=${this.getAttribute("data-id")}`;
            });
        }

        container.appendChild(div);
    });
}


// ───────────────────────────────────────────────────────
//  UTILITÁRIOS
// ───────────────────────────────────────────────────────

function formatarTempo(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}