const User = require('../models/authModel');

module.exports.getFriends = async (req, res) => {
  try {
    const myId = req.myId;
    const friendGet = await User.find({});
    const filter = friendGet.filter((d) => d.id !== myId);
    res.status(200).json({ success: true, friends: filter });
  } catch (error) {
    res.status(500).json({
      error: {
        errorMessage: 'Internal Sever Error',
      },
    });
  }
};
