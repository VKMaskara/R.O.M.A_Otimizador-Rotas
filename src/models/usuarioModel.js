import db from '../database/db.js';

export class UsuarioModel {
    static async criar(usuario) {
        const [id] = await db('usuarios').insert(usuario)
        return id;
    }

    static async buscarPorEmail(email) {

        return await db('usuarios')
            .select(
                'id',
                'nome',
                'email',
                'telefone',
                'tipo',
                'ativo',
                'criado_em'
            )
            .where({ email, ativo: true })
            .first();
    }
    static async buscarComSenhaPorEmail(email) {

        return await db('usuarios')
            .where({ email, ativo: true })
            .first();
    }

    static async listar() {
        return await db('usuarios')
            .select(
                'id',
                'nome',
                'email',
                'telefone',
                'tipo',
                'ativo',
                'criado_em'
            )
            .where({ ativo: true })
            .orderBy('id', 'asc');
    }

    static async buscarPorId(id) {
        const usuario = await db('usuarios')
            .select(
                'id',
                'nome',
                'email',
                'telefone',
                'tipo',
                'ativo',
                'senha_hash',
                'criado_em'
            )
            .where({ id, ativo: true })
            .first();

        if (!usuario) return null;

        const { senha_hash, ...usuarioSemSenha } = usuario;

        return usuarioSemSenha;

    }

    static async atualizar(id, dados) {
        return await db('usuarios')
            .where({ id, ativo: true })
            .update(dados);
    }

    static async deletar(id) {
        return await db('usuarios')
            .where({ id, ativo: true })
            .update({ ativo: false });
    }
}