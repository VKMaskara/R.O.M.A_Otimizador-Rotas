import bcrypt from 'bcrypt';
import { UsuarioModel } from '../models/usuarioModel.js';

export class UsuarioService {
    static async criarUsuario(dados) {
        const usuarioExistente = await UsuarioModel.buscarPorEmail(dados.email);
        if (usuarioExistente) {
            throw new Error('Usuário já existe');
        }

        const senhaHash = await bcrypt.hash(dados.senha, 10);

        const novoUsuario = {
            nome: dados.nome,
            email: dados.email,
            senha_hash: senhaHash,
            telefone: dados.telefone,
            tipo: dados.tipo,
            ativo: true
        };

        const tiposValidos = [
            'EMPRESA',
            'ENTREGADOR',
            'ADMIN'
        ];

        if (!tiposValidos.includes(dados.tipo)) {
            throw new Error('Tipo inválido');
        }

        const id = await UsuarioModel.criar(novoUsuario);

        return {
            id,
            nome: dados.nome,
            email: dados.email,
            tipo: dados.tipo,
        }

    }

    static async listarUsuarios() {
        return await UsuarioModel.listar();
    }

    static async buscarUsuario(id) {
        const usuario = await UsuarioModel.buscarPorId(id);

        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        return usuario;
    }

    static async atualizarUsuario(id, dados) {
        // 1. Verifica se o usuário existe no banco primeiro
        const usuario = await UsuarioModel.buscarPorId(id);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        // 2. Cria o objeto contendo apenas os campos que o banco aceita
        const dadosAtualizados = {
            nome: dados.nome,
            email: dados.email,
            telefone: dados.telefone
        };

        // 3. Se uma nova senha foi enviada, gera o hash e coloca na propriedade correta
        if (dados.senha) {
            dadosAtualizados.senha_hash = await bcrypt.hash(dados.senha, 10);
        }

        // 4. Agora sim passamos a variável 'dadosAtualizados' criada com sucesso
        await UsuarioModel.atualizar(id, dadosAtualizados);

        // 5. Retorna o usuário atualizado
        return await UsuarioModel.buscarPorId(id);
    }

    static async deletarUsuario(id) {
        // 1. Verifica se o usuário existe no banco primeiro
        const usuario = await UsuarioModel.buscarPorId(id);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        await UsuarioModel.deletar(id);
    }
}