const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      trim: true,
      unique: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [5, 'A tour name must have more or equal then 5 characters']
      // validate: [validator.isAlpha, 'Tour name must only be alpha charactors']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either easy, medium or difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0'],
      max: [5, 'rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10 // 4.6666 -> 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // only points to current document on document creation
          return val < this.price;
        },
        message: 'Discount price {VALUE} must be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secret: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour'
});

// DOCUMENT MIDDLEWARE: runs BEFORE .save() and .create()
tourSchema.pre('save', function(next) {
  // console.log('pre save');
  this.slug = slugify(this.name, { lower: true });
  next();
});

// // DOCUMENT MIDDLEWARE: runs AFTER .save() and .create()
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE: runs BEFORE .find() like
// tourSchema.pre('save', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secret: { $ne: true } });
  this.startTime = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: ['name', 'photo']
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  const timeCost = Date.now() - this.startTime;
  console.log('this query took ', timeCost, ' ms');
  next();
});

// AGGREGATE MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  // console.log(this.pipeline());
  if (this.pipeline().findIndex(el => el.$geoNear) === -1) {
    this.pipeline().unshift({ $match: { secret: { $ne: true } } });
  }
  // console.log(this.pipeline());
  next();
});

// tourSchema.post('aggregate', function(next) {
//   //this.pipeline().unshift({ $match: { secret: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
