import { UsuarioService } from '../services/UsuarioService.js';

export class UsuarioController {

    static async criarUsuario(req, res) {
        try {
            const usuario = await UsuarioService.criarUsuario(req.body);

            return res.status(201).json({
                status: 'success',
                dados: usuario
            });

        } catch (error) {
            return res.status(400).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }

    static async listarUsuarios(req, res) {
        try {
            const usuarios = await UsuarioService.listarUsuarios();
            return res.status(200).json({
                status: 'success',
                dados: usuarios
            });
        } catch (error) {
            return res.status(400).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }

    static async buscarUsuarioPorId(req, res) {
        try {
            const usuario = await UsuarioService.buscarUsuario(req.params.id);

            return res.status(200).json({
                status: 'success',
                dados: usuario
            });
        } catch (error) {
            return res.status(400).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }

    static async atualizar(req, res) {
        try {
            const usuario = await UsuarioService.atualizarUsuario(
                req.params.id,
                req.body
            );

            return res.status(200).json({
                status: 'success',
                dados: usuario
            });

        } catch (error) {
            return res.status(400).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }

    static async deletar(req, res) {
        try {
            await UsuarioService.deletarUsuario(req.params.id);

            return res.status(200).json({
                status: 'success',
                mensagem: 'Usuário removido com sucesso'
            });

        } catch (error) {
            return res.status(404).json({
                status: 'error',
                mensagem: error.message
            });
        }
    }
}