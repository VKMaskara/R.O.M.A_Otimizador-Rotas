import fs from "fs"; // Importa o módulo de sistema de arquivos para ler/escrever arquivos
import 'dotenv/config';


// Caminho para a matrix de coordenadas
const INPUT_MATRIX_FILE = 'distancia_matriz_bruta.json';

// FUNÇÃO PARA LER A MATRIZ DE DISTÂNCIAS DO ARQUIVO JSON
function readTravelMatrix() {

    // 1. LER e CONVERTER o arquivo JSON
    const rawdata = fs.readFileSync(INPUT_MATRIX_FILE, 'utf-8');
    const matrixData = JSON.parse(rawdata); // Dados brutos da matriz de distâncias OBJETO

    // 2. PROCESSAR os dados para extrair a matriz de tempos de viagem

    // Array final onde a matriz numérica será armazenada
    const timeMatrix = []; 

    // 2. EXTRAÇÃO E TRANSFORMAÇÃO
      for (const row of matrixData.rows) {
        const rowTimes = row.elements.map(element => {
            if (element.status === 'OK') {
                return element.duration.value; // Tempo em segundos
            } else {
                return Infinity; // Usa Infinity para indicar que não há rota disponível
            }
        });        
        timeMatrix.push(rowTimes); // Adiciona a linha processada à matriz final ARRAY DE ARRAYS
    }
    return timeMatrix;
}

  


function nearestNeighborTSP(matrix, start=0) {
    const n = matrix.length; // Total de pontos
    let route = [start]; // Vai armazenar a sequencia final
    let visited = new Set(route);
    let current = start;
    

    while (route.length < n){
        let minTime = Infinity
        let bestNeighborIndex = null

        for (let i =0; i<n; i++){
            const timeToNeighbor = matrix[current][i];
            if (!visited.has(i) &&  timeToNeighbor < minTime){
                minTime = timeToNeighbor;
                bestNeighborIndex = i;  
            }
        }
        route.push(bestNeighborIndex);
        visited.add(bestNeighborIndex);
        current = bestNeighborIndex;
    }
    console.log("Rota calculada (índices): ", route);
    const totalTime = route.reduce((acc, curr, index) => {
        if (index === 0) return acc; // Pula o primeiro elemento
        return acc + matrix[route[index - 1]][curr];
    }
    , 0);
    console.log("Tempo total da rota (segundos): ", totalTime);
    return {route, totalTime};
}
const matrix = readTravelMatrix();
console.log(matrix);

nearestNeighborTSP(matrix);
