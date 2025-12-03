// 1. CONFIGURAÇÃO (Imports e chaves de API)
import { Client } from "@googlemaps/google-maps-services-js";
import * as fs from "fs"; //encanamento que pega o texto do disco rígido e o joga no seu programa.
import csv from 'csv-parser'; // csv-parser É  como o filtro que organiza o texto bagunçado em dados utilizáveis.
import 'dotenv/config'; // Carrega variáveis de ambiente do arquivo .env
//Inicialize o cliente do Google Maps
const client = new Client({});

// **Importação da chave da API do Google Maps**
const apiKey = process.env.GOOGLE_MAPS_GEOCOORDINATE_API_KEY; 


// 2. DADOS DE  ENTRADA (Lista de endereços)
const INPUT_FILE = 'input_enderecos.csv';
const OUTPUT_FILE = "geolocalizacao_resultados.json";

// FUNÇÃO PAR LER O CSV E RETORNAR UM ARRAY DE ENDEREÇOS
function getAddressesFromCSV(filePath){
    return new Promise((resolve, reject) => { // Retorna uma promessa que resolve com a lista de endereços
        const addresses = []; // Array para armazenar os endereços lidos do CSV
        fs.createReadStream(filePath) // => Cria um fluxo de dados  bruto
        .pipe(csv()) // => Passa o fluxo bruto pelo csv-parser para converter em objetos
        .on('data', (row) => { 
            // Adiciona o endereço do CSV ao array, usando o nome da coluna 'Endereco'
            addresses.push(row.Endereco); // Adiciona o endereço do CSV ao array
        })
        .on('end', () => { // Ele serve como um sinal de que a tarefa está concluída
            resolve(addresses); // Resolve a promessa com o array de endereços
        })
        .on('error', (error) => {
            reject(error);
        });
    })
}

// 3. FUNÇÃO DE GEOCODIFICAÇÃO
async function geocodificarEndereco() {
    // 💡 PASSO 1: Carrega os endereços do CSV de forma assíncrona
    const enderecos = await getAddressesFromCSV(INPUT_FILE) // Espera até que os endereços sejam carregados => wait para esperar a resposta
   console.log(`Iniciando o processo de geocodificação de ${enderecos.length} endereços...`);
    const resultados = [];

    // 💡 PASSO 2: Itera sobre cada endereço e chama a API de geocodificação
    for (const endereco of enderecos) { // Para cada endereço na lista faz:
        try {
            const response = await client.geocode({ // Chama a API de geocodificação do Google Maps => wait para esperar a resposta
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
        fs.writeFileSync(OUTPUT_FILE, jsonOutput);
        console.log(`\n🎉 Sucesso! Arquivo de geolocalização criado: ${OUTPUT_FILE}`);
        console.log(`Total de ${resultados.length} registros processados.`);
    } catch (err) {
        console.error("Erro ao salvar o arquivo:", err);
    }
}

geocodificarEndereco();
