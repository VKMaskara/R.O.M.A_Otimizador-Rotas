// BOTÃO NOVA ROTA
const novaRotaBtn = document.getElementById("btnNovaRota");

if (novaRotaBtn) {
    novaRotaBtn.addEventListener("click", function(){
        window.location.href = "nova-rota.html";
    });
}

// SELECIONAR BOTÕES DE DETALHES NA TABELA
const detalhesBtns = document.querySelectorAll(".btn-detalhes");

detalhesBtns.forEach(function(botao){
    botao.addEventListener("click", function(){
        alert("Abrindo detalhes da rota...");
        // FUTURAMENTE:
        // window.location.href = "detalhes-rota.html";
    });
});

// LOGOUT COM CONFIRMAÇÃO
const sairBtn = document.querySelector(".btn-logout");

if (sairBtn) {
    sairBtn.addEventListener("click", function(event){
        const confirmar = confirm("Deseja realmente sair?");
        if(!confirmar){
            event.preventDefault();
        }
    });
}