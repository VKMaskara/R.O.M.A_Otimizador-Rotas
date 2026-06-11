// src/services/EntregadorService.js
import bcrypt from 'bcrypt';
import db from '../database/db.js';
import { EntregadorModel } from '../models/entregadorModel.js';

export class EntregadorService {

    /**
     * Cria:
     * 1. usuário (tipo ENTREGADOR)
     * 2. registro na tabela entregadores
     *
     * O empresa_id vem do token JWT (req.usuario.id → buscar empresa),
     * NUNCA do body — evita que alguém cadastre entregadores em outra empresa.
     */
    static async criarEntregador(dados, usuario_id_logado) {
        const {
            nome,
            email,
            senha,
            telefone,
            cpf,
            veiculo,
            placa,
            capacidade,
        } = dados;

        // ── Validações ────────────────────────────────────────────────────────
        if (!nome || !email || !senha || !cpf) {
            throw new Error('Nome, email, senha e CPF são obrigatórios.');
        }

        // Busca a empresa do usuário logado
        const empresa = await db('empresas').where({ usuario_id: usuario_id_logado }).first();
        if (!empresa) throw new Error('Empresa não encontrada para este usuário.');
        const empresa_id = empresa.id;

        // Verifica email duplicado
        const emailExistente = await db('usuarios').where({ email }).first();
        if (emailExistente) throw new Error('Este email já está cadastrado.');

        // Verifica CPF duplicado
        const cpfExistente = await db('entregadores').where({ cpf }).first();
        if (cpfExistente) throw new Error('Este CPF já está cadastrado.');

        const senha_hash = await bcrypt.hash(senha, 10);

        // ── Transação ─────────────────────────────────────────────────────────
        const resultado = await db.transaction(async (trx) => {

            // 1. Cria o usuário
            const [usuario_id] = await trx('usuarios').insert({
                nome,
                email,
                senha_hash,
                telefone: telefone || null,
                tipo: 'ENTREGADOR',
                ativo: true,
            });

            // 2. Cria o entregador vinculado à empresa do usuário logado
            const [entregador_id] = await trx('entregadores').insert({
                usuario_id,
                empresa_id,   // ← sempre da empresa logada
                cpf,
                veiculo:    veiculo    || null,
                placa:      placa      || null,
                capacidade: capacidade || null,
            });

            return { usuario_id, entregador_id };
        });

        return {
            id:         resultado.entregador_id,
            usuario_id: resultado.usuario_id,
            nome,
            email,
            cpf,
        };
    }

    // ── Listar entregadores da empresa logada ─────────────────────────────────
    static async listarEntregadores(usuario_id_logado) {
        const empresa = await db('empresas').where({ usuario_id: usuario_id_logado }).first();
        if (!empresa) throw new Error('Empresa não encontrada.');

        // Retorna apenas os entregadores desta empresa (com dados do usuário)
        return await db('entregadores as e')
            .join('usuarios as u', 'u.id', 'e.usuario_id')
            .where('e.empresa_id', empresa.id)
            .where('u.ativo', true)
            .select(
                'e.id',
                'e.usuario_id',
                'e.cpf',
                'e.veiculo',
                'e.placa',
                'e.capacidade',
                'u.nome',
                'u.email',
                'u.telefone',
                'u.ativo',
            )
            .orderBy('u.nome');
    }

    // ── Buscar entregador por ID (valida que pertence à empresa logada) ────────
    static async buscarEntregador(id, usuario_id_logado) {
        const empresa = await db('empresas').where({ usuario_id: usuario_id_logado }).first();
        if (!empresa) throw new Error('Empresa não encontrada.');

        const entregador = await db('entregadores as e')
            .join('usuarios as u', 'u.id', 'e.usuario_id')
            .where('e.id', id)
            .where('e.empresa_id', empresa.id)
            .select(
                'e.id',
                'e.usuario_id',
                'e.cpf',
                'e.veiculo',
                'e.placa',
                'e.capacidade',
                'u.nome',
                'u.email',
                'u.telefone',
                'u.ativo',
            )
            .first();

        if (!entregador) throw new Error('Entregador não encontrado.');
        return entregador;
    }

    // ── Atualizar ─────────────────────────────────────────────────────────────
    static async atualizarEntregador(id, dados, usuario_id_logado) {
        // Valida posse antes de alterar
        await EntregadorService.buscarEntregador(id, usuario_id_logado);

        const entregador = await EntregadorModel.buscarPorId(id);

        await db.transaction(async (trx) => {

            const dadosUsuario = {};
            if (dados.nome)     dadosUsuario.nome     = dados.nome;
            if (dados.email)    dadosUsuario.email    = dados.email;
            if (dados.telefone) dadosUsuario.telefone = dados.telefone;
            if (dados.senha)    dadosUsuario.senha_hash = await bcrypt.hash(dados.senha, 10);

            if (Object.keys(dadosUsuario).length > 0) {
                await trx('usuarios').where({ id: entregador.usuario_id }).update(dadosUsuario);
            }

            const dadosEntregador = {};
            if (dados.veiculo)    dadosEntregador.veiculo    = dados.veiculo;
            if (dados.placa)      dadosEntregador.placa      = dados.placa;
            if (dados.capacidade) dadosEntregador.capacidade = dados.capacidade;
            if (dados.cpf)        dadosEntregador.cpf        = dados.cpf;

            if (Object.keys(dadosEntregador).length > 0) {
                await trx('entregadores').where({ id }).update(dadosEntregador);
            }
        });

        return await EntregadorService.buscarEntregador(id, usuario_id_logado);
    }

    // ── Soft delete ───────────────────────────────────────────────────────────
    static async desativarEntregador(id, usuario_id_logado) {
        const entregador = await EntregadorService.buscarEntregador(id, usuario_id_logado);

        await db('usuarios')
            .where({ id: entregador.usuario_id })
            .update({ ativo: false });
    }
}