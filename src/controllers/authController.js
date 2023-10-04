const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/emailHelper');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true
  };
  if (process.env.NODE_ENV !== 'production') {
    cookieOptions.secure = false;
  }
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    message: 'success',
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });
  sendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1)check whether email and password exit
  if (!email || !password) {
    return next(new AppError('Please provide email and password'), 400);
  }

  // 2)check whether email and password correct
  const user = await User.findOne({ email }).select('+password');
  // console.log(await user.isPasswordCorrect(password));
  const correct = user ? await user.isPasswordCorrect(password) : false;
  if (!correct) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3)send token to client
  sendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.cookies) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }
  // 2)verify token
  const { id, iat } = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // 3)check user
  // console.log(id);
  // const user = await User.findOne({ _id: id });
  const user = await User.findById(id);
  // console.log(user);
  if (!user) {
    return next(new AppError('The user does not exist', 401));
  }
  // 4)check if token issued before password changed
  // console.log(user.isPasswordChanged(iat));
  if (user.isPasswordChanged(iat)) {
    return next(new AppError('Password changed recently, login again', 401));
  }

  // GRANT ACCESS
  req.user = user;
  console.log('current user:', req.user.id);
  console.log('route protect done');
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You have no permission', 403));
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1)get user from email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('The user does not exist', 404));
  }

  // 2)generate reset token
  const token = user.generateResetToken();
  // updateOne
  await user.save({ validateBeforeSave: true });

  // 3)send email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${token}`;
  const text = `Click this link to reset your password:${resetURL}\nIf you didn't forget password, please ignore this mail.`;
  try {
    await sendEmail({
      emailTo: user.email,
      subject: 'Password Reset Link(EXPIRE IN 10 MIN)',
      text
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return next(new AppError('Try sending email later', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on token, set password only if token verified
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  if (!user) {
    return next(new AppError('reset token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  sendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // console.log(req.user._id);
  // 2) check user's password
  // console.log(user.isPasswordCorrect(req.body.password));
  if (!(await user.isPasswordCorrect(req.body.password))) {
    return next(new AppError('your password not correct', 401));
  }

  // 3) save new password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // 4) login user
  // console.log(user);
  // snedToken();

  res.status(200).json({
    status: 'success',
    message: 'password updated, please login manually'
  });
});
