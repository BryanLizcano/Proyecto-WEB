const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const openapiPath = path.resolve(__dirname, '../../../docs/openapi.yaml');
const swaggerDocument = YAML.load(openapiPath);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

module.exports = setupSwagger;
