import db from '../database/db.js';

export class UsuarioModel {
    static async criar(usuario){
        const [id] = await db('usuarios').insert(usuario)
        return id;
    }
    // ✅ ADICIONE ESTE MÉTODO ABAIXO:
    static async buscarPorEmail(email) {
        const usuario = await db('usuarios')
            .where({ email }) // Busca na tabela onde o email seja igual ao enviado
            .first();         // Pega apenas o primeiro registro encontrado (ou undefined)
        
        return usuario;
    }

    static async listar(){
        return await db('usuarios')
        .select('*')
        .orderBy('id', 'asc');
    }

    static async buscarPorId(id) {
        return await db('usuarios')
        .where({ id })
        .first();
    }

    static async atualizar(id, dados) {
        return await db('usuarios')
        .where({ id })
        .update(dados);
    }

    static async deletar(id) {
       return await db('usuarios')
        .where({ id })
        .del();
    }
}