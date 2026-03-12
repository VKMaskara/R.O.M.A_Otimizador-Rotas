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
            console.log("\n🚀 ROMA: Iniciando processo de Otimização de Rotas...");

            // 1. Obter endereços do Excel
            const enderecos = ExecelService.getAddresFromExel(path.resolve('data', 'input_enderecos.xlsx'));

            if (!enderecos || enderecos.length === 0) {
                throw new Error("Nenhum endereço encontrado para otimização.");
            }

            // 2. Geolocalização (Agora usando Adapters internamente)
            // Removemos o 'coordenadasParaMatriz' (string), pois os Adapters usam o objeto puro
            const { enderecosComCoordenadas } = await GeolocationService.geocodificarEnderecos(enderecos);

            // Auditoria
            const outputDir = path.resolve('output');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
            fs.writeFileSync(
                path.join(outputDir, 'geolocalizacao_resultados.json'),
                JSON.stringify(enderecosComCoordenadas, null, 2)
            );

            // 3. Gerar matriz de distância/tempo
            // IMPORTANTE: Agora passamos 'enderecosComCoordenadas' que é um Array de Objetos [{lat, lng, endereco}, ...]
            const matrixData = await MatrizService.gerarMatrizCompleta(enderecosComCoordenadas);

            // 4. Processar otimização (TSP + 2-Opt)
            // Passamos os endereços geolocalizados para garantir que o TSP tenha acesso às coordenadas se precisar
            const resultadoOtimizacao = await OtimizacaoService.processarOtimizacao(matrixData, enderecosComCoordenadas.map(e => e.endereco));
            
            if (resultadoOtimizacao.status === "success") {
                const { dados } = resultadoOtimizacao;

                console.log("\n=========================================");
                console.log("✅ OTIMIZAÇÃO CONCLUÍDA!");
                console.log("=========================================");

                console.log("\n📍 ROTA FINAL (Refinada pelo 2-Opt):");
                dados.ordemEnderecos.forEach((end, i) => {
                    console.log(`   ${i + 1}º - ${end}`);
                });

                console.log("\n📊 MÉTRICAS DE DESEMPENHO:");
                console.log(`📏 Distância Original: ${dados.distanciaOriginal.toFixed(2)} Km`);
                console.log(`✨ Distância Otimizada: ${dados.distanciaOtimizada.toFixed(2)} Km`);
                console.log(`💰 Economia Gerada: ${dados.economiaKm.toFixed(2)} Km`);

                const tempoMin = dados.tempoEstimadoMinutos ?? Math.round((dados.tempoEstimadoSegundos || 0) / 60);
                console.log(`⏱️ Tempo Estimado: ${tempoMin} min`);
                console.log("=========================================\n");

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