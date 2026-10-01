const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function runInit() {
  const schemaPath = path.resolve(__dirname, '../../docs/schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error(`No se encontró el archivo de esquema en: ${schemaPath}`);
    process.exit(1);
  }

  const fullSql = fs.readFileSync(schemaPath, 'utf-8');
  const seedSectionMarker = '-- 5. SEED DATA';
  const ddlSql = fullSql.includes(seedSectionMarker)
    ? fullSql.split(seedSectionMarker)[0]
    : fullSql;

  const client = await pool.connect();
  try {
    console.log('Iniciando ejecución de DDL desde docs/schema.sql...');
    await client.query(ddlSql);
    console.log('Tablas, extensiones e índices creados exitosamente.');
  } catch (error) {
    console.error('Error durante la inicialización de la base de datos:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runInit();
