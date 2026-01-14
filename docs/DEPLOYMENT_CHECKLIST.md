# Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment Checklist

### Environment Setup

- [ ] `.env` file created from `.env.example`
- [ ] All environment variables populated (no placeholder values)
- [ ] Firebase credentials configured
  - [ ] `FIREBASE_PROJECT_ID` set
  - [ ] `FIREBASE_PRIVATE_KEY` set with proper newlines
  - [ ] `FIREBASE_CLIENT_EMAIL` set
- [ ] OpenAI API key configured
  - [ ] `OPENAI_API_KEY` set and valid
  - [ ] API key has sufficient credits
- [ ] Stripe configuration complete
  - [ ] `STRIPE_SECRET_KEY` set (live mode for production)
  - [ ] `STRIPE_PUBLISHABLE_KEY` set in frontend
  - [ ] All price IDs configured (`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, etc.)
  - [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] Database configuration
  - [ ] `DATABASE_URL` set
  - [ ] `CLOUD_SQL_CONNECTION_NAME` set
  - [ ] Database connection tested (`./scripts/test-db-connection.sh`)
- [ ] Frontend URL configured
  - [ ] `FRONTEND_URL` matches production domain

### Firebase Configuration

- [ ] Firebase project created
- [ ] Email/Password authentication enabled
- [ ] Google authentication enabled (optional)
- [ ] Service account key downloaded
- [ ] Production domain added to authorized domains
- [ ] Cloud Run URL added to authorized domains
- [ ] Email templates customized (optional)

### Stripe Configuration

- [ ] Stripe account in live mode
- [ ] Products created:
  - [ ] Starter subscription ($9/month)
  - [ ] Pro subscription ($29/month)
  - [ ] Business subscription ($79/month)
  - [ ] Pay-per-ad ($1.99 each)
- [ ] Price IDs match environment variables
- [ ] Webhook endpoint created (`./scripts/setup-stripe-webhook.sh`)
- [ ] Webhook secret added to environment variables
- [ ] Webhook events subscribed:
  - [ ] checkout.session.completed
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
  - [ ] invoice.payment_succeeded
  - [ ] invoice.payment_failed
- [ ] Test payment completed successfully

### Google Cloud Platform

- [ ] GCP project created
- [ ] Cloud SQL instance running
- [ ] Database initialized (tables created)
- [ ] Cloud Run service created
- [ ] Cloud SQL Client role granted to service account
- [ ] Billing enabled
- [ ] Budget alerts configured

### Code Quality

- [ ] Frontend builds without errors (`npm run build`)
- [ ] Backend builds without errors (included in build step)
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] All linting issues resolved (if applicable)
- [ ] Dependencies up to date (security patches)

### Testing

- [ ] All frontend components render correctly
- [ ] Authentication flow works (signup, login, logout)
- [ ] Password reset sends email
- [ ] Email verification works
- [ ] Ad generation works (all platforms)
- [ ] Multi-variation generation works
- [ ] Brand profiles CRUD operations work
- [ ] Dashboard displays ad history
- [ ] Filtering and search work in dashboard
- [ ] Copy to clipboard works
- [ ] Stripe checkout flow works
- [ ] Subscription management portal works
- [ ] Webhook processing works (test with Stripe CLI)
- [ ] API endpoints return expected responses (`./tests/api-tests.sh`)
- [ ] Database queries execute correctly (`./tests/db-tests.sql`)

## Deployment Steps

### 1. Build Application

```bash
# Install dependencies
npm install

# Build frontend and backend
npm run build
```

**Verify:**
- [ ] `dist/index.js` exists (backend)
- [ ] `dist/public` directory exists (frontend)
- [ ] No build errors in console

### 2. Run Automated Setup Scripts

```bash
# Set up environment variables
./scripts/setup-env.sh

# Test database connection
./scripts/test-db-connection.sh

# Configure Cloud SQL for Cloud Run
./scripts/setup-cloudsql.sh

# Set up Stripe webhook
./scripts/setup-stripe-webhook.sh
```

**Verify:**
- [ ] All scripts execute without errors
- [ ] Environment variables are correct
- [ ] Database connection succeeds
- [ ] Webhook secret is added to .env

### 3. Deploy to Cloud Run

```bash
# Deploy with automation script
./scripts/deploy.sh
```

**Verify:**
- [ ] Deployment succeeds
- [ ] Service URL is displayed
- [ ] Health check passes

**Alternative manual deployment:**
```bash
gcloud run deploy adcreatorpro \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars="$(cat .env | grep -v '^#' | tr '\n' ',')" \
  --add-cloudsql-instances="${CLOUD_SQL_CONNECTION_NAME}"
```

### 4. Configure Environment Variables in Cloud Run

If not using `./scripts/deploy.sh`, manually set environment variables:

```bash
gcloud run services update adcreatorpro \
  --region us-central1 \
  --set-env-vars="NODE_ENV=production,OPENAI_API_KEY=${OPENAI_API_KEY},..."
```

**Verify:**
- [ ] All required environment variables set
- [ ] No sensitive data in public logs
- [ ] Variables match local `.env` file

## Post-Deployment Verification

### Health Checks

- [ ] Health endpoint returns 200
  ```bash
  curl https://your-service-url.run.app/api/health
  ```
- [ ] Response includes `{"status":"ok"}`

### Frontend Testing

- [ ] Homepage loads without errors
- [ ] JavaScript bundle loads
- [ ] CSS styles apply correctly
- [ ] No 404 errors in browser console
- [ ] Mobile responsive design works
- [ ] Navigation menu works

### Authentication Testing

- [ ] Can create new account
- [ ] Receives verification email
- [ ] Email verification works
- [ ] Can log in with email/password
- [ ] Can log in with Google (if enabled)
- [ ] Can reset password
- [ ] Protected routes redirect to login
- [ ] Token refresh works
- [ ] Can log out

### Ad Generation Testing

- [ ] Can generate ad as guest user
- [ ] Can generate ad as authenticated user
- [ ] Multi-variation generation works
- [ ] All platforms work (Facebook, LinkedIn, Google, etc.)
- [ ] Brand profile auto-fills form
- [ ] Ads appear in history
- [ ] Copy to clipboard works
- [ ] Copy all variations works

### Payment Flow Testing

**Test Mode First:**
- [ ] Can create Stripe checkout session
- [ ] Redirects to Stripe Checkout
- [ ] Can complete payment with test card (4242 4242 4242 4242)
- [ ] Webhook processes payment
- [ ] User tier updated correctly
- [ ] Ads remaining incremented
- [ ] Payment logged in database
- [ ] Redirect to success page works

**Live Mode (when ready):**
- [ ] Switch to live Stripe keys
- [ ] Test with real payment (small amount)
- [ ] Verify webhook processing
- [ ] Check payment in Stripe Dashboard
- [ ] Verify user account updated

### Database Verification

```bash
# Run database tests
psql $DATABASE_URL -f tests/db-tests.sql
```

- [ ] All tables exist
- [ ] Indexes created correctly
- [ ] Sample data present (if seeded)
- [ ] No orphaned records
- [ ] Foreign keys enforced

### Monitoring Setup

- [ ] Cloud Logging enabled
- [ ] Error logs visible in GCP Console
- [ ] Request logs captured
- [ ] Database connection logs visible
- [ ] Stripe webhook logs visible

### Performance Testing

- [ ] Page load time < 2 seconds
- [ ] Ad generation time < 5 seconds
- [ ] API response time < 500ms (except generation)
- [ ] No memory leaks
- [ ] No CPU throttling

## Production Cutover

### DNS Configuration (if using custom domain)

- [ ] Domain registered
- [ ] DNS A record points to Cloud Run
- [ ] SSL certificate provisioned
- [ ] HTTPS enforced
- [ ] HTTP redirects to HTTPS
- [ ] www subdomain configured (if desired)

### Final Checks

- [ ] All test accounts removed
- [ ] Sample/dummy data cleared
- [ ] Stripe in live mode
- [ ] Analytics tracking enabled (if configured)
- [ ] Error tracking enabled (Sentry, etc., if configured)
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

### Go-Live

- [ ] Announce to beta users
- [ ] Monitor logs for errors
- [ ] Watch for failed payments
- [ ] Check user signup rate
- [ ] Monitor ad generation success rate
- [ ] Verify webhook deliveries

## Post-Launch Monitoring (First 24 Hours)

### Metrics to Watch

- [ ] Zero critical errors in Cloud Logging
- [ ] Ad generation success rate > 95%
- [ ] Payment success rate > 98%
- [ ] API uptime > 99.9%
- [ ] Average response time < 500ms
- [ ] No database connection errors
- [ ] No OpenAI API errors
- [ ] No Stripe webhook failures

### User Feedback

- [ ] Monitor user signups
- [ ] Check for support requests
- [ ] Review error reports
- [ ] Track conversion rates (signup → paid)
- [ ] Monitor subscription cancellations

## Rollback Plan

If critical issues occur:

### Quick Rollback

```bash
# Revert to previous revision
gcloud run services update-traffic adcreatorpro \
  --region us-central1 \
  --to-revisions PREVIOUS_REVISION=100
```

### Full Rollback

1. Identify last working revision:
   ```bash
   gcloud run revisions list --service adcreatorpro --region us-central1
   ```

2. Roll back to specific revision:
   ```bash
   gcloud run services update-traffic adcreatorpro \
     --region us-central1 \
     --to-revisions REVISION_NAME=100
   ```

3. Notify users of downtime
4. Investigate and fix issue
5. Redeploy when ready

## Troubleshooting Common Issues

### "Internal Server Error" on all endpoints

**Possible causes:**
- Database connection failed
- Environment variables missing
- Firebase credentials invalid

**Solutions:**
1. Check Cloud Run logs:
   ```bash
   gcloud run services logs read adcreatorpro --region us-central1 --limit 50
   ```
2. Verify environment variables:
   ```bash
   gcloud run services describe adcreatorpro --region us-central1
   ```
3. Test database connection locally
4. Verify Firebase service account key

### Stripe webhook not processing

**Possible causes:**
- Webhook secret mismatch
- Webhook URL incorrect
- Events not subscribed

**Solutions:**
1. Check Stripe Dashboard > Developers > Webhooks
2. Verify webhook URL matches Cloud Run URL
3. Check webhook secret in environment variables
4. Resend failed webhook events manually

### OpenAI API errors

**Possible causes:**
- API key invalid
- Insufficient credits
- Rate limit exceeded

**Solutions:**
1. Verify API key in OpenAI dashboard
2. Check account balance
3. Implement retry logic (already in code)
4. Monitor usage and set up billing alerts

### Database connection timeout

**Possible causes:**
- Cloud SQL instance stopped
- Connection name incorrect
- IAM permissions missing

**Solutions:**
1. Check Cloud SQL instance status
2. Verify `CLOUD_SQL_CONNECTION_NAME`
3. Ensure service account has Cloud SQL Client role
4. Check VPC connector configuration

## Security Checklist

- [ ] HTTPS enforced
- [ ] Environment variables not logged
- [ ] Firebase tokens validated on backend
- [ ] SQL injection prevented (parameterized queries)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (for guest users)
- [ ] Sensitive data encrypted at rest
- [ ] Database backups enabled
- [ ] No API keys in client-side code
- [ ] Stripe webhook signature verified

## Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance (if serving EU users)
- [ ] Cookie consent implemented (if using analytics)
- [ ] Stripe payment processing compliant

## Maintenance Plan

### Daily
- Monitor error logs
- Check payment success rate
- Review user feedback

### Weekly
- Review performance metrics
- Update dependencies (security patches)
- Analyze user behavior (analytics)
- Check database size and optimize if needed

### Monthly
- Review and optimize costs
- Update documentation
- Plan feature releases
- Conduct security audit

## Success Criteria

Deployment is successful when:

✅ All health checks pass
✅ Users can sign up and log in
✅ Ad generation works for all platforms
✅ Payments process successfully
✅ Webhooks process without errors
✅ Zero critical errors in first 24 hours
✅ Page load times meet performance targets
✅ All monitoring systems active

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Cloud Run Service URL:** _______________

**Issues Encountered:** _______________

**Resolution:** _______________
