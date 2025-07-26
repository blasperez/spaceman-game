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

    // Buscar si el usuario ya existe
    let user = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [email, profile.id]
    );

    if (user.rows.length === 0) {
      console.log('👤 Creating new user...');
      
      // Generar username único
      const baseUsername = profile.displayName 
        ? profile.displayName.replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '')
        : email.split('@')[0].replace(/[^a-z0-9_]/g, '_').toLowerCase();
      
      let username = baseUsername || `user_${Date.now()}`;
      
      // Asegurar que el username es único
      let attempts = 0;
      while (attempts < 10) {
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE username = $1', 
          [username]
        );
        if (existingUser.rows.length === 0) break;
        attempts++;
        username = `${baseUsername}_${Date.now()}`;
      }
      
      try {
        const result = await pool.query(
          `INSERT INTO users (
            email, 
            username, 
            google_id,
            full_name,
            avatar_url,
            balance,
            balance_demo,
            balance_deposited,
            balance_winnings
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *`,
          [
            email,
            username,
            profile.id,
            profile.displayName || username,
            profile.photos?.[0]?.value || null,
            1000.00,      // balance inicial
            10000.00,     // balance_demo (ya tiene default pero lo ponemos explícito)
            0,            // balance_deposited
            0             // balance_winnings
          ]
        );
        
        user = result;
        console.log('✅ User created successfully:', {
          id: user.rows[0].id,
          email: user.rows[0].email,
          username: user.rows[0].username
        });
        
      } catch (dbError) {
        console.error('❌ Database insert error:', {
          message: dbError.message,
          code: dbError.code,
          detail: dbError.detail,
          constraint: dbError.constraint
        });
        throw dbError;
      }
    } else {
      console.log('✅ Existing user found:', user.rows[0].id);
      
      // Si existe pero no tiene google_id, actualizarlo
      if (!user.rows[0].google_id && user.rows[0].email === email) {
        await pool.query(
          'UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3',
          [profile.id, profile.photos?.[0]?.value, user.rows[0].id]
        );
        
        // Recargar el usuario actualizado
        user = await pool.query('SELECT * FROM users WHERE id = $1', [user.rows[0].id]);
        console.log('✅ Updated google_id for existing user');
      }
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
      balance: parseFloat(user.balance) || 0,
      balance_demo: parseFloat(user.balance_demo) || 10000,
      balance_deposited: parseFloat(user.balance_deposited) || 0,
      balance_winnings: parseFloat(user.balance_winnings) || 0
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