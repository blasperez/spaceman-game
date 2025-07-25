import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './database.js';
import jwt from 'jsonwebtoken';

const googleClientID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;

if (googleClientID && googleClientSecret) {
  passport.use(new GoogleStrategy({
    clientID: googleClientID,
    clientSecret: googleClientSecret,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await pool.query(
        'SELECT * FROM users WHERE google_id = $1',
        [profile.id]
      );

      if (user.rows.length === 0) {
        const result = await pool.query(
          `INSERT INTO users (email, username, google_id, avatar_url, balance_deposited, balance_winnings, balance_demo) 
           VALUES ($1, $2, $3, $4, 0.00, 0.00, 1000.00) 
           RETURNING *`,
          [
            profile.emails[0].value,
            profile.displayName,
            profile.id,
            profile.photos[0]?.value
          ]
        );
        user = result;
      }

      return done(null, user.rows[0]);
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, user.rows[0]);
    } catch (error) {
      done(error, null);
    }
  });
} else {
  console.warn('⚠️ Google OAuth not configured - missing clientID or clientSecret environment variables');
}

function generateJWT(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      avatar_url: user.avatar_url,
      balance_deposited: user.balance_deposited,
      balance_winnings: user.balance_winnings,
      balance_demo: user.balance_demo
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
}

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export { passport, generateJWT, verifyToken };
