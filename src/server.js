const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: 'config.env' });
// console.log(process.env.DATABASE_USERNAME);
const app = require('./app');
// console.log(app.get('env'));
// console.log(process.env.NODE_ENV);

const DB = process.env.DATABASE_STRING.replace(
  '<USERNAME>',
  process.env.DATABASE_USERNAME
).replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  // .connect(DATABASE_STRING_LOCAL, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    //console.log(con.connection);
    console.log('DB Connected Successfully');
  })
  .catch(err => {
    console.log(err.name, err.message);
  });

const port = process.env.PORT || 9527;
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

