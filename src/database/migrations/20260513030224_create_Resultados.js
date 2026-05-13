/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('resultados', (table) => {  
    table.increments('id').primary();

    table.integer('rota_id').unsigned().notNullable().unique();
    table.foreign('rota_id')
        .references('id')
        .inTable('rotas')
        .onDelete('CASCADE');

    table.decimal('km_real', 10, 2).notNullable();

    table.integer('tempo_real_min').notNullable();

    table.integer('entrega_ok').notNullable();

    table.integer('entrega_falha').notNullable();

    table.text('observacao');

    table.dateTime('registrado_em')
        .defaultTo(knex.fn.now())
        .notNullable();
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('resultados');
};
