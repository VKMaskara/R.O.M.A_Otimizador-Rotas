// src/controllers/OtimizacaoController.js
import { MatrizService } from "../services/MatrixService.js";
import { OtimizacaoService } from "../services/OtimizacaoService.js";
import { ExecelService } from "../services/ExecelService.js";
import { apiKeyMatriz } from "../config/googleMaps.js"; // IMPORTAÇÃO FALTANTE
import fs from 'fs';
import path from 'path';

export class OtimizacaoController {
    static async iniciarOtimizacao() {
        try {
            console.log("\n🚀 Iniciando o processo de Otimização de Rotas...");

            // 1. Obter dados (Exemplo de fluxo)
            // Aqui você deve ter sua lógica que pega os endereços
            const enderecos =  ExecelService.getAddresFromExel(path.resolve('data','input_enderecos.xlsx'));

            if (!enderecos || enderecos.length === 0) {
                throw new Error("Nenhum endereço encontrado para otimização.");
            }

            // 2. Gerar Matriz
            const matrixData = await MatrizService.gerarMatrizCompleta(enderecos); // ele recebe os endereços e retorna a matrix completa (combinedMatrix)

            // 3. Processar Otimização
            const resultadoOtimizacao = await OtimizacaoService.processarOtimizacao(matrixData, enderecos);
            
            if (resultadoOtimizacao.status === "success") {
                const { dados } = resultadoOtimizacao;

                // EXIBIÇÃO DAS MÉTRICAS (Ajustado para evitar NaN e 0.00)
                console.log("\n=========================================");
                console.log("✅ OTIMIZAÇÃO CONCLUÍDA!");
                console.log("=========================================");

                console.log("\n📍 ORDEM DA ROTA:");
                dados.ordemEnderecos.forEach((end, i) => {
                    console.log(`${i + 1}º - ${end}`);
                });

                console.log("\n📊 MÉTRICAS DE DESEMPENHO:");
                console.log(`📏 Distância Original (TSP): ${dados.distanciaOriginal.toFixed(2)} Km`);
                console.log(`✨ Distância Refinada (2-Opt): ${dados.distanciaOtimizada.toFixed(2)} Km`);
                console.log(`💰 Economia Gerada: ${dados.economiaKm.toFixed(2)} Km`);

                const tempoMin = Math.round((dados.tempoEstimadoSegundos || 0) / 60);
                console.log(`⏱️ Tempo Estimado: ${tempoMin} min`);
                console.log("=========================================\n");

                // 4. Salvar Relatório
                const outputDir = path.resolve('output');
                if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

                fs.writeFileSync(
                    path.join(outputDir, 'rota_final_otimizada.json'),
                    JSON.stringify(dados, null, 2)
                );

            } else {
                throw new Error(resultadoOtimizacao.mensagem);
            }

        } catch (error) {
            // O ERRO apiKeyMatriz IS NOT DEFINED MORRE AQUI:
            console.error("\n❌ Erro no fluxo de otimização:", error.message);
        }
    }
}

