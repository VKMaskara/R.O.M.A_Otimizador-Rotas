// 1. CONFIGURAÇÃO (Imports e chaves de API)
import { Client } from "@googlemaps/google-maps-services-js";
import * as fs from "fs";
import cvs from 'csv-parser';
import { resolve } from "path";
import { rejects } from "assert";

//Inicialize o cliente do Google Maps
const client = new Client({});

// **Importação da chave da API do Google Maps**
const apiKey = "SUA_CHAVE_AQUI"; // Certifique-se de que sua chave real está aqui, entre as aspas!

// 2. DADOS DE  ENTRADA (Lista de endereços)
const INPUT_FILE = 'input_enderecos.cvs';
const OUTPUT_FILE = "geolocalizacao_resultados.json";
// FUNÇÃO PAR LER O CSV E RETORNAR UM ARRAY DE ENDEREÇOS
function getAddressesFromCSV(filePath){
    return new Promise((resolve, reject) => {
        const address = [];
        fs.createReadStream(filePath)
        .pipe(cvs())
        .on('data' , (row) => {
            // Adiciona o endereço do CSV ao array, usando o nome da coluna 'Endereco'
            addresses.push(row.Endereco);
        })
        .on('end', () => {
            resolve(addresses);
        })
        .on('error', (error) => {
            reject(error);
        });
    })
}

// 3. FUNÇÃO DE GEOCODIFICAÇÃO
async function geocodificarEndereco() {
    // 💡 PASSO 1: Carrega os endereços do CSV de forma assíncrona
    const enderecos = await getAddressesFromCSV(INPUT_FILE)
   console.log(`Iniciando o processo de geocodificação de ${enderecos.length} endereços...`);
    const resultados = [];

    for (const endereco of enderecos) {
        try {
            const response = await client.geocode({
                params: {
                    address: endereco,
                    key: apiKey,
                },
                timeout: 1000, // 1 segundo de timeout
            });

            if (response.data.results.length && response.data.results.length > 0) {
                const geocoded = response.data.results[0];
                const location = geocoded.geometry.location;

                resultados.push({
                    enderoco_origial: endereco,
                    endereco_formatado: geocoded.formatted_address,
                    latitude: location.lat,
                    longitude: location.lng,
                })
                console.log(`✅ Sucesso: ${endereco}`);
            }else {
                // Caso a API não encontre o endereço
                resultados.push({
                    endereco_original: endereco,
                    status: "NOT_FOUND"
                });
                console.log(`❌ Erro: Nenhum resultado encontrado para ${endereco}`);
            }
        }catch (error) {
            // Caso ocorra um erro de conexão ou limite de API
            console.error(`❌ Erro na API para ${endereco}:`, error.response?.data?.error_message || error.message);
            resultados.push({
                endereco_original: endereco,
                status: "ERROR",
                detalhe_erro: error.message
            });
        }
    }
    // 1. Converte o array de resultados em uma string JSON
    const jsonOutput = JSON.stringify(resultados, null, 4);

    // 2. Grava a string no arquivo
    try {
        fs.writeFileSync(outputFile, jsonOutput);
        console.log(`\n🎉 Sucesso! Arquivo de geolocalização criado: ${outputFile}`);
        console.log(`Total de ${resultados.length} registros processados.`);
    } catch (err) {
        console.error("Erro ao salvar o arquivo:", err);
    }
}

geocodificarEndereco();
