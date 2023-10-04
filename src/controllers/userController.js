const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (fields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.updateProfile = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('password not allowed updated here', 400));
  }

  const filteredData = filterObj(req.body, 'name', 'email');

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredData, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.setUserId = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getAllUser = factory.getAll(User);

exports.getUser = factory.getOne(User);

// exports.createUser = factory.createOne(User);

// NOT update password here
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
