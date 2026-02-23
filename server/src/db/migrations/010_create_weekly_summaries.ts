import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('weekly_summaries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.date('week_start_date').notNullable();
    table.decimal('avg_daily_calories', 8, 1);
    table.decimal('avg_daily_protein_g', 7, 1);
    table.decimal('avg_daily_carbs_g', 7, 1);
    table.decimal('avg_daily_fat_g', 7, 1);
    table.integer('total_logs').defaultTo(0);
    table.integer('days_logged').defaultTo(0);
    table.decimal('weight_start_kg', 5, 1);
    table.decimal('weight_end_kg', 5, 1);
    table.decimal('weight_change_kg', 4, 2);
    table.date('projected_goal_date');
    table.string('projection_status', 20);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'week_start_date']);
  });

  await knex.raw('CREATE INDEX idx_weekly_summaries_user ON weekly_summaries(user_id, week_start_date)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('weekly_summaries');
}
