import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('recipe_ingredients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('recipe_id').notNullable().references('id').inTable('recipes').onDelete('CASCADE');
    table.string('food_name', 500).notNullable();
    table.string('external_food_id', 255);
    table.string('food_source', 20);
    table.decimal('calories', 8, 1).notNullable();
    table.decimal('protein_g', 7, 1).defaultTo(0);
    table.decimal('carbs_g', 7, 1).defaultTo(0);
    table.decimal('fat_g', 7, 1).defaultTo(0);
    table.decimal('serving_qty', 6, 2).notNullable().defaultTo(1);
    table.string('serving_unit', 50).notNullable();
    table.decimal('serving_size_g', 7, 1);
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('recipe_ingredients');
}
