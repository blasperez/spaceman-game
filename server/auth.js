import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import database from './database.cjs';
import jwt from 'jsonwebtoken';

const { pool } = database;

// Buscar las variables con o sin prefijo VITE
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || 'your-secret-key';

// Configurar Passport con Google
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar si el usuario ya existe por email
    let user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [profile.emails[0].value]
    );

    if (user.rows.length === 0) {
      // Crear nuevo usuario
      const result = await pool.query(
        `INSERT INTO users (email, username, full_name, balance) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          profile.emails[0].value,
          profile.displayName || profile.emails[0].value.split('@')[0], // username desde displayName o email
          profile.displayName,
          1000.00 // Balance inicial
        ]
      );
      user = result;
    }

    return done(null, user.rows[0]);
  } catch (error) {
    console.error('Error en Google OAuth:', error);
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
      balance: user.balance
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