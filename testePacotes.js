import knex from 'knex';
import config from './knexfile.js';

const db = knex(config.development);

await db('pacotes').insert({
    parada_id: 1,
    codigo: 'PKG001',
    destinatario: 'João Silva',
    observacao: 'Entregar na portaria'
});

const pacotes = await db('pacotes').select('*');

console.log(pacotes);