import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool() {
  if (!pool && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name?: string;
  photo_url?: string;
  tier: 'free' | 'starter' | 'pro' | 'business';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  ads_remaining: number;
  ads_generated_total: number;
  created_at: Date;
  updated_at: Date;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  name: string;
  industry?: string;
  description?: string;
  target_audience?: string;
  brand_voice?: string;
  keywords?: string[];
  example_content?: string;
  website_url?: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Ad {
  id: string;
  user_id: string;
  brand_profile_id?: string;
  product_description: string;
  platform?: string;
  tone?: string;
  target_audience?: string;
  headline: string;
  copy: string;
  cta: string;
  hashtags: string[];
  ai_model: string;
  variation_number: number;
  created_at: Date;
}

// User operations
export async function createUser(firebaseUid: string, email: string, displayName?: string): Promise<User | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query(
      `INSERT INTO users (firebase_uid, email, display_name, tier, ads_remaining)
       VALUES ($1, $2, $3, 'free', 3)
       ON CONFLICT (firebase_uid) DO UPDATE
       SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [firebaseUid, email, displayName || null]
    );
    return result.rows[0] as User;
  } catch (error: any) {
    console.error('Error creating user:', error.message);
    return null;
  }
}

export async function getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
    return result.rows[0] as User || null;
  } catch (error: any) {
    console.error('Error getting user:', error.message);
    return null;
  }
}

export async function getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query('SELECT * FROM users WHERE stripe_customer_id = $1', [stripeCustomerId]);
    return result.rows[0] as User || null;
  } catch (error: any) {
    console.error('Error getting user by Stripe customer ID:', error.message);
    return null;
  }
}

export async function updateUserStripeInfo(
  userId: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  subscriptionStatus?: string
): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `UPDATE users
       SET stripe_customer_id = $1, stripe_subscription_id = $2, subscription_status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [stripeCustomerId, stripeSubscriptionId, subscriptionStatus, userId]
    );
    return true;
  } catch (error: any) {
    console.error('Error updating Stripe info:', error.message);
    return false;
  }
}

export async function updateUserTier(userId: string, tier: User['tier']): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    // Update tier and reset ads_remaining based on tier
    let adsRemaining = 3; // free tier default
    if (tier === 'starter') adsRemaining = 30;
    if (tier === 'pro' || tier === 'business') adsRemaining = 999999; // unlimited

    await db.query(
      `UPDATE users
       SET tier = $1, ads_remaining = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [tier, adsRemaining, userId]
    );
    return true;
  } catch (error: any) {
    console.error('Error updating user tier:', error.message);
    return false;
  }
}

export async function decrementAdsRemaining(userId: string): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `UPDATE users
       SET ads_remaining = GREATEST(ads_remaining - 1, 0),
           ads_generated_total = ads_generated_total + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );
    return true;
  } catch (error: any) {
    console.error('Error decrementing ads:', error.message);
    return false;
  }
}

export async function addAdsToUser(userId: string, count: number): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `UPDATE users
       SET ads_remaining = ads_remaining + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [count, userId]
    );
    return true;
  } catch (error: any) {
    console.error('Error adding ads:', error.message);
    return false;
  }
}

export async function setUserAdsRemaining(userId: string, count: number): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `UPDATE users
       SET ads_remaining = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [count, userId]
    );
    return true;
  } catch (error: any) {
    console.error('Error setting ads remaining:', error.message);
    return false;
  }
}

