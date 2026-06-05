// BOTÃO NOVA ROTA

const novaRotaBtn = document.querySelector(".topbar button");


// EVENTO BOTÃO

novaRotaBtn.addEventListener("click", function(){

    // REDIRECIONAR

    window.location.href = "nova-rota.html";

});


// PEGAR BOTÕES DE DETALHES

const detalhesBtns = document.querySelectorAll(".rota-item button");


// EVENTO EM CADA BOTÃO

detalhesBtns.forEach(function(botao){

    botao.addEventListener("click", function(){

        alert("Abrindo detalhes da rota...");

        // FUTURAMENTE:
        // window.location.href = "detalhes-rota.html";

    });

});


// MENU ATIVO

const menuLinks = document.querySelectorAll(".menu a");


menuLinks.forEach(function(link){

    link.addEventListener("click", function(){

        // REMOVE ACTIVE

        menuLinks.forEach(function(item){

            item.classList.remove("active");

        });

        // ADICIONA ACTIVE

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