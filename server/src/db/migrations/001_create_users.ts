import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('google_id', 255).unique().notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('display_name', 255).notNullable();
    table.text('avatar_url');

    // Profile
    table.decimal('height_cm', 5, 1);
    table.decimal('current_weight_kg', 5, 1);
    table.decimal('goal_weight_kg', 5, 1);
    table.integer('age');
    table.string('gender', 20);
    table.string('activity_level', 20);

    // Calculated + preferences
    table.integer('daily_calorie_goal');
    table.integer('tdee');
    table.string('unit_preference', 10).defaultTo('metric');
    table.string('theme', 10).defaultTo('system');

    // Onboarding + consent
    table.boolean('onboarding_completed').defaultTo(false);
    table.boolean('analytics_consent').defaultTo(false);

    // Notifications
    table.boolean('notifications_enabled').defaultTo(true);
    table.time('lunch_nudge_time').defaultTo('13:00');
    table.time('dinner_nudge_time').defaultTo('19:00');
    table.string('timezone', 50).defaultTo('UTC');

    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_users_google_id ON users(google_id)');
  await knex.raw('CREATE INDEX idx_users_email ON users(email)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
