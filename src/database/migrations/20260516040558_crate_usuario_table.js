/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('usuarios', (table) => {
    table.increments('id').primary();

    table.string('nome', 150).notNullable();
    
    table.string('email', 150).notNullable().unique();

    table.string('senha_hash').notNullable();

    table.string("telefone", );

    table.dateTime('criado_em').defaultTo(knex.fn.now()).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('usuarios');
};
