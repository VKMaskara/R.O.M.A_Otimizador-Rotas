document.addEventListener("DOMContentLoaded", function () {
    
    // Seleciona o botão "Novo Entregador" pelo ID
    const btnNovoEntregador = document.getElementById("btnNovoEntregador");

    // Se o botão existir na página, adiciona o evento de clique
    if (btnNovoEntregador) {
        btnNovoEntregador.addEventListener("click", function () {
            // Redireciona para o arquivo HTML da página de cadastro
            window.location.href = "novo entregador.html"; 
        });
    }

});


// REDIRECIONAR

novoEntregadorBtn.addEventListener("click", function(){

    window.location.href = "novo-entregador.html";

});


// BOTÕES PERFIL

const perfilBtns = document.querySelectorAll(".detalhes");


// EVENTOS PERFIL

perfilBtns.forEach(function(botao){

    botao.addEventListener("click", function(){

        alert("Abrindo perfil do entregador...");

        // FUTURAMENTE:
        // window.location.href = "perfil-entregador.html";

    });

});


// BOTÕES EDITAR

const editarBtns = document.querySelectorAll(".editar");


// EVENTOS EDITAR

editarBtns.forEach(function(botao){

    botao.addEventListener("click", function(){

        alert("Abrindo edição do entregador...");

        // FUTURAMENTE:
        // window.location.href = "editar-entregador.html";

    });

});


// PESQUISA

const pesquisaInput = document.querySelector(".pesquisa input");

const entregadores = document.querySelectorAll(".entregador-card");


// FILTRAR ENTREGADORES

pesquisaInput.addEventListener("input", function(){

    const valor = this.value.toLowerCase();

    entregadores.forEach(function(entregador){

        const texto = entregador.innerText.toLowerCase();

        if(texto.includes(valor)){

            entregador.style.display = "flex";

        } else {

            entregador.style.display = "none";

        }

    });

});


// MENU ATIVO

const menuLinks = document.querySelectorAll(".menu a");


menuLinks.forEach(function(link){

    link.addEventListener("click", function(){

        menuLinks.forEach(function(item){

            item.classList.remove("active");

        });

        this.classList.add("active");

    });

});


// LOGOUT

const sairBtn = document.querySelector(".logout a");


sairBtn.addEventListener("click", function(event){

    const confirmar = confirm("Deseja realmente sair?");

    if(!confirmar){

        event.preventDefault();

    }

});