const redis = require('redis');
// const catchAsync = require('./catchAsync');

const redisCli = redis.createClient(process.env.REDIS_STRING);

const generateKey = (model, query) => {
  // const queryStr = JSON.stringify(query);
  const key = {
    model,
    query
  };
  return JSON.stringify(key);
};

const getModelCache = async (modelName, query) => {
  // let cached;
  try {
    const key = generateKey(modelName, query);
    console.log(key);
    await redisCli.connect();
    const ids = await redisCli.GET(key);
    await redisCli.quit();
    return ids;
  } catch (error) {
    throw error;
  }
};

const setModelCache = async (modelName, query, docs, expire) => {
  try {
    // console.log(docs[0].validate);
    const key = generateKey(modelName, query);
    console.log(key);
    await redisCli.connect();
    await redisCli.SET(key, JSON.stringify(docs.map(doc => doc.id)));
    await redisCli.EXPIRE(key, expire);
    await redisCli.quit();
  } catch (error) {
    throw error;
  }
};

exports.redisCli = redisCli;

exports.getModelCache = getModelCache;

exports.setModelCache = setModelCache;
