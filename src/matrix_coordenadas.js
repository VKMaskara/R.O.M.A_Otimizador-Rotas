// 1. IMPORTAÇÕES E CONFIGURAÇÕES INICIAIS
import { Client } from "@googlemaps/google-maps-services-js"; // Importa o cliente do Google Maps
import * as fs from "fs"; // Importa o módulo de sistema de arquivos para ler/escrever arquivos
import 'dotenv/config';  // Carrega variáveis de ambiente do arquivo .env
import path from 'path';

// 2. CONSTANTES
const INPUT_COORDS_FILE = path.join(process.cwd(), 'output', 'geolocalizacao_resultados.json');
const OUTPUT_MATRIX_FILE = path.join(process.cwd(), 'output', 'distancia_matriz_bruta.json'); // CORRIGIDO: Nome do arquivo de saída

const BATCH_SIZE = 5; // Limite de 5 Origens por lote para evitar o erro 100 elementos

const client = new Client({}); // Inicializa o cliente do Google Maps

// **Importação da chave da API do Google Maps para Matriz de Distâncias**
const apiKey = process.env.GOOGLE_MAPS_MATRIX_API_KEY;

// FUNÇÃO PARA LER E FILTRAR COORDENADAS VÁLIDAS
function readCoordinatesFromJSON(filePath) {
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ ERRO CRÍTICO: O arquivo não foi encontrado em: ${filePath}`);
        // Retornamos um objeto vazio ou lançamos um erro para o main.js tratar
        throw new Error("Arquivo de entrada ausente"); 
    }

    const rawdata = fs.readFileSync(filePath, 'utf-8');
    const results = JSON.parse(rawdata); // Array de objetos com endereços e coordenadas

    // Filtra apenas os endereços que foram geocodificados (têm latitude)
    const validResults = results.filter(item => item.latitude);

    return {
        coordenadas: validResults.map(item => `${item.latitude},${item.longitude}`),
        nomes: validResults.map(item => item.endereco_formatado)
    };
}


// 3. FUNÇÃO PRINCIPAL: CALCULAR A MATRIZ DE DISTÂNCIAS (COM LOTES)
export async function calculateDistanceMatrix() {
    console.log("Iniciando o cálculo da Matriz de Distância com processamento em lotes...");

    // PASSO 1: Carregar as coordenadas válidas
    const coords = readCoordinatesFromJSON(INPUT_COORDS_FILE);
    // CORREÇÃO: Para pegar o tamanho, acessamos a lista de coordenadas dentro do objeto
    const numPoints = coords.coordenadas.length;

    if (numPoints < 2) {
        console.error("❌ ERRO: É necessário pelo menos duas coordenadas válidas.");
        return;
    }

    const combinedMatrix = []; // Array para armazenar os resultados de todos os lotes

    // PASSO 2: Iterar sobre os lotes (Processamento de 5 Origens por vez)
    for (let i = 0; i < numPoints; i += BATCH_SIZE) { // Incrementa de 5 em 5

        // Seleciona as origens para este lote (ex: P1 a P5, depois P6 a P10, depois P11)
        // CORREÇÃO: Usamos coords.coordenadas.slice
        const originsBatch = coords.coordenadas.slice(i, i + BATCH_SIZE); 

        console.log(`\nProcessando Lote: Origens ${i + 1} a ${i + originsBatch.length} de ${numPoints}...`);

        try {
            const response = await client.distancematrix({
                params: {
                    origins: originsBatch, // Bloco de Origens
                    destinations: coords.coordenadas,   // CORREÇÃO: Enviamos apenas as coordenadas para o Google
                    key: apiKey,
                    units: 'metric',
                    mode: 'driving',
                },
                timeout: 5000,
            });

            // Adiciona as linhas (resultados) deste lote à matriz combinada
            combinedMatrix.push(...response.data.rows);

        } catch (error) {
            console.error(`❌ ERRO no Lote ${i + 1}:`, error.response?.data?.error_message || error.message);
            return;
        }
    }

    // PASSO 3: Reestruturar e Salvar a Matriz Completa
    const finalMatrix = {
        enderecos_nomes: coords.nomes,           // Nomes das ruas para o humano
        enderecos_coordenadas: coords.coordenadas, // Lat/Lng para o sistema
        distancias_e_tempos: combinedMatrix,    // Dados brutos do Google (contém distância e duração)
        status: "OK - COMBINED"
    };

    try {
        // CORRIGIDO: Variável de saída
        fs.writeFileSync(OUTPUT_MATRIX_FILE, JSON.stringify(finalMatrix, null, 4));
        console.log(`\n🎉 Sucesso! Matriz de Distância COMPLETA (${numPoints}x${numPoints}) salva em: ${OUTPUT_MATRIX_FILE}`);
        console.log(`Próximo passo: Algoritmo TSP para otimização.`);
    } catch (err) {
        console.error("Erro ao salvar o arquivo da matriz:", err);
    }
}