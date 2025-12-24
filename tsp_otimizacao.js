import fs from "fs";
import 'dotenv/config';

const INPUT_MATRIX_FILE = 'distancia_matriz_bruta.json';

// FUNÇÃO AUXILIAR: Converte segundos para HH:MM:SS
function formatTime(seconds) {
    // 1. HORAS: Total de segundos dividido por 3600 (segundos em 1 hora)
    const hours = Math.floor(seconds / 3600);
    // 2. MINUTOS: Segundos restantes dividido por 60. O % 3600 remove as horas já calculadas.
    const minutes = Math.floor((seconds % 3600) / 60);
    // 3. SEGUNDOS: Restante da divisão por 60.
    const remainingSeconds = seconds % 60;

    // Adiciona zero à esquerda se o número for menor que 10
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

        const timeMatrix = [];
        for (const row of matrixData.rows) {
            const rowTimes = row.elements.map(element => {
                if (element.status === 'OK') {
                    return element.duration.value;
                } else {
                    return Infinity;
                }
            });
            timeMatrix.push(rowTimes);
        }

        console.log(`\n✅ Matriz de distâncias carregada: ${timeMatrix.length} pontos.`);
        return timeMatrix;

    } catch (error) {
        console.error(`\n❌ ERRO FATAL: Falha ao carregar ou processar o arquivo JSON (${INPUT_MATRIX_FILE}).`);
        console.error('Verifique se o arquivo existe e se está no formato JSON esperado.');
        // Retorna um array vazio para evitar o TypeError, mas o erro será percebido em 'n'
        return [];
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

        // Depuração detalhada (descomente para usar)
        // console.log("--- Verificação de Segurança ---");
        // console.log("Ponto atual (current):", current);
        // console.log("A linha existe na matriz?", matrix[current] !== undefined);

        // if (current === 8) {
        //     console.log("--- Diagnóstico do Ponto 8 ---");
        //     for (let i = 0; i < n; i++) {
        //         console.log(`Para ponto ${i}: tempo = ${matrix[current][i]}, visitado? ${visited.has(i)}`);
        //     }
        // }

        for (let i = 0; i < n; i++) {
            // O erro 'TypeError' ocorre nesta linha se 'matrix' for undefined.
            const timeToNeighbor = matrix[current][i];
            if (!visited.has(i) && timeToNeighbor <
                minTime) { // Se o ponto não foi visitado e o tempo é menor que o mínimo atual (OBS: <= para pegar o último igual)
                minTime = timeToNeighbor;
                bestNeighborIndex = i;
            }

        }

        // // Se bestNeighborIndex for null, significa que não há mais rotas válidas (Infinity)
        // if (bestNeighborIndex === null) {
        //     console.warn(`⚠️ Aviso: Rota interrompida no índice ${current}. Não há conexão com os pontos restantes.`);
        //     break; // Sai do loop se não for possível continuar
        // }

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
    const PENALITY_TIME = 3600; // 1 hora em segundos para rotas inválidas
    const totalTime = route.reduce((acc, curr, index) => { // acc = acumulador, curr = valor atual, index = índice atual
        if (index === 0) return acc;

        const tempoOriginal = matrix[route[index - 1]][curr];

        const tempoSomar = (tempoOriginal === Infinity) ? PENALITY_TIME : tempoOriginal;

        return acc + tempoSomar;

    }, 0);

    // 4. Retorno dos resultados
    return { route, totalTime };
}



// --- EXECUÇÃO PRINCIPAL ---
const matrix = readTravelMatrix();  // Lê a matriz de distâncias
const result = nearestNeighborTSP(matrix);  // Executa o TSP

console.log("\n-----------------------------------------");
console.log("✅ OTIMIZAÇÃO CONCLUÍDA");
console.log("-----------------------------------------");
console.log("Ordem de visita (Índices):", result.route);
console.log("Tempo Total (Segundos):", result.totalTime);
console.log("Tempo Total (HH:MM:SS):", formatTime(result.totalTime));
console.log("-----------------------------------------");