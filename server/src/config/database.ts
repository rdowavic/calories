import knex from 'knex';
import { env } from './env';

// Fix node-pg date parsing: return DATE columns as 'YYYY-MM-DD' strings
// instead of JavaScript Date objects (which apply timezone offset incorrectly)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pgTypes = require('pg').types;
const DATE_OID = 1082;
pgTypes.setTypeParser(DATE_OID, (val: string) => val);

export const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './src/db/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './src/db/seeds',
    extension: 'ts',
  },
});
