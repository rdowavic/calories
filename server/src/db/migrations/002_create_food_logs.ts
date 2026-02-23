import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('food_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Food identification
    table.string('food_name', 500).notNullable();
    table.string('brand_name', 255);
    table.string('food_source', 20).notNullable();
    table.string('external_food_id', 255);
    table.string('barcode', 20);

    // Nutrition
    table.decimal('calories', 8, 1).notNullable();
    table.decimal('protein_g', 7, 1).defaultTo(0);
    table.decimal('carbs_g', 7, 1).defaultTo(0);
    table.decimal('fat_g', 7, 1).defaultTo(0);
    table.decimal('fiber_g', 7, 1).defaultTo(0);
    table.decimal('sugar_g', 7, 1).defaultTo(0);
    table.decimal('sodium_mg', 8, 1).defaultTo(0);

    // Serving info
    table.decimal('serving_qty', 6, 2).notNullable().defaultTo(1);
    table.string('serving_unit', 50).notNullable();
    table.decimal('serving_size_g', 7, 1);

    // Categorization
    table.string('meal_category', 20).notNullable();
    table.date('logged_date').notNullable();
    table.timestamp('logged_at').defaultTo(knex.fn.now());

    // Input method tracking
    table.string('input_method', 20).notNullable();
    table.uuid('recipe_id');

    // Photo
    table.text('photo_url');

    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_date)');
  await knex.raw('CREATE INDEX idx_food_logs_user_meal ON food_logs(user_id, logged_date, meal_category)');
  await knex.raw('CREATE INDEX idx_food_logs_created ON food_logs(created_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('food_logs');
}
