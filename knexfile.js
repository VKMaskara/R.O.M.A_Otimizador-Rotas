/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {

  development: {
    client: 'better-sqlite3',
    connection: {
      filename: './data/roma.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations'
    }
  },
};


