import express from 'express';
import cors from 'cors';
import { apiReference } from '@scalar/express-api-reference';
import routes from './routes/index.js';
import { requestLogger, responseLogger, errorLogger } from './middleware/log.js';
import errorHandler from './middleware/error.js';
import ResponseService from './util/response.js';
import openapi from './docs/openapi.js';

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(responseLogger);

app.use('/docs', apiReference({ content: openapi, pageTitle: 'Mercato API' }));

app.use(routes);
app.use((_req, res) => {
  ResponseService.json(res, 404, 'Not found', null);
});

app.use(errorLogger);
app.use(errorHandler);

export default app;
