import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import database from './database.cjs';
import jwt from 'jsonwebtoken';

const { pool } = database;

// Buscar las variables con o sin prefijo VITE
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || 'your-secret-key';

// Verificar que las variables existan
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('❌ Google OAuth credentials not found!');
  console.error('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
  console.error('GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'Found' : 'Missing');
}

// Configurar Passport con Google
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar si el usuario ya existe
    let user = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (user.rows.length === 0) {
      // Crear nuevo usuario
      const result = await pool.query(
        `INSERT INTO users (email, username, google_id, avatar_url, balance, balance_demo, balance_deposited, balance_winnings) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          profile.emails[0].value,
          profile.displayName,
          profile.id,
          profile.photos[0]?.value,
          0,          // balance (deprecated)
          10000.00,   // balance_demo
          0,          // balance_deposited
          0           // balance_winnings
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

// Función para generar JWT
export function generateJWT(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      balance: user.balance,
      balance_demo: user.balance_demo,
      balance_deposited: user.balance_deposited,
      balance_winnings: user.balance_winnings
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Middleware para verificar JWT
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export { passport };