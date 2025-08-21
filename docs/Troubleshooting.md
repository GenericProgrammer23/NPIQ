# NPIQ Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### "Not a member" - User sees no data
**Problem**: User is authenticated but sees empty dashboard/lists
**Cause**: User is not a member of any organization
**Solution**: 
1. Complete the Setup Wizard to create an organization
2. Or have an admin add you to an existing organization

#### "Writes blocked" - Cannot create data
**Problem**: User cannot create providers, locations, etc.
**Cause**: User lacks sufficient permissions or is not authenticated
**Solution**:
1. Ensure you're signed in (check for auth status indicator)
2. Verify your role (admin/manager required for most write operations)
3. Check that you're a member of the organization

#### Authentication errors on sign in
**Problem**: Sign in fails with error messages
**Common Causes & Solutions**:
- **Invalid credentials**: Double-check email/password
- **Email not confirmed**: Check email for confirmation link
- **Account doesn't exist**: Use "Sign Up" instead of "Sign In"

### Database Connection Issues

#### "Running in Local Mode" banner
**Problem**: App shows local mode instead of connecting to Supabase
**Cause**: Missing or incorrect environment variables
**Solution**:
1. Check `.env` file exists with correct Supabase URL and anon key
2. Restart development server after adding environment variables
3. Verify Supabase project is active and accessible

#### "Supabase request failed" errors
**Problem**: Database queries fail with 400/500 errors
**Common Causes & Solutions**:
- **RLS blocking access**: Ensure user is member of organization
- **Missing migrations**: Run database migrations in Supabase dashboard
- **Invalid UUID**: Check that organization/user IDs are valid UUIDs

### Setup Wizard Issues

#### Setup Wizard appears repeatedly
**Problem**: Wizard shows even after completing setup
**Cause**: Organization membership not created properly
**Solution**:
1. Check `org_members` table has entry for your user
2. Verify `user_id` matches your authenticated user ID
3. Re-run setup wizard to create membership

#### "Failed to create organization" error
**Problem**: Organization creation fails in setup wizard
**Common Causes & Solutions**:
- **Database permissions**: Ensure RLS policies allow organization creation
- **Missing authentication**: Sign out and sign back in
- **Network issues**: Check internet connection and Supabase status

### Migration Issues

#### "Already exists" errors when running migrations
**Problem**: Migration fails with "relation already exists" or similar
**Cause**: Previous partial migration left objects in database
**Solution**:
1. Migrations are idempotent - this shouldn't happen with current migrations
2. If using old migrations, run the cleanup script first
3. Contact support if issue persists

#### Demo data not appearing
**Problem**: Demo migration runs but no data visible
**Cause**: User ID in demo data doesn't match authenticated user
**Solution**:
1. Update `user_id` in demo migration to your actual user ID
2. Find your user ID: `SELECT id FROM auth.users WHERE email = 'your@email.com'`
3. Re-run demo migration with correct user ID

### Performance Issues

#### Slow loading times
**Problem**: Dashboard and lists load slowly
**Common Causes & Solutions**:
- **Large datasets**: Implement pagination for large provider lists
- **Missing indexes**: Ensure database indexes are created by migrations
- **Network latency**: Consider geographic proximity to Supabase region

#### App crashes or freezes
**Problem**: Application becomes unresponsive
**Common Causes & Solutions**:
- **Memory issues**: Refresh browser tab
- **JavaScript errors**: Check browser console for error messages
- **Infinite loops**: Clear browser cache and reload

### Development Issues

#### Environment variables not loading
**Problem**: `.env` variables not accessible in app
**Solution**:
1. Ensure variables start with `VITE_` prefix
2. Restart development server after changing `.env`
3. Check `.env` file is in project root directory

#### Local development server won't start
**Problem**: `npm run dev` fails or shows errors
**Common Solutions**:
1. Delete `node_modules` and run `npm install`
2. Check Node.js version compatibility
3. Clear npm cache: `npm cache clean --force`

## Getting Help

### Debug Information to Collect

When reporting issues, please include:

1. **Environment**:
   - Operating system
   - Node.js version
   - Browser and version
   - Local or remote mode

2. **Error Details**:
   - Exact error message
   - Browser console errors
   - Network tab errors (for API issues)

3. **Steps to Reproduce**:
   - What you were trying to do
   - Steps that led to the error
   - Expected vs actual behavior

### Diagnostic Commands

```bash
# Check environment variables
echo $VITE_SUPABASE_URL

# Test database connection (in browser console)
await supabase.from('organizations').select('count')

# Check authentication status (in browser console)  
await supabase.auth.getUser()

# Verify user membership (in browser console)
await supabase.from('org_members').select('*')
```

### Reset Procedures

#### Complete Local Reset
```bash
# Clear browser data
# 1. Open browser dev tools
# 2. Application/Storage tab
# 3. Clear all local storage and session storage

# Reset development environment
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Database Reset (Local Supabase)
```bash
supabase db reset
# Re-run migrations through dashboard
```

#### Account Reset (Remote)
1. Sign out of application
2. Delete user account in Supabase dashboard (if needed)
3. Sign up with new account
4. Complete setup wizard

## Contact Support

If you continue experiencing issues:

1. Check the [GitHub Issues](https://github.com/your-repo/npiq/issues) for similar problems
2. Create a new issue with debug information
3. Include steps to reproduce and expected behavior