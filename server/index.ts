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

// ==================== BRAND PROFILE ROUTES ====================

// Create brand profile
app.post('/api/brand-profiles', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, industry, description, targetAudience, brandVoice, keywords, exampleContent, websiteUrl, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    const profile = await db.createBrandProfile(
      user.id,
      name,
      industry,
      description,
      targetAudience,
      brandVoice,
      keywords,
      exampleContent,
      websiteUrl,
      isDefault
    );

    if (!profile) {
      return res.status(500).json({ error: 'Failed to create brand profile' });
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Create brand profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all brand profiles for user
app.get('/api/brand-profiles', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profiles = await db.getBrandProfiles(user.id);
    res.json(profiles);
  } catch (error: any) {
    console.error('Get brand profiles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single brand profile
app.get('/api/brand-profiles/:id', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await db.getBrandProfileById(user.id, req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Brand profile not found' });
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Get brand profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update brand profile
app.put('/api/brand-profiles/:id', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = req.body;
    const profile = await db.updateBrandProfile(user.id, req.params.id, updates);

    if (!profile) {
      return res.status(404).json({ error: 'Brand profile not found or no changes made' });
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Update brand profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete brand profile
app.delete('/api/brand-profiles/:id', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const success = await db.deleteBrandProfile(user.id, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Brand profile not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete brand profile error:', error);
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

// Create checkout session for one-time ad purchase
app.post('/api/stripe/create-payment-checkout', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { quantity = 1 } = req.body; // Number of ads to purchase

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or use Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      await db.updateUserStripeInfo(user.id, customerId, null, null);
    }

    // $1.99 per ad, with discount for 5+ ads
    const pricePerAd = quantity >= 5 ? 199 : 199; // Can add discounts here
    const amount = pricePerAd * quantity;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Ad Generation Credits`,
              description: `${quantity} ad generation ${quantity === 1 ? 'credit' : 'credits'}`,
            },
            unit_amount: pricePerAd,
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
      metadata: {
        userId: user.id,
        quantity: quantity.toString(),
        type: 'one_time_ad'
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Payment checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create customer portal session
app.post('/api/stripe/create-portal-session', authenticateUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await db.getUserByFirebaseUid(req.user.uid);
    if (!user || !user.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('⚠️  Webhook secret not configured - skipping verification');
    return res.status(400).send('Webhook secret not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`✅ Webhook received: ${event.type}`);

    switch (event.type) {
      // Subscription created/updated
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;
        const paymentType = session.metadata?.type;

        console.log(`Processing checkout completion for user ${userId}`);

        // Handle subscription checkout
        if (userId && tier && session.mode === 'subscription') {
          console.log(`Activating ${tier} subscription for user ${userId}`);

          await db.updateUserTier(userId, tier as any);
          await db.updateUserStripeInfo(
            userId,
            session.customer as string,
            session.subscription as string,
            'active'
          );

          await db.recordPayment(
            userId,
            session.amount_total || 0,
            'subscription',
            session.id,
            'succeeded'
          );
        }

        // Handle one-time payment checkout
        if (userId && paymentType === 'one_time_ad' && session.mode === 'payment') {
          const quantity = parseInt(session.metadata?.quantity || '1');
          console.log(`Adding ${quantity} ads to user ${userId}`);

          await db.addAdsToUser(userId, quantity);
          await db.recordPayment(
            userId,
            session.amount_total || 0,
            'one_time',
            session.id,
            'succeeded'
          );
        }
        break;
      }

      // Subscription updated (plan change, etc.)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription updated for customer ${customerId}`);

        // Find user by stripe_customer_id
        const user = await db.getUserByStripeCustomerId(customerId);
        if (user) {
          const status = subscription.status === 'active' ? 'active' :
                        subscription.status === 'canceled' ? 'canceled' :
                        subscription.status;

          await db.updateUserStripeInfo(
            user.id,
            customerId,
            subscription.id,
            status
          );

          // If subscription becomes active, ensure user has correct tier
          if (subscription.status === 'active') {
            // Determine tier from subscription price
            const priceId = subscription.items.data[0]?.price.id;
            const tierMap: Record<string, string> = {
              [process.env.STRIPE_PRICE_STARTER || 'starter']: 'starter',
              [process.env.STRIPE_PRICE_PRO || 'pro']: 'pro',
              [process.env.STRIPE_PRICE_BUSINESS || 'business']: 'business'
            };
            const tier = tierMap[priceId];
            if (tier) {
              await db.updateUserTier(user.id, tier as any);
            }
          }
        }
        break;
      }

      // Subscription deleted/canceled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Subscription canceled for customer ${customerId}`);

        const user = await db.getUserByStripeCustomerId(customerId);
        if (user) {
          // Downgrade to free tier
          await db.updateUserTier(user.id, 'free');
          await db.updateUserStripeInfo(
            user.id,
            customerId,
            subscription.id,
            'canceled'
          );
        }
        break;
      }

      // Invoice payment succeeded (for recurring subscriptions)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        console.log(`Invoice paid for customer ${customerId}`);

        if (subscriptionId) {
          const user = await db.getUserByStripeCustomerId(customerId);
          if (user) {
            await db.recordPayment(
              user.id,
              invoice.amount_paid,
              'subscription',
              invoice.id,
              'succeeded'
            );

            // Reset monthly ads for subscription users
            if (user.tier === 'starter') {
              await db.setUserAdsRemaining(user.id, 30);
            } else if (user.tier === 'pro' || user.tier === 'business') {
              await db.setUserAdsRemaining(user.id, 999999); // Unlimited
            }
          }
        }
        break;
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`❌ Invoice payment failed for customer ${customerId}`);

        const user = await db.getUserByStripeCustomerId(customerId);
        if (user) {
          await db.recordPayment(
            user.id,
            invoice.amount_due,
            'subscription',
            invoice.id,
            'failed'
          );
          // Consider sending an email notification here
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// ==================== AD GENERATION ROUTES ====================

// Generate ad copy (with auth, brand profiles, and multi-variation support)
app.post('/api/generate-ad', optionalAuth, async (req, res) => {
  try {
    const { product, platform, tone, targetAudience, brandProfileId, variationsCount = 3 } = req.body;

    if (!product) {
      return res.status(400).json({ error: 'Product description is required' });
    }

    // Check if user is authenticated and has credits
    let user = null;
    let brandProfile = null;

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

        // Fetch brand profile if provided
        if (brandProfileId) {
          brandProfile = await db.getBrandProfileById(user.id, brandProfileId);
        }
      }
    }

    // Build brand context if brand profile exists
    let brandContext = '';
    if (brandProfile) {
      brandContext = `
BRAND CONTEXT:
Brand Name: ${brandProfile.name}
${brandProfile.industry ? `Industry: ${brandProfile.industry}` : ''}
${brandProfile.description ? `Brand Description: ${brandProfile.description}` : ''}
${brandProfile.target_audience ? `Target Audience: ${brandProfile.target_audience}` : ''}
${brandProfile.brand_voice ? `Brand Voice: ${brandProfile.brand_voice}` : ''}
${brandProfile.keywords && brandProfile.keywords.length > 0 ? `Key Themes: ${brandProfile.keywords.join(', ')}` : ''}
${brandProfile.example_content ? `Style Reference: ${brandProfile.example_content}` : ''}

Use this brand context to ensure consistency and authenticity in the ad copy.`;
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
Tone: ${tone || (brandProfile?.brand_voice || 'Professional')}
Target Audience: ${targetAudience || (brandProfile?.target_audience || 'General audience')}
${brandContext}
${platformPrompt}

${outputFormat}

IMPORTANT: Generate ${variationsCount} DIFFERENT variations. Each should be unique with different angles, hooks, or approaches while maintaining brand consistency.
Return as JSON array: [{ variation1 }, { variation2 }, { variation3 }]`;

    const completion = await openai.chat.completions.create({
      model: user?.tier === 'pro' || user?.tier === 'business' ? 'gpt-4' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert advertising copywriter specializing in high-converting ad copy. Create compelling, engaging ad content that drives conversions. Always return valid JSON arrays for multiple variations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9, // Higher temperature for more variety
      max_tokens: 1500 // More tokens for multiple variations
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse as JSON array of variations
    let variations: any[] = [];
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        variations = JSON.parse(jsonMatch[0]);
      } else {
        // Try single object format
        const objMatch = response.match(/\{[\s\S]*\}/);
        if (objMatch) {
          variations = [JSON.parse(objMatch[0])];
        } else {
          throw new Error('No JSON found');
        }
      }
    } catch (parseError) {
      // Fallback: create single variation from text
      const lines = response.split('\n').filter(l => l.trim());
      variations = [{
        headline: lines.find(l => l.includes('headline'))?.split(':')[1]?.trim() || lines[0],
        copy: lines.find(l => l.toLowerCase().includes('copy'))?.split(':')[1]?.trim() || lines[1],
        cta: lines.find(l => l.toLowerCase().includes('cta') || l.toLowerCase().includes('call'))?.split(':')[1]?.trim() || 'Learn More',
        hashtags: lines.filter(l => l.includes('#')).map(l => l.trim())
      }];
    }

    // Ensure we have at least one variation
    if (!variations || variations.length === 0) {
      throw new Error('Failed to generate variations');
    }

    // Save all variations and decrement credits for authenticated users
    if (user) {
      const aiModel = user.tier === 'pro' || user.tier === 'business' ? 'gpt-4' : 'gpt-3.5-turbo';

      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        await db.saveAd(
          user.id,
          product,
          platform || 'General',
          tone || 'Professional',
          targetAudience || '',
          variation.headline || variation.hook || variation.title || '',
          variation.copy || variation.problem || (Array.isArray(variation.bullets) ? variation.bullets.join(' ') : '') || '',
          variation.cta || 'Learn More',
          Array.isArray(variation.hashtags) ? variation.hashtags : (Array.isArray(variation.keywords) ? variation.keywords : []),
          aiModel,
          brandProfileId || undefined,
          i + 1 // variation_number
        );
      }

      // Only decrement once for the entire set of variations
      await db.decrementAdsRemaining(user.id);
      await db.logUsage(user.id, 'generate_ad_multi', platform);

      // Include updated ads_remaining in response
      const updatedUser = await db.getUserByFirebaseUid(req.user!.uid);
      const adsRemaining = updatedUser?.ads_remaining || 0;

      return res.json({
        variations,
        adsRemaining,
        count: variations.length
      });
    }

    // For non-authenticated users
    return res.json({
      variations,
      count: variations.length
    });

  } catch (error: any) {
    console.error('Error generating ad variations:', error);
    res.status(500).json({
      error: 'Failed to generate ad variations',
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
