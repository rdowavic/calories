import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('recipes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description');
    table.decimal('servings', 4, 1).defaultTo(1);
    table.decimal('total_calories', 8, 1);
    table.decimal('total_protein_g', 7, 1);
    table.decimal('total_carbs_g', 7, 1);
    table.decimal('total_fat_g', 7, 1);
    table.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_recipes_user ON recipes(user_id)');

  // Add foreign key from food_logs to recipes now that recipes table exists
  await knex.schema.alterTable('food_logs', (table) => {
    table.foreign('recipe_id').references('id').inTable('recipes').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('food_logs', (table) => {
    table.dropForeign('recipe_id');
  });
  await knex.schema.dropTableIfExists('recipes');
}
