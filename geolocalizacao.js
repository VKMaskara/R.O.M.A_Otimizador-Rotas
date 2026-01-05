// 1. CONFIGURAÇÃO (Imports e chaves de API)
import { Client } from "@googlemaps/google-maps-services-js";
import * as fs from "fs"; //encanamento que pega o texto do disco rígido e o joga no seu programa.
import * as XLSX from "xlsx"; // -> Atualização dos imports
import 'dotenv/config'; // Carrega variáveis de ambiente do arquivo .env
//Inicialize o cliente do Google Maps
const client = new Client({});

// **Importação da chave da API do Google Maps**
const apiKey = process.env.GOOGLE_MAPS_GEOCOORDINATE_API_KEY; 


// 2. DADOS DE  ENTRADA (Lista de endereços)
const INPUT_FILE = 'input_enderecos.xlsx'; // -> Documento padrão
const OUTPUT_FILE = "geolocalizacao_resultados.json";

// FUNÇÃO PAR LER O CSV E RETORNAR UM ARRAY DE ENDEREÇOS
// ->  getAddressesFromCSV() PARA getAdddresFromExel()
function getAdddresFromExel(filePath){ // -> ela é uma fução sícrona
  // 1. ELE Vai ler o arquivo completo
  const workbook  = XLSX.readFile(filePath) 
  //2. Pega o nome Da Primeira aba (Sheet)
  const firstSheetName = workbook.SheetNames[0] 
  // 3. Vamos pegar um dados da aba especifica
  const worksheet = workbook.Sheets[firstSheetName]
  // 4. vamos converter a aba  em um Array de OBJ Json
  const data = XLSX.utils.sheet_to_json(worksheet);
  // 5. Filtra Para retornarm apenas os endereços

  const enderecosBrutos =  data.map(linha => linha.Endereco);
  // 6. Filtro verificador: "O endereço existe e não é apenas um texto vazio?
  
  const enderecosLimpos = enderecosBrutos.filter(endereco => {
    if (endereco  && endereco.trim() !==""){
         return true; // -> envie para a lista
    }
    return false; // -> Remover da lista
  })
  return  enderecosLimpos
}

// 3. FUNÇÃO DE GEOCODIFICAÇÃO
export async function geocodificarEndereco() {
    // 💡 PASSO 1: Carrega os endereços do CSV de forma assíncrona
    const enderecos =  getAdddresFromExel(INPUT_FILE) // Sem depender de awaint
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

            if (response.data.results.length && response.data.results.length > 0) { // Verifica se há resultados
                const geocoded = response.data.results[0]; /// Pega o primeiro resultado
                const location = geocoded.geometry.location; // Extrai latitude e longitude

                // Armazena o resultado formatado no array

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

