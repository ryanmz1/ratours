// const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const {
  // redisCli,
  getModelCache,
  setModelCache
} = require('../utils/redisHelper');
const customMongoose = require('../utils/customMongoose');

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // satisfy Review Route
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    const features = new APIFeatures(Model.find(filter), req.query);
    // const features = new APIFeatures(Model.find(filter), req.query)
    //   .filter()
    //   .sort()
    //   .limitFields()
    //   .paginate();

    // if redis cached
    // console.log(features.query);
    const ids = await getModelCache(Model.modelName, req.query);
    if (ids) {
      console.log('query redis');
      features.query.find({ _id: { $in: JSON.parse(ids) } });
    } else {
      console.log('query mongodb');
      features.filter();
    }

    features
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

    if (!ids) {
      await setModelCache(Model.modelName, req.query, docs, 300);
    }

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });

exports.getOne = (Model, popOtions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOtions) {
      query = query.populate(popOtions);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }
    res.json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc
      }
    });
  });

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError(`No document found with that ID`, 404));
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });
