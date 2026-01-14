-- AdCreatorPro Database Verification Tests
-- Run with: psql $DATABASE_URL -f tests/db-tests.sql

\echo '\n======================================'
\echo 'AdCreatorPro Database Tests'
\echo '======================================'
\echo ''

-- 1. Check if all tables exist
\echo '1. Checking Tables'
\echo '------------------'
SELECT
  COUNT(*) as table_count,
  STRING_AGG(table_name, ', ') as tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

\echo ''

-- 2. Check users table
\echo '2. Users Table Statistics'
\echo '-------------------------'
SELECT
  COUNT(*) as total_users,
  COUNT(DISTINCT tier) as unique_tiers,
  SUM(CASE WHEN tier = 'free' THEN 1 ELSE 0 END) as free_users,
  SUM(CASE WHEN tier = 'starter' THEN 1 ELSE 0 END) as starter_users,
  SUM(CASE WHEN tier = 'pro' THEN 1 ELSE 0 END) as pro_users,
  SUM(CASE WHEN tier = 'business' THEN 1 ELSE 0 END) as business_users
FROM users;

\echo ''

-- 3. Check brand profiles
\echo '3. Brand Profiles Statistics'
\echo '----------------------------'
SELECT
  COUNT(*) as total_profiles,
  COUNT(DISTINCT user_id) as users_with_profiles,
  SUM(CASE WHEN is_default = true THEN 1 ELSE 0 END) as default_profiles
FROM brand_profiles;

\echo ''

-- 4. Check ads
\echo '4. Ads Statistics'
\echo '-----------------'
SELECT
  COUNT(*) as total_ads,
  COUNT(DISTINCT user_id) as users_who_generated_ads,
  COUNT(DISTINCT platform) as platforms_used
FROM ads;

\echo ''
\echo '4a. Ads by Platform'
SELECT
  platform,
  COUNT(*) as ad_count
FROM ads
GROUP BY platform
ORDER BY ad_count DESC;

\echo ''
\echo '4b. Ads by AI Model'
SELECT
  ai_model,
  COUNT(*) as ad_count
FROM ads
GROUP BY ai_model;

\echo ''
\echo '4c. Variation Distribution'
SELECT
  variation_number,
  COUNT(*) as count
FROM ads
GROUP BY variation_number
ORDER BY variation_number;

\echo ''

-- 5. Check payments
\echo '5. Payment Statistics'
\echo '---------------------'
SELECT
  COUNT(*) as total_payments,
  COUNT(DISTINCT user_id) as paying_users,
  SUM(CASE WHEN payment_type = 'subscription' THEN 1 ELSE 0 END) as subscriptions,
  SUM(CASE WHEN payment_type = 'one_time' THEN 1 ELSE 0 END) as one_time_payments,
  SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) / 100.0 as total_revenue_usd
FROM payments;

\echo ''
\echo '5a. Revenue by Payment Type'
SELECT
  payment_type,
  COUNT(*) as count,
  SUM(amount) / 100.0 as total_usd
FROM payments
WHERE status = 'succeeded'
GROUP BY payment_type;

\echo ''

-- 6. Check usage logs
\echo '6. Usage Logs Statistics'
\echo '------------------------'
SELECT
  COUNT(*) as total_logs,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT action) as unique_actions
FROM usage_logs;

\echo ''
\echo '6a. Top Actions'
SELECT
  action,
  COUNT(*) as count
FROM usage_logs
GROUP BY action
ORDER BY count DESC
LIMIT 10;

\echo ''

-- 7. Check indexes
\echo '7. Database Indexes'
\echo '-------------------'
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''

-- 8. Data integrity checks
\echo '8. Data Integrity Checks'
\echo '------------------------'

-- Check for orphaned brand profiles
SELECT
  'Orphaned Brand Profiles' as check_name,
  COUNT(*) as count
FROM brand_profiles bp
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = bp.user_id);

\echo ''

-- Check for orphaned ads
SELECT
  'Orphaned Ads' as check_name,
  COUNT(*) as count
FROM ads a
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id);

\echo ''

-- Check for users with negative ads_remaining
SELECT
  'Users with Negative Ads Remaining' as check_name,
  COUNT(*) as count
FROM users
WHERE ads_remaining < 0;

\echo ''

-- 9. Recent activity
\echo '9. Recent Activity (Last 24 Hours)'
\echo '-----------------------------------'

\echo '9a. New Users'
SELECT COUNT(*) as new_users
FROM users
WHERE created_at > NOW() - INTERVAL '24 hours';

\echo ''
\echo '9b. Ads Generated'
SELECT COUNT(*) as ads_generated
FROM ads
WHERE created_at > NOW() - INTERVAL '24 hours';

\echo ''
\echo '9c. Payments'
SELECT COUNT(*) as payments
FROM payments
WHERE created_at > NOW() - INTERVAL '24 hours';

\echo ''

-- 10. Database size
\echo '10. Database Size'
\echo '-----------------'
SELECT
  pg_database.datname as database_name,
  pg_size_pretty(pg_database_size(pg_database.datname)) as size
FROM pg_database
WHERE datname = current_database();

\echo ''
\echo 'Table Sizes:'
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo ''
\echo '======================================'
\echo 'Database Tests Complete!'
\echo '======================================'
\echo ''
