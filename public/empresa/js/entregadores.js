// public/empresa/js/entregadores.js

document.addEventListener("DOMContentLoaded", function () {

    // ── ELEMENTOS ──────────────────────────────────────────────────────────────
    const lista         = document.getElementById("listaEntregadores");
    const inputPesquisa = document.getElementById("inputPesquisa");
    const btnNovo       = document.getElementById("btnNovoEntregador");

    // ── ÍCONE POR TIPO DE VEÍCULO ──────────────────────────────────────────────
    function iconeVeiculo(veiculo) {
        if (!veiculo) return "bi-bicycle";
        const v = veiculo.toLowerCase();
        if (v.includes("moto"))     return "bi-bicycle";
        if (v.includes("van"))      return "bi-truck-front";
        if (v.includes("caminh"))   return "bi-truck";
        if (v.includes("carro"))    return "bi-car-front";
        return "bi-bicycle";
    }

    // ── BADGE DE STATUS ────────────────────────────────────────────────────────
    // A tabela de usuários tem campo "ativo" (boolean).
    // Quando a API retornar um campo "status" (em_rota, etc.), use-o.
    function badgeStatus(entregador) {
        if (!entregador.ativo) {
            return `<span class="badge bg-secondary px-3 py-2 rounded-pill">Offline</span>`;
        }
        if (entregador.status === "em_rota") {
            return `<span class="badge bg-primary px-3 py-2 rounded-pill">Em Rota</span>`;
        }
        return `<span class="badge bg-success px-3 py-2 rounded-pill">Ativo</span>`;
    }

    // ── FORMATAR TELEFONE ──────────────────────────────────────────────────────
    function formatarTelefone(tel) {
        if (!tel) return "—";
        const d = tel.replace(/\D/g, "");
        if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
        if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
        return tel;
    }

    // ── GERAR CARD ─────────────────────────────────────────────────────────────
    function criarCard(e) {
        const col = document.createElement("div");
        col.className = "col-12 col-md-6 col-xl-4";
        col.dataset.id = e.id;

        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm p-4 rounded-4 dashboard-card d-flex flex-column justify-content-between">
                <div>
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="bg-light-blue text-navy rounded-circle p-3 d-inline-flex align-items-center justify-content-center"
                             style="width:50px;height:50px;">
                            <i class="bi bi-person fs-4"></i>
                        </div>
                        ${badgeStatus(e)}
                    </div>
                    <h2 class="h5 fw-bold text-navy mb-3">${e.nome}</h2>
                    <p class="text-muted small mb-2">
                        <i class="bi bi-telephone me-2"></i>${formatarTelefone(e.telefone)}
                    </p>
                    <p class="text-muted small mb-0">
                        <i class="bi ${iconeVeiculo(e.veiculo)} me-2"></i>Veículo: <strong>${e.veiculo || "—"}</strong>
                    </p>
                </div>
                <div class="d-flex gap-2 mt-4 pt-2 border-top">
                    <button class="btn btn-outline-orange btn-sm flex-grow-1 py-2 rounded-3 btn-perfil"
                            data-id="${e.id}">Ver Perfil</button>
                    <button class="btn btn-light btn-sm text-secondary px-3 py-2 rounded-3 btn-editar"
                            data-id="${e.id}" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `;

        // Eventos dos botões do card
        col.querySelector(".btn-perfil").addEventListener("click", () => {
            alert(`Abrindo perfil de ${e.nome}...`);
            // window.location.href = `perfil-entregador.html?id=${e.id}`;
        });

        col.querySelector(".btn-editar").addEventListener("click", () => {
            alert(`Abrindo edição de ${e.nome}...`);
            // window.location.href = `editar-entregador.html?id=${e.id}`;
        });

        return col;
    }

    // ── CARREGAR ENTREGADORES DA API ───────────────────────────────────────────
    async function carregarEntregadores() {
        const token = localStorage.getItem("roma_token");

        if (!token) {
            alert("Sessão expirada. Faça login novamente.");
            window.location.href = "../login/login.html";
            return;
        }

        // Estado de carregamento
        lista.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <div class="spinner-border text-secondary mb-3" role="status"></div>
                <p>Carregando entregadores...</p>
            </div>
        `;

        try {
            const res = await fetch("http://localhost:3000/entregadores", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                localStorage.removeItem("roma_token");
                alert("Sessão expirada. Faça login novamente.");
                window.location.href = "../login/login.html";
                return;
            }

            const data = await res.json();

            if (!res.ok || data.status === "error") {
                throw new Error(data.erro || "Erro ao carregar entregadores.");
            }

            const entregadores = data.dados;

            lista.innerHTML = ""; // limpa spinner

            if (!entregadores || entregadores.length === 0) {
                lista.innerHTML = `
                    <div class="col-12 text-center py-5 text-muted">
                        <i class="bi bi-people fs-1 mb-3 d-block"></i>
                        <p class="fw-bold">Nenhum entregador cadastrado ainda.</p>
                        <p class="small">Clique em "Novo Entregador" para adicionar.</p>
                    </div>
                `;
                return;
            }

            entregadores.forEach(e => lista.appendChild(criarCard(e)));

        } catch (err) {
            console.error("Erro ao carregar entregadores:", err);
            lista.innerHTML = `
                <div class="col-12 text-center py-5 text-danger">
                    <i class="bi bi-exclamation-triangle fs-1 mb-3 d-block"></i>
                    <p class="fw-bold">Não foi possível carregar os entregadores.</p>
                    <p class="small">${err.message}</p>
                    <button class="btn btn-outline-danger mt-2" id="btnTentarNovamente">
                        Tentar novamente
                    </button>
                </div>
            `;
            document.getElementById("btnTentarNovamente")
                ?.addEventListener("click", carregarEntregadores);
        }
    }

    // ── PESQUISA (filtra os cards já renderizados) ─────────────────────────────
    inputPesquisa.addEventListener("input", function () {
        const termo = this.value.toLowerCase();
        lista.querySelectorAll(".col-12").forEach(col => {
            const texto = col.innerText.toLowerCase();
            col.style.display = texto.includes(termo) ? "" : "none";
        });
    });

    // ── BOTÃO NOVO ENTREGADOR ──────────────────────────────────────────────────
    btnNovo.addEventListener("click", function () {
        window.location.href = "novo-entregador.html";
    });

    // ── LOGOUT ─────────────────────────────────────────────────────────────────
    const sairBtn = document.querySelector(".logout-area a");
    if (sairBtn) {
        sairBtn.addEventListener("click", function (event) {
            const confirmar = confirm("Deseja realmente sair?");
            if (confirmar) {
                localStorage.removeItem("roma_token");
                localStorage.removeItem("roma_user_tipo");
            } else {
                event.preventDefault();
            }
        });
    }

    // ── INICIAR ────────────────────────────────────────────────────────────────
    carregarEntregadores();
});