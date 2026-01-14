# AdCreatorPro

> AI-powered ad copy generation platform for digital marketers

AdCreatorPro is a SaaS platform that uses artificial intelligence to generate high-quality ad copy for multiple platforms including Facebook, Instagram, LinkedIn, Google Ads, and more. Built with React, TypeScript, and Node.js, deployed on Google Cloud Run.

## Features

### Core Features
- **AI Ad Generation**: Generate professional ad copy using OpenAI GPT-3.5 Turbo and GPT-4
- **Multi-Platform Support**: Facebook/Instagram, LinkedIn, Google Ads, Twitter, TikTok, Pinterest
- **Ad Variations**: Generate up to 5 variations per request for A/B testing
- **Brand Profiles**: Save and reuse brand information for consistent messaging
- **Ad History**: View, search, and filter all previously generated ads
- **Guest Access**: Try the platform without creating an account

### User Experience
- **Modern UI**: Clean, responsive design built with React and TypeScript
- **Mobile Responsive**: Full mobile support with hamburger navigation
- **Toast Notifications**: Non-intrusive feedback system
- **Skeleton Loaders**: Smooth loading states
- **Error Boundaries**: Graceful error handling
- **Copy to Clipboard**: One-click copying of ad copy

### Authentication & Security
- **Firebase Auth**: Secure email/password and Google OAuth authentication
- **Email Verification**: Automated email verification flow
- **Password Reset**: Self-service password reset
- **Protected Routes**: Secure access to user-specific features
- **Token-based API**: JWT authentication for all API endpoints

### Monetization
- **Freemium Model**: 3 free ads to try the platform
- **Subscription Tiers**: Starter ($9/mo), Pro ($29/mo), Business ($79/mo)
- **Pay-per-Ad**: One-time purchases ($1.99 per ad)
- **Stripe Integration**: Secure payment processing
- **Subscription Management**: Self-service via Stripe Customer Portal

### Admin & Analytics
- **Usage Tracking**: Detailed logging of user actions
- **Payment Logging**: Complete payment history
- **Database Analytics**: User tier distribution, revenue tracking
- **Cloud Monitoring**: Built-in monitoring and logging

## Tech Stack

### Frontend
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Firebase SDK**: Authentication
- **CSS3**: Custom styling with responsive design

### Backend
- **Node.js 20**: Latest LTS version
- **Express.js**: Web framework
- **TypeScript**: Type-safe server code
- **PostgreSQL**: Relational database
- **Firebase Admin**: Token verification
- **Stripe**: Payment processing
- **OpenAI API**: AI ad generation

### Infrastructure
- **Google Cloud Run**: Serverless container deployment
- **Cloud SQL**: Managed PostgreSQL database
- **Cloud Logging**: Centralized logging
- **Cloud Monitoring**: Performance metrics
- **Docker**: Containerization
- **esbuild**: Fast backend bundling

### Development Tools
- **ESLint**: Code linting (if configured)
- **Git**: Version control
- **npm**: Package management

## Prerequisites

Before you begin, ensure you have:

