// ═══════════════════════════════════════════════════════
//  R.O.M.A — rota-entregador.js  |  Mapa + Navegação GPS
// ═══════════════════════════════════════════════════════

let mapa            = null;
let paradas         = [];
let paradaAtual     = 0;
let marcadores      = [];
let linhaRota       = null;
let linhaAteProximo = null;
let rotaId          = null;
let marcadorUsuario = null;
let posUsuario      = null;

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    rotaId = params.get("id");

    if (!rotaId) { mostrarErro("ID da rota não encontrado na URL."); return; }

    inicializarMapa();
    carregarRota(rotaId);
    configurarPainel();
    iniciarRastreamento();

    document.getElementById("btn-localizar").addEventListener("click", centralizarUsuario);
    document.getElementById("btn-proxima").addEventListener("click", proximaParada);
    document.getElementById("btn-concluir").addEventListener("click", concluirParadaAtual);
    document.getElementById("btn-navegar").addEventListener("click", abrirNavegador);
});


// ───────────────────────────────────────────────────────
//  MAPA
// ───────────────────────────────────────────────────────

function inicializarMapa() {
    mapa = L.map("mapa", { zoomControl: false, attributionControl: false })
             .setView([-23.555, -46.663], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(mapa);
    L.control.zoom({ position: "topright" }).addTo(mapa);
    L.control.attribution({ position: "bottomleft", prefix: false })
        .addAttribution("© OpenStreetMap").addTo(mapa);
}


// ───────────────────────────────────────────────────────
//  RASTREAMENTO EM TEMPO REAL
// ───────────────────────────────────────────────────────

function iniciarRastreamento() {
    if (!navigator.geolocation) return;

    navigator.geolocation.watchPosition(
        function (pos) {
            posUsuario = [pos.coords.latitude, pos.coords.longitude];

            if (marcadorUsuario) {
                marcadorUsuario.setLatLng(posUsuario);
            } else {
                marcadorUsuario = L.circleMarker(posUsuario, {
                    radius: 10, fillColor: "#2563eb",
                    color: "#ffffff", weight: 3, fillOpacity: 1, zIndexOffset: 1000
                }).addTo(mapa).bindPopup("📍 Você está aqui");
            }

            atualizarLinhaAteProximo();
        },
        err => console.warn("Geo:", err.message),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
}

function atualizarLinhaAteProximo() {
    if (!posUsuario) return;
    if (linhaAteProximo) mapa.removeLayer(linhaAteProximo);

    const parada = paradas[paradaAtual];
    if (!parada?.lat) return;

    linhaAteProximo = L.polyline([posUsuario, [parada.lat, parada.lng]], {
        color: "#2563eb", weight: 3, opacity: .8, dashArray: "6, 4"
    }).addTo(mapa);
}


// ───────────────────────────────────────────────────────
//  ABRIR NAVEGADOR EXTERNO
// ───────────────────────────────────────────────────────

function abrirNavegador() {
    const parada = paradas[paradaAtual];
    if (!parada?.lat) { alert("Nenhuma parada selecionada."); return; }

    const lat   = parada.lat;
    const lng   = parada.lng;
    const isMob = /Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMob) {
        window.location.href = `waze://?ll=${lat},${lng}&navigate=yes`;
        setTimeout(() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank"), 1500);
    } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
    }
}


// ───────────────────────────────────────────────────────
//  CARREGA A ROTA
// ───────────────────────────────────────────────────────

async function carregarRota(id) {
    const token = localStorage.getItem("roma_token");
    if (!token) { mostrarErro("Não autenticado. Faça login novamente."); return; }

    try {
        const response = await fetch("http://localhost:3000/entregadores/minha-rota", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        const resposta   = await response.json();
        const todasRotas = Array.isArray(resposta.dados) ? resposta.dados : [];
        const dados      = todasRotas.find(r => String(r.id) === String(id));

        if (!dados) { mostrarErro("Rota não encontrada ou não pertence a você."); return; }

        paradas = dados.paradas ?? [];
        if (paradas.length === 0) { mostrarErro("Esta rota não possui paradas cadastradas."); return; }

        // Header
        document.getElementById("header-rota").textContent = `Rota #${dados.id}`;
        document.getElementById("header-data").textContent = formatarData(dados.data);

        const badge  = document.getElementById("header-status");
        const status = (dados.status || "pendente").toLowerCase();
        badge.textContent = capitalize(dados.status || "Pendente");
        badge.className   = `badge rounded-pill px-3 py-2 ${
            status === "concluida" ? "text-bg-success" :
            status === "em_andamento" || status === "em andamento" ? "text-bg-primary" :
            "text-bg-warning text-dark"
        }`;

        // Resumo
        const totalEntregas = paradas.filter(p => p.status_entrega !== null).length;
        const concluidas    = paradas.filter(p => p.status_entrega === "entregue").length;

        document.getElementById("resumo-km").textContent      = dados.km_otimizado ? `${dados.km_otimizado} km` : "—";
        document.getElementById("resumo-tempo").textContent   = dados.tempo_estimado_min ? formatarTempo(dados.tempo_estimado_min) : "—";
        document.getElementById("resumo-entregas").textContent = `${concluidas}/${totalEntregas}`;

        renderizarMapa();
        renderizarLista();

        // Ativa primeira entrega pendente
        const primeiraIdx = paradas.findIndex(p => p.status_entrega === "pendente");
        ativarParada(primeiraIdx >= 0 ? primeiraIdx : 0);
        esconderLoading();

    } catch (error) {
        console.error("Erro ao carregar rota:", error);
        mostrarErro(error.message || "Falha ao conectar com o servidor.");
    }
}


// ───────────────────────────────────────────────────────
//  RENDERIZA MAPA
// ───────────────────────────────────────────────────────

function renderizarMapa() {
    marcadores.forEach(m => mapa.removeLayer(m));
    marcadores = [];
    if (linhaRota) mapa.removeLayer(linhaRota);

    const coords = [];

    paradas.forEach(function (parada, idx) {
        if (!parada.lat || !parada.lng) return;
        coords.push([parada.lat, parada.lng]);

        const isDeposito  = parada.status_entrega === null;
        const isEntregue  = parada.status_entrega === "entregue";
        const isAtiva     = idx === paradaAtual;

        let cor   = isAtiva ? "#e85d04" : "#F28C28";
        let texto = String(parada.posicao);

        if (isDeposito && idx === 0)                  { cor = "#0B2A4A"; texto = "S"; }
        if (isDeposito && idx === paradas.length - 1) { cor = "#0B2A4A"; texto = "R"; }
        if (isEntregue)                               { cor = "#16a34a"; }

        const tam = isAtiva ? 44 : 36;

        const icone = L.divIcon({
            className: "",
            html: `<div style="background:${cor};width:${tam}px;height:${tam}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.3);">
                     <span style="transform:rotate(45deg);font-weight:700;font-size:${isAtiva?15:13}px;color:white;">${texto}</span>
                   </div>`,
            iconSize: [tam, tam], iconAnchor: [tam/2, tam], popupAnchor: [0, -tam]
        });

        const marcador = L.marker([parada.lat, parada.lng], { icon: icone })
            .addTo(mapa)
            .bindPopup(criarPopup(parada, idx), { maxWidth: 260 })
            .on("click", () => ativarParada(idx));

        marcadores.push(marcador);
    });

    linhaRota = L.polyline(coords, {
        color: "#F28C28", weight: 4, opacity: .6, dashArray: "8, 6"
    }).addTo(mapa);

    if (coords.length > 0) mapa.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
}


// ───────────────────────────────────────────────────────
//  POPUP
// ───────────────────────────────────────────────────────

function criarPopup(parada, idx) {
    const isDeposito = parada.status_entrega === null;

    if (isDeposito) {
        return `<div style="font-family:'Segoe UI',Arial,sans-serif;">
            <p style="margin:0;font-weight:700;color:#0B2A4A;">${idx === 0 ? "📦 Saída" : "🏭 Retorno"}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${parada.endereco}</p>
        </div>`;
    }

    const statusColor = parada.status_entrega === "entregue" ? "#16a34a" : parada.status_entrega === "falhou" ? "#dc2626" : "#d97706";

    return `<div style="font-family:'Segoe UI',Arial,sans-serif;min-width:200px;">
        <p style="margin:0;font-weight:700;color:#0B2A4A;">#${parada.posicao} — ${parada.destinatario || "Entrega"}</p>
        <p style="margin:4px 0;font-size:12px;color:#6b7280;">${parada.endereco}</p>
        ${parada.codigo ? `<span style="background:#fff7ed;color:#c2410c;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">${parada.codigo}</span>` : ""}
        ${parada.observacao ? `<p style="margin:6px 0 0;font-size:12px;color:#d97706;">⚠️ ${parada.observacao}</p>` : ""}
        <p style="margin:6px 0 0;font-size:12px;">Status: <strong style="color:${statusColor}">${capitalize(parada.status_entrega || "pendente")}</strong></p>
        <button onclick="abrirNavegador()" style="margin-top:8px;width:100%;background:#F28C28;color:white;border:none;border-radius:8px;padding:6px;font-size:12px;font-weight:600;cursor:pointer;">
            🗺️ Navegar até aqui
        </button>
    </div>`;
}


// ───────────────────────────────────────────────────────
//  LISTA DE PARADAS
// ───────────────────────────────────────────────────────

function renderizarLista() {
    const lista = document.getElementById("lista-paradas");
    lista.innerHTML = "";

    paradas.forEach(function (parada, idx) {
        const isDeposito = parada.status_entrega === null;
        const isEntregue = parada.status_entrega === "entregue";
        const isFalhou   = parada.status_entrega === "falhou";

        let classeItem  = "parada-item";
        let classeIcone = "icone-entrega";
        let textoIcone  = String(parada.posicao);

        if (isDeposito)          { classeItem += " ponto-base"; classeIcone = "icone-deposito"; textoIcone = idx === 0 ? "S" : "R"; }
        else if (isEntregue)     { classeItem += " concluida";  classeIcone = "icone-concluido"; }
        else if (isFalhou)       { classeItem += " falhou"; }

        const badgeStatus = isDeposito ? "" : `
            <span class="parada-status-badge ${isEntregue ? "badge-concluida" : isFalhou ? "badge-falhou" : "badge-pendente"}">
                ${isEntregue ? "✓" : isFalhou ? "✗" : "Pendente"}
            </span>`;

        const li = document.createElement("li");
        li.className   = classeItem;
        li.dataset.idx = idx;
        li.innerHTML   = `
            <div class="icone-parada ${classeIcone}">${textoIcone}</div>
            <div class="parada-info">
                <p class="fw-semibold text-navy" style="font-size:14px;">
                    ${isDeposito ? (idx === 0 ? "Saída do Depósito" : "Retorno ao Depósito") : (parada.destinatario || parada.endereco.split(",")[0])}
                </p>
                <p class="text-muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${parada.endereco}
                </p>
                ${parada.observacao ? `<p style="font-size:11px;color:#d97706;">⚠️ ${parada.observacao}</p>` : ""}
            </div>
            ${badgeStatus}
        `;

        li.addEventListener("click", () => { ativarParada(idx); centralizarMarcador(idx); });
        lista.appendChild(li);
    });
}


// ───────────────────────────────────────────────────────
//  ATIVA PARADA
// ───────────────────────────────────────────────────────

function ativarParada(idx) {
    paradaAtual = idx;
    const parada = paradas[idx];
    if (!parada) return;

    document.querySelectorAll(".parada-item").forEach((el, i) => el.classList.toggle("ativa", i === idx));

    const card       = document.getElementById("parada-atual-card");
    const isDeposito = parada.status_entrega === null;
    const isEntregue = parada.status_entrega === "entregue";
    const btnNav     = document.getElementById("btn-navegar");
    const btnConcluir= document.getElementById("btn-concluir");

    if (!isDeposito) {
        card.classList.remove("d-none");
        btnNav.classList.remove("d-none");

        document.getElementById("parada-numero").textContent       = parada.posicao;
        document.getElementById("parada-destinatario").textContent = parada.destinatario || parada.endereco.split(",")[0];
        document.getElementById("parada-endereco").textContent     = parada.endereco;
        document.getElementById("parada-codigo").textContent       = parada.codigo || "—";

        const obsEl = document.getElementById("parada-obs");
        if (parada.observacao) { obsEl.textContent = `⚠️ ${parada.observacao}`; obsEl.classList.remove("d-none"); }
        else obsEl.classList.add("d-none");

        btnConcluir.disabled  = isEntregue;
        btnConcluir.innerHTML = isEntregue
            ? '<i class="bi bi-check-circle-fill"></i>'
            : '<i class="bi bi-check-lg"></i>';
    } else {
        card.classList.add("d-none");
        btnNav.classList.add("d-none");
    }

    centralizarMarcador(idx);
    renderizarMapa();
    atualizarLinhaAteProximo();

    // Atualiza contador no resumo
    const totalEntregas = paradas.filter(p => p.status_entrega !== null).length;
    const concluidas    = paradas.filter(p => p.status_entrega === "entregue").length;
    document.getElementById("resumo-entregas").textContent = `${concluidas}/${totalEntregas}`;
}


// ───────────────────────────────────────────────────────
//  CENTRALIZA MARCADOR
// ───────────────────────────────────────────────────────

function centralizarMarcador(idx) {
    const parada = paradas[idx];
    if (!parada?.lat) return;
    mapa.setView([parada.lat, parada.lng], 16, { animate: true });
    if (marcadores[idx]) marcadores[idx].openPopup();
}


// ───────────────────────────────────────────────────────
//  PRÓXIMA PARADA
// ───────────────────────────────────────────────────────

function proximaParada() {
    const proxIdx = paradas.findIndex((p, i) =>
        i > paradaAtual && p.status_entrega !== null && p.status_entrega !== "entregue"
    );

    if (proxIdx !== -1) {
        ativarParada(proxIdx);
        const itens = document.querySelectorAll(".parada-item");
        if (itens[proxIdx]) itens[proxIdx].scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
        // Todas entregues — pergunta se quer finalizar a rota
        if (confirm("✅ Todas as entregas concluídas!\n\nDeseja finalizar a rota?")) {
            finalizarRota();
        }
    }
}


// ───────────────────────────────────────────────────────
//  CONCLUI PARADA — PATCH /paradas/:id/status
// ───────────────────────────────────────────────────────

async function concluirParadaAtual() {
    const parada = paradas[paradaAtual];
    if (!parada || parada.status_entrega === null) return;
    if (parada.status_entrega === "entregue") return;

    const confirmar = confirm(`Confirmar entrega em:\n${parada.endereco}?`);
    if (!confirmar) return;

    const token = localStorage.getItem("roma_token");
    const btn   = document.getElementById("btn-concluir");
    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        const response = await fetch(`http://localhost:3000/paradas/${parada.id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status: "entregue" })  // ✅ campo correto
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        // Atualiza localmente
        paradas[paradaAtual].status_entrega = "entregue";
        renderizarLista();
        ativarParada(paradaAtual);

        // Vai para próxima automaticamente após 800ms
        setTimeout(() => proximaParada(), 800);

    } catch (error) {
        console.error("Erro ao concluir parada:", error);
        alert("Não foi possível registrar a entrega. Tente novamente.");
        btn.disabled  = false;
        btn.innerHTML = '<i class="bi bi-check-lg"></i>';
    }
}


// ───────────────────────────────────────────────────────
//  FINALIZAR ROTA — POST /rotas/:id/resultado
// ───────────────────────────────────────────────────────

async function finalizarRota() {
    const token = localStorage.getItem("roma_token");

    try {
        const response = await fetch(`http://localhost:3000/rotas/${rotaId}/resultado`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                entrega_ok:    paradas.filter(p => p.status_entrega === "entregue").length,
                entrega_falha: paradas.filter(p => p.status_entrega === "falhou").length,
                km_real:       0,
                tempo_real_min: 0,
            })
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        alert("🎉 Rota finalizada com sucesso!");
        window.location.href = "rotas.html";

    } catch (error) {
        console.error("Erro ao finalizar rota:", error);
        alert("Não foi possível finalizar a rota. Tente novamente.");
    }
}


