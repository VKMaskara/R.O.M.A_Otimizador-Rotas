import knex from 'knex';
import config from './knexfile.js';

const db = knex(config.development);



await db('rotas').insert({
    empresa_id: 3,
    entregador_id: 1,
    data: '2026-05-12',
    km_original: 100,
    km_otimizada: 80,
    tempo_original: 5,
    tempo_otimizado: 4,
    custo_original: 200,
    custo_otimizado: 150
});

const rotas = await db('rotas').select('*');
console.log(rotas);
