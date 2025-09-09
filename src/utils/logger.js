import morgan from 'morgan';

// Custom token for request body (only in development)
morgan.token('body', (req) => {
  if (process.env.NODE_ENV === 'development') {
    return JSON.stringify(req.body);
  }
  return '';
});

// Custom format for development
const developmentFormat = ':method :url :status :res[content-length] - :response-time ms :body';

// Custom format for production
const productionFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

export const loggerMiddleware = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    // Only log error responses in production
    skip: (req, res) => process.env.NODE_ENV === 'production' && res.statusCode < 400
  }
);

export default loggerMiddleware;