// ───────────────────────────────────────────────────────
//  CENTRALIZAR USUÁRIO
// ───────────────────────────────────────────────────────

function centralizarUsuario() {
    if (posUsuario) {
        mapa.setView(posUsuario, 16, { animate: true });
        if (marcadorUsuario) marcadorUsuario.openPopup();
    } else {
        navigator.geolocation?.getCurrentPosition(
            pos => mapa.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true }),
            ()  => alert("Não foi possível obter sua localização.")
        );
    }
}


// ───────────────────────────────────────────────────────
//  PAINEL SWIPEABLE — corrigido para mobile
// ───────────────────────────────────────────────────────

function configurarPainel() {
    const painel  = document.getElementById("painel");
    const alca    = document.getElementById("alca");
    const mapaEl  = document.getElementById("mapa");
    const btnFlut = document.querySelector(".btn-flutuante");

    let startY = 0;
    let estado = "min";
    let isDragging = false;

    function getEstadoAltura() {
        const vh = window.innerHeight;
        return { min: 220, mid: Math.floor(vh * 0.55), max: Math.floor(vh * 0.88) };
    }

    function aplicarAltura(altura) {
        painel.style.height    = altura + "px";
        mapaEl.style.bottom    = altura + "px";
        btnFlut.style.bottom   = (altura + 16) + "px";
    }

    function onStart(y) { startY = y; isDragging = true; }

    function onEnd(y) {
        if (!isDragging) return;
        isDragging = false;

        const diff   = startY - y;
        const alturas = getEstadoAltura();

        if (diff > 40) {
            if (estado === "min")           { estado = "mid"; aplicarAltura(alturas.mid); }
            else if (estado === "mid")      { estado = "max"; aplicarAltura(alturas.max); }
        } else if (diff < -40) {
            if (estado === "max")           { estado = "mid"; aplicarAltura(alturas.mid); }
            else if (estado === "mid")      { estado = "min"; aplicarAltura(alturas.min); }
        }
    }

    // Touch
    alca.addEventListener("touchstart", e => onStart(e.touches[0].clientY), { passive: true });
    alca.addEventListener("touchend",   e => onEnd(e.changedTouches[0].clientY));

    // Mouse (desktop)
    alca.addEventListener("mousedown", e => { onStart(e.clientY); e.preventDefault(); });
    document.addEventListener("mousemove", e => { /* só tracking */ });
    document.addEventListener("mouseup",   e => { if (isDragging) onEnd(e.clientY); });

    // Altura inicial
    aplicarAltura(getEstadoAltura().min);

    // Recalcula no resize
    window.addEventListener("resize", () => {
        const alturas = getEstadoAltura();
        const mapa    = { min: alturas.min, mid: alturas.mid, max: alturas.max };
        aplicarAltura(mapa[estado] || alturas.min);
    });
}


// ───────────────────────────────────────────────────────
//  UTILITÁRIOS
// ───────────────────────────────────────────────────────

function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""; }

function formatarData(d) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { weekday:"short", day:"2-digit", month:"short" });
}

function formatarTempo(min) {
    const h = Math.floor(min/60), m = min%60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function esconderLoading() { document.getElementById("loading-overlay").classList.add("d-none"); }

function mostrarErro(msg) {
    document.getElementById("loading-overlay").innerHTML = `
        <div class="text-center text-white px-4">
            <i class="bi bi-exclamation-triangle-fill fs-1 text-warning mb-3 d-block"></i>
            <p class="fw-semibold">${msg}</p>
            <a href="rotas.html" class="btn btn-light mt-2">Voltar às Rotas</a>
        </div>`;
}