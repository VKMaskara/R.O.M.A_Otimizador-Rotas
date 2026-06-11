// src/controllers/entregadorController.js
import { EntregadorService } from '../services/EntregadorService.js';
import db from '../database/db.js';

export class EntregadorController {

    // POST /entregadores
    static async criar(req, res) {
        try {
            // usuario_id vem do token JWT (injetado pelo middleware autenticar)
            const entregador = await EntregadorService.criarEntregador(
                req.body,
                req.usuario.id   // ← passa o id do usuário logado
            );
            return res.status(201).json({ status: 'success', dados: entregador });
        } catch (err) {
            return res.status(400).json({ status: 'error', erro: err.message });
        }
    }

    // GET /entregadores
    static async listar(req, res) {
        try {
            const entregadores = await EntregadorService.listarEntregadores(
                req.usuario.id   // ← filtra pela empresa do usuário logado
            );
            return res.status(200).json({ status: 'success', dados: entregadores });
        } catch (err) {
            return res.status(400).json({ status: 'error', erro: err.message });
        }
    }

    // GET /entregadores/:id
    static async buscarPorId(req, res) {
        try {
            const entregador = await EntregadorService.buscarEntregador(
                Number(req.params.id),
                req.usuario.id
            );
            return res.status(200).json({ status: 'success', dados: entregador });
        } catch (err) {
            const status = err.message.includes('não encontrado') ? 404 : 400;
            return res.status(status).json({ status: 'error', erro: err.message });
        }
    }

    // PUT /entregadores/:id
    static async atualizar(req, res) {
        try {
            const entregador = await EntregadorService.atualizarEntregador(
                Number(req.params.id),
                req.body,
                req.usuario.id
            );
            return res.status(200).json({ status: 'success', dados: entregador });
        } catch (err) {
            const status = err.message.includes('não encontrado') ? 404 : 400;
            return res.status(status).json({ status: 'error', erro: err.message });
        }
    }

    // DELETE /entregadores/:id
    static async desativar(req, res) {
        try {
            await EntregadorService.desativarEntregador(
                Number(req.params.id),
                req.usuario.id
            );
            return res.status(200).json({ status: 'success', dados: { mensagem: 'Entregador desativado com sucesso.' } });
        } catch (err) {
            const status = err.message.includes('não encontrado') ? 404 : 400;
            return res.status(status).json({ status: 'error', erro: err.message });
        }
    }

    // GET /entregadores/minha-rota  (usado pelo próprio entregador)
    static async minhaRota(req, res) {
        try {
            const entregador = await db('entregadores')
                .where({ usuario_id: req.usuario.id })
                .first();

            if (!entregador) {
                return res.status(404).json({ status: 'error', erro: 'Perfil de entregador não encontrado.' });
            }

            const hoje = new Date().toISOString().split('T')[0];

            const rota = await db('rotas')
                .where({ entregador_id: entregador.id })
                .whereIn('status', ['em_andamento', 'pendente'])
                .whereRaw('DATE(criado_em) = ?', [hoje])
                .first();

            if (!rota) {
                return res.status(200).json({ status: 'success', dados: null, mensagem: 'Nenhuma rota atribuída para hoje.' });
            }

            const paradas = await db('paradas')
                .where({ rota_id: rota.id })
                .orderBy('posicao')
                .select('*');

            return res.status(200).json({ status: 'success', dados: { ...rota, paradas } });
        } catch (err) {
            return res.status(500).json({ status: 'error', erro: err.message });
        }
    }
}