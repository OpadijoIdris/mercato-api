import app from './app.js';
import config from './config/env.js';
import prisma from './database/prisma.js';

const server = app.listen(config.port, () => {
  console.log(`mercato-api listening on :${config.port} (${config.env})`);
});

const shutdown = (): void => {
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default server;
