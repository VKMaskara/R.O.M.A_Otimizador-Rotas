/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    await knex.schema.createTable('empresas', (table) => {
        table.increments('id');
        table.string('nome').notNullable();
        table.string('cnpj',20).notNullable().unique()
        table.string('email',20).notNullable().unique()
        table.dateTime('criado_em').defaultTo(knex.fn.now());
        table.string('senha_hash').notNullable();
    });
 }

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    return knex.schema.dropTable("empresas")
 }