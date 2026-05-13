
import knex from 'knex';
import config from './knexfile.js';
import bcrypt from 'bcrypt';

const db = knex(config.development);

await db('empresas').insert({
  nome: 'Empresa Teste',
  cnpj: '12345678000199',
  email: 'teste@empresa.com',
  senha_hash: '123456'
});

const empresas = await db('empresas').select('*');
console.log(empresas);

