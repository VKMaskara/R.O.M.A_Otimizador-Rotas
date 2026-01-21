export class TspService {
    /**
     * Extrai matrizes de tempo, distância e nomes das ruas dos dados brutos do Google.
     */
    static processarDadosBrutos(matrixData) {
        try {
            // Se matrixData já for um Array, ele é a própria lista de rows
            // Caso contrário, tentamos buscar dentro das chaves conhecidas
            let rows = Array.isArray(matrixData) ? matrixData : (matrixData.rows || matrixData.matriz?.rows || []);

            // Para os nomes, se vier um Array, não teremos os nomes aqui (precisaremos tratar no Service)
            const pontos = matrixData.endereços || matrixData.enderecos_nomes || [];
            const nomesDasRuas = pontos.map(p => p.endereco_original || p.endereco || (typeof p === 'string' ? p : "Rua desconhecida"));

            if (!rows || rows.length === 0) {
                throw new Error("A matriz de dados (rows) está vazia no TspService.");
            }

            const timeMatrix = [];
            const distanceMatrix = [];

            for (const row of rows) {
                // Se a estrutura for do Google, terá .elements. Se for simplificada, tratamos aqui:
                const elements = row.elements || row;

                const rowTimes = elements.map(el => el.status === 'OK' ? el.duration.value : (typeof el === 'number' ? el : 999999));
                const rowDistances = elements.map(el => el.status === 'OK' ? el.distance.value / 1000 : (typeof el === 'number' ? el : 999999));

                timeMatrix.push(rowTimes);
                distanceMatrix.push(rowDistances);
            }

            console.log(`\n✅ Matrizes extraídas com sucesso: ${timeMatrix.length} pontos.`);
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


