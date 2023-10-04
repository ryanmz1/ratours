const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  console.log(err.code, err.errmsg);
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate Field value: ${value}, please use anothor value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token', 401);
const handleTokenExpiredError = () => new AppError('Token expired', 401);

const sendErrorUnknown = (err, res) => {
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong'
  });
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    // message: `${err.message}`,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOprational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: `${err.message}`
    });
  } else {
    console.log('ERROR 💣', err);
    sendErrorUnknown(err, res);
  }
};

module.exports = (err, req, res, next) => {
  console.log('err: ', err);
  // console.log({ ...err });
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
    return;
  } 
  if (process.env.NODE_ENV === 'production') {
    // let error = { ...err };
    // let error = Object.create(err);
    let error = JSON.parse(JSON.stringify(error));
    console.log('err: ', err);
    // console.log('error: ', error);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleTokenExpiredError(error);
    sendErrorProd(error, res);
    return;
  }
  sendErrorUnknown(err, res);
};
