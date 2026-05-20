// src/models/EmpresaModel.js
import db from '../database/db.js';

export class EmpresaModel {

    static async criar(usuario_id, cnpj) {
        const [id] = await db('empresas').insert({ usuario_id, cnpj });
        return id;
    }

    static async buscarPorUsuarioId(usuario_id) {
        return await db('empresas')
            .where({ usuario_id })
            .first();
    }

    static async buscarPorId(id) {
        return await db('empresas')
            .where({ id })
            .first();
    }

    static async listar() {
        return await db('empresas')
            .join('usuarios', 'empresas.usuario_id', 'usuarios.id')
            .select(
                'empresas.id',
                'empresas.cnpj',
                'empresas.criado_em',
                'usuarios.nome',
                'usuarios.email',
                'usuarios.telefone',
                'usuarios.ativo'
            )
            .where('usuarios.ativo', true)
            .orderBy('empresas.id', 'asc');
    }

    static async atualizar(usuario_id, cnpj) {
        return await db('empresas')
            .where({ usuario_id })
            .update({ cnpj });
    }
}