import pg from 'pg';
const { Pool } = pg;

export async function initializeDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;

  // Only run if we have a real database URL
  if (!DATABASE_URL || DATABASE_URL.includes('placeholder')) {
    console.log('⚠️  No database configured - using in-memory storage');
    console.log('   Set DATABASE_URL environment variable for persistence');
    return;
  }

  console.log('🔄 Initializing AdCreatorPro database schema...');

  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        photo_url TEXT,
        tier VARCHAR(50) DEFAULT 'free',
        stripe_customer_id VARCHAR(255) UNIQUE,
        stripe_subscription_id VARCHAR(255),
        subscription_status VARCHAR(50),
        ads_remaining INTEGER DEFAULT 3,
        ads_generated_total INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');

    // Create ads table (history of generated ads)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_description TEXT NOT NULL,
        platform VARCHAR(100),
        tone VARCHAR(100),
        target_audience TEXT,
        headline VARCHAR(500),
        copy TEXT,
        cta VARCHAR(255),
        hashtags TEXT[],
        ai_model VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Ads table ready');

    // Create payments table (one-time payments and subscription events)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        stripe_payment_intent_id VARCHAR(255),
        stripe_invoice_id VARCHAR(255),
        amount INTEGER NOT NULL,
        currency VARCHAR(10) DEFAULT 'usd',
        payment_type VARCHAR(50),
        status VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Payments table ready');

    // Create usage_logs table (track API usage for billing/limits)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Usage logs table ready');

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
      CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
    `);
    console.log('✅ Database indexes created');

    console.log('🎉 AdCreatorPro database schema initialized successfully!');

  } catch (error: any) {
    console.error('❌ Error initializing database:', error.message);
    console.log('   Continuing with in-memory storage...');
  } finally {
    await pool.end();
  }
}
