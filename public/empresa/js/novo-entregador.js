const form = document.getElementById("form-entregador");

const nome = document.getElementById("nome");
const email = document.getElementById("email");
const telefone = document.getElementById("telefone");
const senha = document.getElementById("senha");
const cpf = document.getElementById("cpf");
const veiculo = document.getElementById("veiculo");
const placa = document.getElementById("placa");
const capacidade = document.getElementById("capacidade");


// Formatações e Limpezas em tempo de digitação
cpf.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
});

telefone.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
});

// Evento de Envio
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // 1. CAPTURA DOS TEXTOS BRUTOS DO FORMULÁRIO (Sem converter número ainda)
    const nomeValor = nome.value.trim();
    const emailValor = email.value.trim();
    const telefoneValor = telefone.value.trim();
    const senhaValor = senha.value.trim();
    const cpfValor = cpf.value.trim();
    const veiculoValor = veiculo.value;
    const placaValor = placa.value.trim().toUpperCase();
    const capacidadeValor = capacidade.value.trim();

    // 2. VALIDAÇÃO SE HÁ CAMPOS VAZIOS (Verificando estritamente como texto)
    if (
        !nomeValor ||
        !emailValor ||
        !telefoneValor ||
        !senhaValor ||
        !cpfValor ||
        !veiculoValor ||
        !placaValor ||
        !capacidadeValor
    ) {
        alert("Por favor, preencha todos os campos obrigatórios!");
        return;
    }

    // 3. TRATAMENTO E VALIDAÇÃO DA CAPACIDADE
    // Substitui vírgula por ponto caso o usuário tenha digitado formato brasileiro (ex: 500,50 -> 500.50)
    const capacidadeTratada = capacidadeValor.replace(",", ".");
    const capacidadeNumerica = parseFloat(capacidadeTratada);

    if (isNaN(capacidadeNumerica) || capacidadeNumerica <= 0) {
        alert("Por favor, insira um valor válido e maior que zero para a capacidade de carga!");
        return;
    }

    // 4. DEMAIS VALIDAÇÕES DE FORMATO
    if (cpfValor.length !== 11) {
        alert("O CPF deve conter exatamente 11 dígitos numéricos!");
        return;
    }

    if (senhaValor.length < 6) {
        alert("A senha deve ter no mínimo 6 caracteres!");
        return;
    }

    // 5. MONTAGEM DO OBJETO FINAL APÓS TODAS AS VALIDAÇÕES
    const dadosFormulario = {
        nome: nomeValor,
        email: emailValor,
        telefone: telefoneValor,
        senha: senhaValor,
        cpf: cpfValor,
        veiculo: veiculoValor,
        placa: placaValor,
        capacidade: capacidadeNumerica // Agora vai como um número decimal legítimo
    };

    try {
        const token = localStorage.getItem("roma_token");

        if (!token) {
            alert("Sessão expirada. Faça login novamente.");
            window.location.href = "../login/login.html";
            return;
        }

        // ENVIAR A REQUISIÇÃO COM O CABEÇALHO DE AUTENTICAÇÃO
        const response = await fetch("http://localhost:3000/entregadores", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(dadosFormulario)
        });

        if (response.ok) {
            alert("Entregador cadastrado com sucesso!");
            window.location.href = "entregadores.html";
        } else {
            const erro = await response.json();
            alert(`Erro ao cadastrar: ${erro.mensagem || 'Verifique os dados.'}`);
        }

    } catch (error) {
        console.error("Erro na comunicação com o servidor:", error);
        alert("Não foi possível conectar ao servidor.");
    }
});