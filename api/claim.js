const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const app = express();

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Initialize User
app.post('/initialize', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const existingUser = await User.findOne({ userId });
  if (existingUser) {
    return res.status(400).json({ message: 'User already initialized.' });
  }

  const newUser = new User({ userId });
  await newUser.save();
  res.status(201).json({ message: 'User initialized with 9000 tokens.' });
});

// Claim Tokens
app.post('/claim', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const user = await User.findOne({ userId });
  if (!user) {
    return res.status(400).json({ error: 'User not found. Please initialize first.' });
  }

  const now = new Date();
  const lastClaimed = user.lastClaimed;

  if (!lastClaimed || now - lastClaimed >= 24 * 60 * 60 * 1000) {
    user.tokens += 1000;
    user.lastClaimed = now;
    await user.save();
    return res.json({ message: 'Tokens claimed successfully!', tokens: user.tokens });
  } else {
    const remainingTime = 24 * 60 * 60 * 1000 - (now - lastClaimed);
    return res.status(400).json({
      message: `You can only claim tokens once every 24 hours. Please wait ${Math.ceil(
        remainingTime / 60000
      )} minutes.`,
    });
  }
});

// Default Export
module.exports = app;
