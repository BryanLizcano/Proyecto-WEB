const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const setupSwagger = require('./config/swagger');
const apiV1Routes = require('./routes/index');
const healthRoutes = require('./routes/healthRoutes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Render utiliza un proxy inverso para SSL; trust proxy es necesario para que Express detecte conexiones seguras
app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.corsOrigins.includes(origin) || env.corsOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Bloqueado por política de CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));

setupSwagger(app);

app.use('/api', healthRoutes);
app.use('/api/v1', apiV1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
