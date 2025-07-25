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
console.log('🔐 Google OAuth Config:');
console.log('Client ID:', GOOGLE_CLIENT_ID ? '✅ Found' : '❌ Missing');
console.log('Client Secret:', GOOGLE_CLIENT_SECRET ? '✅ Found' : '❌ Missing');

// Configurar Passport con Google
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('📧 Google profile received:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      displayName: profile.displayName
    });

    const email = profile.emails?.[0]?.value;
    if (!email) {
      console.error('❌ No email found in Google profile');
      return done(new Error('No email found'), null);
    }

    // Buscar si el usuario ya existe por email
    let user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      console.log('👤 Creating new user...');
      
      // Generar username único si no hay displayName
      const username = profile.displayName || `user_${profile.id.substring(0, 8)}`;
      
      try {
        const result = await pool.query(
          `INSERT INTO users (email, username, full_name, balance) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [
            email,
            username,
            profile.displayName || username,
            1000.00
          ]
        );
        user = result;
        console.log('✅ User created successfully:', user.rows[0].id);
      } catch (dbError) {
        console.error('❌ Database error details:', dbError);
        
        // Si el error es por username duplicado, intentar con uno diferente
        if (dbError.code === '23505' && dbError.constraint === 'users_username_key') {
          const uniqueUsername = `${username}_${Date.now()}`;
          console.log('🔄 Retrying with unique username:', uniqueUsername);
          
          const result = await pool.query(
            `INSERT INTO users (email, username, full_name, balance) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [
              email,
              uniqueUsername,
              profile.displayName || uniqueUsername,
              1000.00
            ]
          );
          user = result;
          console.log('✅ User created with unique username');
        } else {
          throw dbError;
        }
      }
    } else {
      console.log('✅ Existing user found:', user.rows[0].id);
    }

    return done(null, user.rows[0]);
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
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