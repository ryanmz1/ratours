const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookierParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errHandler');

const app = express();
// console.log(process.env.NODE_ENV);

// serve static resources
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// set secure http headers
app.use(helmet());

// Global Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// rate limit
const limiter = rateLimit({
  max: 100,
  windowMS: process.env.RATE_LIMIT_WINDOW * 60 * 60 * 1000,
  message: 'Too many requests from this IP, try again later'
});
app.use('/api', limiter);

// body parser, reading body into req.body
// cookie parser
app.use(express.json({ limit: '10kb' }));
app.use(cookierParser());

// Data sanitization
// 1) against NoSQL query injection
app.use(mongoSanitize());
// 2) against XSS
app.use(xssClean());

// against parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'price',
      'maxGroupSize'
    ]
  })
);

// test global middleware
app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

// Routers
app.get('/', async (req, res) => {
  res.status(200).render('base', {
    tour: 'The Travel Lover',
    user: 'Ryan'
  });
});
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`cannot find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
