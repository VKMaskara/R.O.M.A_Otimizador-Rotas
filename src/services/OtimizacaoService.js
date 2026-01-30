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
            const kmAntesTotal = TwoOptService.calcularDistanciaTotal(resultadoTsp.rota, distanceMatrix);
            const kmAntesSemRetorno = TwoOptService.calcularDistanciaSemRetorno(resultadoTsp.rota, distanceMatrix);
            const resultado2Opt = TwoOptService.aplicar2Opt(resultadoTsp.rota, distanceMatrix);
            const kmDepoisTotal = (resultado2Opt.distanciaFinal > 0) ? resultado2Opt.distanciaFinal : kmAntesTotal;
            const kmDepoisSemRetorno = TwoOptService.calcularDistanciaSemRetorno(resultado2Opt.rotaOtimizada, distanceMatrix);

            // 4. PREPARAR RETORNO COM ENDEREÇOS REAIS
            const rotaTspIndices = resultadoTsp.rota;
            const rotaOtimizadaIndices = resultado2Opt.rotaOtimizada;

            // Ordem da rota TSP (vizinho mais próximo) – só entregas
            const ordemEnderecosTsp = rotaTspIndices.map(idx => nomesDasRuas[idx] || `Ponto ${idx + 1}`);
            // Ordem da rota refinada pelo 2-Opt – só entregas
            const ordemEnderecosRefinada = rotaOtimizadaIndices.map(idx => nomesDasRuas[idx] || `Ponto ${idx + 1}`);

            // Rota final exibida/salva: refinada + retorno ao depósito
            const ordemEnderecos = [...ordemEnderecosRefinada];
            ordemEnderecos.push(`🏁 Retorno ao Origem: ${nomesDasRuas[0]}`);

            return {
                status: "success",
                dados: {
                    ordemEnderecos: ordemEnderecos,
                    ordemEnderecosTsp: ordemEnderecosTsp,
                    ordemEnderecosRefinada: ordemEnderecosRefinada,
                    rotaIndicesTsp: rotaTspIndices,
                    // Distância total (inclui retorno ao depósito)
                    distanciaOriginal: Number(kmAntesTotal.toFixed(2)),
                    distanciaOtimizada: Number(kmDepoisTotal.toFixed(2)),
                    // Distância só da rota de entregas (sem retorno) – para comparar com cálculos manuais
                    distanciaOriginalSemRetorno: Number(kmAntesSemRetorno.toFixed(2)),
                    distanciaOtimizadaSemRetorno: Number(kmDepoisSemRetorno.toFixed(2)),
                    economiaKm: Number(Math.max(0, kmAntesTotal - kmDepoisTotal).toFixed(2)),
                    tempoEstimadoSegundos: resultadoTsp.tempoFinal,
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