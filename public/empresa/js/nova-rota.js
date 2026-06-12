// ELEMENTOS DO FORMULÁRIO
const form = document.getElementById("form-rota");
const nomeRota = document.getElementById("nomeRota");
const entregador = document.getElementById("entregador");
const prioridade = document.getElementById("prioridade");
const horario = document.getElementById("horario");
const observacoes = document.getElementById("observacoes");

// ELEMENTOS ALTERNADORES (MANUAL vs EXCEL)
const tipoManual = document.getElementById("tipoManual");
const tipoExcel = document.getElementById("tipoExcel");
const containerManual = document.getElementById("container-endereco-manual");
const containerExcel = document.getElementById("container-endereco-excel");
const enderecoInput = document.getElementById("endereco");
const arquivoExcelInput = document.getElementById("arquivoExcel");

// ESCUTADORES PARA ALTERNAR INTERFACE
tipoManual.addEventListener("change", () => {
    containerManual.classList.remove("d-none");
    containerExcel.classList.add("d-none");
    arquivoExcelInput.value = ""; // Limpa o arquivo se mudar de aba
});

tipoExcel.addEventListener("change", () => {
    containerExcel.classList.remove("d-none");
    containerManual.classList.add("d-none");
    enderecoInput.value = ""; // Limpa a digitação se mudar de aba
});

// EVENTO DE ENVIO DO FORMULÁRIO
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    // 1. VALIDAÇÃO BÁSICA DOS CAMPOS TEXTUAIS FIXOS
    if (!nomeRota.value.trim() || !prioridade.value || !horario.value) {
        alert("Por favor, preencha todos os campos obrigatórios!");
        return;
    }

    if (nomeRota.value.trim().length < 3) {
        alert("O nome da rota deve conter no mínimo 3 caracteres!");
        return;
    }

    // 2. RECUPERAR O MODO ESCOLHIDO DE ENDEREÇO
    const modoEndereco = document.querySelector('input[name="tipoEndereco"]:checked').value;

    // Criamos um objeto FormData porque o envio de arquivos exige este formato no backend
    const formData = new FormData();
    formData.append("nome_rota", nomeRota.value.trim());
    formData.append("entregador_id", entregador.value || "");
    formData.append("prioridade", prioridade.value);
    formData.append("horario_entrega", horario.value);
    formData.append("observacoes", observacoes.value.trim());
    formData.append("tipo_entrada", modoEndereco);

    if (modoEndereco === "manual") {
        const enderecoTexto = enderecoInput.value.trim();
        if (!enderecoTexto || enderecoTexto.length < 5) {
            alert("Por favor, digite um endereço válido!");
            return;
        }
        formData.append("endereco", enderecoTexto);
    } else {
        // Se for via planilha Excel
        const arquivo = arquivoExcelInput.files[0];
        if (!arquivo) {
            alert("Por favor, selecione uma planilha Excel válida para prosseguir!");
            return;
        }
        formData.append("planilha", arquivo); // Anexa o arquivo binário na requisição
    }

    // 3. ENVIO COM AUTHENTICAÇÃO PARA O BACK-END
    try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!token) {
            alert("Sua sessão expirou ou você não está autenticado. Redirecionando para o login...");
            window.location.href = "login.html";
            return;
        }

        const response = await fetch("http://localhost:3000/api/rotas", {
            method: "POST",
            headers: {
                // Ao enviar FormData contendo arquivos, NÃO definimos o 'Content-Type' manualmente,
                // o navegador adiciona a fronteira (boundary) correta automaticamente.
                "Authorization": `Bearer ${token}` 
            },
            body: formData
        });

        if (response.ok) {
            alert("Rota criada com sucesso!");
            form.reset();
            window.location.href = "rotas.html";
        } else {
            const erro = await response.json();
            alert(`Erro ao salvar rota: ${erro.mensagem || 'Verifique as informações fornecidas.'}`);
        }

    } catch (error) {
        console.error("Erro na comunicação com o servidor:", error);
        alert("Não foi possível conectar ao servidor backend.");
    }
});

// LOGOUT PADRONIZADO
const sairBtn = document.getElementById("btn-sair");
if (sairBtn) {
    sairBtn.addEventListener("click", function(event) {
        const confirmar = confirm("Deseja realmente sair?");
        if (!confirmar) {
            event.preventDefault();
        } else {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
        }
    });
}