// src/controllers/OtimizacaoController.js
import { MatrizService }      from "../services/MatrixService.js";
import { OtimizacaoService }  from "../services/OtimizacaoService.js";
import { GeolocationService } from "../services/GeolocationService.js";
import { InputService }       from "../services/InputService.js";
import fs   from 'fs';
import path from 'path';

export class OtimizacaoController {
    static async iniciarOtimizacao() {
        try {
            console.log("\n🚀 ROMA: Iniciando processo de Otimização de Rotas...");

            // 1. ENTRADA DE DADOS — suporta excel | ocr | manual
            //    Modo configurável via variável de ambiente INPUT_MODE
            const paradas = await InputService.carregarParadas();

            if (!paradas || paradas.length < 2) {
                throw new Error("É necessário ao menos 1 depósito e 1 entrega para otimizar.");
            }

            // 2. GEOLOCALIZAÇÃO
            const { enderecosOk } = await GeolocationService.geocodificarEnderecos(paradas);

            // Auditoria: salva resultado do geocoding
            const outputDir = path.resolve('output');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

            fs.writeFileSync(
                path.join(outputDir, 'geolocalizacao_resultados.json'),
                JSON.stringify(enderecosOk, null, 2),  "utf-8"
            );

            // 3. MATRIZ DE DISTÂNCIA / TEMPO
            const matrixData = await MatrizService.gerarMatrizCompleta(enderecosOk);

            // 4. OTIMIZAÇÃO (TSP + 2-Opt)
            const nomesEnderecos = enderecosOk.map(e => e.endereco);
            const resultadoOtimizacao = await OtimizacaoService.processarOtimizacao(
                matrixData,
                nomesEnderecos
            );

            if (resultadoOtimizacao.status !== "success") {
                throw new Error(resultadoOtimizacao.mensagem);
            }

            const { dados } = resultadoOtimizacao;

            // 5. ENRIQUECER ROTA COM DADOS DE PACOTE
            //    Monta lista detalhada com endereço + pacote para cada parada da rota final
            const rotaDetalhada = dados.rotaIndices.map((idx, posicao) => {
                const parada = enderecosOk[idx];
                return {
                    posicao:      posicao + 1,
                    endereco:     parada.endereco,
                    tipo:         parada.tipo   || 'ENTREGA',
                    pacote:       parada.pacote || null,
                    lat:          parada.lat,
                    lng:          parada.lng,
                };
            });

            // Adiciona retorno ao depósito no final
            const origem = enderecosOk[0];
            rotaDetalhada.push({
                posicao:  rotaDetalhada.length + 1,
                endereco: `Retorno ao Depósito: ${origem.endereco}`,
                tipo:     'RETORNO',
                pacote:   null,
                lat:      origem.lat,
                lng:      origem.lng,
            });

            // 6. LOG NO TERMINAL
            console.log("\n=========================================");
            console.log("✅ OTIMIZAÇÃO CONCLUÍDA!");
            console.log("=========================================");
            console.log("\n📍 ROTA FINAL (Refinada pelo 2-Opt):");

            rotaDetalhada.forEach(p => {
                const pkg = p.pacote?.id
                    ? ` [${p.pacote.id}${p.pacote.destinatario ? ' → ' + p.pacote.destinatario : ''}]`
                    : '';
                console.log(`   ${p.posicao}º - ${p.endereco}${pkg}`);
            });

            console.log("\n📊 MÉTRICAS DE DESEMPENHO:");
            console.log(`📏 Distância Original : ${dados.distanciaOriginal.toFixed(2)} km`);
            console.log(`✨ Distância Otimizada: ${dados.distanciaOtimizada.toFixed(2)} km`);
            console.log(`💰 Economia Gerada    : ${dados.economiaKm.toFixed(2)} km`);
            console.log(`⏱️  Tempo Estimado     : ${dados.tempoEstimadoMinutos} min`);
            console.log("=========================================\n");

            // 7. SALVAR RESULTADO FINAL
            const saida = {
                ...dados,
                rotaDetalhada,   // ← rota com pacotes vinculados
            };

            fs.writeFileSync(
                path.join(outputDir, 'rota_final_otimizada.json'),
                JSON.stringify(saida, null, 2)
            );

            console.log(`💾 Resultado salvo em output/rota_final_otimizada.json`);

        } catch (error) {
            console.error("\n❌ Erro no fluxo de otimização:", error.message);
        }
    }
}