// src/controllers/OtimizacaoController.js
import { MatrizService } from "../services/MatrixService.js";
import { OtimizacaoService } from "../services/OtimizacaoService.js";
import { ExecelService } from "../services/ExecelService.js";
import { GeolocationService } from "../services/GeolocationService.js";
import fs from 'fs';
import path from 'path';

export class OtimizacaoController {
    static async iniciarOtimizacao() {
        try {
            console.log("\n🚀 Iniciando o processo de Otimização de Rotas...");

            // 1. Obter endereços do Excel
            const enderecos = ExecelService.getAddresFromExel(path.resolve('data', 'input_enderecos.xlsx'));

            if (!enderecos || enderecos.length === 0) {
                throw new Error("Nenhum endereço encontrado para otimização.");
            }

            // 2. Geolocalização: converter endereços em coordenadas (lat, lng)
            const { enderecosComCoordenadas, coordenadasParaMatriz } = await GeolocationService.geocodificarEnderecos(enderecos);

            // Salvar resultado da geolocalização (opcional, para auditoria)
            const outputDir = path.resolve('output');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
            fs.writeFileSync(
                path.join(outputDir, 'geolocalizacao_resultados.json'),
                JSON.stringify(enderecosComCoordenadas, null, 2)
            );

            // 3. Gerar matriz de distância/tempo a partir das coordenadas
            const matrixData = await MatrizService.gerarMatrizCompleta(coordenadasParaMatriz);

            // 4. Processar otimização (TSP + 2-Opt) usando a matriz e os nomes originais
            const resultadoOtimizacao = await OtimizacaoService.processarOtimizacao(matrixData, enderecos);
            
            if (resultadoOtimizacao.status === "success") {
                const { dados } = resultadoOtimizacao;

                // EXIBIÇÃO DAS MÉTRICAS (Ajustado para evitar NaN e 0.00)
                console.log("\n=========================================");
                console.log("✅ OTIMIZAÇÃO CONCLUÍDA!");
                console.log("=========================================");

                console.log("\n📍 ORDEM DA ROTA (TSP – Vizinho Mais Próximo):");
                (dados.ordemEnderecosTsp || []).forEach((end, i) => {
                    console.log(`   ${i + 1}º - ${end}`);
                });

                console.log("\n📍 ROTA FINAL (Refinada pelo 2-Opt, com retorno ao depósito):");
                dados.ordemEnderecos.forEach((end, i) => {
                    console.log(`   ${i + 1}º - ${end}`);
                });

                console.log("\n📊 MÉTRICAS DE DESEMPENHO:");
                console.log(`📏 Distância Original (TSP) – com retorno: ${dados.distanciaOriginal.toFixed(2)} Km`);
                console.log(`✨ Distância Refinada (2-Opt) – com retorno: ${dados.distanciaOtimizada.toFixed(2)} Km`);
                if (dados.distanciaOriginalSemRetorno != null) {
                    console.log(`📏 Distância da rota de entregas (sem retorno): ${dados.distanciaOriginalSemRetorno.toFixed(2)} Km → ${dados.distanciaOtimizadaSemRetorno.toFixed(2)} Km`);
                }
                console.log(`💰 Economia Gerada: ${dados.economiaKm.toFixed(2)} Km`);

                const tempoMin = dados.tempoEstimadoMinutos ?? Math.round((dados.tempoEstimadoSegundos || 0) / 60);
                console.log(`⏱️ Tempo Estimado: ${tempoMin} min`);
                console.log("=========================================\n");

                // 5. Salvar relatório da rota otimizada
                fs.writeFileSync(
                    path.join(outputDir, 'rota_final_otimizada.json'),
                    JSON.stringify(dados, null, 2)
                );

            } else {
                throw new Error(resultadoOtimizacao.mensagem);
            }

        } catch (error) {
            console.error("\n❌ Erro no fluxo de otimização:", error.message);
        }
    }
}

