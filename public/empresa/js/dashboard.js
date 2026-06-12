// public/empresa/js/dashboard.js

document.addEventListener("DOMContentLoaded", function () {

    // ── BOTÃO NOVA ROTA ────────────────────────────────────────────────────────
    const novaRotaBtn = document.getElementById("btnNovaRota");
    if (novaRotaBtn) {
        novaRotaBtn.addEventListener("click", function () {
            window.location.href = "nova-rota.html";
        });
    }

    // ── BOTÕES DE DETALHES NA TABELA ───────────────────────────────────────────
    document.querySelectorAll(".btn-detalhes").forEach(function (botao) {
        botao.addEventListener("click", function () {
            alert("Abrindo detalhes da rota...");
            // FUTURAMENTE:
            // window.location.href = "detalhes-rota.html";
        });
    });

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

    // ── CARDS DE RESUMO (dados reais da API) ──────────────────────────────────
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

    // ── Rotas (hoje, concluídas, pendentes) ───────────────────────────────────
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

        const rotasHoje  = rotas.filter(r => (r.criado_em || "").startsWith(hoje));
        const concluidas = rotas.filter(r => r.status === "concluida");
        const pendentes  = rotas.filter(r => r.status === "pendente");

        if (elRotasHoje)  elRotasHoje.textContent  = rotasHoje.length;
        if (elConcluidas) elConcluidas.textContent = concluidas.length;
        if (elPendentes)  elPendentes.textContent  = pendentes.length;

    } catch (err) {
        console.error("Erro ao carregar resumo de rotas:", err);
        [elRotasHoje, elConcluidas, elPendentes].forEach(el => {
            if (el) el.textContent = "—";
        });
    }
}