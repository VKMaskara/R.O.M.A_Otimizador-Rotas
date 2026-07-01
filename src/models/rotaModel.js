import db from '../database/db.js'

export class RotaModel {
    // ------- CRUD ROTAS -------

    static async criar(dados) {
        const [id] = await db('rotas').insert({
            empresa_id: dados.empresa_id,
            entregador_id: dados.entregador_id,
            data: dados.data || new Date().toISOString().split('T')[0],
            status: 'pendente',
            km_original: dados.km_original,
            km_otimizado: dados.km_otimizado,
            economia_km: dados.economia_km,
            tempo_estimado_min: dados.tempo_estimado_min,
        })
        return id
    }
    static async buscarPorId(id) {
        return await db('rotas').where({ id }).first()
    }

    static async listarPorEmpresa(empresa_id) {
        return await db('rotas')
            .leftJoin('usuarios', function () {
                this.on('rotas.entregador_id', '=',
                    db.raw(`(SELECT id FROM entregadores WHERE entregadores.id = rotas.entregador_id LIMIT 1)`)
                )
            })
            .where('rotas.empresa_id', empresa_id)
            .select(
                'rotas.id',
                'rotas.data',
                'rotas.status',
                'rotas.km_original',
                'rotas.km_otimizado',
                'rotas.economia_km',
                'rotas.tempo_estimado_min',
                'rotas.entregador_id',
                'rotas.criado_em'
            )
            .orderBy('rotas.criado_em', 'desc');
    }

    static async atualizarStatus(id, status) {
        return await db('rotas').where({ id }).update({ status });
    }

    static async atribuirEntregador(id, entregador_id) {
        return await db('rotas').where({ id }).update({ entregador_id });
    }
    // ─── PARADAS ──────────────────────────────────────────────────────────────

    static async salvarParadas(rota_id, paradas) {
        const registros = paradas.map((p) => ({
            rota_id,
            posicao: p.posicao,
            endereco: p.endereco,
            lat: p.lat,
            lng: p.lng,
            status_entrega: p.tipo === 'DEPOSITO' || p.tipo === 'RETORNO'
                ? null
                : 'pendente',
        }));

        await db('paradas').insert(registros);

        // Retorna as paradas com os IDs gerados
        return await db('paradas').where({ rota_id }).orderBy('posicao');
    }

    static async buscarParadasDaRota(rota_id) {
        return await db('paradas')
            .leftJoin('pacotes', 'paradas.id', 'pacotes.parada_id')
            .where('paradas.rota_id', rota_id)
            .select(
                'paradas.id',
                'paradas.posicao',
                'paradas.endereco',
                'paradas.lat',
                'paradas.lng',
                'paradas.status_entrega',
                'pacotes.id as pacote_id',
                'pacotes.codigo',
                'pacotes.destinatario',
                'pacotes.observacao'
            )
            .orderBy('paradas.posicao');
    }

    static async atualizarStatusParada(id, status) {
        return await db('paradas').where({ id }).update({ status_entrega: status });
    }

    // ─── PACOTES ──────────────────────────────────────────────────────────────

    static async salvarPacotes(paradas) {
        const pacotes = paradas
            .filter(p => p.parada_id && p.pacote?.id)
            .map(p => ({
                parada_id: p.parada_id,
                codigo: p.pacote.id,
                destinatario: p.pacote.destinatario || null,
                observacao: p.pacote.observacao || null,
            }));

        if (pacotes.length > 0) {
            await db('pacotes').insert(pacotes);
        }
    }

    // ─── RESULTADOS ───────────────────────────────────────────────────────────

    static async salvarResultado(rota_id, dados) {
        const [id] = await db('resultados').insert({
            rota_id,
            km_real: dados.km_real || 0,
            tempo_real_min: dados.tempo_real_min || 0,
            entrega_ok: dados.entrega_ok || 0,  // ✅ nome correto
            entrega_falha: dados.entrega_falha || 0,  // ✅ nome correto
            observacao: dados.observacao || null,
        });
        return id;
    }

    static async buscarResultado(rota_id) {
        return await db('resultados').where({ rota_id }).first();
    }
    static async atualizar(id, dados) {
        const campos = {};
        if (dados.status) campos.status = dados.status;
        if (dados.entregador_id !== undefined) campos.entregador_id = dados.entregador_id;
        if (dados.data) campos.data = dados.data;

        return await db('rotas').where({ id }).update(campos);
    }

}
