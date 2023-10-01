const express = require('express');

const router = express.Router();
const {
  signup,
  login,
  protect,
  restrictTo,
  forgetPassword,
  resetPassword,
  updatePassword
} = require('../controllers/authController');
const {
  getAllUser,
  getUser,
  updateUser,
  deleteUser,
  updateProfile,
  deleteMe,
  setUserId
} = require('../controllers/userController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgetPassword', forgetPassword);
router.patch('/resetPassword/:token', resetPassword);

// protect all routes after this line
router.use(protect);

router.patch('/updatePassword', updatePassword);

router.get('/getMe', setUserId, getUser);
router.patch('/updateProfile', updateProfile);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin'));

router.route('/').get(getAllUser);
// .post(createUser);
router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
