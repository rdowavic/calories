import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('role', 20).notNullable();
    table.text('content').notNullable();
    table.string('context_type', 30);
    table.uuid('food_log_id').references('id').inTable('food_logs').onDelete('SET NULL');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_chat_messages_user ON chat_messages(user_id, created_at)');
  await knex.raw('CREATE INDEX idx_chat_messages_context ON chat_messages(user_id, context_type)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('chat_messages');
}
