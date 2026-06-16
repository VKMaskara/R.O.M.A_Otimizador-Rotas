// ═══════════════════════════════════════════════════════
//  R.O.M.A — editar-rota.js  |  Integração com backend
// ═══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {

    const urlParams = new URLSearchParams(window.location.search);
    const rotaId    = urlParams.get("id");

    if (!rotaId) {
        exibirAlerta("ID da rota não identificado na URL.", "danger");
        return;
    }

    // Atualiza o link de Cancelar para voltar aos detalhes da rota certa
    const btnCancelar = document.getElementById("btn-cancelar");
    if (btnCancelar) btnCancelar.href = `detalhes-rota.html?id=${rotaId}`;

    // Carrega os dados da rota e os entregadores em paralelo
    Promise.all([
        carregarRota(rotaId),
        carregarEntregadores()
    ]).then(([dadosRota]) => {
        if (dadosRota) preencherFormulario(dadosRota);
    });

    // Submit do formulário
    document.getElementById("form-editar-rota").addEventListener("submit", function (event) {
        event.preventDefault();
        salvarRota(rotaId);
    });

    // Logout
    const sairBtn = document.querySelector(".btn-logout");
    if (sairBtn) {
        sairBtn.addEventListener("click", function (event) {
            if (!confirm("Deseja realmente sair do sistema R.O.M.A?")) {
                event.preventDefault();
            } else {
                localStorage.removeItem("roma_token");
                localStorage.removeItem("roma_user_tipo");
            }
        });
    }
});


// ───────────────────────────────────────────────────────
//  BUSCA OS DADOS DA ROTA
// ───────────────────────────────────────────────────────

async function carregarRota(id) {
    const token = localStorage.getItem("roma_token");

    if (!token) {
        exibirAlerta("Usuário não autenticado. Faça login novamente.", "danger");
        return null;
    }

    try {
        const response = await fetch(`http://localhost:3000/rotas/${id}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        const resposta = await response.json();
        return resposta.dados ?? resposta;

    } catch (error) {
        console.error("Erro ao carregar rota:", error);
        exibirAlerta("Não foi possível carregar os dados da rota.", "danger");
        return null;
    }
}


// ───────────────────────────────────────────────────────
//  BUSCA OS ENTREGADORES PARA O SELECT
// ───────────────────────────────────────────────────────

async function carregarEntregadores() {
    const token = localStorage.getItem("roma_token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:3000/entregadores", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const resposta  = await response.json();
        // Backend retorna { status: "success", dados: [...] }
        const lista     = Array.isArray(resposta) ? resposta : resposta.dados ?? resposta.entregadores ?? [];
        const selectEl  = document.getElementById("entregador_id");

        lista.forEach(function (entregador) {
            const option  = document.createElement("option");
            option.value  = entregador.id;
            option.textContent = entregador.nome || entregador.name || `Entregador #${entregador.id}`;
            selectEl.appendChild(option);
        });

    } catch (error) {
        console.warn("Não foi possível carregar entregadores:", error);
    }
}


// ───────────────────────────────────────────────────────
//  PREENCHE O FORMULÁRIO COM OS DADOS DA ROTA
// ───────────────────────────────────────────────────────

function preencherFormulario(dados) {

    // Subtítulo
    const subtitulo = document.getElementById("subtitulo-rota");
    if (subtitulo) subtitulo.textContent = `Rota #${dados.id} — ${formatarData(dados.data)}`;

    // Status
    const selectStatus = document.getElementById("status");
    if (selectStatus) {
        const statusVal = (dados.status || "pendente").toLowerCase();
        Array.from(selectStatus.options).forEach(opt => {
            if (opt.value === statusVal) opt.selected = true;
        });
    }

    // Entregador (seleciona após carregar as options)
    if (dados.entregador_id) {
        const selectEnt = document.getElementById("entregador_id");
        // Aguarda o DOM ter as options dos entregadores
        setTimeout(() => {
            Array.from(selectEnt.options).forEach(opt => {
                if (String(opt.value) === String(dados.entregador_id)) opt.selected = true;
            });
        }, 300);
    }

    // Campos somente leitura
    setValue("km_original",       dados.km_original    ? `${dados.km_original} km`    : "—");
    setValue("km_otimizado",      dados.km_otimizado   ? `${dados.km_otimizado} km`   : "—");
    setValue("tempo_estimado_min",dados.tempo_estimado_min ? formatarTempo(dados.tempo_estimado_min) : "—");

    // Data
    if (dados.data) {
        const dataInput = document.getElementById("data");
        if (dataInput) dataInput.value = dados.data.split("T")[0]; // garante formato yyyy-mm-dd
    }

    // Total de paradas (excluindo saída e retorno)
    const paradas = dados.paradas || [];
    const entregas = paradas.filter(p => p.pacote_id !== null);
    setValue("total_paradas", `${entregas.length} entrega(s) — ${paradas.length} parada(s) no total`);

    // Esconde loading e exibe formulário
    document.getElementById("loading-form").classList.add("d-none");
    document.getElementById("form-editar-rota").classList.remove("d-none");
}


// ───────────────────────────────────────────────────────
//  ENVIA AS ALTERAÇÕES PARA O BACKEND
// ───────────────────────────────────────────────────────

async function salvarRota(id) {
    const token = localStorage.getItem("roma_token");

    const payload = {
        status:        document.getElementById("status").value,
        entregador_id: document.getElementById("entregador_id").value || null,
        data:          document.getElementById("data").value
    };

    const btnSalvar = document.querySelector("[type='submit']");
    btnSalvar.disabled   = true;
    btnSalvar.innerHTML  = `<span class="spinner-border spinner-border-sm me-2"></span> Salvando...`;

    try {
        const response = await fetch(`http://localhost:3000/rotas/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        exibirAlerta("Rota atualizada com sucesso!", "success");

        // Redireciona para detalhes após 1.5s
        setTimeout(() => {
            window.location.href = `detalhes-rota.html?id=${id}`;
        }, 1500);

    } catch (error) {
        console.error("Erro ao salvar rota:", error);
        exibirAlerta("Não foi possível salvar as alterações. Tente novamente.", "danger");

        btnSalvar.disabled  = false;
        btnSalvar.innerHTML = `<i class="bi bi-floppy me-2"></i> Salvar Alterações`;
    }
}


// ───────────────────────────────────────────────────────
//  UTILITÁRIOS
// ───────────────────────────────────────────────────────

function setValue(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor;
}

function formatarData(dataStr) {
    if (!dataStr) return "—";
    const d = new Date(dataStr);
    if (isNaN(d)) return dataStr;
    return d.toLocaleDateString("pt-BR");
}

function formatarTempo(minutos) {
    if (!minutos) return "—";
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

function exibirAlerta(mensagem, tipo) {
    const alerta = document.getElementById("alerta-feedback");
    if (!alerta) return;
    alerta.className     = `alert alert-${tipo} rounded-3`;
    alerta.innerHTML     = `<i class="bi bi-${tipo === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2"></i>${mensagem}`;
    alerta.classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });
}