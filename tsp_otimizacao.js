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
function nearestNeighborTSP(matrix, start=0) {
    const n = matrix.length; 
    
    // Checagem de segurança (Resolve o caso de arquivo vazio)
    if (n === 0) {
        console.error("❌ Erro: Matriz vazia. Não há pontos para otimizar.");
        return {route: [], totalTime: 0};
    }

    let route = [start]; 
    let visited = new Set(route);
    let current = start;
    
    // 1. Loop de Otimização
    while (route.length < n){
        let minTime = Infinity;
        let bestNeighborIndex = null;

        for (let i = 0; i < n; i++){
            // O erro 'TypeError' ocorre nesta linha se 'matrix' for undefined.
            const timeToNeighbor = matrix[current][i];
            if (!visited.has(i) && timeToNeighbor < minTime){
                minTime = timeToNeighbor;
                bestNeighborIndex = i;  
            }
        }
        
        // Se bestNeighborIndex for null, significa que não há mais rotas válidas (Infinity)
        if (bestNeighborIndex === null) {
             console.warn(`⚠️ Aviso: Rota interrompida no índice ${current}. Não há conexão com os pontos restantes.`);
             break; // Sai do loop se não for possível continuar
        }

        // 2. Atualização da Rota
        route.push(bestNeighborIndex);
        visited.add(bestNeighborIndex);
        current = bestNeighborIndex;
    }
    
    // 3. Cálculo do Tempo Total
    const totalTime = route.reduce((acc, curr, index) => {
        if (index === 0) return acc;
        return acc + matrix[route[index - 1]][curr];
    }, 0);

    // 4. Retorno dos resultados
    return {route, totalTime};
}


// --- EXECUÇÃO PRINCIPAL ---
const matrix = readTravelMatrix(); 
const result = nearestNeighborTSP(matrix);

console.log("\n-----------------------------------------");
console.log("✅ OTIMIZAÇÃO CONCLUÍDA");
console.log("-----------------------------------------");
console.log("Ordem de visita (Índices):", result.route);
console.log("Tempo Total (Segundos):", result.totalTime);
console.log("Tempo Total (HH:MM:SS):", formatTime(result.totalTime));
console.log("-----------------------------------------");