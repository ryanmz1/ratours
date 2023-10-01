const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review not be empty']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'review must belong to a user']
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'review must belong to a tour']
  }
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: ['name', 'photo']
  });
  // .populate({
  //   path: 'tour',
  //   select: ['name']
  // });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const reviews = await this.find({ tour: tourId }).select('rating');
  // console.log(reviews);
  const nRating = reviews.length;
  let sum = 0;
  reviews.forEach(el => {
    sum += el.rating;
  });
  const avgRating = nRating !== 0 ? sum / nRating : 4.5;
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: nRating,
    ratingsAverage: avgRating
  });
};

reviewSchema.post('save', async function() {
  // this points to current doc
  await this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function(doc) {
  // console.log(doc);
  // this points to Query object
  // await this.find() does not work here, because query has been excuted
  await doc.constructor.calcAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
