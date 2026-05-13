import knex from 'knex';
import config from './knexfile.js';

const db = knex(config.development);

await db('paradas').insert({
    rota_id: 1,
    posicao: 1,
    endereco: 'Rua Exemplo, 123',
    latitude: -23.550520,
    longitude: -46.633308,
    status_entrega: false
});

const paradas = await db('paradas').select('*');

console.log(paradas);