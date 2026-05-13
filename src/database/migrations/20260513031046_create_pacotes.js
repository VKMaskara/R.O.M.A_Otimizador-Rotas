/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('pacotes', (table) => {

    table.increments('id').primary();

    table.integer('parada_id').unsigned().notNullable();
    table.foreign('parada_id')
        .references('id')
        .inTable('paradas')
        .onDelete('CASCADE');

    table.string('codigo', 80).notNullable();

    table.string('destinatario', 150).notNullable();

    table.text('observacao');

});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('pacotes');
};
