# Monitoring and Observability Guide

This guide covers setting up monitoring, logging, and alerting for AdCreatorPro in production.

## Google Cloud Monitoring

### Cloud Run Metrics

Google Cloud automatically collects metrics for Cloud Run services.

#### Access Cloud Run Metrics

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Run**
3. Select your service: `adcreatorpro`
4. Click **METRICS** tab

#### Key Metrics to Monitor

**Request Metrics:**
- **Request count**: Total number of requests
- **Request latencies**: P50, P95, P99 response times
- **Error rate**: 4xx and 5xx responses
- **Billable request time**: Actual compute time

**Resource Metrics:**
- **Container instance count**: Number of running instances
- **CPU utilization**: % CPU usage per instance
- **Memory utilization**: MB of memory used
- **Startup latency**: Time to start new instances

**Target Values:**
- Request latency (P95): < 1000ms
- Error rate: < 1%
- CPU utilization: < 80%
- Memory utilization: < 400MB

### Create Custom Dashboard

1. Go to **Monitoring** > **Dashboards** > **Create Dashboard**
2. Add these charts:

**Chart 1: Request Rate**
- Resource type: Cloud Run Revision
- Metric: `run.googleapis.com/request_count`
- Aggregation: Rate

**Chart 2: Error Rate**
- Metric: `run.googleapis.com/request_count`
- Filter: `response_code_class="4xx"` OR `response_code_class="5xx"`
- Aggregation: Rate

**Chart 3: Response Latency**
- Metric: `run.googleapis.com/request_latencies`
- Aggregation: 95th percentile

**Chart 4: Memory Usage**
- Metric: `run.googleapis.com/container/memory/utilizations`
- Aggregation: Mean

**Chart 5: Active Instances**
- Metric: `run.googleapis.com/container/instance_count`
- Aggregation: Sum

## Cloud Logging

### Access Logs

1. Go to **Cloud Logging** > **Logs Explorer**
2. Filter by resource: `Cloud Run Revision` > `adcreatorpro`

### Log Severity Levels

The application uses these log levels:
- **DEBUG**: Development information
- **INFO**: Normal operations (startup, requests)
- **WARNING**: Degraded performance (retries, fallbacks)
- **ERROR**: Operation failures (API errors, validation failures)
- **CRITICAL**: System failures (database down, auth failure)

### Useful Log Queries

**All Errors (Last 24 Hours)**
```
resource.type="cloud_run_revision"
resource.labels.service_name="adcreatorpro"
severity>=ERROR
timestamp>="2024-01-15T00:00:00Z"
```

**OpenAI API Errors**
```
resource.type="cloud_run_revision"
resource.labels.service_name="adcreatorpro"
jsonPayload.message=~"OpenAI.*error"
severity>=ERROR
```

**Stripe Webhook Events**
```
resource.type="cloud_run_revision"
resource.labels.service_name="adcreatorpro"
httpRequest.requestUrl=~"/api/stripe/webhook"
```

**Failed Authentication Attempts**
```
resource.type="cloud_run_revision"
resource.labels.service_name="adcreatorpro"
jsonPayload.message=~"Unauthorized|Invalid token"
```

**Slow Requests (> 3 seconds)**
```
resource.type="cloud_run_revision"
resource.labels.service_name="adcreatorpro"
httpRequest.latency>="3s"
```

### Export Logs (Long-term Storage)

For compliance or long-term analysis, export logs to Cloud Storage or BigQuery:

1. Go to **Cloud Logging** > **Log Router**
2. Click **Create Sink**
3. Configure sink:
   - **Sink name**: `adcreatorpro-error-logs`
   - **Sink destination**: Cloud Storage or BigQuery
   - **Filter**:
     ```
     resource.type="cloud_run_revision"
     resource.labels.service_name="adcreatorpro"
     severity>=ERROR
     ```
4. Click **Create Sink**

## Alerting Policies

Set up alerts to get notified of issues before users report them.

### Create Alert Policy

1. Go to **Monitoring** > **Alerting**
2. Click **Create Policy**

### Recommended Alert Policies

#### Alert 1: High Error Rate

**Condition:**
- Metric: `run.googleapis.com/request_count`
- Filter: `response_code_class="5xx"`
- Threshold: > 5 errors per minute
- Duration: 5 minutes

**Notification:**
- Email to: your-email@example.com
- Severity: Critical

#### Alert 2: High Response Latency

**Condition:**
- Metric: `run.googleapis.com/request_latencies`
- Aggregation: 95th percentile
- Threshold: > 3000ms
- Duration: 10 minutes

**Notification:**
- Email to: your-email@example.com
- Severity: Warning

#### Alert 3: Database Connection Failures

**Condition:**
- Log query:
  ```
  resource.type="cloud_run_revision"
  resource.labels.service_name="adcreatorpro"
  jsonPayload.message=~"Database connection error"
  severity=ERROR
  ```
- Threshold: > 0 occurrences
- Duration: 1 minute

