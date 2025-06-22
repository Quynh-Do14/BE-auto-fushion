const userModel = require('../models/user.model');

const getProfile = async (req, res) => {
  try {
    const user = await userModel.findUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = { getProfile };
