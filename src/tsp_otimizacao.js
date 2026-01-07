import fs from "fs";
import 'dotenv/config';
import path from 'path';

const INPUT_MATRIX_FILE =  path.join(process.cwd(), 'output', 'distancia_matriz_bruta.json');

export async function otimizarRota() {
    // FUNÇÃO AUXILIAR: Converte segundos para HH:MM:SS
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(remainingSeconds).padStart(2, '0');

        return `${h}:${m}:${s}`;
    }

    // FUNÇÃO 1: LER A MATRIZ E CONVERTER PARA FORMATO NUMÉRICO
    function readTravelMatrix() {
        try {
            // Tenta ler o arquivo. Se falhar (ex: arquivo não existe), o 'catch' é executado.
            const rawdata = fs.readFileSync(INPUT_MATRIX_FILE, 'utf-8');
            const matrixData = JSON.parse(rawdata);

            // 1. ACESSO AOS DADOS: Mudamos de 'rows' para o novo nome que definimos
            // Adicionamos um "fallback" (|| matrixData.rows) caso você ainda não tenha rodado a Máquina 2 atualizada
            const rows = matrixData.distancias_e_tempos || matrixData.rows;
            const nomesDasRuas = matrixData.enderecos_nomes || []; // Capturamos os nomes aqui

            const timeMatrix = [];

            // Agora iteramos sobre a variável 'rows' que acabamos de extrair
            for (const row of rows) {
                const rowTimes = row.elements.map(element => {
                    if (element.status === 'OK') {
                        return element.duration.value;
                    } else {
                        return Infinity;
                    }
                });
                timeMatrix.push(rowTimes);
            }

            console.log(`\n✅ Matriz carregada: ${timeMatrix.length} pontos.`);

            // 2. RETORNO: Devolvemos os dois dados importantes como um objeto
            return { timeMatrix, nomesDasRuas };

        } catch (error) {
            // ... seu código de erro ...
            console.error(`\n❌ ERRO FATAL: Falha ao carregar ou processar o arquivo JSON (${INPUT_MATRIX_FILE}).`);
            return { timeMatrix: [], nomesDasRuas: [] }; // Mantemos o padrão de objeto no erro
        }
    }

    // FUNÇÃO 2: ALGORITMO TSP (Vizinho Mais Próximo)
    function nearestNeighborTSP(matrix, start = 0) {
        const n = matrix.length;

        // Checagem de segurança (Resolve o caso de arquivo vazio)
        if (n === 0) {
            console.error("❌ Erro: Matriz vazia. Não há pontos para otimizar.");
            return { route: [], totalTime: 0 };
        }

        let route = [start];  // Rota inicial
        let visited = new Set(route); // Conjunto para rastrear pontos visitados
        let current = start; // Ponto atual

        // 1. Loop de Otimização
        while (route.length < n) { // Enquanto houver pontos não visitados
            let minTime = Infinity; // -> inicializa o tempo mínimo como infinito (0) 
            let bestNeighborIndex = null; // -> vai guardar o menor indice do vizinho mais próximo

            for (let i = 0; i < n; i++) {
                // O erro 'TypeError' ocorre nesta linha se 'matrix' for undefined.
                const timeToNeighbor = matrix[current][i];
                if (!visited.has(i) && timeToNeighbor < minTime) { // Se o ponto não foi visitado e o tempo é menor que o mínimo atual
                    minTime = timeToNeighbor;
                    bestNeighborIndex = i;
                }
            }

            // Se não encontrou vizinho próximo, procura o primeiro disponível
            if (bestNeighborIndex === null) {
                for (let i = 0; i < n; i++) {
                    if (!visited.has(i)) {
                        bestNeighborIndex = i;
                        break; // Encontrou um? Para de procurar e sai do loop
                    }
                }
            }

            // 2. Atualização da Rota
            route.push(bestNeighborIndex);
            visited.add(bestNeighborIndex);
            current = bestNeighborIndex;
        }

        // 3. Cálculo do Tempo Total
        // 1. Transforma a matriz (tabela) em uma lista única e filtra os valores para a média
        const todosOsTempos = matrix.flat();
        const temposValidos = todosOsTempos.filter(time => time !== Infinity && time !== 0);

        // 2. Calcula a média real para usar como penalidade em trechos sem conexão (Infinity)
        const somaTotalTempos = temposValidos.reduce((acc, atual) => acc + atual, 0);
        const mediaTime = somaTotalTempos / temposValidos.length;
        const PENALIDADE = mediaTime;

        // 3. Calcula o tempo total da rota gerada
        const totalTimeFinal = route.reduce((acc, curr, index) => {
            // Pula o primeiro elemento pois não há trajeto "antes" dele
            if (index === 0) return acc;

            // Busca o tempo na matriz entre o ponto anterior e o atual
            const tempoOriginal = matrix[route[index - 1]][curr];

            // Se o tempo for inválido (Infinity ou undefined), aplica a penalidade média
            const tempoSomar = (tempoOriginal === Infinity || tempoOriginal === undefined)
                ? PENALIDADE
                : tempoOriginal;

            // IMPORTANTE: Retorna a soma acumulada para a próxima iteração
            return acc + tempoSomar;
        }, 0);

        // 4. Retorno dos resultados
        return { route, totalTime: totalTimeFinal };
    }

    // --- EXECUÇÃO PRINCIPAL ---
    // Chamamos a função e desestruturamos o objeto retornado
    const { timeMatrix, nomesDasRuas } = readTravelMatrix();
    
    // CORREÇÃO: Passamos 'timeMatrix' que foi o nome definido acima
    const result = nearestNeighborTSP(timeMatrix);  // Executa o TSP

    console.log("\n-----------------------------------------");
    console.log("✅ OTIMIZAÇÃO CONCLUÍDA");
    console.log("-----------------------------------------");
    console.log("Ordem de visita (Índices):", result.route);
    
    // Exemplo de como imprimir a rota formatada
    console.log("\n--- ROTA PARA O ENTREGADOR ---");

    result.route.forEach((indice, passo) => {
        // Se nomesDasRuas estiver vazio (fallback), mostra "Ponto X"
        const nome = nomesDasRuas[indice] || `Ponto ${indice}`;
        console.log(`${passo + 1}º Paragem: ${nome}`);
    });

    console.log("\nTempo Total (Segundos):", result.totalTime);
    console.log("Tempo Total (HH:MM:SS):", formatTime(result.totalTime));
    console.log("-----------------------------------------");

    // Retornamos os dados caso o main.js precise usar
    return result;
}