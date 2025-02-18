const { Clerk } = require('@clerk/clerk-sdk-node');
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

const verifyClerkToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const session = await clerk.sessions.verifyToken(token);
    req.session = session;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = verifyClerkToken;