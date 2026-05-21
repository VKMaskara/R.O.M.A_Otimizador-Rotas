import bcrypt from 'bcrypt';
import db from '../database/db.js';

import { EntregadorModel } from '../models/entregadorModel.js';

export class EntregadorService {

    /**
     * Cria:
     * 1. usuário
     * 2. entregador
     */
    static async criarEntregador(dados) {

        const {
            nome,
            email,
            senha,
            telefone,
            cpf,
            veiculo,
            placa,
            capacidade,
            empresa_id
        } = dados;

        // =========================
        // VALIDAÇÕES
        // =========================

        if (!nome || !email || !senha || !cpf) {
            throw new Error(
                'Nome, email, senha e CPF são obrigatórios.'
            );
        }

        // Verifica email
        const emailExistente = await db('usuarios')
            .where({ email })
            .first();

        if (emailExistente) {
            throw new Error(
                'Este email já está cadastrado.'
            );
        }

        // Verifica CPF
        const cpfExistente = await db('entregadores')
            .where({ cpf })
            .first();

        if (cpfExistente) {
            throw new Error(
                'Este CPF já está cadastrado.'
            );
        }

        // Hash senha
        const senha_hash = await bcrypt.hash(
            senha,
            10
        );

        // =========================
        // TRANSAÇÃO
        // =========================

        const resultado = await db.transaction(
            async (trx) => {

                // 1. Usuário
                const [usuario_id] =
                    await trx('usuarios')
                        .insert({
                            nome,
                            email,
                            senha_hash,
                            telefone: telefone || null,
                            tipo: 'ENTREGADOR',
                            ativo: true
                        });

                // 2. Entregador
                const [entregador_id] = await trx('entregadores').insert({
                    usuario_id,
                    empresa_id,
                    cpf,
                    veiculo,
                    placa,
                    capacidade
                });

                return {
                    usuario_id,
                    entregador_id
                };
            }
        );

        // =========================
        // RETORNO
        // =========================

        return {
            id: resultado.entregador_id,
            usuario_id: resultado.usuario_id,
            nome,
            email,
            cpf
        };
    }

    // =========================
    // LISTAR
    // =========================

    static async listarEntregadores() {
        return await EntregadorModel.listar();
    }

    // =========================
    // BUSCAR POR ID
    // =========================

    static async buscarEntregador(id) {

        const entregador =
            await EntregadorModel.buscarPorId(id);

        if (!entregador) {
            throw new Error(
                'Entregador não encontrado.'
            );
        }

        return entregador;
    }

    // =========================
    // ATUALIZAR
    // =========================

    static async atualizarEntregador(id, dados) {

        const entregador =
            await EntregadorModel.buscarPorId(id);

        if (!entregador) {
            throw new Error(
                'Entregador não encontrado.'
            );
        }

        await db.transaction(async (trx) => {

            // =========================
            // Atualiza usuário
            // =========================

            const dadosUsuario = {};

            if (dados.nome)
                dadosUsuario.nome = dados.nome;

            if (dados.email)
                dadosUsuario.email = dados.email;

            if (dados.telefone)
                dadosUsuario.telefone = dados.telefone;

            if (dados.senha) {
                dadosUsuario.senha_hash =
                    await bcrypt.hash(
                        dados.senha,
                        10
                    );
            }

            if (
                Object.keys(dadosUsuario).length > 0
            ) {

                await trx('usuarios')
                    .where({
                        id: entregador.usuario_id
                    })
                    .update(dadosUsuario);
            }

            // =========================
            // Atualiza entregador
            // =========================

            const dadosEntregador = {};

            if (dados.veiculo)
                dadosEntregador.veiculo = dados.veiculo;

            if (dados.placa)
                dadosEntregador.placa = dados.placa;

            if (dados.capacidade)
                dadosEntregador.capacidade =
                    dados.capacidade;

            if (dados.cpf)
                dadosEntregador.cpf = dados.cpf;

            if (
                Object.keys(dadosEntregador).length > 0
            ) {

                await trx('entregadores')
                    .where({ id })
                    .update(dadosEntregador);
            }
        });

        return await EntregadorModel.buscarPorId(id);
    }

    // =========================
    // SOFT DELETE
    // =========================

    static async desativarEntregador(id) {

        const entregador =
            await EntregadorModel.buscarPorId(id);

        if (!entregador) {
            throw new Error(
                'Entregador não encontrado.'
            );
        }

        await db('usuarios')
            .where({
                id: entregador.usuario_id
            })
            .update({
                ativo: false
            });
    }
}