import { TspService } from './TspService.js';
import { TwoOptService } from './TwoOptService.js';

export class OtimizacaoService {

    // Adicionamos um segundo parâmetro: listaNomesOriginal
    static async processarOtimizacao(matrixDataBruta, listaNomesOriginal = []) {
        try {
            // 1. PROCESSAR DADOS
            const { timeMatrix, distanceMatrix } = TspService.processarDadosBrutos(matrixDataBruta);

            // CORREÇÃO: Se o TspService não achou os nomes, usamos a lista que veio do Excel
            const nomesDasRuas = (listaNomesOriginal.length > 0) 
                ? listaNomesOriginal 
                : (TspService.processarDadosBrutos(matrixDataBruta).nomesDasRuas);

            if (!timeMatrix || timeMatrix.length === 0) {
                throw new Error("Matriz de tempo vazia.");
            }

            // 2. ROTA INICIAL (TSP)
            const resultadoTsp = TspService.executarAlgoritmoTSP(timeMatrix);

            // 3. REFINAMENTO (2-OPT)
            const kmAntes = TwoOptService.calcularDistanciaTotal(resultadoTsp.rota, distanceMatrix);
            const resultado2Opt = TwoOptService.aplicar2Opt(resultadoTsp.rota, distanceMatrix);
            const kmDepois = (resultado2Opt.distanciaFinal > 0) ? resultado2Opt.distanciaFinal : kmAntes;

            // 4. PREPARAR RETORNO COM ENDEREÇOS REAIS
            const rotaOtimizadaIndices = resultado2Opt.rotaOtimizada;
            
            // Mapeia os índices para os nomes das ruas reais
            const ordemEnderecos = rotaOtimizadaIndices.map(idx => nomesDasRuas[idx] || `Ponto ${idx + 1}`);

            // 5. FECHAR A ROTA (Opcional: Voltar ao depósito)
            // Se quiser que apareça o retorno no console:
            ordemEnderecos.push(`🏁 Retorno ao Origem: ${nomesDasRuas[0]}`);

            return {
                status: "success",
                dados: {
                    ordemEnderecos: ordemEnderecos,
                    distanciaOriginal: Number(kmAntes.toFixed(2)),
                    distanciaOtimizada: Number(kmDepois.toFixed(2)),
                    economiaKm: Number(Math.max(0, kmAntes - kmDepois).toFixed(2)),
                    tempoEstimadoMinutos: Math.round(resultadoTsp.tempoFinal / 60),
                    rotaIndices: rotaOtimizadaIndices
                }
            };

        } catch (error) {
            console.error("❌ Erro na orquestração:", error.message);
            return { status: "error", mensagem: error.message };
        }
    }
}