// Brand Profile operations
export async function createBrandProfile(
  userId: string,
  name: string,
  industry?: string,
  description?: string,
  targetAudience?: string,
  brandVoice?: string,
  keywords?: string[],
  exampleContent?: string,
  websiteUrl?: string,
  isDefault?: boolean
): Promise<BrandProfile | null> {
  const db = getPool();
  if (!db) return null;

  try {
    // If this is set as default, unset other defaults first
    if (isDefault) {
      await db.query(
        'UPDATE brand_profiles SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await db.query(
      `INSERT INTO brand_profiles (user_id, name, industry, description, target_audience, brand_voice, keywords, example_content, website_url, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, name, industry, description, targetAudience, brandVoice, keywords || [], exampleContent, websiteUrl, isDefault || false]
    );
    return result.rows[0] as BrandProfile;
  } catch (error: any) {
    console.error('Error creating brand profile:', error.message);
    return null;
  }
}

export async function getBrandProfiles(userId: string): Promise<BrandProfile[]> {
  const db = getPool();
  if (!db) return [];

  try {
    const result = await db.query(
      'SELECT * FROM brand_profiles WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return result.rows as BrandProfile[];
  } catch (error: any) {
    console.error('Error getting brand profiles:', error.message);
    return [];
  }
}

export async function getBrandProfileById(userId: string, profileId: string): Promise<BrandProfile | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query(
      'SELECT * FROM brand_profiles WHERE id = $1 AND user_id = $2',
      [profileId, userId]
    );
    return result.rows[0] as BrandProfile || null;
  } catch (error: any) {
    console.error('Error getting brand profile:', error.message);
    return null;
  }
}

export async function updateBrandProfile(
  userId: string,
  profileId: string,
  updates: Partial<Omit<BrandProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<BrandProfile | null> {
  const db = getPool();
  if (!db) return null;

  try {
    // If setting as default, unset other defaults first
    if (updates.is_default) {
      await db.query(
        'UPDATE brand_profiles SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(profileId, userId);

    const result = await db.query(
      `UPDATE brand_profiles SET ${fields.join(', ')}
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values
    );
    return result.rows[0] as BrandProfile || null;
  } catch (error: any) {
    console.error('Error updating brand profile:', error.message);
    return null;
  }
}

export async function deleteBrandProfile(userId: string, profileId: string): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      'DELETE FROM brand_profiles WHERE id = $1 AND user_id = $2',
      [profileId, userId]
    );
    return true;
  } catch (error: any) {
    console.error('Error deleting brand profile:', error.message);
    return false;
  }
}

export async function getDefaultBrandProfile(userId: string): Promise<BrandProfile | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query(
      'SELECT * FROM brand_profiles WHERE user_id = $1 AND is_default = true LIMIT 1',
      [userId]
    );
    return result.rows[0] as BrandProfile || null;
  } catch (error: any) {
    console.error('Error getting default brand profile:', error.message);
    return null;
  }
}

// Ad operations
export async function saveAd(
  userId: string,
  productDescription: string,
  platform: string,
  tone: string,
  targetAudience: string,
  headline: string,
  copy: string,
  cta: string,
  hashtags: string[],
  aiModel: string,
  brandProfileId?: string,
  variationNumber?: number
): Promise<Ad | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query(
      `INSERT INTO ads (user_id, brand_profile_id, product_description, platform, tone, target_audience, headline, copy, cta, hashtags, ai_model, variation_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [userId, brandProfileId || null, productDescription, platform, tone, targetAudience, headline, copy, cta, hashtags, aiModel, variationNumber || 1]
    );
    return result.rows[0] as Ad;
  } catch (error: any) {
    console.error('Error saving ad:', error.message);
    return null;
  }
}

export async function getUserAds(userId: string, limit = 50): Promise<Ad[]> {
  const db = getPool();
  if (!db) return [];

  try {
    const result = await db.query(
      'SELECT * FROM ads WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows as Ad[];
  } catch (error: any) {
    console.error('Error getting user ads:', error.message);
    return [];
  }
}

// Payment operations
export async function recordPayment(
  userId: string,
  amount: number,
  paymentType: 'subscription' | 'one_time',
  stripePaymentIntentId?: string,
  status?: string,
  metadata?: any
): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `INSERT INTO payments (user_id, stripe_payment_intent_id, amount, payment_type, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, stripePaymentIntentId, amount, paymentType, status || 'completed', metadata]
    );
    return true;
  } catch (error: any) {
    console.error('Error recording payment:', error.message);
    return false;
  }
}

// Usage logging
export async function logUsage(
  userId: string,
  action: string,
  resource?: string,
  metadata?: any
): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      'INSERT INTO usage_logs (user_id, action, resource, metadata) VALUES ($1, $2, $3, $4)',
      [userId, action, resource, metadata]
    );
    return true;
  } catch (error: any) {
    console.error('Error logging usage:', error.message);
    return false;
  }
}
