// PEGAR ELEMENTOS

const form = document.getElementById("login-form");

const email = document.getElementById("email");

const senha = document.getElementById("senha");


// EVENTO DE ENVIO

form.addEventListener("submit", async function (event) {

    // IMPEDE RECARREGAR A PÁGINA
    event.preventDefault();

    // PEGAR VALORES
    const emailValor = email.value.trim();
    const senhaValor = senha.value.trim();

    // VALIDAR CAMPOS
    if (emailValor === "" || senhaValor === "") {
        alert("Preencha todos os campos!");
        return;
    }

    try {

        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailValor,
                senha: senhaValor
            })
        });


        const data = await res.json();

        if (!res.ok || data.status === 'error') {

            alert(data.mensagem || data.message || 'Erro ao fazer login! Tente novamente.');
            return;
        }


        if (data.dados?.token) {
            localStorage.setItem("roma_token", data.dados.token);
            if (data.dados.usuario) {
                localStorage.setItem("roma_user_tipo", data.dados.usuario.tipo);
            }
        }

        alert("Login realizado com sucesso!");

        const tipo = data.dados.usuario?.tipo?.toUpperCase();

        if (tipo === "EMPRESA") {
            window.location.href = "../empresa/dashboard.html";
        } else if (tipo === "ENTREGADOR") {
            window.location.href = "../entregador/rotas.html";
        } else {
            alert("Tipo de usuário não reconhecido.");
        }

    } catch (error) {
        console.error("Erro na requisição de login:", error);
        alert("Erro de conexão com o servidor. Tente novamente mais tarde.");
    }
});