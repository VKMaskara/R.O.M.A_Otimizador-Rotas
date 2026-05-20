// src/services/EmpresaService.js
import bcrypt from 'bcrypt';
import db from '../database/db.js';
import { EmpresaModel } from '../models/empresaModel.js';

export class EmpresaService {

    /**
     * Cria um usuário do tipo EMPRESA + registro na tabela empresas.
     * Usa transação — se qualquer parte falhar, desfaz tudo.
     */
    static async criarEmpresa(dados) {
        const { nome, email, senha, telefone, cnpj } = dados;

        // Valida campos obrigatórios
        if (!nome || !email || !senha || !cnpj) {
            throw new Error('Nome, email, senha e CNPJ são obrigatórios.');
        }

        // Verifica se email já está em uso
        const emailExistente = await db('usuarios').where({ email }).first();
        if (emailExistente) {
            throw new Error('Este email já está cadastrado.');
        }

        // Verifica se CNPJ já está em uso
        const cnpjExistente = await db('empresas').where({ cnpj }).first();
        if (cnpjExistente) {
            throw new Error('Este CNPJ já está cadastrado.');
        }

        const senha_hash = await bcrypt.hash(senha, 10);

        // Transação — cria usuário e empresa juntos
        const resultado = await db.transaction(async (trx) => {

            // 1. Cria o usuário
            const [usuario_id] = await trx('usuarios').insert({
                nome,
                email,
                senha_hash,
                telefone: telefone || null,
                tipo: 'EMPRESA',
                ativo: true,
            });

            // 2. Cria a empresa vinculada ao usuário
            const [empresa_id] = await trx('empresas').insert({
                usuario_id,
                cnpj,
            });

            return { usuario_id, empresa_id };
        });

        return {
            id:         resultado.empresa_id,
            usuario_id: resultado.usuario_id,
            nome,
            email,
            cnpj,
        };
    }

    static async listarEmpresas() {
        return await EmpresaModel.listar();
    }

    static async buscarEmpresa(id) {
        const empresa = await EmpresaModel.buscarPorId(id);
        if (!empresa) throw new Error('Empresa não encontrada.');
        return empresa;
    }

    /**
     * Atualiza dados da empresa e/ou do usuário vinculado.
     */
    static async atualizarEmpresa(id, dados) {
        const empresa = await EmpresaModel.buscarPorId(id);
        if (!empresa) throw new Error('Empresa não encontrada.');

        await db.transaction(async (trx) => {

            // Atualiza campos do usuário se enviados
            const dadosUsuario = {};
            if (dados.nome)     dadosUsuario.nome     = dados.nome;
            if (dados.email)    dadosUsuario.email    = dados.email;
            if (dados.telefone) dadosUsuario.telefone = dados.telefone;
            if (dados.senha)    dadosUsuario.senha_hash = await bcrypt.hash(dados.senha, 10);

            if (Object.keys(dadosUsuario).length > 0) {
                await trx('usuarios')
                    .where({ id: empresa.usuario_id })
                    .update(dadosUsuario);
            }

            // Atualiza CNPJ se enviado
            if (dados.cnpj) {
                await trx('empresas').where({ id }).update({ cnpj: dados.cnpj });
            }
        });

        return await EmpresaModel.listar().then(list =>
            list.find(e => e.id === id)
        );
    }

    /**
     * Desativa a empresa (soft delete — não apaga do banco).
     */
    static async desativarEmpresa(id) {
        const empresa = await EmpresaModel.buscarPorId(id);
        if (!empresa) throw new Error('Empresa não encontrada.');

        await db('usuarios')
            .where({ id: empresa.usuario_id })
            .update({ ativo: false });
    }
}