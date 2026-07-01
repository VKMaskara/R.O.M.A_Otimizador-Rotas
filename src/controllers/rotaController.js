// src/controllers/RotaController.js
import db from '../database/db.js';
import fs from 'fs';
import { RotaModel } from '../models/rotaModel.js';
import { RotaService } from '../services/RotaService.js';
import { ExecelService } from '../services/ExecelService.js';


export class RotaController {

    // POST /rotas/otimizar
    static async otimizar(req, res) {
        try {
            const empresa_id = req.usuario.id;
            const { paradas, entregador_id } = req.body;

            if (!paradas || paradas.length < 2) {
                return res.status(400).json({
                    status: 'error',
                    mensagem: 'Envie ao menos 1 depósito e 1 entrega.'
                });
            }

            const resultado = await RotaService.otimizarERosalvar(
                empresa_id,
                paradas,
                entregador_id || null
            );

            return res.status(201).json({ status: 'success', dados: resultado });

        } catch (error) {
            return res.status(400).json({ status: 'error', mensagem: error.message });
        }
    }

    // POST /rotas/otimizar-excel — modo PLANILHA (multipart/form-data)
    // Campos do form-data:
    //   planilha       -> arquivo .xlsx/.xls/.csv (obrigatório)
    //   entregador_id  -> opcional
    static async otimizarExcel(req, res) {
        try {
            const empresa_id = req.usuario.id;

            if (!req.file) {
                return res.status(400).json({
                    status: 'error',
                    mensagem: 'Nenhuma planilha foi enviada.'
                });
            }

            const paradas = ExecelService.getAddresFromExel(req.file.path);

            // Remove o arquivo temporário independentemente do resultado
            fs.unlink(req.file.path, () => { });

            if (!paradas) {
                return res.status(400).json({
                    status: 'error',
                    mensagem: 'Planilha inválida. Verifique se há uma linha com "Tipo: DEPOSITO" e as colunas Endereco, Numero, Cidade, Estado.'
                });
            }

            const { entregador_id } = req.body;

            const resultado = await RotaService.otimizarERosalvar(
                empresa_id,
                paradas,
                entregador_id || null
            );

            return res.status(201).json({ status: 'success', dados: resultado });

        } catch (error) {
            if (req.file?.path) fs.unlink(req.file.path, () => { });
            return res.status(400).json({ status: 'error', mensagem: error.message });
        }
    }

    // GET /rotas
    static async listar(req, res) {
        try {
            const empresa_id = req.usuario.id;
            const rotas = await RotaService.listarRotas(empresa_id);
            return res.status(200).json({ status: 'success', dados: rotas });
        } catch (error) {
            return res.status(500).json({ status: 'error', mensagem: error.message });
        }
    }

    // GET /rotas/:id
    static async detalhar(req, res) {
        try {
            const empresa_id = req.usuario.id;
            const rota = await RotaService.detalharRota(
                Number(req.params.id),
                empresa_id
            );
            return res.status(200).json({ status: 'success', dados: rota });
        } catch (error) {
            return res.status(404).json({ status: 'error', mensagem: error.message });
        }
    }

    // PATCH /rotas/:id/entregador
    static async atribuirEntregador(req, res) {
        try {
            const empresa_id = req.usuario.id;
            const { entregador_id } = req.body;

            await RotaService.atribuirEntregador(
                Number(req.params.id),
                entregador_id,
                empresa_id
            );

            return res.status(200).json({
                status: 'success',
                mensagem: 'Entregador atribuído com sucesso.'
            });
        } catch (error) {
            return res.status(400).json({ status: 'error', mensagem: error.message });
        }
    }

    // PATCH /paradas/:id/status
    static async atualizarStatusParada(req, res) {
        try {
            const { status } = req.body;

            await RotaService.atualizarStatusParada(
                Number(req.params.id),
                status
            );

            return res.status(200).json({
                status: 'success',
                mensagem: 'Status da parada atualizado.'
            });
        } catch (error) {
            return res.status(400).json({ status: 'error', mensagem: error.message });
        }
    }

    // POST /rotas/:id/resultado
    static async registrarResultado(req, res) {
        try {
            await RotaService.registrarResultado(
                Number(req.params.id),
                req.body,
                req.usuario.id
            );

            return res.status(201).json({
                status: 'success',
                mensagem: 'Resultado registrado. Rota concluída!'
            });
        } catch (error) {
            return res.status(400).json({ status: 'error', mensagem: error.message });
        }
    }

    static async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { status, entregador_id, data } = req.body;

            const rota = await RotaModel.buscarPorId(id);
            if (!rota) return res.status(404).json({ erro: 'Rota não encontrada' });

            // Busca o empresa_id real, igual ao RotaService faz
            const empresa = await db('empresas').where({ usuario_id: req.usuario.id }).first();
            if (!empresa) return res.status(404).json({ erro: 'Empresa não encontrada' });

            if (Number(rota.empresa_id) !== Number(empresa.id))
                return res.status(403).json({ erro: 'Sem permissão' });

            await RotaModel.atualizar(id, { status, entregador_id, data });
            const rotaAtualizada = await RotaModel.buscarPorId(id);
            res.json(rotaAtualizada);
        } catch (err) {
            console.error('Erro ao atualizar rota:', err);
            res.status(500).json({ erro: 'Erro interno ao atualizar rota' });
        }
    }
}