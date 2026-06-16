// ═══════════════════════════════════════════════════════
//  R.O.M.A — perfil-entregador.js  |  Integração backend
// ═══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {

    const urlParams   = new URLSearchParams(window.location.search);
    const entregadorId = urlParams.get("id");

    if (!entregadorId) {
        mostrarErro("ID do entregador não identificado na URL.");
        return;
    }

    carregarPerfil(entregadorId);

    // Botão Editar
    const btnEditar = document.getElementById("btnEditar");
    if (btnEditar) {
        btnEditar.addEventListener("click", function () {
            window.location.href = `editar-entregador.html?id=${entregadorId}`;
        });
    }

    // Logout
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
});


// ───────────────────────────────────────────────────────
//  BUSCA O PERFIL DO ENTREGADOR NO BACKEND
// ───────────────────────────────────────────────────────

async function carregarPerfil(id) {
    const token = localStorage.getItem("roma_token");

    if (!token) {
        mostrarErro("Usuário não autenticado. Faça login novamente.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/entregadores/${id}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error("Sessão expirada. Faça login novamente.");
        }

        if (!response.ok) {
            throw new Error(`Erro ${response.status} — Entregador não encontrado.`);
        }

        const resposta = await response.json();
        console.log("Perfil recebido do backend:", resposta);

        // Backend retorna { status: "success", dados: { ... } }
        const dados = resposta.dados ?? resposta;

        renderizarPerfil(dados);

    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        mostrarErro(error.message || "Falha ao conectar com o banco de dados.");
    }
}


// ───────────────────────────────────────────────────────
//  RENDERIZA OS DADOS NA TELA
// ───────────────────────────────────────────────────────

function renderizarPerfil(dados) {

    // Nome
    setText("nome-entregador", dados.nome || "Nome não informado");

    // Dados pessoais
    setText("cpf-entregador",        formatarCPF(dados.cpf)          || "—");
    setText("telefone-entregador",   formatarTelefone(dados.telefone) || "—");
    setText("email-entregador",      dados.email                      || "—");
    setText("veiculo-entregador",    dados.veiculo                    || "—");
    setText("placa-entregador",      dados.placa                      || "—");
    setText("capacidade-entregador", dados.capacidade ? `${dados.capacidade} kg` : "—");

    // Badge de status (ativo = 1, inativo = 0)
    const badgeEl   = document.getElementById("badge-status");
    const estaAtivo = dados.ativo === 1 || dados.ativo === true;

    badgeEl.textContent = estaAtivo ? "Ativo" : "Inativo";
    badgeEl.className   = `badge rounded-pill mt-3 d-inline-block px-3 py-2 ${estaAtivo ? "badge-ativo" : "badge-offline"}`;

    // Estatísticas (se o backend não retornar, exibe 0)
    setText("stat-hoje",       dados.entregas_hoje      ?? "0");
    setText("stat-concluidas", dados.rotas_concluidas   ?? "0");
    setText("stat-andamento",  dados.rotas_andamento    ?? "0");

    // Exibe o conteúdo e esconde o loading
    document.getElementById("loading-perfil").classList.add("d-none");
    document.getElementById("conteudo-perfil").classList.remove("d-none");
}


// ───────────────────────────────────────────────────────
//  UTILITÁRIOS
// ───────────────────────────────────────────────────────

function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

function formatarCPF(cpf) {
    if (!cpf) return "—";
    const s = String(cpf).replace(/\D/g, "");
    if (s.length !== 11) return cpf;
    return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(tel) {
    if (!tel) return "—";
    const s = String(tel).replace(/\D/g, "");
    if (s.length === 11) return s.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (s.length === 10) return s.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return tel;
}

function mostrarErro(mensagem) {
    document.getElementById("loading-perfil").innerHTML = `
        <div class="alert alert-danger rounded-3 d-inline-flex align-items-center gap-2">
            <i class="bi bi-exclamation-triangle-fill"></i>
            ${mensagem}
        </div>
    `;
}
