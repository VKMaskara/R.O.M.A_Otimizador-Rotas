import knex from 'knex';
import config from './knexfile.js';

const db = knex(config.development);

await db('resultados').insert({
    rota_id: 1,
    km_real: 85.50,
    tempo_real_min: 120,
    entrega_ok: 18,
    entrega_falha: 2,
    observacao: 'Rota concluída com pequeno atraso'
});

const resultados = await db('resultados').select('*');

console.log(resultados);