const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function runSeed() {
  const schemaPath = path.resolve(__dirname, '../../docs/schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error(`No se encontró el archivo de esquema en: ${schemaPath}`);
    process.exit(1);
  }

  const fullSql = fs.readFileSync(schemaPath, 'utf-8');
  const startMarker = 'INSERT INTO categoria';
  const endMarker = '-- 6. INSTRUCCIÓN';

  if (!fullSql.includes(startMarker)) {
    console.error('No se encontró la sentencia inicial de seed en docs/schema.sql.');
    process.exit(1);
  }

  const startIndex = fullSql.indexOf(startMarker);
  const endIndex = fullSql.includes(endMarker) ? fullSql.indexOf(endMarker) : fullSql.length;
  const seedSql = fullSql.slice(startIndex, endIndex).trim();

  const client = await pool.connect();
  try {
    console.log('Insertando datos semilla (seed) en la base de datos...');
    await client.query('BEGIN');
    await client.query(seedSql);
    await client.query('COMMIT');
    console.log('Datos iniciales de docs/schema.sql insertados exitosamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la inserción del seed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
