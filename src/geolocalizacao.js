// 1. CONFIGURAÇÃO (Imports e chaves de API)
import { Client } from "@googlemaps/google-maps-services-js";
import * as fs from "fs"; //encanamento que pega o texto do disco rígido e o joga no seu programa.
import XLSX from "xlsx";// -> Atualização dos imports
import 'dotenv/config'; // Carrega variáveis de ambiente do arquivo .env
import path from 'path'; // Importação do módulo path para gerenciar caminhos

const client = new Client({});

// **Importação da chave da API do Google Maps**
const apiKey = process.env.GOOGLE_MAPS_GEOCOORDINATE_API_KEY;


// 2. DADOS DE ENTRADA (Lista de endereços)
// Ajuste: Garantimos que os arquivos apontem para as pastas corretas usando process.cwd()
const INPUT_FILE = path.join(process.cwd(), 'data', 'input_enderecos.xlsx')// -> Documento padrão
const OUTPUT_FILE = path.join(process.cwd(), 'output', 'geolocalizacao_resultados.json')

// FUNÇÃO PARA LER O EXCEL E RETORNAR UM ARRAY DE ENDEREÇOS
function getAddresFromExel(filePath) { // -> ela é uma função síncrona
    // 1. ELE Vai ler o arquivo completo
    const workbook = XLSX.readFile(filePath) 
    //2. Pega o nome Da Primeira aba (Sheet)
    const firstSheetName = workbook.SheetNames[0] 
    // 3. Vamos pegar um dados da aba especifica
    const worksheet = workbook.Sheets[firstSheetName]
    // 4. vamos converter a aba em um Array de OBJ Json
    const data = XLSX.utils.sheet_to_json(worksheet);

    // 5. Unindo os campos para formar o endereço completo
    // CORREÇÃO: Usamos o .map() para percorrer cada linha (objeto) do JSON gerado pelo Excel
    const enderecosBrutos = data.map(linha => {
        // Unimos as colunas com vírgulas. O "Brasil" no final garante que não vá para Portugal!
        // Usamos os nomes das colunas exatamente como o Excel informou no console.log
        return `${linha.Endereco}, ${linha.Numero}, ${linha.Cidade}, ${linha.Estado}, Brasil`;
    });

    // 6. Filtro verificador: "O endereço existe e não é apenas um texto vazio?"
    const enderecosLimpos = enderecosBrutos.filter(endereco => {
        if (endereco && endereco.trim() !== "") {
            return true; // -> envie para a lista
        }
        return false; // -> Remover da lista
    })
    return enderecosLimpos
}

// 3. FUNÇÃO DE GEOCODIFICAÇÃO
export async function geocodificarEndereco() {
    // 💡 PASSO 1: Carrega os endereços do Excel usando a função acima
    const enderecos = getAddresFromExel(INPUT_FILE) 
    console.log(`Iniciando o processo de geocodificação de ${enderecos.length} endereços...`);

    const resultados = [];

    // 💡 PASSO 2: Itera sobre cada endereço e chama a API de geocodificação
    for (const endereco of enderecos) { 
        try {
            const response = await client.geocode({ 
                params: {
                    address: endereco,
                    key: apiKey,
                    // CORREÇÃO/REFORÇO: Restringe a busca apenas para o território brasileiro
                    components: { country: 'BR' }
                },
                timeout: 5000, // Aumentei para 5 segundos para evitar erros de rede lenta
            });

            if (response.data.results && response.data.results.length > 0) { 
                const geocoded = response.data.results[0]; 
                const location = geocoded.geometry.location; 

                resultados.push({
                    enderoco_origial: endereco,
                    endereco_formatado: geocoded.formatted_address,
                    latitude: location.lat,
                    longitude: location.lng,
                })
                console.log(`✅ Sucesso: ${endereco}`);
            } else {
                resultados.push({
                    endereco_original: endereco,
                    status: "NOT_FOUND"
                });
                console.log(`❌ Erro: Nenhum resultado encontrado para ${endereco}`);
            }
        } catch (error) {
            console.error(`❌ Erro na API para ${endereco}:`, error.response?.data?.error_message || error.message);
            resultados.push({
                endereco_original: endereco,
                status: "ERROR",
                detalhe_erro: error.message
            });
        }
    }

    // 1. Converte o array de resultados em uma string JSON organizada
    const jsonOutput = JSON.stringify(resultados, null, 4);

    // 2. Grava o JSON no disco
    try {
        // Criamos uma proteção simples: se a pasta output não existir, o Node pode dar erro.
        // Mas como você já criou as pastas manualmente, o comando abaixo salvará direto:
        fs.writeFileSync(OUTPUT_FILE, jsonOutput);
        console.log(`\n🎉 Sucesso! Arquivo de geolocalização criado: ${OUTPUT_FILE}`);
        console.log(`Total de ${resultados.length} registros processados.`);
    } catch (err) {
        console.error("Erro ao salvar o arquivo:", err);
    }
}