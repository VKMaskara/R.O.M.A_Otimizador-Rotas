/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
   await knex.schema.createTable('rotas', (table) => {
        table.increments('id')
        table.integer('empresa_id').unsigned().notNullable();
        table.foreign('empresa_id').references('id').inTable('empresas').onDelete('RESTRICT');
        table.integer('entregador_id').unsigned();
        table.foreign('entregador_id').references('id').inTable('entregadores').onDelete('RESTRICT');
        table.date('data').notNullable();
        table.float('km_original').notNullable();
        table.float('km_otimizada').notNullable();
        table.float('tempo_original').notNullable();
        table.float('tempo_otimizado').notNullable();
        table.float('custo_original').notNullable();
        table.float('custo_otimizado').notNullable();
        table.dateTime('criado_em').defaultTo(knex.fn.now());
        table.boolean('ativo').defaultTo(true);
   })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('rotas');
};
