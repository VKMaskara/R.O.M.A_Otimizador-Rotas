/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    await knex.schema.createTable('empresas', (table) => {
        table.increments('id');
        table.string('cnpj', 20).notNullable().unique()

        table.integer('usuario_id')
            .unsigned()
            .notNullable()
            .unique();

        table.foreign('usuario_id')
            .references('id')
            .inTable('usuarios')
            .onDelete('CASCADE');

        table.dateTime('criado_em').defaultTo(knex.fn.now());

    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    return knex.schema.dropTable("empresas")
}