**Notification:**
- Email + SMS (if configured)
- Severity: Critical

#### Alert 4: OpenAI API Failures

**Condition:**
- Log query:
  ```
  resource.type="cloud_run_revision"
  resource.labels.service_name="adcreatorpro"
  jsonPayload.message=~"OpenAI.*error"
  severity>=ERROR
  ```
- Threshold: > 10 occurrences per hour
- Duration: 5 minutes

**Notification:**
- Email to: your-email@example.com
- Severity: Warning

#### Alert 5: Stripe Webhook Failures

**Condition:**
- Log query:
  ```
  resource.type="cloud_run_revision"
  resource.labels.service_name="adcreatorpro"
  httpRequest.requestUrl=~"/api/stripe/webhook"
  httpRequest.status>=400
  ```
- Threshold: > 0 occurrences
- Duration: 1 minute

**Notification:**
- Email to: your-email@example.com
- Severity: Critical

### Set Up Notification Channels

1. Go to **Monitoring** > **Alerting** > **Edit notification channels**
2. Configure:
   - **Email**: Add your email
   - **SMS** (optional): Add phone number
   - **Slack** (optional): Connect workspace
   - **PagerDuty** (optional): For 24/7 coverage

## Application Performance Monitoring

### Cloud Trace

Cloud Trace automatically captures request traces for Cloud Run.

**View Traces:**
1. Go to **Trace** > **Trace List**
2. Filter by service: `adcreatorpro`
3. Analyze slow requests

**Identify Bottlenecks:**
- Database queries taking too long
- OpenAI API response time
- Slow middleware execution

### Cloud Profiler (Optional)

For in-depth performance analysis:

1. Install Cloud Profiler:
   ```bash
   npm install @google-cloud/profiler
   ```

2. Enable in `server/index.ts`:
   ```typescript
   import { start as startProfiler } from '@google-cloud/profiler';

   if (process.env.NODE_ENV === 'production') {
     startProfiler({
       serviceContext: {
         service: 'adcreatorpro',
         version: '1.0.0'
       }
     });
   }
   ```

3. View profiles in **Profiler** console

## Database Monitoring

### Cloud SQL Metrics

1. Go to **SQL** > Select instance > **Monitoring**
2. Monitor:
   - CPU usage
   - Memory usage
   - Disk usage
   - Connections
   - Query performance

### Database Query Performance

**Long-running Queries:**
```sql
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state != 'idle';
```

**Connection Pool Status:**
```sql
SELECT
  count(*) as total_connections,
  sum(case when state = 'active' then 1 else 0 end) as active,
  sum(case when state = 'idle' then 1 else 0 end) as idle
FROM pg_stat_activity
WHERE datname = 'adcreatorpro';
```

**Table Sizes:**
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Database Alerts

**Alert: High CPU Usage**
- Threshold: > 80% for 10 minutes
- Action: Upgrade instance or optimize queries

**Alert: Low Disk Space**
- Threshold: < 20% free
- Action: Increase storage or clean up old data

**Alert: High Connection Count**
- Threshold: > 80% of max connections
- Action: Investigate connection leaks

## External Monitoring Services

### Uptime Monitoring

Use external service to monitor uptime from outside GCP:

**Options:**
- **Google Cloud Monitoring Uptime Checks**: Free, integrated
- **Pingdom**: Paid, detailed reports
- **UptimeRobot**: Free tier available
- **StatusCake**: Free tier available

**Set up GCP Uptime Check:**
1. Go to **Monitoring** > **Uptime checks**
2. Click **Create Uptime Check**
3. Configure:
   - **Title**: AdCreatorPro Health Check
   - **Protocol**: HTTPS
   - **Resource Type**: URL
   - **Hostname**: your-service-url.run.app
   - **Path**: /api/health
   - **Check frequency**: 1 minute
4. Set up alert notification

### Synthetic Monitoring

Monitor critical user flows:

**Create Synthetic Monitors:**
1. Use Cloud Monitoring or third-party service
2. Simulate user actions:
   - Sign up flow
   - Login flow
   - Ad generation
   - Payment checkout
3. Alert on failures

## Error Tracking (Optional)

### Sentry Integration

For advanced error tracking and debugging:

