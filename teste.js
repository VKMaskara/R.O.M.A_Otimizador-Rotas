import knex from 'knex';
import config from './knexfile.js';
import bcrypt from 'bcrypt';

const db = knex(config.development);

const senha_hash = await bcrypt.hash('123456', 10);

await db('ro').insert({
    
  nome: 'Entregador',
  telefone: '11999999999',
  veiculo: 'Moto',
  placa: 'ABC-1234',
  capacidade: 50,
  cpf: '123.456.789-00',
  senha_hash: senha_hash,
  empresa_id: 3

});

const entregadores = await db('entregadores').select('*');
console.log(entregadores);