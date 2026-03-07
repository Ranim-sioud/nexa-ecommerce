import morgan from 'morgan';
import logger from '../config/logger.js';

// Stream morgan output into winston http level
const stream = {
  write: (message) => logger.http(message.trim()),
};

// Combined format: ip method url status bytes - ms  (skip health checks to reduce noise)
export const httpLogger = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  {
    stream,
    skip: (req) => req.url === '/api/health',
  }
);
