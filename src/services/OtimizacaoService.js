// src/services/OtimizacaoService.js
import { TspService } from './TspService.js';
import { TwoOptService } from './TwoOptService.js';


export class OtimizacaoService {

    static async processarOtimizacao(matrixDataBruta) {
        try {
            // Se matrixDataBruta for um array, os endereços podem estar vindo separados ou não existir
            // Vamos garantir que passamos a estrutura correta para o TspService
            const { timeMatrix, distanceMatrix, nomesDasRuas } = TspService.processarDadosBrutos(matrixDataBruta);

            if (!timeMatrix || timeMatrix.length === 0) {
                throw new Error("Matriz de tempo vazia. O formato dos dados enviados pelo Controller é incompatível.");
            }

            // 2. ROTA INICIAL (TSP)
            const resultadoTsp = TspService.executarAlgoritmoTSP(timeMatrix);

            // 3. REFINAMENTO
            const kmAntes = TwoOptService.calcularDistanciaTotal(resultadoTsp.rota, distanceMatrix);
            const resultado2Opt = TwoOptService.aplicar2Opt(resultadoTsp.rota, distanceMatrix);

            // Se o 2-opt falhar ou retornar 0, usamos a distância do TSP para não zerar o relatório
            const kmDepois = (resultado2Opt.distanciaFinal > 0) ? resultado2Opt.distanciaFinal : kmAntes;

            return {
                status: "success",
                dados: {
                    ordemEnderecos: resultado2Opt.rotaOtimizada.map(idx => nomesDasRuas[idx] || `Ponto ${idx + 1}`),
                    distanciaOriginal: Number(kmAntes.toFixed(2)),
                    distanciaOtimizada: Number(kmDepois.toFixed(2)),
                    economiaKm: Number(Math.max(0, kmAntes - kmDepois).toFixed(2)),
                    tempoEstimadoMinutos: Math.round(resultadoTsp.tempoFinal / 60), // Convertendo segundos para minutos
                    rotaIndices: resultado2Opt.rotaOtimizada
                }
            };

        } catch (error) {
            console.error("❌ Erro na orquestração:", error.message);
            return { status: "error", mensagem: error.message };
        }
    }
}

