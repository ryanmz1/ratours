const mongoose = require('mongoose');

const { exec } = mongoose.Query.prototype;

mongoose.Query.prototype.exec = function() {
  console.log('customMongoose works');
  return exec.apply(this, arguments);
};
