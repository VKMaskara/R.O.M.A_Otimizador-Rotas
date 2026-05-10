import knex from 'knex';
import config from './knexfile.js';
import bcrypt from 'bcrypt';

const db = knex(config.development);

const senha_hash = await bcrypt.hash('123456', 10);

await db('empresas').del({
    
  nome: 'Empresa Teste5',
  cnpj: '12345678000190',
  email: 'teste1@empresa.com',
  senha_hash: senha_hash
});

const empresas = await db('empresas').select('*');
console.log(empresas);