const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

router.get('/profile', authenticate, userController.getProfile);

module.exports = router;
