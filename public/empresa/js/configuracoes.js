// ═══════════════════════════════════════════════════════
//  R.O.M.A — configuracoes.js  |  Integração com backend
// ═══════════════════════════════════════════════════════

let empresaId = null;

document.addEventListener("DOMContentLoaded", function () {

    carregarEmpresa();

    document.getElementById("form-empresa").addEventListener("submit", function (e) {
        e.preventDefault();
        salvarEmpresa();
    });

    document.getElementById("form-senha").addEventListener("submit", function (e) {
        e.preventDefault();
        atualizarSenha();
    });

    document.getElementById("btn-excluir").addEventListener("click", function () {
        confirmarExclusao();
    });

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
//  DESCOBRE E CARREGA A EMPRESA DO USUÁRIO LOGADO
// ───────────────────────────────────────────────────────

async function carregarEmpresa() {
    const token = localStorage.getItem("roma_token");

    if (!token) {
        mostrarAlerta("Usuário não autenticado. Faça login novamente.", "danger");
        document.getElementById("loading-config").classList.add("d-none");
        return;
    }

    try {
        // Decodifica o token para pegar o usuario_id
        const payload   = JSON.parse(atob(token.split(".")[1]));
        const usuarioId = Number(payload.id);

        // Busca lista de empresas (tem nome, email, telefone)
        const response = await fetch("http://localhost:3000/empresas", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        const lista = (await response.json()).dados ?? [];

        // Para cada empresa, busca o detalhe e verifica usuario_id
        let dadosCompletos = null;

        for (const emp of lista) {
            const resDetalhe = await fetch(`http://localhost:3000/empresas/${emp.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!resDetalhe.ok) continue;

            const detalhe = (await resDetalhe.json()).dados ?? {};

            if (Number(detalhe.usuario_id) === usuarioId) {
                // Mescla: detalhe tem usuario_id/cnpj, listagem tem nome/email/telefone
                dadosCompletos = { ...detalhe, ...emp };
                empresaId = emp.id;
                break;
            }
        }

        if (!dadosCompletos) {
            throw new Error("Nenhuma empresa vinculada a este usuário.");
        }

        preencherFormulario(dadosCompletos);

    } catch (error) {
        console.error("Erro ao carregar empresa:", error);
        mostrarAlerta(error.message || "Falha ao carregar os dados da empresa.", "danger");
        document.getElementById("loading-config").classList.add("d-none");
    }
}


// ───────────────────────────────────────────────────────
//  PREENCHE O FORMULÁRIO
// ───────────────────────────────────────────────────────

function preencherFormulario(dados) {
    setValue("nome-empresa",     dados.nome     || "");
    setValue("cnpj-empresa",     formatarCNPJ(dados.cnpj));
    setValue("email-empresa",    dados.email    || "");
    setValue("telefone-empresa", formatarTelefone(dados.telefone));

    document.getElementById("loading-config").classList.add("d-none");
    document.getElementById("conteudo-config").classList.remove("d-none");
}


// ───────────────────────────────────────────────────────
//  SALVA OS DADOS DA EMPRESA
// ───────────────────────────────────────────────────────

async function salvarEmpresa() {
    const token = localStorage.getItem("roma_token");

    const payload = {
        nome:     document.getElementById("nome-empresa").value.trim(),
        email:    document.getElementById("email-empresa").value.trim(),
        telefone: document.getElementById("telefone-empresa").value.trim() || null
    };

    if (!payload.nome || !payload.email) {
        mostrarAlerta("Nome e e-mail são obrigatórios.", "warning");
        return;
    }

    const btn = document.querySelector("#form-empresa [type='submit']");
    btn.disabled  = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Salvando...`;

    try {
        const response = await fetch(`http://localhost:3000/empresas/${empresaId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        mostrarAlerta("Dados da empresa atualizados com sucesso!", "success");

    } catch (error) {
        console.error("Erro ao salvar empresa:", error);
        mostrarAlerta("Não foi possível salvar as alterações.", "danger");
    } finally {
        btn.disabled  = false;
        btn.innerHTML = `<i class="bi bi-floppy me-2"></i> Salvar Alterações`;
    }
}


// ───────────────────────────────────────────────────────
//  ATUALIZA A SENHA
// ───────────────────────────────────────────────────────

async function atualizarSenha() {
    const novaSenha      = document.getElementById("nova-senha").value;
    const confirmarSenha = document.getElementById("confirmar-senha").value;

    if (!novaSenha || !confirmarSenha) {
        mostrarAlerta("Preencha os dois campos de senha.", "warning");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        mostrarAlerta("As senhas não coincidem.", "warning");
        return;
    }

    if (novaSenha.length < 6) {
        mostrarAlerta("A senha deve ter pelo menos 6 caracteres.", "warning");
        return;
    }

    const token = localStorage.getItem("roma_token");
    const btn   = document.querySelector("#form-senha [type='submit']");
    btn.disabled  = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Atualizando...`;

    try {
        const response = await fetch(`http://localhost:3000/empresas/${empresaId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ senha: novaSenha })
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        mostrarAlerta("Senha atualizada com sucesso!", "success");
        document.getElementById("nova-senha").value      = "";
        document.getElementById("confirmar-senha").value = "";

    } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        mostrarAlerta("Não foi possível atualizar a senha.", "danger");
    } finally {
        btn.disabled  = false;
        btn.innerHTML = `<i class="bi bi-key me-2"></i> Atualizar Senha`;
    }
}


// ───────────────────────────────────────────────────────
//  EXCLUIR EMPRESA
// ───────────────────────────────────────────────────────

async function confirmarExclusao() {
    const nomeEmpresa = document.getElementById("nome-empresa").value || "sua empresa";

    const confirmado = confirm(
        `⚠️ ATENÇÃO: Você está prestes a excluir "${nomeEmpresa}".\n\n` +
        `Esta ação é PERMANENTE e irá remover todos os dados.\n\n` +
        `Deseja continuar?`
    );

    if (!confirmado) return;

    const token = localStorage.getItem("roma_token");
    const btn   = document.getElementById("btn-excluir");
    btn.disabled  = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Excluindo...`;

    try {
        const response = await fetch(`http://localhost:3000/empresas/${empresaId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        mostrarAlerta("Empresa excluída com sucesso. Redirecionando...", "success");

        setTimeout(() => {
            localStorage.removeItem("roma_token");
            localStorage.removeItem("roma_user_tipo");
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        console.error("Erro ao excluir empresa:", error);
        mostrarAlerta("Não foi possível excluir a empresa.", "danger");
        btn.disabled  = false;
        btn.innerHTML = `<i class="bi bi-trash me-2"></i> Excluir Empresa`;
    }
}


// ───────────────────────────────────────────────────────
//  UTILITÁRIOS
// ───────────────────────────────────────────────────────

function setValue(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor ?? "";
}

function formatarCNPJ(cnpj) {
    if (!cnpj) return "—";
    const s = String(cnpj).replace(/\D/g, "");
    if (s.length !== 14) return cnpj;
    return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatarTelefone(tel) {
    if (!tel) return "";
    const s = String(tel).replace(/\D/g, "");
    if (s.length === 11) return s.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (s.length === 10) return s.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return tel;
}

function mostrarAlerta(mensagem, tipo) {
    const alerta = document.getElementById("alerta-global");
    if (!alerta) return;
    const icone = tipo === "success" ? "check-circle" : tipo === "warning" ? "exclamation-circle" : "exclamation-triangle";
    alerta.className = `alert alert-${tipo} rounded-3 d-flex align-items-center gap-2`;
    alerta.innerHTML = `<i class="bi bi-${icone}-fill"></i> ${mensagem}`;
    alerta.classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (tipo === "success") {
        setTimeout(() => alerta.classList.add("d-none"), 4000);
    }
}