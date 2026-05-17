/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('entregadores', (table) => {
    table.increments("id");
    table.string('veiculo', 80).notNullable()
    table.string('placa', 20).notNullable().unique()
    table.decimal('capacidade', 10, 2).notNullable()
    table.string('cpf', 20).notNullable().unique()

    table.integer('usuario_id')
      .unsigned()
      .notNullable()
      .unique();

    table.foreign('usuario_id')
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE');

    table.dateTime('criado_em').defaultTo(knex.fn.now());
    table.boolean('ativo').defaultTo(true);

    table.integer('empresa_id')
      .unsigned()
      .notNullable();

    table.foreign('empresa_id')
      .references('id')
      .inTable('empresas')
      .onDelete('RESTRICT');
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('entregadores');
};
