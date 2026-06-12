// public/empresa/js/nova-rota.js

const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", function () {

    // ── TOKEN ──────────────────────────────────────────────────────────────────
    const token = localStorage.getItem("roma_token");
    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        window.location.href = "../login/login.html";
        return;
    }

    // ── ELEMENTOS ──────────────────────────────────────────────────────────────
    const form         = document.getElementById("form-rota");
    const entregadorEl = document.getElementById("entregador");
    const observacoes  = document.getElementById("observacoes");
    const btnSubmit    = document.getElementById("btnSubmit");

    const tipoManual      = document.getElementById("tipoManual");
    const tipoExcel       = document.getElementById("tipoExcel");
    const containerManual = document.getElementById("container-endereco-manual");
    const containerExcel  = document.getElementById("container-endereco-excel");
    const depositoInput   = document.getElementById("deposito");
    const arquivoExcelInput = document.getElementById("arquivoExcel");

    const listaEntregas = document.getElementById("lista-entregas");
    const btnAddEntrega = document.getElementById("btnAddEntrega");
    const templateEntrega = document.getElementById("template-entrega");

    // ── ALTERNAR MANUAL / EXCEL ────────────────────────────────────────────────
    tipoManual.addEventListener("change", () => {
        containerManual.classList.remove("d-none");
        containerExcel.classList.add("d-none");
        arquivoExcelInput.value = "";
    });

    tipoExcel.addEventListener("change", () => {
        containerExcel.classList.remove("d-none");
        containerManual.classList.add("d-none");
    });

    // ── ADICIONAR / REMOVER LINHAS DE ENTREGA ─────────────────────────────────
    function adicionarLinhaEntrega() {
        const clone = templateEntrega.content.cloneNode(true);
        const row = clone.querySelector(".entrega-row");

        row.querySelector(".btn-remover-entrega").addEventListener("click", () => {
            // Mantém pelo menos 1 linha
            if (listaEntregas.children.length > 1) {
                row.remove();
            } else {
                // Limpa os campos em vez de remover a última linha
                row.querySelectorAll("input").forEach(i => i.value = "");
            }
        });

        listaEntregas.appendChild(row);
    }

    btnAddEntrega.addEventListener("click", adicionarLinhaEntrega);

    // Começa com 1 linha de entrega
    adicionarLinhaEntrega();

    // ── CARREGAR ENTREGADORES (select dinâmico) ───────────────────────────────
    async function carregarEntregadores() {
        try {
            const res = await fetch(`${API_BASE}/entregadores`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.status === 401) {
                localStorage.removeItem("roma_token");
                alert("Sessão expirada. Faça login novamente.");
                window.location.href = "../login/login.html";
                return;
            }

            const data = await res.json();
            if (!res.ok || data.status === "error") throw new Error(data.mensagem || data.erro || "Erro ao carregar entregadores.");

            (data.dados || []).forEach(e => {
                const opt = document.createElement("option");
                opt.value = e.id;
                opt.textContent = e.nome;
                entregadorEl.appendChild(opt);
            });

        } catch (err) {
            console.error("Erro ao carregar entregadores:", err);
            // Não bloqueia o formulário — entregador é opcional
        }
    }
    carregarEntregadores();

    // ── HELPERS DE FEEDBACK ────────────────────────────────────────────────────
    function setLoading(loading) {
        btnSubmit.disabled = loading;
        btnSubmit.innerHTML = loading
            ? `<span class="spinner-border spinner-border-sm me-2"></span> Otimizando rota...`
            : `<i class="bi bi-check-lg me-1"></i> Criar Rota`;
    }

    // ── SUBMIT ─────────────────────────────────────────────────────────────────
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const modoEndereco = document.querySelector('input[name="tipoEndereco"]:checked').value;
        const entregadorId = entregadorEl.value || null;

        setLoading(true);

        try {
            let response;

            if (modoEndereco === "manual") {
                // ── Validações ────────────────────────────────────────────────
                const depositoEndereco = depositoInput.value.trim();
                if (!depositoEndereco || depositoEndereco.length < 5) {
                    alert("Informe o endereço do depósito (origem).");
                    setLoading(false);
                    return;
                }

                const linhas = [...listaEntregas.querySelectorAll(".entrega-row")];
                const entregas = [];

                for (const linha of linhas) {
                    const endereco     = linha.querySelector(".entrega-endereco").value.trim();
                    const pacoteId     = linha.querySelector(".entrega-pacote").value.trim();
                    const destinatario = linha.querySelector(".entrega-destinatario").value.trim();

                    if (!endereco) continue; // ignora linhas vazias

                    if (endereco.length < 5) {
                        alert("Um dos endereços de entrega parece inválido. Verifique e tente novamente.");
                        setLoading(false);
                        return;
                    }

                    entregas.push({
                        endereco,
                        tipo: "ENTREGA",
                        pacote: (pacoteId || destinatario) ? {
                            id: pacoteId || null,
                            destinatario: destinatario || null,
                            observacao: null,
                        } : null,
                    });
                }

                if (entregas.length === 0) {
                    alert("Adicione ao menos um endereço de entrega.");
                    setLoading(false);
                    return;
                }

                const paradas = [
                    { endereco: depositoEndereco, tipo: "DEPOSITO", pacote: null },
                    ...entregas,
                ];

                // ── Envio JSON ───────────────────────────────────────────────
                response = await fetch(`${API_BASE}/rotas/otimizar`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        paradas,
                        entregador_id: entregadorId,
                    }),
                });

            } else {
                // ── Modo Excel ───────────────────────────────────────────────
                const arquivo = arquivoExcelInput.files[0];
                if (!arquivo) {
                    alert("Selecione uma planilha Excel para continuar.");
                    setLoading(false);
                    return;
                }

                const formData = new FormData();
                formData.append("planilha", arquivo);
                if (entregadorId) formData.append("entregador_id", entregadorId);

                response = await fetch(`${API_BASE}/rotas/otimizar-excel`, {
                    method: "POST",
                    headers: {
                        // NÃO definir Content-Type — o browser monta o boundary
                        "Authorization": `Bearer ${token}`,
                    },
                    body: formData,
                });
            }

            if (response.status === 401) {
                localStorage.removeItem("roma_token");
                alert("Sessão expirada. Faça login novamente.");
                window.location.href = "../login/login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok || data.status === "error") {
                throw new Error(data.mensagem || data.erro || "Verifique as informações fornecidas.");
            }

            // ── Sucesso ──────────────────────────────────────────────────────
            const metr = data.dados?.metricas;
            const resumo = metr
                ? `\n\nDistância otimizada: ${metr.km_otimizado} km` +
                  `\nEconomia: ${metr.economia_km} km` +
                  `\nTempo estimado: ${metr.tempo_estimado_min} min`
                : "";

            const enderecosComErro = data.dados?.enderecosComErro || [];
            let avisoErros = "";
            if (enderecosComErro.length > 0) {
                avisoErros = `\n\n⚠️ ${enderecosComErro.length} endereço(s) não foram geocodificados e ficaram de fora da rota.`;
            }

            alert(`Rota criada com sucesso!${resumo}${avisoErros}`);
            window.location.href = "rotas.html";

        } catch (error) {
            console.error("Erro na comunicação com o servidor:", error);
            alert(`Erro ao salvar rota: ${error.message}`);
        } finally {
            setLoading(false);
        }
    });

    // ── LOGOUT ─────────────────────────────────────────────────────────────────
    const sairBtn = document.getElementById("btn-sair");
    if (sairBtn) {
        sairBtn.addEventListener("click", function (event) {
            if (!confirm("Deseja realmente sair?")) {
                event.preventDefault();
            } else {
                localStorage.removeItem("roma_token");
                localStorage.removeItem("roma_user_tipo");
            }
        });
    }
});