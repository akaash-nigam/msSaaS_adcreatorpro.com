# Testing Guide

This guide covers all testing procedures for AdCreatorPro.

## Table of Contents

- [Automated Testing](#automated-testing)
- [Manual Testing](#manual-testing)
- [API Testing](#api-testing)
- [Database Testing](#database-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)

## Automated Testing

### Run All Tests

```bash
# Install dependencies
npm install

# Run API tests
./tests/api-tests.sh

# Run database tests
psql $DATABASE_URL -f tests/db-tests.sql
```

### Continuous Integration

For CI/CD pipelines (GitHub Actions, Cloud Build):

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - run: ./tests/api-tests.sh
```

## Manual Testing

### Frontend Testing Checklist

#### Homepage (`/`)

- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] "Generate Ad" button visible
- [ ] Form fields render properly
- [ ] Platform dropdown shows all options
- [ ] Variation count slider works (1-5)
- [ ] Generate button disabled until form is valid
- [ ] Guest users can generate 1 ad
- [ ] Generated ad displays correctly
- [ ] Copy buttons work for each field
- [ ] "Copy All Variations" button works
- [ ] Variation tabs switch correctly
- [ ] Mobile responsive design works

#### Authentication Pages

**Signup (`/signup`)**
- [ ] Email and password fields validate correctly
- [ ] Display name field required
- [ ] Password strength indicator works
- [ ] "Sign Up" button disabled until form valid
- [ ] Can sign up with email/password
- [ ] Verification email sent automatically
- [ ] Redirects to `/verify-email` after signup
- [ ] Error messages display for invalid input
- [ ] Can sign up with Google (if enabled)

**Login (`/login`)**
- [ ] Email and password fields work
- [ ] "Forgot Password?" link goes to `/reset-password`
- [ ] Can log in with valid credentials
- [ ] Error message for invalid credentials
- [ ] Redirects to dashboard after login
- [ ] Can log in with Google (if enabled)

**Verify Email (`/verify-email`)**
- [ ] Shows email verification message
- [ ] Auto-checks verification status every 3 seconds
- [ ] "Resend Email" button works
- [ ] Cooldown timer shows after resend (60 seconds)
- [ ] "Skip for now" redirects to dashboard
- [ ] Auto-redirects when email verified

**Reset Password (`/reset-password`)**
- [ ] Email field validates correctly
- [ ] "Send Reset Email" button works
- [ ] Success message displays after send
- [ ] Password reset email received
- [ ] Reset link works (redirects to Firebase)
- [ ] Can set new password
- [ ] Can log in with new password

#### Navigation

- [ ] Logo links to homepage
- [ ] Navigation links work (Home, Pricing, Dashboard)
- [ ] Login/Signup buttons show when logged out
- [ ] Profile menu shows when logged in
- [ ] Logout button works
- [ ] Mobile hamburger menu appears on mobile
- [ ] Mobile menu opens/closes correctly
- [ ] Mobile menu links work

#### Dashboard (`/dashboard`)

**User Info Section**
- [ ] Displays user email and name
- [ ] Shows current tier (Free, Starter, Pro, Business)
- [ ] Shows ads remaining (or "Unlimited")
- [ ] Upgrade button shows for non-Business users
- [ ] Manage Subscription button shows for subscribers

**Ad History**
- [ ] All generated ads display
- [ ] Newest ads appear first
- [ ] Search bar filters by product/headline/copy
- [ ] Platform filter works (All, Facebook, Instagram, etc.)
- [ ] Date range filter works (Last 7 days, 30 days, All)
- [ ] Sort toggle works (Newest ↔ Oldest)
- [ ] "No ads found" shows when filters return empty
- [ ] Ad cards show all fields (headline, copy, CTA, etc.)
- [ ] Copy buttons work for each ad
- [ ] Pagination works (if implemented)
- [ ] Skeleton loaders show while loading

**Subscription Actions**
- [ ] "Manage Subscription" opens Stripe portal
- [ ] Can cancel subscription in portal
- [ ] Can upgrade/downgrade in portal
- [ ] Returns to dashboard after portal actions

#### Brand Profiles (`/brand-profiles`)

**List View**
- [ ] All brand profiles display
- [ ] Default brand shows "Default" badge
- [ ] Edit button works for each profile
- [ ] Delete button works
- [ ] Confirmation modal shows before delete
- [ ] "Create New Profile" button works
- [ ] Empty state shows when no profiles

**Create/Edit Form**
- [ ] All fields editable (name, industry, voice, etc.)
- [ ] "Set as Default" checkbox works
- [ ] Save button creates/updates profile
- [ ] Success toast shows after save
- [ ] Redirects to list after save
- [ ] Cancel button returns without saving
- [ ] Validation works (name required)

#### Pricing (`/pricing`)

- [ ] All 4 tiers display (Free, Starter, Pro, Business)
- [ ] Prices show correctly
- [ ] Features list for each tier
- [ ] "Get Started" button works for Free
- [ ] "Subscribe" button works for paid tiers
- [ ] Redirects to Stripe Checkout
- [ ] "Current Plan" shows for user's tier
- [ ] Pay-per-ad option displays ($1.99)
- [ ] "Buy More Ads" button works

### Backend Testing Checklist

#### Authentication Middleware

**Test with valid token:**
```bash
# Get token from Firebase (use browser console)
token="<your-firebase-token>"

curl http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer $token"
```

Expected: 200 OK with user data

**Test with invalid token:**
```bash
curl http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer invalid-token"
```

Expected: 401 Unauthorized

**Test without token:**
```bash
curl http://localhost:8080/api/user/profile
```

Expected: 401 Unauthorized

#### Rate Limiting (Guest Users)

Generate ads 11 times from same IP without auth:

```bash
for i in {1..11}; do
  curl -X POST http://localhost:8080/api/generate-ad \
    -H "Content-Type: application/json" \
    -d '{"product":"Test","platform":"Facebook/Instagram"}'
  echo "\n"
done
```

Expected: First 10 succeed, 11th returns 429 Too Many Requests

#### Ad Generation

**Test all platforms:**
```bash
platforms=("Facebook/Instagram" "LinkedIn" "Google Ads" "Twitter" "TikTok" "Pinterest")

for platform in "${platforms[@]}"; do
  echo "Testing $platform..."
  curl -X POST http://localhost:8080/api/generate-ad \
    -H "Content-Type: application/json" \
    -d "{\"product\":\"Test product\",\"platform\":\"$platform\"}"
  echo "\n"
done
```

Expected: Different ad formats for each platform

**Test with variations:**
```bash
curl -X POST http://localhost:8080/api/generate-ad \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Premium coffee",
    "platform": "Instagram",
    "variationsCount": 3
  }'
```

Expected: 3 different ad variations returned

#### Ads Remaining Logic

1. Create new user (3 free ads)
2. Generate 3 ads
3. Check `ads_remaining = 0`
4. Try to generate 4th ad
5. Expected: 403 Forbidden

#### Payment Flow

**Create checkout session:**
```bash
curl -X POST http://localhost:8080/api/stripe/create-checkout-session \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"tier":"starter"}'
```

Expected: Returns checkout URL

**Complete payment:**
1. Use returned URL
2. Enter test card: 4242 4242 4242 4242
3. Complete checkout
4. Webhook should fire
5. Check user tier updated to "starter"
6. Check ads_remaining = 30

## API Testing

### Automated API Tests

Run the comprehensive test suite:

```bash
./tests/api-tests.sh
```

This tests:
- Health check endpoint
- Template retrieval
- Guest ad generation
- All authenticated endpoints
- Error handling
- Invalid requests

### Manual API Testing with Postman

**Import Collection:**

Create a Postman collection with these requests:

1. **Health Check** - GET `/api/health`
2. **Get Templates** - GET `/api/templates`
3. **Register User** - POST `/api/auth/register`
4. **Get Profile** - GET `/api/user/profile`
5. **Generate Ad** - POST `/api/generate-ad`
6. **Create Brand Profile** - POST `/api/brand-profiles`
7. **List Brand Profiles** - GET `/api/brand-profiles`
8. **Update Brand Profile** - PUT `/api/brand-profiles/:id`
9. **Delete Brand Profile** - DELETE `/api/brand-profiles/:id`
10. **Get Ad History** - GET `/api/user/ads`
11. **Create Checkout** - POST `/api/stripe/create-checkout-session`
12. **Create Portal Session** - POST `/api/stripe/create-portal-session`

**Set Environment Variables:**
- `baseUrl`: http://localhost:8080 or production URL
- `authToken`: Firebase ID token

## Database Testing

### Run Database Tests

```bash
psql $DATABASE_URL -f tests/db-tests.sql
```

### Manual Database Queries

**Check user creation:**
```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

**Check ad generation:**
```sql
SELECT COUNT(*) FROM ads WHERE user_id = '<user-id>';
```

**Check payments:**
```sql
SELECT * FROM payments WHERE user_id = '<user-id>' ORDER BY created_at DESC;
```

**Check usage logs:**
```sql
SELECT * FROM usage_logs WHERE user_id = '<user-id>' ORDER BY created_at DESC;
```

**Verify foreign keys:**
```sql
-- Should return 0 orphaned records
SELECT COUNT(*) FROM ads WHERE user_id NOT IN (SELECT id FROM users);
SELECT COUNT(*) FROM brand_profiles WHERE user_id NOT IN (SELECT id FROM users);
```

### Database Performance Testing

**Analyze slow queries:**
```sql
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Check index usage:**
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## End-to-End Testing

### User Journey 1: New User Sign Up

1. Navigate to homepage
2. Click "Sign Up"
3. Fill form: email, password, name
4. Submit form
5. **Verify:** Redirected to `/verify-email`
6. Check email inbox
7. Click verification link
8. **Verify:** Auto-redirected to dashboard
9. **Verify:** Shows "Free" tier
10. **Verify:** Shows "3 ads remaining"

### User Journey 2: Generate First Ad

1. Log in
2. Go to homepage
3. Fill ad generation form
4. Select platform: "Instagram"
5. Enter product: "Premium coffee beans"
6. Set variations: 3
7. Click "Generate Ad"
8. **Verify:** Loading state shows
9. **Verify:** 3 variations display
10. **Verify:** Can switch between variations
11. Click "Copy" on variation 1
12. **Verify:** Toast notification shows
13. Click "Copy All Variations"
14. **Verify:** All variations copied to clipboard
15. Go to Dashboard
16. **Verify:** Ad appears in history
17. **Verify:** Ads remaining = 2

### User Journey 3: Create Brand Profile

1. Navigate to Brand Profiles
2. Click "Create New Profile"
3. Fill form:
   - Name: "My Coffee Brand"
   - Industry: "Food & Beverage"
   - Brand Voice: "Warm and inviting"
4. Check "Set as Default"
5. Click "Save"
6. **Verify:** Redirected to list
7. **Verify:** Profile shows with "Default" badge
8. Go to homepage
9. **Verify:** Form auto-filled with brand info

### User Journey 4: Subscribe to Paid Plan

1. Use all 3 free ads
2. Try to generate 4th ad
3. **Verify:** Error message about limit
4. Go to Pricing page
5. Click "Subscribe" on Starter plan
6. **Verify:** Redirected to Stripe Checkout
7. Enter test card: 4242 4242 4242 4242
8. Complete payment
9. **Verify:** Redirected to success page
10. **Verify:** Auto-redirect to dashboard
11. **Verify:** Tier shows "Starter"
12. **Verify:** Ads remaining shows 30
13. Go to homepage
14. Generate an ad
15. **Verify:** Ads remaining decrements to 29

### User Journey 5: Manage Subscription

1. Log in as subscriber
2. Go to Dashboard
3. Click "Manage Subscription"
4. **Verify:** Redirected to Stripe portal
5. Click "Update plan"
6. Upgrade to Pro plan
7. Confirm upgrade
8. Return to dashboard
9. **Verify:** Tier shows "Pro"
10. **Verify:** Ads remaining shows "Unlimited"

### User Journey 6: Password Reset

1. Log out
2. Go to Login page
3. Click "Forgot Password?"
4. Enter email
5. Click "Send Reset Email"
6. **Verify:** Success message displays
7. Check email inbox
8. Click reset link
9. **Verify:** Redirected to Firebase password reset
10. Enter new password
11. Confirm password
12. **Verify:** Password updated successfully
13. Go to Login page
14. Log in with new password
15. **Verify:** Login successful

## Performance Testing

### Load Testing with Artillery

Install Artillery:
```bash
npm install -g artillery
```

Create load test config:
```yaml
# load-test.yml
config:
  target: "http://localhost:8080"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
scenarios:
  - name: "Generate Ad"
    flow:
      - post:
          url: "/api/generate-ad"
          json:
            product: "Test product"
            platform: "Facebook/Instagram"
```

Run test:
```bash
artillery run load-test.yml
```

**Success Criteria:**
- Response time p95 < 5000ms
- Response time p99 < 10000ms
- Error rate < 1%
- Requests/sec > 40

### Frontend Performance

Use Chrome DevTools Lighthouse:

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select categories: Performance, Accessibility, Best Practices
4. Click "Generate report"

**Success Criteria:**
- Performance score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Largest Contentful Paint < 2.5s

## Security Testing

### Authentication Testing

**Test expired tokens:**
1. Get valid token
2. Wait 1 hour
3. Try to use token
4. **Expected:** 401 Unauthorized

**Test token from different user:**
1. Get token for User A
2. Try to access User B's data
3. **Expected:** 403 Forbidden or 404 Not Found

### SQL Injection Testing

Try malicious input in form fields:
```
Product: '; DROP TABLE users; --
Platform: '); DELETE FROM ads; --
```

**Expected:** Input sanitized, no SQL executed

### XSS Testing

Try malicious input:
```
Product: <script>alert('XSS')</script>
Headline: <img src=x onerror=alert('XSS')>
```

**Expected:** Input escaped, no script execution

### CORS Testing

Try request from unauthorized origin:
```bash
curl http://localhost:8080/api/generate-ad \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"product":"Test","platform":"Facebook/Instagram"}'
```

**Expected:** CORS error or blocked request

### Rate Limiting Testing

**Test guest rate limit:**
- Generate 11 ads from same IP
- **Expected:** 11th request blocked

**Test authenticated rate limit:**
- Try to generate 100 ads in 1 minute
- **Expected:** No rate limit (or higher limit)

## Browser Compatibility Testing

Test on multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Test Features:**
- Form submission
- Authentication flows
- Toast notifications
- Copy to clipboard
- Mobile navigation menu
- Responsive design

## Regression Testing

Before each release, test:

1. **Critical Paths:**
   - [ ] User registration
   - [ ] Login/logout
   - [ ] Ad generation
   - [ ] Payment checkout
   - [ ] Subscription management

2. **Bug Fixes:**
   - [ ] Previously reported bugs still fixed
   - [ ] No new bugs introduced

3. **Database Integrity:**
   - [ ] Foreign keys enforced
   - [ ] No orphaned records
   - [ ] Correct data types

## Test Data

### Test Cards (Stripe)

**Success:**
- 4242 4242 4242 4242 (Visa)
- 5555 5555 5555 4444 (Mastercard)

**Decline:**
- 4000 0000 0000 0002 (Card declined)

**Authentication Required:**
- 4000 0027 6000 3184 (3D Secure)

### Test Users

Create test users for each tier:
- test-free@example.com (Free tier, 3 ads)
- test-starter@example.com (Starter, 30 ads/month)
- test-pro@example.com (Pro, unlimited)
- test-business@example.com (Business, unlimited)

## Test Results Documentation

Record test results:

```markdown
# Test Run: 2024-01-15

## Environment
- Browser: Chrome 120
- OS: macOS 14
- Server: localhost:8080
- Database: Local PostgreSQL

## Results
- Total tests: 47
- Passed: 46
- Failed: 1
- Skipped: 0

## Failed Tests
1. Brand profile deletion (issue #123)
   - Error: Foreign key constraint violation
   - Workaround: Delete associated ads first
   - Fix planned for v1.1

## Notes
- All payment flows working correctly
- Performance within acceptable range
- Minor UI issue on Safari (cosmetic)
```

## Continuous Testing

### Pre-commit Checks

Run before every commit:
```bash
npm run build  # Ensure code compiles
```

### Pre-deployment Checks

Run before every deployment:
```bash
./tests/api-tests.sh  # Test API endpoints
psql $DATABASE_URL -f tests/db-tests.sql  # Test database
```

### Post-deployment Checks

Run after deployment:
```bash
# Health check
curl https://your-production-url.run.app/api/health

# Smoke test ad generation
curl -X POST https://your-production-url.run.app/api/generate-ad \
  -H "Content-Type: application/json" \
  -d '{"product":"Test","platform":"Facebook/Instagram"}'
```

## Bug Reporting Template

```markdown
**Bug Title:** Brief description

**Environment:**
- Browser/OS:
- URL:
- User tier:

**Steps to Reproduce:**
1. Go to...
2. Click...
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Screenshots:**
[Attach if applicable]

**Console Errors:**
[Paste any errors from browser console]

**Severity:**
- [ ] Critical (blocks core functionality)
- [ ] High (major feature broken)
- [ ] Medium (minor feature broken)
- [ ] Low (cosmetic issue)
```

## Resources

- [Testing Best Practices](https://cloud.google.com/blog/products/devops-sre/testing-best-practices)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Firebase Auth Testing](https://firebase.google.com/docs/auth/web/start)
