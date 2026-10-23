const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

async function seedAdmin() {
  const hash = await bcrypt.hash('PasswordSeguro123!', 10);
  const sql = `
    INSERT INTO administrador (nombre, email, password_hash)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO NOTHING
    RETURNING id_administrador, nombre, email;
  `;
  const result = await pool.query(sql, [
    'Administrador General',
    'admin@tiendamodular.com',
    hash,
  ]);

  if (result.rows.length > 0) {
    console.log('Administrador inicial creado exitosamente:', result.rows[0]);
  } else {
    console.log('El administrador ya existía en la base de datos.');
  }

  await pool.end();
}

seedAdmin().catch((err) => {
  console.error('Error creando admin:', err);
  process.exit(1);
});
