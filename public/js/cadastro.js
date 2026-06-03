// PEGAR FORMULÁRIO
const form = document.getElementById("cadastro-form");

// PEGAR INPUTS
const empresa = document.getElementById("empresa");
const cnpj = document.getElementById("cnpj");
const email = document.getElementById("email");
const telefone = document.getElementById("telefone");
const endereco = document.getElementById("endereco");
const senha = document.getElementById("senha");
const confirmarSenha = document.getElementById("confirmarSenha");
const check = document.getElementById("check");

// BOTÃO DE ENVIO
const btn = document.querySelector('button[type="submit"]');

// PERMITIR SOMENTE NÚMEROS NO CNPJ
cnpj.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
});

// PERMITIR SOMENTE NÚMEROS NO TELEFONE
telefone.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
});

// EVENTO DE ENVIO
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const empresaValor = empresa.value.trim();
    const cnpjValor = cnpj.value.trim();
    const emailValor = email.value.trim();
    const telefoneValor = telefone.value.trim();
    const enderecoValor = endereco.value.trim();
    const senhaValor = senha.value.trim();
    const confirmarSenhaValor = confirmarSenha.value.trim();

    // VALIDAR CAMPOS VAZIOS
    if (
        !empresaValor ||
        !cnpjValor ||
        !emailValor ||
        !telefoneValor ||
        !enderecoValor ||
        !senhaValor ||
        !confirmarSenhaValor
    ) {
        alert("Preencha todos os campos!");
        return;
    }

    // VALIDAR CNPJ
    if (cnpjValor.length !== 14) {
        alert("O CNPJ deve conter 14 números!");
        return;
    }

    // VALIDAR TELEFONE
    if (telefoneValor.length < 10) {
        alert("Digite um telefone válido!");
        return;
    }

    // VALIDAR EMAIL
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValido.test(emailValor)) {
        alert("Digite um e-mail válido!");
        return;
    }

    // VALIDAR SENHA
    if (senhaValor.length < 6) {
        alert("A senha deve ter no mínimo 6 caracteres!");
        return;
    }

    // CONFIRMAR SENHA
    if (senhaValor !== confirmarSenhaValor) {
        alert("As senhas não coincidem!");
        return;
    }

    // VALIDAR CHECKBOX
    if (!check.checked) {
        alert("Aceite os termos para continuar!");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Cadastrando...';

    try {
        const res = await fetch("http://localhost:3000/empresas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: empresaValor,
                cnpj: cnpjValor,
                email: emailValor,
                telefone: telefoneValor || null,
                endereco: enderecoValor,
                senha: senhaValor // Certifique-se que o controller do back espera 'senha'
            })
        });

        // Modificado aqui para evitar quebrar o código caso o back não retorne um JSON válido em caso de erro 500
        let data = {};
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        }

        if (!res.ok || data.status === "error") {
            mostrarErro(
                data.mensagem || "Erro ao cadastrar. Tente novamente."
            );
            return;
        }

        const toast = document.getElementById("toast");
        if (toast) {
            toast.classList.add("show");
        }

        setTimeout(() => {
            window.location.href = "/index.html";
        }, 2000);

    } catch (error) {
        console.error(error);
        mostrarErro(
            "Erro de conexão. Verifique se o servidor está rodando."
        );
    } finally {
        btn.disabled = false;
        // Ajustado para o texto original da sua tela
        btn.innerHTML = "Cadastrar Empresa"; 
    }
});

function mostrarErro(msg) {
    const el = document.getElementById("erroGeral");

    if (!el) {
        alert(msg);
        return;
    }

    el.textContent = msg;
    el.classList.add("visible");

    el.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}