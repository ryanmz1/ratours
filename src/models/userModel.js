const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema([
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please tell us your email'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide your email']
    },
    photo: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'guide', 'lead-guide'],
      default: 'user'
    },
    password: {
      type: String,
      trim: true,
      required: [true, 'A user must have a password'],
      minlength: [8, 'password must be at least 6 charactors'],
      maxlength: [26, 'password must be at most 26 charactors'],
      select: false
    },
    passwordConfirm: {
      type: String,
      trim: true,
      required: [true, 'Please confirm your password'],
      minlength: [6, 'password must be at least 6 charactors'],
      maxlength: [26, 'password must be at most 26 charactors'],
      validate: {
        // Only works on SAVE and CREATE
        validator: function(val) {
          return val === this.password;
        },
        message: 'Passwords are not the same'
      },
      select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  }
]);

userSchema.pre('save', async function(next) {
  // console.log('before save', this.passwordConfirm);
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    this.passwordConfirm = undefined;
  }
  next();
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // ensure not equal to jwt iat
  }
  next();
});

// userSchema.pre('validate', async function(next) {
//   console.log('Pre validate!');
//   // console.log(mongoose.Model._getPathsToValidate(this));
//   console.log('this.passwordConfirm', this.passwordConfirm);
//   next();
// });

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.isPasswordCorrect = async function(candidatePassword) {
  // console.log(`${candidatePassword}, this.password:${this.password}`);
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isPasswordChanged = function(timestamp) {
  // console.log(typeof this.passwordChangedAt.getTime(), typeof timestamp);
  if (this.passwordChangedAt) {
    // console.log(this.passwordChangedAt.getTime(), timestamp);
    return this.passwordChangedAt.getTime() >= timestamp * 1000;
  }
  return false;
};

userSchema.methods.generateResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // console.log(token, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // console.log(this.passwordResetExpires);
  return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
