/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    // Tabela de Rotas
    await knex.schema.createTable('rotas', (table) => {
        table.increments('id').primary();
        table.integer('empresa_id').unsigned().notNullable();
        table.foreign('empresa_id').references('id').inTable('empresas').onDelete('RESTRICT');
        table.integer('entregador_id').unsigned();
        table.foreign('entregador_id').references('id').inTable('entregadores').onDelete('RESTRICT');
        table.date('data').notNullable();
        table.string('status').defaultTo('pendente');
        
        // Colunas exatas para bater com o RotaModel:
        table.float('km_original').notNullable();
        table.float('km_otimizado').notNullable(); 
        table.float('economia_km'); 
        table.float('tempo_estimado_min');

        table.dateTime('criado_em').defaultTo(knex.fn.now());
        table.boolean('ativo').defaultTo(true);
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('rotas');
};