1. **Create Sentry account** at [sentry.io](https://sentry.io)

2. **Install Sentry SDK:**
   ```bash
   npm install @sentry/node @sentry/react
   ```

3. **Backend Integration** (`server/index.ts`):
   ```typescript
   import * as Sentry from '@sentry/node';

   if (process.env.NODE_ENV === 'production') {
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       environment: 'production',
       tracesSampleRate: 0.1
     });
   }

   // Error handler middleware
   app.use(Sentry.Handlers.errorHandler());
   ```

4. **Frontend Integration** (`client/src/main.tsx`):
   ```typescript
   import * as Sentry from '@sentry/react';

   if (import.meta.env.PROD) {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       integrations: [new Sentry.BrowserTracing()],
       tracesSampleRate: 0.1
     });
   }
   ```

5. **View errors** in Sentry dashboard with:
   - Stack traces
   - User context
   - Breadcrumbs (user actions leading to error)
   - Performance insights

## Business Metrics

Monitor key business metrics:

### Usage Metrics

Track in `usage_logs` table:
- Ad generations per day
- Platform distribution (Facebook vs LinkedIn, etc.)
- Variations requested
- Brand profile usage

**Query:**
```sql
SELECT
  DATE(created_at) as date,
  action,
  COUNT(*) as count
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date, action
ORDER BY date DESC;
```

### Revenue Metrics

Track in `payments` table:
- Daily revenue
- MRR (Monthly Recurring Revenue)
- Subscription vs one-time revenue
- Churn rate

**Query:**
```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  payment_type,
  COUNT(*) as transaction_count,
  SUM(amount) / 100.0 as total_usd
FROM payments
WHERE status = 'succeeded'
GROUP BY month, payment_type
ORDER BY month DESC;
```

### User Metrics

Track in `users` table:
- New signups per day
- Tier distribution
- Active users

**Query:**
```sql
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as new_users,
  SUM(CASE WHEN tier = 'free' THEN 1 ELSE 0 END) as free_tier,
  SUM(CASE WHEN tier != 'free' THEN 1 ELSE 0 END) as paid_tier
FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY signup_date
ORDER BY signup_date DESC;
```

## Cost Monitoring

### Set Up Budget Alerts

1. Go to **Billing** > **Budgets & alerts**
2. Click **Create budget**
3. Configure:
   - **Name**: AdCreatorPro Monthly Budget
   - **Budget amount**: $100 (or your limit)
   - **Alert thresholds**: 50%, 90%, 100%
   - **Notifications**: Email

### Monitor Costs by Service

Track costs for:
- Cloud Run: Compute time
- Cloud SQL: Database instance + storage
- Networking: Egress traffic
- OpenAI API: External service
- Stripe: Transaction fees

**View Cost Breakdown:**
- Go to **Billing** > **Reports**
- Filter by project and service

## Performance Benchmarks

### Expected Performance

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Homepage load time | < 2s | > 3s |
| Ad generation time | < 5s | > 10s |
| API response time (non-gen) | < 500ms | > 1s |
| Database query time | < 100ms | > 500ms |
| Uptime | > 99.9% | < 99.5% |
| Error rate | < 0.1% | > 1% |

### Performance Testing

**Load Testing with Artillery:**

```bash
npm install -g artillery

# Create load test config
cat > load-test.yml <<EOF
config:
  target: "https://your-service-url.run.app"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Generate Ad"
    flow:
      - post:
          url: "/api/generate-ad"
          json:
            product: "Test product"
            platform: "Facebook/Instagram"
EOF

# Run load test
artillery run load-test.yml
```

## Monitoring Checklist

### Initial Setup
- [ ] Cloud Run dashboard configured
- [ ] Custom monitoring dashboard created
- [ ] Log exports configured
- [ ] Alert policies created
- [ ] Notification channels configured
- [ ] Uptime checks configured
- [ ] Budget alerts set

### Daily Monitoring
- [ ] Check error logs
- [ ] Review alert notifications
- [ ] Monitor payment success rate
- [ ] Check user signup rate

### Weekly Monitoring
- [ ] Review performance metrics
- [ ] Analyze slow queries
- [ ] Check database size growth
- [ ] Review cost reports
- [ ] Analyze user behavior patterns

### Monthly Monitoring
- [ ] Review and optimize alert policies
- [ ] Analyze monthly costs
- [ ] Review security logs
- [ ] Performance optimization opportunities
- [ ] Capacity planning

## Incident Response

### Incident Severity Levels

**P0 - Critical (< 15 min response)**
- Service completely down
- Database unavailable
- Payment processing broken

**P1 - High (< 1 hour response)**
- Major feature broken
- High error rate (> 5%)
- Severe performance degradation

**P2 - Medium (< 4 hours response)**
- Minor feature broken
- Moderate error rate (1-5%)
- Performance issues affecting some users

**P3 - Low (< 24 hours response)**
- Cosmetic issues
- Documentation errors
- Minor UX improvements

### Incident Response Playbook

1. **Acknowledge**: Respond to alert within SLA
2. **Assess**: Determine severity and impact
3. **Mitigate**: Stop the bleeding (rollback, scale up, etc.)
4. **Investigate**: Root cause analysis
5. **Resolve**: Deploy fix
6. **Document**: Post-mortem report
7. **Prevent**: Update monitoring/alerting to catch earlier

## Resources

- [Cloud Run Monitoring Documentation](https://cloud.google.com/run/docs/monitoring)
- [Cloud Logging Documentation](https://cloud.google.com/logging/docs)
- [Cloud Monitoring Documentation](https://cloud.google.com/monitoring/docs)
- [Cloud SQL Monitoring](https://cloud.google.com/sql/docs/postgres/monitor-instance)
