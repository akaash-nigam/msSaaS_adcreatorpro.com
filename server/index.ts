import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import Stripe from 'stripe';
import { initializeDatabase } from './db-init.js';
import { initializeFirebase, authenticateUser, optionalAuth } from './auth-middleware.js';
import * as db from './db-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase Admin
initializeFirebase();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder-key'
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'placeholder-key', {
  apiVersion: '2024-12-18.acacia'
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AdCreatorPro' });
});

// ==================== AUTH ROUTES ====================

// Create or get user profile
app.post('/api/auth/register', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { displayName } = req.body;
    const user = await db.createUser(req.user.uid, req.user.email || '', displayName);

    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.getUserByFirebaseUid(req.user.uid);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's ad history
app.get('/api/user/ads', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ads = await db.getUserAds(user.id);
    res.json(ads);
  } catch (error: any) {
    console.error('Get ads error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== STRIPE ROUTES ====================

// Create Stripe checkout session for subscription
app.post('/api/stripe/create-checkout-session', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tier } = req.body; // 'starter' or 'pro' or 'business'

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Price IDs for different tiers
    const priceIds: Record<string, string> = {
      starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
      pro: process.env.STRIPE_PRICE_PRO || 'price_pro',
      business: process.env.STRIPE_PRICE_BUSINESS || 'price_business'
    };

    const session = await stripe.checkout.sessions.create({
      customer: user.stripe_customer_id || undefined,
      customer_email: !user.stripe_customer_id ? user.email : undefined,
      line_items: [
        {
          price: priceIds[tier],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
      metadata: {
        userId: user.id,
        tier: tier
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create payment intent for one-time ad purchase
app.post('/api/stripe/create-payment-intent', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { quantity = 1 } = req.body; // Number of ads to purchase

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // $1.99 per ad
    const amount = 199 * quantity;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: user.stripe_customer_id || undefined,
      metadata: {
        userId: user.id,
        quantity: quantity.toString(),
        type: 'one_time_ad'
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(400).send('Webhook secret not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;

        if (userId && tier) {
          await db.updateUserTier(userId, tier as any);
          await db.updateUserStripeInfo(
            userId,
            session.customer as string,
            session.subscription as string,
            'active'
          );
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata?.userId;
        const quantity = parseInt(paymentIntent.metadata?.quantity || '1');

        if (userId) {
          await db.addAdsToUser(userId, quantity);
          await db.recordPayment(userId, paymentIntent.amount, 'one_time', paymentIntent.id, 'succeeded');
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // Update subscription status
        // You'd need to query user by stripe_customer_id to update
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ==================== AD GENERATION ROUTES ====================

// Generate ad copy (with auth and usage tracking)
app.post('/api/generate-ad', optionalAuth, async (req, res) => {
  try {
    const { product, platform, tone, targetAudience } = req.body;

    if (!product) {
      return res.status(400).json({ error: 'Product description is required' });
    }

    // Check if user is authenticated and has credits
    let user = null;
    if (req.user) {
      user = await db.getUserByFirebaseUid(req.user.uid);

      if (user) {
        // Check if user has ads remaining
        if (user.ads_remaining <= 0) {
          return res.status(403).json({
            error: 'No ads remaining',
            message: 'Please purchase more ads or upgrade your subscription'
          });
        }
      }
    }

    // Platform-specific optimization
    let platformPrompt = '';

    // Instagram & Pinterest (visual platforms)
    if (platform?.toLowerCase().includes('instagram') || platform?.toLowerCase().includes('pinterest')) {
      platformPrompt = `
INSTAGRAM/PINTEREST-SPECIFIC REQUIREMENTS:
- Use visual, emotion-driven language
- Include emojis naturally (1-2 max)
- Focus on lifestyle and aspiration
- Keep copy conversational and authentic
- Hashtags should be trending and niche-specific
- Consider the visual-first nature of the platform`;
    }

    // YouTube video ad scripts
    else if (platform?.toLowerCase().includes('youtube')) {
      platformPrompt = `
YOUTUBE VIDEO AD SCRIPT REQUIREMENTS:
- Create a 15-30 second video ad script
- Structure: Hook (0-3s) → Problem (3-8s) → Solution (8-20s) → CTA (20-30s)
- Hook must grab attention immediately ("Stop scrolling if...")
- Address viewer pain point directly
- Present product as natural solution
- Clear, actionable call-to-action
- Conversational, like talking to a friend
- Include visual cues in [brackets] for creator
- Keep it punchy and fast-paced`;
    }

    // Amazon product listings
    else if (platform?.toLowerCase().includes('amazon')) {
      platformPrompt = `
AMAZON PRODUCT LISTING REQUIREMENTS:
- Create keyword-optimized product title (150-200 characters)
- Focus on benefits, not just features
- Include 5 bullet points highlighting key benefits
- Use power words: Premium, Professional, Durable, Easy, etc.
- Address customer pain points
- SEO-optimized for Amazon A9 algorithm
- Clear value proposition
- Build trust and credibility
- Professional but persuasive tone`;
    }

    // Create a prompt for ad generation
    let outputFormat = '';

    if (platform?.toLowerCase().includes('youtube')) {
      outputFormat = `
Generate a YouTube video ad script with these sections:
1. Hook (attention-grabbing opening, 3-5 seconds)
2. Problem (viewer pain point, 5-10 seconds)
3. Solution (your product solves it, 10-15 seconds)
4. CTA (clear call-to-action, 3-5 seconds)

Format as JSON: { "hook": "...", "problem": "...", "solution": "...", "cta": "..." }`;
    } else if (platform?.toLowerCase().includes('amazon')) {
      outputFormat = `
Generate an Amazon product listing with:
1. Title: Keyword-optimized product title (150-200 characters)
2. Bullet points: 5 benefit-focused bullet points (each 150-200 characters)
3. Description: Compelling product description (250 characters)
4. Keywords: 5-7 search keywords for SEO

Format as JSON: { "title": "...", "bullets": ["...", "...", "...", "...", "..."], "description": "...", "keywords": ["...", "...", "..."] }`;
    } else {
      outputFormat = `
Generate:
1. A catchy headline (max 60 characters)
2. Primary ad copy (max 150 characters for social media, max 90 for Google Ads)
3. Call-to-action text
4. 3-5 relevant, high-performing hashtags

Format as JSON: { "headline": "...", "copy": "...", "cta": "...", "hashtags": ["...", "..."] }`;
    }

    const prompt = `Create a compelling ${platform || 'social media'} advertisement for the following product/service:

Product: ${product}
Platform: ${platform || 'General'}
Tone: ${tone || 'Professional'}
Target Audience: ${targetAudience || 'General audience'}
${platformPrompt}

${outputFormat}`;

    const completion = await openai.chat.completions.create({
      model: user?.tier === 'pro' || user?.tier === 'business' ? 'gpt-4' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert advertising copywriter specializing in high-converting ad copy. Create compelling, engaging ad content that drives conversions. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse as JSON, fallback to structured text
    let adContent: any;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        adContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      // Fallback: parse the text response
      const lines = response.split('\n').filter(l => l.trim());
      adContent = {
        headline: lines.find(l => l.includes('headline'))?.split(':')[1]?.trim() || lines[0],
        copy: lines.find(l => l.toLowerCase().includes('copy'))?.split(':')[1]?.trim() || lines[1],
        cta: lines.find(l => l.toLowerCase().includes('cta') || l.toLowerCase().includes('call'))?.split(':')[1]?.trim() || 'Learn More',
        hashtags: lines.filter(l => l.includes('#')).map(l => l.trim())
      };
    }

    // Save ad and decrement credits for authenticated users
    if (user) {
      await db.saveAd(
        user.id,
        product,
        platform || 'General',
        tone || 'Professional',
        targetAudience || '',
        adContent.headline,
        adContent.copy,
        adContent.cta,
        Array.isArray(adContent.hashtags) ? adContent.hashtags : [],
        user.tier === 'pro' || user.tier === 'business' ? 'gpt-4' : 'gpt-3.5-turbo'
      );
      await db.decrementAdsRemaining(user.id);
      await db.logUsage(user.id, 'generate_ad', platform);

      // Include updated ads_remaining in response
      const updatedUser = await db.getUserByFirebaseUid(req.user!.uid);
      adContent.adsRemaining = updatedUser?.ads_remaining || 0;
    }

    return res.json(adContent);

  } catch (error: any) {
    console.error('Error generating ad:', error);
    res.status(500).json({
      error: 'Failed to generate ad',
      message: error.message
    });
  }
});

// Ad templates
app.get('/api/templates', (_req, res) => {
  const templates = [
    {
      id: 1,
      name: 'Social Media Post',
      platform: 'Facebook/Instagram/Pinterest',
      dimensions: '1080x1080',
      description: 'Square format perfect for social feeds'
    },
    {
      id: 2,
      name: 'Instagram/Pinterest Story',
      platform: 'Instagram/Pinterest',
      dimensions: '1080x1920',
      description: 'Vertical format for stories and pins'
    },
    {
      id: 3,
      name: 'YouTube Video Ad',
      platform: 'YouTube',
      dimensions: '1920x1080',
      description: 'Video ad script (15-30 seconds)'
    },
    {
      id: 4,
      name: 'Amazon Product Listing',
      platform: 'Amazon',
      dimensions: 'N/A',
      description: 'Complete product listing with title, bullets, and description'
    },
    {
      id: 5,
      name: 'Facebook Ad',
      platform: 'Facebook',
      dimensions: '1200x628',
      description: 'Optimized for Facebook news feed'
    },
    {
      id: 6,
      name: 'Google Display Ad',
      platform: 'Google Ads',
      dimensions: '728x90',
      description: 'Leaderboard banner format'
    },
    {
      id: 7,
      name: 'LinkedIn Post',
      platform: 'LinkedIn',
      dimensions: '1200x627',
      description: 'Professional network format'
    },
    {
      id: 8,
      name: 'Twitter Card',
      platform: 'Twitter/X',
      dimensions: '1200x675',
      description: 'Optimized for Twitter cards'
    },
    {
      id: 9,
      name: 'TikTok Ad',
      platform: 'TikTok',
      dimensions: '1080x1920',
      description: 'Vertical video ad for TikTok'
    }
  ];

  res.json(templates);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

// Initialize database and start server
(async () => {
  try {
    // Initialize database schema if using Cloud SQL
    await initializeDatabase();

    app.listen(port, () => {
      console.log(`🚀 AdCreatorPro server running on port ${port}`);
      console.log(`📝 API endpoint: http://localhost:${port}/api`);
      console.log(`🔐 Authentication: Firebase`);
      console.log(`💳 Payments: Stripe`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
