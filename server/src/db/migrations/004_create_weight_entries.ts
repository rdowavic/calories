import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('weight_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('weight_kg', 5, 1).notNullable();
    table.date('logged_date').notNullable();
    table.text('note');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'logged_date']);
  });

  await knex.raw('CREATE INDEX idx_weight_entries_user_date ON weight_entries(user_id, logged_date)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('weight_entries');
}
