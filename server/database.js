// server/database.js - Convertido a ES modules
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Crear tablas
async function initDB() {
  try {
    // Tabla de usuarios actualizada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        username VARCHAR(100) NOT NULL,
        google_id VARCHAR(255) UNIQUE,
        avatar_url TEXT,
        balance_deposited DECIMAL(10, 2) DEFAULT 0.00,
        balance_winnings DECIMAL(10, 2) DEFAULT 0.00,
        balance_demo DECIMAL(10, 2) DEFAULT 1000.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Tabla de historial de juegos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        game_id VARCHAR(100),
        bet_amount DECIMAL(10,2),
        multiplier DECIMAL(10,2),
        win_amount DECIMAL(10,2),
        is_demo BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Tabla de transacciones (para depósitos y otros movimientos)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal_fee', etc.
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        stripe_charge_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Tabla de retiros
    await pool.query(`
        CREATE TABLE IF NOT EXISTS withdrawals (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
            withdrawal_method VARCHAR(100), -- e.g., 'Bank Transfer'
            withdrawal_details TEXT, -- e.g., JSON with bank info
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('✅ Database tables updated or created successfully');
  } catch (error) {
    console.error('Error creating/updating tables:', error);
  }
}

// Exportar usando ES modules
export { pool, initDB };