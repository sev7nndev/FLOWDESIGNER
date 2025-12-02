# 🧪 Flow Designer Backend Testing Guide

## 🔧 Prerequisites
- Backend server running on http://localhost:3001
- Supabase configured with proper environment variables
- Test user accounts created

## 📋 Test Commands

### 1. Test Health Check
```bash
curl http://localhost:3001/
```

### 2. Test Owner Metrics (requires owner token)
```bash
# First, get a valid JWT token from your authenticated session
# Then replace YOUR_JWT_TOKEN with the actual token

curl -X GET \
  http://localhost:3001/api/owner/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "planCounts": {
    "free": 5,
    "starter": 3,
    "pro": 2
  },
  "statusCounts": {
    "on": 8,
    "paused": 1,
    "cancelled": 1
  },
  "clients": [
    {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "plan": "free",
      "status": "on"
    }
  ],
  "mpConnectionStatus": "disconnected"
}
```

### 3. Test User Usage
```bash
curl -X GET \
  http://localhost:3001/api/usage/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "role": "free",
  "current": 2,
  "limit": 3,
  "isUnlimited": false,
  "usagePercentage": 66.67,
  "isBlocked": false
}
```

### 4. Test Image Generation (with quota check)
```bash
curl -X POST \
  http://localhost:3001/api/generation/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promptInfo": {
      "companyName": "Test Company",
      "phone": "(11) 99999-9999",
      "addressStreet": "Test Street",
      "addressNumber": "123",
      "addressNeighborhood": "Center",
      "addressCity": "São Paulo",
      "details": "Professional services and promotions"
    }
  }'
```

### 5. Test Admin Get All Images
```bash
curl -X GET \
  http://localhost:3001/api/admin/images \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 6. Test Support Recipient
```bash
curl -X GET \
  http://localhost:3001/api/generation/support-recipient \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

<dyad-write path="DEPLOYMENT_CHECKLIST.md" description="Complete deployment checklist for the fixed backend">
# 🚀 Flow Designer Deployment Checklist

## 📋 Pre-Deployment Setup

### 1. Environment Variables
Ensure all required environment variables are set:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Google AI Studio
GEMINI_API_KEY=your-gemini-api-key

# Mercado Pago (Optional)
MP_CLIENT_ID=your-mp-client-id
MP_CLIENT_SECRET=your-mp-secret
MP_ACCESS_TOKEN=your-mp-token

# Application URLs
FRONTEND_URL=https://your-frontend.com
BACKEND_URL=https://your-backend.com
```

### 2. Supabase Database Setup
Run these SQL commands in your Supabase SQL editor:

```sql
-- Create the profiles_with_email view
CREATE OR REPLACE VIEW public.profiles_with_email AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.role,
    p.status,
    p.updated_at,
    au.email
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- Create function to get owner metrics
CREATE OR REPLACE FUNCTION public.get_owner_metrics(owner_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    is_owner boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = owner_id AND role = 'owner'
    ) INTO is_owner;
    
    IF NOT is_owner THEN
        RAISE EXCEPTION 'Access denied. Only owners can access these metrics.';
    END IF;

    SELECT json_build_object(
        'planCounts', json_build_object(
            'free', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE role = 'free'), 0),
            'starter', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE role = 'starter'), 0),
            'pro', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE role = 'pro'), 0)
        ),
        'statusCounts', json_build_object(
            'on', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE status = 'on'), 0),
            'paused', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE status = 'paused'), 0),
            'cancelled', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE status = 'cancelled'), 0)
        ),
        'clients', COALESCE((
            SELECT json_agg(json_build_object(
                'id', id,
                'name', COALESCE(first_name || ' ' || last_name, 'N/A'),
                'email', email,
                'plan', role,
                'status', status
            ))
            FROM public.profiles_with_email
            WHERE role IN ('free', 'starter', 'pro')
            ORDER BY updated_at DESC
        ), '[]'::json),
        'mpConnectionStatus', 'disconnected'
    ) INTO result;

    RETURN result;
END;
$$;

-- Create function to increment user usage
CREATE OR REPLACE FUNCTION public.increment_user_usage(user_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_usage
  SET 
    current_usage = current_usage + 1,
    updated_at = NOW()
  WHERE user_id = user_id_input;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.profiles_with_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_usage TO authenticated;
```

### 3. Storage Buckets Setup
Create these storage buckets in Supabase:

1. **generated-arts** - For user generated images
2. **landing-carousel** - For landing page images

Set policies:
- Public read access for landing-carousel
- User-specific access for generated-arts

### 4. RLS Policies Verification
Ensure these RLS policies exist:

```sql
-- Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow owners to view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- User usage policies
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" ON public.user_usage
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON public.user_usage
FOR ALL TO service_role USING (true) WITH CHECK (true);
```

## 🚀 Deployment Steps

### 1. Backend Deployment
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start
```

### 2. Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to your hosting service (Vercel, Netlify, etc.)
```

### 3. Post-Deployment Verification
Run these tests after deployment:

```bash
# Test health endpoint
curl https://your-backend.com/

# Test owner metrics (requires auth)
curl -X GET \
  https://your-backend.com/api/owner/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test image generation
curl -X POST \
  https://your-backend.com/api/generation/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"promptInfo": {"companyName": "Test", "details": "Test service"}}'
```

## 🔍 Monitoring Setup

### 1. Application Monitoring
Add these environment variables for monitoring:
```bash
# Optional: Sentry for error tracking
SENTRY_DSN=your-sentry-dsn

# Optional: Log level
LOG_LEVEL=info
```

### 2. Health Checks
Set up health check endpoints:
- `GET /` - Basic health check
- `GET /api/health` - Detailed health check (if implemented)

## 🚨 Common Issues & Solutions

### Issue 1: 500 Error on Owner Metrics
**Solution**: Check if the `get_owner_metrics` function exists and the user has owner role.

### Issue 2: Quota Not Working
**Solution**: Verify the `increment_user_usage` function and user_usage table RLS policies.

### Issue 3: Image Generation Fails
**Solution**: Check Google AI Studio API key and quota limits.

### Issue 4: Authentication Errors
**Solution**: Verify JWT tokens and Supabase anon key configuration.

## 📊 Performance Optimization

### 1. Database Indexes
```sql
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_created_at ON images(created_at);
```

### 2. Caching Strategy
- Implement Redis caching for frequently accessed data
- Use CDN for static assets
- Enable browser caching for images

## 🔐 Security Checklist

- [ ] All environment variables are set
- [ ] RLS policies are properly configured
- [ ] Service role key is only used server-side
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation is in place
- [ ] Error messages don't expose sensitive data

## 📞 Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test with the provided curl commands
4. Check Supabase dashboard for database errors

## ✅ Final Verification

After deployment, verify:
- [ ] Health check endpoint responds
- [ ] Owner can see all users in metrics
- [ ] Image generation works with quota checks
- [ ] Authentication works properly
- [ ] All API endpoints respond correctly
- [ ] No 500 errors in logs