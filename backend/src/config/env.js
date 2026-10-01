const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173'],
  databaseUrl: process.env.DATABASE_URL || null,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'tienda_modular',
  },
};

module.exports = env;
