import db from "../database/db.js"

export class EntregadorModel {

    static async criar(usuario_id, cpf) {
        const [id] = await db('entregadores').insert({ usuario_id, cpf })
        return id
    }

    static async buscarPorUsuarioId(usuario_id) {
        return await db('entregadores')
            .where({ usuario_id })
            .first();
    }

    static async buscarPorId(id) {
        return await db('entregadores')
            .where({ id })
            .first();
    }

    static async listar() {
        return await db('entregadores')
            .join('usuarios', 'entregadores.usuario_id', 'usuarios.id')
            .select(
                'entregadores.id',
                'entregadores.cpf',
                'entregadores.criado_em',
                'entregadores.veiculo',
                'entregadores.placa',
                'entregadores.capacidade',
                'usuarios.nome',
                'usuarios.email',
                'usuarios.telefone',
                'usuarios.ativo'
            )
            .where('usuarios.ativo', true)
            .orderBy('entregadores.id', 'asc');
    }

    static async atualizar(usuario_id, cpf) {
        return await db('entregadores')
            .where({ usuario_id })
            .update({ cpf });
    }

}