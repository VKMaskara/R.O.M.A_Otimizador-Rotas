// src/services/MatrizService.js
import { client, apiKeyMatriz } from '../config/googleMaps.js'; // Única importação necessária

export class MatrizService {
    // Definimos o tamanho do lote para respeitar os limites da API do Google
    static BATCH_SIZE = 3;

    /**
     * Calcula a matriz de distância completa entre todos os pontos.
     * @param {Array} listaCoordenadas - Array de strings ou objetos de localização
     * @returns {Promise<Array>} - Retorna as linhas (rows) processadas
     */
    static async gerarMatrizCompleta(listaCoordenadas) { // Nome ajustado para alinhar com o Controller
        console.log(`\n⏳ Iniciando cálculo da Matriz de Distância para ${listaCoordenadas.length} pontos...`);

        if (!listaCoordenadas || listaCoordenadas.length < 2) {
            throw new Error("É necessário fornecer pelo menos duas coordenadas para calcular a matriz.");
        }

        const combinedMatrix = [];
        const numPoints = listaCoordenadas.length;

        // Processamento em lotes para evitar erros de URL muito longa ou limites de cota
        for (let i = 0; i < numPoints; i += this.BATCH_SIZE) {
            const originsBatch = listaCoordenadas.slice(i, i + this.BATCH_SIZE);

            console.log(`📦 Processando Lote: Origens ${i + 1} a ${i + originsBatch.length} de ${numPoints}...`);

            try {
                const response = await client.distancematrix({
                    params: {
                        origins: originsBatch,
                        destinations: listaCoordenadas, // Todos os pontos são destinos para gerar a matriz quadrada
                        key: apiKeyMatriz,
                        mode: 'driving',
                    },
                    timeout: 10000
                });

                if (response.data.status !== "OK") {
                    throw new Error(response.data.error_message || response.data.status);
                }

                // Adiciona as linhas (rows) retornadas ao acumulador final
                combinedMatrix.push(...response.data.rows);

            } catch (error) {
                const msgErro = error.response?.data?.error_message || error.message;
                throw new Error(`❌ ERRO no Google Matrix (Lote ${i + 1}): ${msgErro}`);
            }
        }

        console.log("✅ Matriz completa gerada com sucesso.");
        return combinedMatrix; // Retorna o array de rows que o TspService espera
    }
}