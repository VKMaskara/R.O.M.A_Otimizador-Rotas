export class TspService {
    /**
     * Extrai matrizes de tempo, distância e nomes das ruas dos dados brutos do Google.
     */
    static processarDadosBrutos(matrixData) {
        try {
            // 1. Extração das Linhas (Rows)
            let rows = Array.isArray(matrixData) ? matrixData : (matrixData.rows || matrixData.matriz?.rows || []);

            // 2. CORREÇÃO: Extração dos Nomes das Ruas
            // Tentamos todas as possibilidades: o que o Google manda e o que seu ExcelService gera
            // No seu TspService.js, vamos mudar esta parte:
            const pontos = matrixData.endereços ||
                matrixData.enderecos_nomes ||
                matrixData.destination_addresses || // Nome padrão do Google
                matrixData.origin_addresses ||      // Outro nome padrão do Google
                [];

            // Criamos o array de strings final
            const nomesDasRuas = pontos.map(p => {
                if (typeof p === 'string') return p;
                return p.endereco_original || p.endereco || "Endereço não identificado";
            });

            if (!rows || rows.length === 0) {
                throw new Error("A matriz de dados (rows) está vazia no TspService.");
            }

            const timeMatrix = [];
            const distanceMatrix = [];

            for (const row of rows) {
                const elements = row.elements || row;

                // API retorna: duration.value em SEGUNDOS, distance.value em METROS
                const rowTimes = elements.map(el =>
                    el.status === 'OK' ? el.duration.value : (typeof el === 'number' ? el : 999999)
                );
                const rowDistances = elements.map(el => {
                    if (el.status !== 'OK') return typeof el === 'number' ? el : 999999;
                    const metros = el.distance?.value; // sempre em metros (Google API)
                    if (metros == null || typeof metros !== 'number') return 999999;
                    return metros / 1000; // converter para KM
                });

                timeMatrix.push(rowTimes);
                distanceMatrix.push(rowDistances);
            }

            // Diagnóstico: amostra do primeiro trecho (origem 0 -> destino 1) para validar unidade
            const amostraDistKm = distanceMatrix[0]?.[1];
            const amostraTempoS = timeMatrix[0]?.[1];
            console.log(`\n✅ Matrizes extraídas com sucesso: ${timeMatrix.length} pontos.`);
            console.log(`   [Amostra] Trecho 0→1: distância = ${amostraDistKm?.toFixed(2) ?? '?'} km, tempo = ${amostraTempoS ?? '?'} s`);
            if (amostraDistKm != null && amostraDistKm > 100) {
                console.warn(`   ⚠️ Trecho 0→1 com distância muito alta (${amostraDistKm.toFixed(0)} km). Confira se a API retorna distância em metros (valor/1000 = km).`);
            }

            // Retornamos os nomes preenchidos para o OtimizacaoService usar
            return { timeMatrix, distanceMatrix, nomesDasRuas };

        } catch (error) {
            console.error(`\n❌ ERRO no TspService:`, error.message);
            return { timeMatrix: [], distanceMatrix: [], nomesDasRuas: [] };
        }
    }

    /**
     * Implementação do Algoritmo do Vizinho Mais Próximo.
     * NOME CORRIGIDO: executarAlgoritmoTSP (removido o 'i' extra)
     */
    static executarAlgoritmoTSP(timeMatrix, start = 0) {
        const n = timeMatrix.length;

        if (n === 0) {
            console.error("❌ Erro: Matriz vazia para o TSP.");
            return { rota: [], tempoFinal: 0 };
        }

        let rota = [start];
        let pontosVisitados = new Set(rota);
        let pontoAtual = start;

        while (rota.length < n) {
            let tempoMinimo = Infinity;
            let melhorVizinhoIndex = null;

            for (let i = 0; i < n; i++) {
                const tempoParaVizinho = timeMatrix[pontoAtual][i];
                if (!pontosVisitados.has(i) && tempoParaVizinho < tempoMinimo) {
                    tempoMinimo = tempoParaVizinho;
                    melhorVizinhoIndex = i;
                }
            }

            if (melhorVizinhoIndex === null) {
                for (let i = 0; i < n; i++) {
                    if (!pontosVisitados.has(i)) {
                        melhorVizinhoIndex = i;
                        break;
                    }
                }
            }

            rota.push(melhorVizinhoIndex);
            pontosVisitados.add(melhorVizinhoIndex);
            pontoAtual = melhorVizinhoIndex;
        }

        // Cálculo do Tempo Total
        const todosOsTempos = timeMatrix.flat();
        const temposValidos = todosOsTempos.filter(t => t !== Infinity && t > 0);
        const PENALIDADE = temposValidos.length > 0
            ? temposValidos.reduce((a, b) => a + b, 0) / temposValidos.length
            : 0;

        const tempoFinal = rota.reduce((acc, curr, index) => {
            if (index === 0) return acc;
            const tempoOriginal = timeMatrix[rota[index - 1]][curr];
            const tempoSomar = (tempoOriginal === Infinity || tempoOriginal === undefined) ? PENALIDADE : tempoOriginal;
            return acc + tempoSomar;
        }, 0);

        return { rota, tempoFinal };
    }
}