### Required
- **Node.js 20+**: [Download here](https://nodejs.org/)
- **npm 10+**: Comes with Node.js
- **PostgreSQL 14+**: [Download here](https://www.postgresql.org/) or use Cloud SQL
- **Google Cloud Account**: [Sign up here](https://cloud.google.com/)
- **Firebase Project**: [Create here](https://console.firebase.google.com/)
- **OpenAI API Key**: [Get here](https://platform.openai.com/)
- **Stripe Account**: [Sign up here](https://stripe.com/)

### Optional
- **Docker**: For containerized development
- **Google Cloud SDK**: For deployment
- **Stripe CLI**: For webhook testing

## Installation

### 1. Clone the Repository

```bash
cd /path/to/project
# Repository is already in: AxionApps/msSaaS/msSaaS_adcreatorpro.com
```

### 2. Install Dependencies

```bash
npm install
```

This installs both frontend and backend dependencies.

### 3. Set Up Environment Variables

```bash
# Run interactive setup script
./scripts/setup-env.sh
```

Or manually create `.env` file:

```bash
# Copy example file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required Environment Variables:**

```bash
# Node Environment
NODE_ENV=development

# Server
PORT=8080
FRONTEND_URL=http://localhost:5173

# Firebase (Backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com

# Firebase (Frontend - in client/.env or root .env with VITE_ prefix)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx  # or sk_live_xxxxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_BUSINESS=price_xxxxx
STRIPE_PRICE_PAY_PER_AD=price_xxxxx

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/adcreatorpro
CLOUD_SQL_CONNECTION_NAME=project:region:instance  # For Cloud Run

# Stripe Frontend (optional, in client/.env)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # or pk_live_xxxxx
```

### 4. Set Up Database

**Local PostgreSQL:**

```bash
# Create database
createdb adcreatorpro

# Initialize schema (runs automatically on first API request)
# Or manually:
psql adcreatorpro < server/db/schema.sql
```

**Cloud SQL:**

```bash
# Configure Cloud SQL connection
./scripts/setup-cloudsql.sh

# Test connection
./scripts/test-db-connection.sh
```

### 5. Configure External Services

**Firebase Setup:**
- See [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)

**Stripe Setup:**
1. Create products in Stripe Dashboard
2. Copy price IDs to `.env`
3. Set up webhook:
   ```bash
   ./scripts/setup-stripe-webhook.sh
   ```

## Development

### Start Development Server

**Terminal 1 - Backend:**
```bash
npm run dev
```
Server runs on http://localhost:8080

**Terminal 2 - Frontend (if needed):**
```bash
# Frontend is served by backend in development
# But if you want separate frontend dev server:
cd client
npm run dev
```
Frontend runs on http://localhost:5173

### Development Workflow

1. **Make changes** to code
2. **Save files** - auto-reload enabled
3. **Check browser** - see changes immediately
4. **Test features** - verify functionality
5. **Commit changes** - use git

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run dev:frontend     # Frontend only (Vite dev server)
npm run dev:backend      # Backend only

# Building
npm run build           # Build both frontend and backend
npm run build:frontend  # Build frontend only
npm run build:backend   # Build backend only

# Production
npm start              # Run production build (requires build first)

# Testing
./tests/api-tests.sh          # Test API endpoints
psql $DATABASE_URL -f tests/db-tests.sql  # Test database

# Deployment
./scripts/deploy.sh    # Deploy to Cloud Run
```

## Testing

### Run All Tests

```bash
# API tests
./tests/api-tests.sh

# Database tests
psql $DATABASE_URL -f tests/db-tests.sql
```

### Manual Testing

See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for comprehensive testing procedures.

### Test User Accounts

For development, create test accounts:
- Free tier: test-free@example.com
- Starter tier: test-starter@example.com (requires subscription)
- Pro tier: test-pro@example.com (requires subscription)

## Deployment

### Deploy to Google Cloud Run

**One-command deployment:**

```bash
./scripts/deploy.sh
```

**Manual deployment:**

```bash
# Build application
npm run build

# Deploy to Cloud Run
gcloud run deploy adcreatorpro \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 300 \
  --set-env-vars="$(cat .env | grep -v '^#' | tr '\n' ',')"
```

### Post-Deployment

1. **Configure Stripe webhook** with production URL
2. **Add Cloud Run URL** to Firebase authorized domains
3. **Test health endpoint**: `curl https://your-url.run.app/api/health`
4. **Test ad generation**: Create test account and generate ad
5. **Monitor logs**: Check Cloud Logging for errors

See [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for complete deployment checklist.

## Project Structure

```
msSaaS_adcreatorpro.com/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Toast.tsx
│   │   ├── AppRouter.tsx     # Route configuration
│   │   ├── AuthContext.tsx   # Authentication state
│   │   ├── Home.tsx          # Ad generation page
│   │   ├── Login.tsx         # Login page
│   │   ├── Signup.tsx        # Signup page
│   │   ├── ResetPassword.tsx # Password reset
│   │   ├── VerifyEmail.tsx   # Email verification
│   │   ├── Dashboard.tsx     # User dashboard
│   │   ├── BrandProfiles.tsx # Brand management
│   │   ├── Pricing.tsx       # Pricing page
│   │   ├── Navigation.tsx    # Navigation component
│   │   └── main.tsx          # App entry point
│   ├── public/               # Static assets
│   └── index.html            # HTML template
├── server/                   # Backend Express application
│   ├── db/
│   │   ├── schema.sql        # Database schema
│   │   └── init.ts           # Database initialization
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   ├── user.ts           # User routes
│   │   ├── brandProfiles.ts  # Brand profile routes
│   │   ├── adGeneration.ts   # Ad generation routes
│   │   ├── stripe.ts         # Payment routes
│   │   └── templates.ts      # Template routes
│   ├── middleware/
│   │   ├── auth.ts           # Auth middleware
│   │   └── rateLimit.ts      # Rate limiting
│   ├── services/
│   │   └── openai.ts         # OpenAI integration
│   └── index.ts              # Server entry point
├── scripts/                  # Automation scripts
│   ├── setup-env.sh          # Environment setup
│   ├── test-db-connection.sh # Database test
│   ├── setup-cloudsql.sh     # Cloud SQL config
│   ├── setup-stripe-webhook.sh # Stripe webhook
│   └── deploy.sh             # Deployment script
├── tests/                    # Test files
│   ├── api-tests.sh          # API tests
│   └── db-tests.sql          # Database tests
├── docs/                     # Documentation
│   ├── API.md                # API documentation
│   ├── USER_GUIDE.md         # User guide
│   ├── FIREBASE_SETUP.md     # Firebase setup
│   ├── TESTING_GUIDE.md      # Testing guide
│   ├── DEPLOYMENT_CHECKLIST.md # Deployment checklist
│   └── MONITORING.md         # Monitoring guide
├── .env.example              # Environment template
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config
├── Dockerfile                # Docker config
└── README.md                 # This file
```

## Database Schema

### Tables

**users**
- id (UUID, primary key)
- email (unique)
- display_name
- tier (free, starter, pro, business)
- ads_remaining (integer)
- stripe_customer_id
- subscription_id
- subscription_status
- created_at, updated_at

**brand_profiles**
- id (UUID, primary key)
- user_id (foreign key)
- name
- industry
- brand_voice
- target_audience
- unique_selling_points
- is_default (boolean)
- created_at, updated_at

**ads**
- id (UUID, primary key)
- user_id (foreign key)
- brand_profile_id (foreign key, nullable)
- product_description
- platform
- tone
- target_audience
- headline, copy, cta, hashtags (platform-dependent fields)
- title, hook, body (LinkedIn fields)
- description (Google Ads field)
- ai_model (gpt-3.5-turbo, gpt-4)
- variation_number (integer)
- generation_id (UUID, groups variations)
- created_at

**payments**
- id (UUID, primary key)
- user_id (foreign key)
- stripe_payment_id
- stripe_customer_id
- amount (integer, cents)
- currency (string)
- payment_type (subscription, one_time)
- status (succeeded, failed, pending)
- created_at

**usage_logs**
- id (UUID, primary key)
- user_id (foreign key, nullable)
- action (ad_generated, profile_created, etc.)
- metadata (JSONB)
- created_at

See `server/db/schema.sql` for complete schema.

## API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

**Key Endpoints:**

- `GET /api/health` - Health check
- `POST /api/auth/register` - Register user
- `GET /api/user/profile` - Get user profile
- `POST /api/generate-ad` - Generate ad copy
- `GET /api/brand-profiles` - List brand profiles
- `POST /api/stripe/create-checkout-session` - Create payment session

## Configuration

### Environment Variables

See `.env.example` for all available environment variables.

### Firebase Configuration

1. Create Firebase project
2. Enable Email/Password and Google authentication
3. Download service account key
4. Add credentials to `.env`

See [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) for detailed setup.

### Stripe Configuration

1. Create Stripe account
2. Create products and prices
3. Add price IDs to `.env`
4. Configure webhook endpoint
5. Add webhook secret to `.env`

## Monitoring

### Cloud Run Metrics

Monitor in Google Cloud Console:
- Request count and latency
- Error rates
- CPU and memory usage
- Instance count

### Cloud Logging

View logs:
```bash
gcloud run services logs read adcreatorpro --region us-central1
```

### Custom Monitoring

See [docs/MONITORING.md](docs/MONITORING.md) for:
- Setting up dashboards
- Configuring alerts
- Performance monitoring
- Cost tracking

## Troubleshooting

### Common Issues

**"Internal Server Error" on all endpoints**
- Check database connection
- Verify environment variables
- Check Cloud Run logs

**Stripe webhook not processing**
- Verify webhook secret
- Check webhook URL
- Resend failed events in Stripe Dashboard

**OpenAI API errors**
- Check API key validity
- Verify account has credits
- Check rate limits

**Build failures**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v` (should be 20+)
- Check for TypeScript errors: `npm run build`

See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for more troubleshooting tips.

## Security

### Best Practices

- Never commit `.env` files
- Use environment variables for secrets
- Enable HTTPS in production
- Validate all user input
- Use parameterized SQL queries
- Verify Firebase tokens on backend
- Verify Stripe webhook signatures
- Keep dependencies updated

### Security Features

- Firebase Authentication (industry-standard)
- JWT token validation
- SQL injection prevention (parameterized queries)
- XSS protection (React auto-escaping)
- CORS configuration
- Rate limiting for guest users
- HTTPS enforcement (Cloud Run)

## Performance

### Optimization

- Frontend code splitting (Vite)
- Backend bundling (esbuild)
- Database indexing
- Connection pooling
- Cloud Run auto-scaling
- CDN for static assets (via Cloud Run)

### Benchmarks

- Page load time: < 2s
- Ad generation: 3-10s (depends on OpenAI)
- API response time: < 500ms (non-AI endpoints)
- Uptime target: 99.9%

## Contributing

### Development Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** and test thoroughly
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Add comments for complex logic
- Write meaningful commit messages
- Update documentation for new features

### Testing Requirements

- Test all new features manually
- Update API tests if adding endpoints
- Ensure build succeeds
- Check for console errors

## Roadmap

### Planned Features

- [ ] Analytics dashboard for ad performance
- [ ] AI image generation (DALL-E integration)
- [ ] Video ad script generation
- [ ] Campaign management
- [ ] Team collaboration features
- [ ] White-label solution
- [ ] API for developers
- [ ] Mobile app (React Native)
- [ ] Advanced A/B testing tools
- [ ] Integration with ad platforms (Facebook Ads API, etc.)

## License

Copyright © 2024 AdCreatorPro. All rights reserved.

[Specify your license here - MIT, proprietary, etc.]

## Support

### Documentation

- [User Guide](docs/USER_GUIDE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT_CHECKLIST.md)
- [Testing Guide](docs/TESTING_GUIDE.md)

### Contact

- **Email**: support@adcreatorpro.com
- **Issues**: [GitHub Issues](link-to-issues)
- **Documentation**: [Documentation Site](link-to-docs)

## Acknowledgments

- **OpenAI**: GPT models for ad generation
- **Firebase**: Authentication infrastructure
- **Stripe**: Payment processing
- **Google Cloud**: Infrastructure and hosting
- **React Team**: Frontend framework
- **TypeScript Team**: Type safety

---

**Built with ❤️ for digital marketers worldwide**

For questions or feedback, please reach out to support@adcreatorpro.com
