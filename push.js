/* eslint-disable @typescript-eslint/no-var-requires */
// Simple script to push all records from src/data/us_data.json into the MedicineUSA table
// Run with: node push.js (from the backend directory)

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const filePath = path.join(__dirname, 'src', 'data', 'us_data.json');

  console.log('Reading JSON data from:', filePath);

  // NOTE: This reads the whole file into memory.
  // If this becomes too big for your machine, we can switch to a streaming parser.
  const rawBuffer = fs.readFileSync(filePath);

  // Try to be robust to BOM/encoding issues: find the first '[' and parse from there.
  let raw = rawBuffer.toString('utf8');
  const firstBracket = raw.indexOf('[');
  if (firstBracket > 0) {
    raw = raw.slice(firstBracket);
  }
  raw = raw.trim();

  let records;
  try {
    records = JSON.parse(raw);
  } catch (e) {
    console.error(
      'Failed to parse us_data.json as JSON. First 100 chars:',
      raw.slice(0, 100),
    );
    throw e;
  }

  if (!Array.isArray(records)) {
    throw new Error('Expected us_data.json to contain an array of records');
  }

  console.log(`Loaded ${records.length} records. Inserting into database...`);

  // Map records directly; JSON keys match Prisma model fields.
  const data = records.map((r) => ({
    PRODUCTID: r.PRODUCTID,
    PRODUCTNDC: r.PRODUCTNDC ?? '',
    PRODUCTTYPENAME: r.PRODUCTTYPENAME ?? '',
    PROPRIETARYNAME: r.PROPRIETARYNAME,
    PROPRIETARYNAMESUFFIX: r.PROPRIETARYNAMESUFFIX ?? '',
    NONPROPRIETARYNAME: r.NONPROPRIETARYNAME ?? '',
    DOSAGEFORMNAME: r.DOSAGEFORMNAME ?? '',
    ROUTENAME: r.ROUTENAME ?? '',
    STARTMARKETINGDATE: r.STARTMARKETINGDATE ?? '',
    ENDMARKETINGDATE: r.ENDMARKETINGDATE ?? '',
    MARKETINGCATEGORYNAME: r.MARKETINGCATEGORYNAME ?? '',
    APPLICATIONNUMBER: r.APPLICATIONNUMBER ?? '',
    LABELERNAME: r.LABELERNAME ?? '',
    SUBSTANCENAME: r.SUBSTANCENAME ?? '',
    ACTIVE_NUMERATOR_STRENGTH: r.ACTIVE_NUMERATOR_STRENGTH ?? '',
    ACTIVE_INGRED_UNIT: r.ACTIVE_INGRED_UNIT ?? '',
    PHARM_CLASSES: r.PHARM_CLASSES ?? '',
    DEASCHEDULE: r.DEASCHEDULE ?? '',
    AIMODELCHAT: r.AIMODELCHAT ?? null,
    // region will default to USA via Prisma enum default
  }));

  // Use createMany for efficient bulk insert
  const batchSize = 1000;
  let insertedTotal = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(`Inserting batch ${i} - ${i + batch.length}...`);

    const result = await prisma.medicineUSA.createMany({
      data: batch,
      skipDuplicates: true, // in case PRODUCTID already exists
    });

    insertedTotal += result.count;
    console.log(
      `Inserted ${result.count} records in this batch (total inserted: ${insertedTotal}).`,
    );
  }

  console.log('Done inserting MedicineUSA data.');
}

main()
  .catch((err) => {
    console.error('Error while pushing data:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
