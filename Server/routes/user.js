const express = require('express');
const router = express.Router();
const { Clerk } = require('@clerk/clerk-sdk-node');
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

router.post('/create-user', async (req, res) => {
  const { emailAddress, password } = req.body;

  try {
    const user = await clerk.users.createUser({
      emailAddress,
      password,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;