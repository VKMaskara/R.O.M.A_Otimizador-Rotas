import fs from "fs"; // Importa o módulo de sistema de arquivos para ler/escrever arquivos
import 'dotenv/config';
import { time } from "console";

// Caminho para a matrix de coordenadas
const INPUT_MATRIX_FILE = 'distancia_matriz_bruta.json';

// FUNÇÃO PARA LER A MATRIZ DE DISTÂNCIAS DO ARQUIVO JSON
function readTravelMatrix() {

    // 1. LER e CONVERTER o arquivo JSON
    const rawdata = fs.readFileSync(INPUT_MATRIX_FILE, 'utf-8');
    const matrixData = JSON.parse(rawdata); // Dados brutos da matriz de distâncias

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
        timeMatrix.push(rowTimes);
    }
    console.log(timeMatrix); 
}

readTravelMatrix();
   