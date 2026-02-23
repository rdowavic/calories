import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('favorite_foods', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('food_name', 500).notNullable();
    table.string('brand_name', 255);
    table.string('external_food_id', 255);
    table.string('food_source', 20).notNullable();
    table.decimal('calories', 8, 1).notNullable();
    table.decimal('protein_g', 7, 1).defaultTo(0);
    table.decimal('carbs_g', 7, 1).defaultTo(0);
    table.decimal('fat_g', 7, 1).defaultTo(0);
    table.decimal('serving_qty', 6, 2).notNullable().defaultTo(1);
    table.string('serving_unit', 50).notNullable();
    table.decimal('serving_size_g', 7, 1);
    table.integer('use_count').defaultTo(0);
    table.timestamp('last_used_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'external_food_id', 'food_source']);
  });

  await knex.raw('CREATE INDEX idx_favorite_foods_user ON favorite_foods(user_id)');
  await knex.raw('CREATE INDEX idx_favorite_foods_frequency ON favorite_foods(user_id, use_count DESC)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('favorite_foods');
}
