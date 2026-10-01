const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  console.log(`Servidor iniciado en http://localhost:${env.port}`);
  console.log(`Swagger UI disponible en http://localhost:${env.port}/api-docs`);
});

module.exports = server;
