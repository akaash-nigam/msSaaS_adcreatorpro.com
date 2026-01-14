# AdCreatorPro API Documentation

Base URL: `https://your-domain.com` (replace with your Cloud Run URL or custom domain)

All API endpoints are prefixed with `/api`

## Authentication

Most endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

Get the ID token from Firebase client SDK:
```javascript
const token = await firebase.auth().currentUser.getIdToken();
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message description"
}
```

## Rate Limiting

- Guest users: 10 ad generations per day
- Free tier: 3 ads total
- Starter tier: 30 ads per month
- Pro/Business tier: Unlimited ads

## Endpoints

### Health Check

#### GET `/api/health`

Check if the API is running.

**Authentication:** None

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production"
}
```

---

### Authentication

#### POST `/api/auth/register`

Register a new user in the database after Firebase signup.

**Authentication:** Required (Firebase ID token)

**Request Body:**
```json
{
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "id": "firebase-uid-123",
  "email": "user@example.com",
  "display_name": "John Doe",
  "tier": "free",
  "ads_remaining": 3,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Codes:**
- `400` - Missing displayName
- `409` - User already exists
- `500` - Database error

---

### User Management

#### GET `/api/user/profile`

Get the authenticated user's profile.

**Authentication:** Required

**Response:**
```json
{
  "id": "firebase-uid-123",
  "email": "user@example.com",
  "display_name": "John Doe",
  "tier": "starter",
  "ads_remaining": 25,
  "stripe_customer_id": "cus_xxxxx",
  "subscription_id": "sub_xxxxx",
  "subscription_status": "active",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Codes:**
- `401` - Unauthorized (invalid token)
- `404` - User not found
- `500` - Server error

---

#### GET `/api/user/ads`

Get the authenticated user's ad generation history.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of ads to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "ads": [
    {
      "id": "ad-uuid-123",
      "user_id": "firebase-uid-123",
      "brand_profile_id": "brand-uuid-456",
      "product_description": "Premium coffee beans",
      "platform": "Instagram",
      "tone": "Casual",
      "target_audience": "Coffee enthusiasts",
      "headline": "Wake Up to Premium Coffee",
      "copy": "Start your morning with our artisanal...",
      "cta": "Shop Now",
      "hashtags": "#coffee #premium #morningbrew",
      "ai_model": "gpt-3.5-turbo",
      "variation_number": 1,
      "generation_id": "gen-uuid-789",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

**Error Codes:**
- `401` - Unauthorized
- `500` - Server error

---

### Brand Profiles

#### POST `/api/brand-profiles`

Create a new brand profile.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "My Brand",
  "industry": "Technology",
  "brandVoice": "Professional",
  "targetAudience": "B2B SaaS companies",
  "uniqueSellingPoints": "AI-powered, Easy to use, Affordable",
  "isDefault": true
}
```

**Field Descriptions:**
- `name`: Brand name (required, max 255 chars)
- `industry`: Industry category (optional, max 100 chars)
- `brandVoice`: Tone of voice (optional, max 100 chars)
- `targetAudience`: Target audience description (optional, max 255 chars)
- `uniqueSellingPoints`: Key differentiators (optional, max 500 chars)
- `isDefault`: Set as default brand for ad generation (optional, boolean)

**Response:**
```json
{
  "id": "brand-uuid-456",
  "user_id": "firebase-uid-123",
  "name": "My Brand",
  "industry": "Technology",
  "brand_voice": "Professional",
  "target_audience": "B2B SaaS companies",
  "unique_selling_points": "AI-powered, Easy to use, Affordable",
  "is_default": true,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Codes:**
- `400` - Missing required fields
- `401` - Unauthorized
- `500` - Server error

---

#### GET `/api/brand-profiles`

Get all brand profiles for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "profiles": [
    {
      "id": "brand-uuid-456",
      "user_id": "firebase-uid-123",
      "name": "My Brand",
      "industry": "Technology",
      "brand_voice": "Professional",
      "target_audience": "B2B SaaS companies",
      "unique_selling_points": "AI-powered, Easy to use, Affordable",
      "is_default": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Codes:**
- `401` - Unauthorized
- `500` - Server error

---

#### PUT `/api/brand-profiles/:id`

Update an existing brand profile.

**Authentication:** Required

**URL Parameters:**
- `id`: Brand profile UUID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Brand Name",
  "industry": "Technology",
  "brandVoice": "Friendly",
  "targetAudience": "Small businesses",
  "uniqueSellingPoints": "Fast, Reliable, Secure",
  "isDefault": false
}
```

**Response:**
```json
{
  "id": "brand-uuid-456",
  "user_id": "firebase-uid-123",
  "name": "Updated Brand Name",
  ...
}
```

**Error Codes:**
- `400` - Invalid request
- `401` - Unauthorized
- `403` - Not the owner of this brand profile
- `404` - Brand profile not found
- `500` - Server error

---

#### DELETE `/api/brand-profiles/:id`

Delete a brand profile.

**Authentication:** Required

**URL Parameters:**
- `id`: Brand profile UUID

**Response:**
```json
{
  "success": true,
  "message": "Brand profile deleted successfully"
}
```

**Error Codes:**
- `401` - Unauthorized
- `403` - Not the owner of this brand profile
- `404` - Brand profile not found
- `500` - Server error

---

### Ad Generation

#### POST `/api/generate-ad`

Generate ad copy using AI.

**Authentication:** Optional (guest users allowed)

**Request Body:**
```json
{
  "product": "Premium coffee beans from Colombia",
  "platform": "Instagram",
  "tone": "Casual",
  "targetAudience": "Coffee enthusiasts aged 25-45",
  "brandProfileId": "brand-uuid-456",
  "variationsCount": 3
}
```

**Field Descriptions:**
- `product`: Product/service description (required, max 500 chars)
- `platform`: Ad platform (required, one of: "Facebook/Instagram", "Google Ads", "LinkedIn", "Twitter", "TikTok", "Pinterest")
- `tone`: Tone of voice (optional, e.g., "Professional", "Casual", "Playful")
- `targetAudience`: Target audience (optional, max 255 chars)
- `brandProfileId`: Brand profile to use (optional, UUID)
- `variationsCount`: Number of variations to generate (optional, 1-5, default: 1)

**Response:**
```json
{
  "ads": [
    {
      "id": "ad-uuid-123",
      "headline": "Wake Up to Premium Coffee",
      "copy": "Experience the rich flavors of Colombian coffee beans...",
      "cta": "Shop Now",
      "hashtags": "#coffee #premium #colombian",
      "variationNumber": 1
    },
    {
      "id": "ad-uuid-124",
      "headline": "Your Morning Deserves Better",
      "copy": "Elevate your coffee ritual with our handpicked beans...",
      "cta": "Order Today",
      "hashtags": "#specialtycoffee #morningbrew #coffeelover",
      "variationNumber": 2
    }
  ],
  "adsRemaining": 1,
  "tier": "free"
}
```

**For LinkedIn platform, response includes:**
```json
{
  "ads": [
    {
      "id": "ad-uuid-125",
      "title": "Premium Colombian Coffee Beans",
      "hook": "Looking to elevate your morning routine?",
      "body": "Our premium Colombian coffee beans deliver exceptional...",
      "cta": "Learn More",
      "variationNumber": 1
    }
  ]
}
```

**Error Codes:**
- `400` - Missing required fields or invalid platform
- `401` - Unauthorized (for authenticated users)
- `403` - Insufficient ads remaining
- `429` - Rate limit exceeded (guest users)
- `500` - AI generation error or server error

---

### Templates

#### GET `/api/templates`

Get available ad templates (platform-specific formats).

**Authentication:** None

**Response:**
```json
{
  "templates": {
    "Facebook/Instagram": {
      "fields": ["headline", "copy", "cta", "hashtags"],
      "maxHeadlineLength": 40,
      "maxCopyLength": 125,
      "recommended": "Use emojis and keep it conversational"
    },
    "LinkedIn": {
      "fields": ["title", "hook", "body", "cta"],
      "maxTitleLength": 70,
      "maxHookLength": 150,
      "maxBodyLength": 600,
      "recommended": "Professional tone, value-focused"
    },
    "Google Ads": {
      "fields": ["headline", "description", "cta"],
      "maxHeadlineLength": 30,
      "maxDescriptionLength": 90,
      "recommended": "Include keywords, clear CTA"
    }
  }
}
```

---

### Payments (Stripe)

#### POST `/api/stripe/create-checkout-session`

Create a Stripe Checkout session for subscription or one-time purchase.

**Authentication:** Required

**Request Body (Subscription):**
```json
{
  "tier": "starter"
}
```

**Request Body (One-time Purchase):**
```json
{
  "type": "one_time",
  "quantity": 1
}
```

**Field Descriptions:**
- `tier`: Subscription tier (required for subscriptions, one of: "starter", "pro", "business")
- `type`: Payment type (required for one-time, must be "one_time")
- `quantity`: Number of ads to purchase (required for one-time, integer)

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_xxxxx"
}
```

**Error Codes:**
- `400` - Missing or invalid tier/type
- `401` - Unauthorized
- `500` - Stripe API error

**Flow:**
1. Create checkout session with this endpoint
2. Redirect user to returned URL
3. User completes payment on Stripe
4. Stripe redirects to success URL
5. Webhook updates user tier/ads

---

#### POST `/api/stripe/create-portal-session`

Create a Stripe Customer Portal session for subscription management.

**Authentication:** Required

**Request Body:**
```json
{
  "returnUrl": "https://yourdomain.com/dashboard"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/session/xxxxx"
}
```

**Error Codes:**
- `400` - Missing return URL or no Stripe customer ID
- `401` - Unauthorized
- `500` - Stripe API error

**Note:** User must have an active subscription (Stripe customer ID) to access the portal.

---

#### POST `/api/stripe/webhook`

Stripe webhook endpoint for processing payment events.

**Authentication:** None (verified by Stripe signature)

**Headers:**
- `stripe-signature`: Stripe webhook signature

**Events Handled:**
- `checkout.session.completed`: Creates payment record, updates user tier/ads
- `customer.subscription.updated`: Updates subscription status
- `customer.subscription.deleted`: Downgrades user to free tier
- `invoice.payment_succeeded`: Resets monthly ad count
- `invoice.payment_failed`: Logs failed payment

**Response:**
```json
{
  "received": true
}
```

**Error Codes:**
- `400` - Invalid signature or payload
- `500` - Processing error

**Note:** This endpoint is called by Stripe, not your frontend.

---

## Error Handling

All endpoints may return these general errors:

### 401 Unauthorized
```json
{
  "error": "Unauthorized: Invalid or missing token"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

## Usage Examples

### JavaScript (Fetch API)

```javascript
// Get user profile
const token = await firebase.auth().currentUser.getIdToken();

const response = await fetch('https://api.adcreatorpro.com/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data);
```

### cURL

```bash
# Generate ad (guest)
curl -X POST https://api.adcreatorpro.com/api/generate-ad \
  -H "Content-Type: application/json" \
  -d '{
    "product": "AI tool",
    "platform": "LinkedIn",
    "variationsCount": 2
  }'

# Get user profile (authenticated)
curl https://api.adcreatorpro.com/api/user/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

# Create brand profile
curl -X POST https://api.adcreatorpro.com/api/brand-profiles \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Startup",
    "industry": "SaaS",
    "brandVoice": "Innovative",
    "isDefault": true
  }'
```

## Webhooks

### Stripe Webhook Configuration

1. Set up webhook in Stripe Dashboard
2. Point to: `https://yourdomain.com/api/stripe/webhook`
3. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` environment variable

## API Limits

### Guest Users
- 10 ad generations per day per IP
- No ad history
- No brand profiles
- No variations (single ad only)

### Free Tier
- 3 total ads
- Up to 5 brand profiles
- Up to 3 variations per generation
- Full ad history

### Starter Tier ($9/month)
- 30 ads per month
- Resets on billing date
- Unlimited brand profiles
- Up to 5 variations per generation

### Pro Tier ($29/month)
- Unlimited ads
- Unlimited brand profiles
- Up to 5 variations per generation
- GPT-4 model access

### Business Tier ($79/month)
- Everything in Pro
- Priority support
- API access (coming soon)

## Database Schema

See `server/db/schema.sql` for complete database schema.

## Versioning

Current API version: **v1** (no version prefix in URL)

Future versions will be prefixed: `/api/v2/...`

## Support

For API support or bug reports:
- GitHub Issues: [link]
- Email: support@adcreatorpro.com
