const AppError = require("./appError");

module.exports = fn => {
  return (req, res, next) => {
    // console.log(fn);
    try {
      fn(req, res, next).catch(next);
    } catch (error) {
      next(error);
    }
  };
};
