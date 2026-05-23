// src/services/RotaService.js
import { InputService } from './InputService.js';
import { GeolocationService } from './GeolocationService.js';
import { MatrizService } from './MatrixService.js';
import { OtimizacaoService } from './OtimizacaoService.js';
import { RotaModel } from '../models/rotaModel.js';

export class RotaService {

    /**
     * Fluxo completo de otimização:
     * 1. Geocodifica os endereços
     * 2. Gera a matriz de distâncias
     * 3. Otimiza com TSP + 2-Opt 
     * 4. Salva rota, paradas e pacotes no banco
     * 5. Retorna resultado completo para a API
     *
     * @param {number} empresa_id - ID da empresa (vem do token JWT)
     * @param {Array}  paradas    - Lista de paradas com endereço e pacote
     * @param {number} [entregador_id] - Opcional: atribuir entregador na criação
     */
   static async otimizarERosalvar(empresa_id, paradas, entregador_id = null) {

        // ── 1. GEOCODIFICAÇÃO ──────────────────────────────────────────────────
        // Alterado de enderecosComError para enderecosComErro para manter o padrão em português
        const { status, enderecosOk, enderecosComErro } =
            await GeolocationService.geocodificarEnderecos(paradas);

        if (enderecosOk.length < 2) {
            throw new Error(
                'Endereços insuficientes para roteirizar. ' +
                'Verifique os endereços inválidos e tente novamente.'
            );
        }

        // ── 2. MATRIZ DE DISTÂNCIAS ───────────────────────────────────────────
        const matrixData = await MatrizService.gerarMatrizCompleta(enderecosOk);

        // ── 3. OTIMIZAÇÃO (TSP + 2-Opt) ───────────────────────────────────────
        const nomesEnderecos = enderecosOk.map(e => e.endereco);
        const resultadoOtimizacao = await OtimizacaoService.processarOtimizacao(
            matrixData,
            nomesEnderecos
        );

        if (resultadoOtimizacao.status !== 'success') {
            throw new Error(resultadoOtimizacao.mensagem);
        }

        const { dados } = resultadoOtimizacao;

        // ── 4. MONTA ROTA DETALHADA ───────────────────────────────────────────
        const rotaDetalhada = dados.rotaIndices.map((idx, posicao) => {
            const parada = enderecosOk[idx];
            return {
                posicao: posicao + 1,
                endereco: parada.endereco,
                tipo: parada.tipo || 'ENTREGA',
                pacote: parada.pacote || null,
                lat: parada.lat,
                lng: parada.lng,
            };
        });

        // Retorno ao depósito
        const origen = enderecosOk[0];
        rotaDetalhada.push({
            posicao: rotaDetalhada.length + 1,
            endereco: `Retorno ao Depósito: ${origen.endereco}`,
            tipo: 'RETORNO',
            pacote: null,
            lat: origen.lat,
            lng: origen.lng,
        });

        // ── 5. SALVA NO BANCO ─────────────────────────────────────────────────
        const rota_id = await RotaModel.criar({
            empresa_id,
            entregador_id,
            km_original: dados.distanciaOriginal,
            km_otimizado: dados.distanciaOtimizada,
            economia_km: dados.economiaKm,
            tempo_estimado_min: dados.tempoEstimadoMinutos,
        });

        // Salva paradas
        const paradasSalvas = await RotaModel.salvarParadas(rota_id, rotaDetalhada);

        // Vincula parada_id ao pacote e salva pacotes
        const paradasComId = rotaDetalhada.map((p, i) => ({
            ...p,
            parada_id: paradasSalvas[i]?.id || null,
        }));

        await RotaModel.salvarPacotes(paradasComId);

        // ── 6. RETORNO ────────────────────────────────────────────────────────
        return {
            rota_id,
            status: 'pendente',
            enderecosComErro,   // Now matches the variable from destructuring
            metricas: {
                km_original: dados.distanciaOriginal,
                km_otimizado: dados.distanciaOtimizada,
                economia_km: dados.economiaKm,
                tempo_estimado_min: dados.tempoEstimadoMinutos,
            },
            rotaDetalhada,
        };
    }
}