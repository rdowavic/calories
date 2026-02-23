import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('push_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('expo_push_token', 255).notNullable();
    table.string('device_id', 255);
    table.string('platform', 10);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.unique(['user_id', 'expo_push_token']);
  });

  await knex.raw('CREATE INDEX idx_push_tokens_user ON push_tokens(user_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('push_tokens');
}
