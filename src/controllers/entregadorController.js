import { EntregadorService }
    from "../services/EntregadorService.js";
import db from '../database/db.js';

export class EntregadorController {

    // =========================
    // CRIAR
    // =========================

    static async criar(req, res) {

        try {

            const entregador =
                await EntregadorService
                    .criarEntregador(req.body);

            return res.status(201).json({
                status: 'success',
                dados: entregador
            });

        } catch (error) {

            return res.status(400).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }

    // =========================
    // LISTAR
    // =========================

    static async listar(req, res) {

        try {

            const entregadores =
                await EntregadorService
                    .listarEntregadores();

            return res.status(200).json({
                status: 'success',
                dados: entregadores
            });

        } catch (error) {

            return res.status(500).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }

    // =========================
    // BUSCAR POR ID
    // =========================

    static async buscarPorId(req, res) {

        try {

            const entregador =
                await EntregadorService
                    .buscarEntregador(
                        Number(req.params.id)
                    );

            return res.status(200).json({
                status: 'success',
                dados: entregador
            });

        } catch (error) {

            return res.status(404).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }

    // =========================
    // ATUALIZAR
    // =========================

    static async atualizar(req, res) {

        try {

            const entregador =
                await EntregadorService
                    .atualizarEntregador(
                        Number(req.params.id),
                        req.body
                    );

            return res.status(200).json({
                status: 'success',
                dados: entregador
            });

        } catch (error) {

            return res.status(400).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }

    // =========================
    // DESATIVAR
    // =========================

    static async desativar(req, res) {

        try {

            await EntregadorService
                .desativarEntregador(
                    Number(req.params.id)
                );

            return res.status(200).json({
                status: 'success',
                mensagem:
                    'Entregador desativado com sucesso.'
            });

        } catch (error) {

            return res.status(404).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }
    // GET /entregadores/minha-rota
    static async minhaRota(req, res) {
        try {
            const usuario_id = req.usuario.id;

            // Busca o entregador pelo usuario_id
            const entregador = await db('entregadores')
                .where({ usuario_id })
                .first();

            if (!entregador) {
                return res.status(404).json({
                    status: 'error',
                    mensagem: 'Entregador não encontrado.'
                });
            }

            // Busca a rota de hoje atribuída a esse entregador
            const hoje = new Date().toISOString().split('T')[0];

            const rota = await db('rotas')
                .where({ entregador_id: entregador.id })
                .whereIn('status', ['pendente', 'em_andamento'])
                .where('data', hoje)
                .first();

            if (!rota) {
                return res.status(200).json({
                    status: 'success',
                    mensagem: 'Nenhuma rota atribuída para hoje.',
                    dados: null
                });
            }

            // Busca as paradas com pacotes
            const paradas = await db('paradas')
                .leftJoin('pacotes', 'paradas.id', 'pacotes.parada_id')
                .where('paradas.rota_id', rota.id)
                .select(
                    'paradas.id',
                    'paradas.posicao',
                    'paradas.endereco',
                    'paradas.lat',
                    'paradas.lng',
                    'paradas.status_entrega',
                    'pacotes.codigo',
                    'pacotes.destinatario',
                    'pacotes.observacao'
                )
                .orderBy('paradas.posicao');

            return res.status(200).json({
                status: 'success',
                dados: {
                    rota_id: rota.id,
                    status: rota.status,
                    data: rota.data,
                    km_otimizado: rota.km_otimizado,
                    tempo_estimado_min: rota.tempo_estimado_min,
                    paradas
                }
            });

        } catch (error) {
            return res.status(500).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }
}