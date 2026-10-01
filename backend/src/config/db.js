const { Pool } = require('pg');
const env = require('./env');

const poolConfig = env.databaseUrl
  ? {
      connectionString: env.databaseUrl,
      ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Error inesperado en el pool inactivo de PostgreSQL:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
