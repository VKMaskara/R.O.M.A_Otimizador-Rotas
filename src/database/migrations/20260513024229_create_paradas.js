/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) { 
    await knex.schema.createTable('paradas', (table) => {
        table.increments('id');
        table.integer('rota_id').unsigned().notNullable();
        table.foreign('rota_id').references('id').inTable('rotas').onDelete('CASCADE');
        table.integer('posicao').notNullable();
        table.string('endereco').notNullable();
        table.float('latitude').notNullable();
        table.float('longitude').notNullable();
        table.boolean('status_entrega').notNullable().defaultTo('Pendente');
        table.dateTime('criado_em').defaultTo(knex.fn.now());
    }) 
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('paradas');
};
