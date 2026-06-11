// public/empresa/js/editar-entregador.js

document.addEventListener("DOMContentLoaded", async function () {

    // ── TOKEN ──────────────────────────────────────────────────────────────────
    const token = localStorage.getItem("roma_token");
    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = "../login/login.html";
        return;
    }

    // ── ID DO ENTREGADOR (vem da URL: editar-entregador.html?id=3) ─────────────
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        alert("Entregador não identificado. Voltando para a lista.");
        window.location.href = "entregadores.html";
        return;
    }

    const form            = document.getElementById("form-editar-entregador");
    const inputNome       = document.getElementById("nome");
    const inputCpf        = document.getElementById("cpf");
    const inputEmail      = document.getElementById("email");
    const inputTelefone   = document.getElementById("telefone");
    const inputSenha      = document.getElementById("senha");
    const inputVeiculo    = document.getElementById("veiculo");
    const inputPlaca      = document.getElementById("placa");
    const inputCapacidade = document.getElementById("capacidade");
    const btnExcluir      = document.getElementById("btnExcluir");

    // ── CARREGAR DADOS ─────────────────────────────────────────────────────────
    try {
        const res = await fetch(`http://localhost:3000/entregadores/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) {
            localStorage.removeItem("roma_token");
            alert("Sessão expirada. Faça login novamente.");
            window.location.href = "../login/login.html";
            return;
        }
        if (res.status === 404) {
            alert("Entregador não encontrado.");
            window.location.href = "entregadores.html";
            return;
        }

        const data = await res.json();
        if (!res.ok || data.status === "error") throw new Error(data.erro || "Erro ao carregar dados.");

        const e = data.dados;
        inputNome.value       = e.nome       || "";
        inputCpf.value        = e.cpf        || "";
        inputEmail.value      = e.email      || "";
        inputTelefone.value   = e.telefone   || "";
        inputPlaca.value      = e.placa      || "";
        inputCapacidade.value = e.capacidade || "";

        if (e.veiculo) {
            const opcao = [...inputVeiculo.options].find(
                o => o.value.toLowerCase() === e.veiculo.toLowerCase()
            );
            if (opcao) opcao.selected = true;
        }

    } catch (err) {
        console.error("Erro ao carregar entregador:", err);
        alert(`Não foi possível carregar os dados: ${err.message}`);
        window.location.href = "entregadores.html";
        return;
    }

    // ── SALVAR ALTERAÇÕES ──────────────────────────────────────────────────────
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const nomeValor       = inputNome.value.trim();
        const cpfValor        = inputCpf.value.replace(/\D/g, "");
        const emailValor      = inputEmail.value.trim();
        const telefoneValor   = inputTelefone.value.replace(/\D/g, "");
        const senhaValor      = inputSenha.value.trim();
        const veiculoValor    = inputVeiculo.value;
        const placaValor      = inputPlaca.value.trim().toUpperCase();
        const capacidadeValor = parseFloat((inputCapacidade.value || "0").replace(",", "."));

        if (!nomeValor || !emailValor || !cpfValor || !veiculoValor) {
            alert("Preencha todos os campos obrigatórios!");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValor)) {
            alert("Digite um e-mail válido!");
            return;
        }
        if (cpfValor.length !== 11) {
            alert("O CPF deve conter 11 dígitos.");
            return;
        }
        if (senhaValor && senhaValor.length < 6) {
            alert("A nova senha deve ter no mínimo 6 caracteres.");
            return;
        }

        const dadosAtualizados = {
            nome:       nomeValor,
            email:      emailValor,
            telefone:   telefoneValor   || null,
            cpf:        cpfValor,
            veiculo:    veiculoValor,
            placa:      placaValor      || null,
            capacidade: capacidadeValor || null,
        };
        if (senhaValor) dadosAtualizados.senha = senhaValor;

        try {
            const res = await fetch(`http://localhost:3000/entregadores/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(dadosAtualizados)
            });

            const data = await res.json();
            if (!res.ok || data.status === "error") throw new Error(data.erro || "Erro ao salvar.");

            alert("Entregador atualizado com sucesso!");
            window.location.href = "entregadores.html";

        } catch (err) {
            console.error("Erro ao atualizar:", err);
            alert(`Erro ao salvar: ${err.message}`);
        }
    });

    // ── EXCLUIR ENTREGADOR ─────────────────────────────────────────────────────
    btnExcluir.addEventListener("click", async function () {
        const nome = inputNome.value || "este entregador";

        const confirmar = confirm(
            `Tem certeza que deseja excluir "${nome}"?\n\nEsta ação desativa o acesso do entregador ao sistema.`
        );
        if (!confirmar) return;

        try {
            const res = await fetch(`http://localhost:3000/entregadores/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok || data.status === "error") throw new Error(data.erro || "Erro ao excluir.");

            alert("Entregador excluído com sucesso!");
            window.location.href = "entregadores.html";

        } catch (err) {
            console.error("Erro ao excluir:", err);
            alert(`Erro ao excluir: ${err.message}`);
        }
    });

    // ── LOGOUT ─────────────────────────────────────────────────────────────────
    const sairBtn = document.querySelector(".logout-area a");
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
});
