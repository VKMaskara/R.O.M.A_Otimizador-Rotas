// src/controllers/EmpresaController.js
import { EmpresaService } from '../services/EmpresaService.js';

export class EmpresaController {

    static async criar(req, res) {
        try {
            const empresa = await EmpresaService.criarEmpresa(req.body);
            return res.status(201).json({ status: 'success', dados: empresa });
        } catch (error) {
            return res.status(400).json({ status: 'error', mensagem: error.message });
        }
    }

    static async listar(req, res) {
        try {
            const empresas = await EmpresaService.listarEmpresas();
            return res.status(200).json({ status: 'success', dados: empresas });
        } catch (error) {
            return res.status(500).json({ status: 'error', mensagem: error.message });
        }
    }

    static async buscarPorId(req, res) {
        try {
            const empresa = await EmpresaService.buscarEmpresa(Number(req.params.id));
            return res.status(200).json({ status: 'success', dados: empresa });
        } catch (error) {
            return res.status(404).json({ status: 'error', mensagem: error.message });
        }
    }

    static async atualizar(req, res) {
        try {
            const empresa = await EmpresaService.atualizarEmpresa(
                Number(req.params.id),
                req.body
            );
            return res.status(200).json({ status: 'success', dados: empresa });
        } catch (error) {
            return res.status(400).json({ status: 'error', mensagem: error.message });
        }
    }

    static async desativar(req, res) {
        try {
            await EmpresaService.desativarEmpresa(Number(req.params.id));
            return res.status(200).json({
                status: 'success',
                mensagem: 'Empresa desativada com sucesso.'
            });
        } catch (error) {
            return res.status(404).json({ status: 'error', mensagem: error.message });
        }
    }
}