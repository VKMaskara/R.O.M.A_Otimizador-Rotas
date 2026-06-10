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
cpf.addEventListener("input", function() {
    this.value = this.value.replace(/\D/g, "");
});

telefone.addEventListener("input", function() {
    this.value = this.value.replace(/\D/g, "");
});

// Evento de Envio
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    // Capturando e limpando valores
    const dadosFormulario = {
        nome: nome.value.trim(),
        email: email.value.trim(),
        telefone: telefone.value.trim(),
        senha: senha.value.trim(),
        cpf: cpf.value.trim(),
        veiculo: veiculo.value,
        placa: placa.value.trim().toUpperCase(),
        capacidade: parseFloat(capacidade.value)
    };

    // Validação básica se algum campo está vazio
    if (Object.values(dadosFormulario).some(valor => valor === "" || isNaN(valor))) {
        alert("Por favor, preencha todos os campos obrigatórios!");
        return;
    }

    if (dadosFormulario.cpf.length !== 11) {
        alert("O CPF deve conter exatamente 11 dígitos numéricos!");
        return;
    }

    if (dadosFormulario.senha.length < 6) {
        alert("A senha deve ter no mínimo 6 caracteres!");
        return;
    }

    try {
        // CONEXÃO COM O BACK-END (Substitua a URL pela rota real da sua API)
        const response = await fetch("http://localhost:3000/api/entregadores", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dadosFormulario)
        });

        if (response.ok) {
            alert("Entregador e Usuário vinculados com sucesso!");
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