// src/services/RotaService.js
import { GeolocationService } from './GeolocationService.js';
import { MatrizService }      from './MatrixService.js';
import { OtimizacaoService }  from './OtimizacaoService.js';
import { RotaModel }          from '../models/RotaModel.js';
import db                     from '../database/db.js';

export class RotaService {

    static async otimizarERosalvar(usuario_id, paradas, entregador_id = null) {

        // ── 0. BUSCA O ID REAL DA EMPRESA ─────────────────────────────────────
        const empresa = await db('empresas').where({ usuario_id }).first();
        if (!empresa) throw new Error('Empresa não encontrada para este usuário.');
        const empresa_id = empresa.id;

        // ── 1. GEOCODIFICAÇÃO ──────────────────────────────────────────────────
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
                posicao:  posicao + 1,
                endereco: parada.endereco,
                tipo:     parada.tipo   || 'ENTREGA',
                pacote:   parada.pacote || null,
                lat:      parada.lat,
                lng:      parada.lng,
            };
        });

        // Retorno ao depósito
        const origem = enderecosOk[0];
        rotaDetalhada.push({
            posicao:  rotaDetalhada.length + 1,
            endereco: `Retorno ao Depósito: ${origem.endereco}`,
            tipo:     'RETORNO',
            pacote:   null,
            lat:      origem.lat,
            lng:      origem.lng,
        });

        // ── 5. SALVA NO BANCO ─────────────────────────────────────────────────
        const rota_id = await RotaModel.criar({
            empresa_id,
            entregador_id,
            km_original:        dados.distanciaOriginal,
            km_otimizado:       dados.distanciaOtimizada,
            economia_km:        dados.economiaKm,
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
            status:           'pendente',
            enderecosComErro,
            metricas: {
                km_original:        dados.distanciaOriginal,
                km_otimizado:       dados.distanciaOtimizada,
                economia_km:        dados.economiaKm,
                tempo_estimado_min: dados.tempoEstimadoMinutos,
            },
            rotaDetalhada,
        };
    }

    // ─── LISTAR ROTAS DA EMPRESA ──────────────────────────────────────────────

    static async listarRotas(usuario_id) {
        const empresa = await db('empresas').where({ usuario_id }).first();
        if (!empresa) throw new Error('Empresa não encontrada.');
        return await RotaModel.listarPorEmpresa(empresa.id);
    }

    // ─── DETALHE DE UMA ROTA ─────────────────────────────────────────────────

    static async detalharRota(rota_id, usuario_id) {
        const empresa = await db('empresas').where({ usuario_id }).first();
        if (!empresa) throw new Error('Empresa não encontrada.');

        const rota = await RotaModel.buscarPorId(rota_id);
        if (!rota) throw new Error('Rota não encontrada.');
        if (rota.empresa_id !== empresa.id) {
            throw new Error('Acesso negado. Esta rota não pertence à sua empresa.');
        }

        const paradas   = await RotaModel.buscarParadasDaRota(rota_id);
        const resultado = await RotaModel.buscarResultado(rota_id);

        return { ...rota, paradas, resultado };
    }

    // ─── ATRIBUIR ENTREGADOR ──────────────────────────────────────────────────

    static async atribuirEntregador(rota_id, entregador_id, usuario_id) {
        const empresa = await db('empresas').where({ usuario_id }).first();
        if (!empresa) throw new Error('Empresa não encontrada.');

        const rota = await RotaModel.buscarPorId(rota_id);
        if (!rota) throw new Error('Rota não encontrada.');
        if (rota.empresa_id !== empresa.id) throw new Error('Acesso negado.');
        if (rota.status === 'concluida') {
            throw new Error('Não é possível alterar uma rota já concluída.');
        }

        await RotaModel.atribuirEntregador(rota_id, entregador_id);
        await RotaModel.atualizarStatus(rota_id, 'em_andamento');
    }

    // ─── ATUALIZAR STATUS DE PARADA ───────────────────────────────────────────

    static async atualizarStatusParada(parada_id, status) {
        const statusValidos = ['pendente', 'entregue', 'falhou'];
        if (!statusValidos.includes(status)) {
            throw new Error(`Status inválido. Use: ${statusValidos.join(', ')}`);
        }
        await RotaModel.atualizarStatusParada(parada_id, status);
    }

    // ─── REGISTRAR RESULTADO FINAL ────────────────────────────────────────────

    static async registrarResultado(rota_id, dados) {
        const rota = await RotaModel.buscarPorId(rota_id);
        if (!rota) throw new Error('Rota não encontrada.');
        if (rota.status === 'concluida') throw new Error('Esta rota já foi finalizada.');

        await RotaModel.salvarResultado(rota_id, dados);
        await RotaModel.atualizarStatus(rota_id, 'concluida');
    }
}