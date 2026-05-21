import { EntregadorService }
    from "../services/EntregadorService.js";

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
}