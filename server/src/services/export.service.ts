import { Readable } from 'stream';
import { stringify } from 'csv-stringify';
import { db } from '../config/database';
import { logger } from '../config/logger';

/**
 * Column definitions for food log CSV export.
 */
const FOOD_LOG_COLUMNS = [
  { key: 'logged_date', header: 'Date' },
  { key: 'logged_at', header: 'Time' },
  { key: 'meal_category', header: 'Meal' },
  { key: 'food_name', header: 'Food Name' },
  { key: 'brand_name', header: 'Brand' },
  { key: 'calories', header: 'Calories' },
  { key: 'protein_g', header: 'Protein (g)' },
  { key: 'carbs_g', header: 'Carbs (g)' },
  { key: 'fat_g', header: 'Fat (g)' },
  { key: 'fiber_g', header: 'Fiber (g)' },
  { key: 'sugar_g', header: 'Sugar (g)' },
  { key: 'sodium_mg', header: 'Sodium (mg)' },
  { key: 'serving_qty', header: 'Serving Qty' },
  { key: 'serving_unit', header: 'Serving Unit' },
  { key: 'food_source', header: 'Source' },
  { key: 'input_method', header: 'Input Method' },
];

/**
 * Column definitions for weight entry CSV export.
 */
const WEIGHT_COLUMNS = [
  { key: 'logged_date', header: 'Date' },
  { key: 'weight_kg', header: 'Weight (kg)' },
  { key: 'note', header: 'Note' },
];

/**
 * Creates a readable stream that outputs CSV data for the given rows and columns.
 */
function createCsvStream(
  rows: Record<string, unknown>[],
  columns: Array<{ key: string; header: string }>
): Readable {
  const stringifier = stringify({
    header: true,
    columns: columns.map((c) => ({ key: c.key, header: c.header })),
  });

  const readable = new Readable({
    read() {
      // Data is pushed in below
    },
  });

  // Pipe rows through stringifier and collect into readable
  stringifier.on('readable', () => {
    let chunk: string | Buffer | null;
    while ((chunk = stringifier.read()) !== null) {
      readable.push(chunk);
    }
  });

  stringifier.on('error', (err) => {
    logger.error({ err }, 'CSV stringify error');
    readable.destroy(err);
  });

  stringifier.on('finish', () => {
    readable.push(null); // Signal end of stream
  });

  // Write all rows to stringifier
  for (const row of rows) {
    stringifier.write(row);
  }
  stringifier.end();

  return readable;
}

/**
 * Exports food logs as a CSV readable stream for the given date range.
 */
export async function exportFoodLogs(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Readable> {
  const rows = await db('food_logs')
    .where({ user_id: userId })
    .whereBetween('logged_date', [startDate, endDate])
    .orderBy('logged_date', 'asc')
    .orderBy('logged_at', 'asc')
    .select(FOOD_LOG_COLUMNS.map((c) => c.key));

  logger.info(
    { userId, startDate, endDate, rowCount: rows.length },
    'Exporting food logs to CSV'
  );

  return createCsvStream(rows, FOOD_LOG_COLUMNS);
}

/**
 * Exports weight entries as a CSV readable stream for the given date range.
 */
export async function exportWeightEntries(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Readable> {
  const rows = await db('weight_entries')
    .where({ user_id: userId })
    .whereBetween('logged_date', [startDate, endDate])
    .orderBy('logged_date', 'asc')
    .select(WEIGHT_COLUMNS.map((c) => c.key));

  logger.info(
    { userId, startDate, endDate, rowCount: rows.length },
    'Exporting weight entries to CSV'
  );

  return createCsvStream(rows, WEIGHT_COLUMNS);
}

/**
 * Exports all data (food logs + weight entries) as a combined CSV stream.
 * Food log rows and weight rows are output in separate sections with section headers.
 */
export async function exportAll(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Readable> {
  const [foodRows, weightRows] = await Promise.all([
    db('food_logs')
      .where({ user_id: userId })
      .whereBetween('logged_date', [startDate, endDate])
      .orderBy('logged_date', 'asc')
      .orderBy('logged_at', 'asc')
      .select(FOOD_LOG_COLUMNS.map((c) => c.key)),
    db('weight_entries')
      .where({ user_id: userId })
      .whereBetween('logged_date', [startDate, endDate])
      .orderBy('logged_date', 'asc')
      .select(WEIGHT_COLUMNS.map((c) => c.key)),
  ]);

  logger.info(
    {
      userId,
      startDate,
      endDate,
      foodLogCount: foodRows.length,
      weightCount: weightRows.length,
    },
    'Exporting all data to CSV'
  );

  const readable = new Readable({
    read() {
      // Data is pushed below
    },
  });

  // Section 1: Food Logs
  const foodStringifier = stringify({
    header: true,
    columns: FOOD_LOG_COLUMNS.map((c) => ({ key: c.key, header: c.header })),
  });

  const foodChunks: (string | Buffer)[] = [];

  foodStringifier.on('readable', () => {
    let chunk: string | Buffer | null;
    while ((chunk = foodStringifier.read()) !== null) {
      foodChunks.push(chunk);
    }
  });

  foodStringifier.on('finish', () => {
    // Push section header
    readable.push('=== FOOD LOGS ===\n');
    for (const chunk of foodChunks) {
      readable.push(chunk);
    }

    // Section 2: Weight Entries
    readable.push('\n=== WEIGHT ENTRIES ===\n');

    const weightStringifier = stringify({
      header: true,
      columns: WEIGHT_COLUMNS.map((c) => ({ key: c.key, header: c.header })),
    });

    weightStringifier.on('readable', () => {
      let chunk: string | Buffer | null;
      while ((chunk = weightStringifier.read()) !== null) {
        readable.push(chunk);
      }
    });

    weightStringifier.on('finish', () => {
      readable.push(null); // End of stream
    });

    weightStringifier.on('error', (err) => {
      readable.destroy(err);
    });

    for (const row of weightRows) {
      weightStringifier.write(row);
    }
    weightStringifier.end();
  });

  foodStringifier.on('error', (err) => {
    readable.destroy(err);
  });

  for (const row of foodRows) {
    foodStringifier.write(row);
  }
  foodStringifier.end();

  return readable;
}
