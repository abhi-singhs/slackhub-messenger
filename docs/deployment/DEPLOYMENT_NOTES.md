# Deployment Configuration

This document explains the deployment setup for the Slackhub application.

## Key Fixes Applied

### 1. JSON Syntax Errors Fixed
- Removed trailing comma in `tsconfig.json` 
- Ensured all JSON files have valid syntax

### 2. Supabase Configuration Improved
- Updated `.env` file with proper placeholder values
- Added configuration validation in `src/lib/supabase.ts`
- Added graceful handling of missing/invalid Supabase credentials
- Created setup guide in `SUPABASE_SETUP.md`

### 3. Environment Variables
The application now uses validated environment variables:
```env
VITE_SUPABASE_URL=https://example-project.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-key-replace-with-actual
```

### 4. Configuration Validation
- Added `isSupabaseConfigured()` function to check valid setup
- Added `getConfigurationMessage()` for user feedback
- AuthComponent now shows configuration warnings

## Next Steps for Users

1. **Set up Supabase project** following `SUPABASE_SETUP.md`
2. **Update `.env` file** with actual Supabase credentials
3. **Run database schema** from `supabase-schema.sql`
4. **Configure OAuth providers** (GitHub required, Google optional)

## Deployment Status

The application should now deploy successfully with placeholder credentials and will guide users through proper Supabase setup when they access the app.

## GitHub Pages Deployment

This project ships with a GitHub Actions workflow that builds and publishes to GitHub Pages.

Setup steps:

1. In your GitHub repo, go to Settings → Pages and set Source to "GitHub Actions".
2. Add repository secrets (Settings → Secrets and variables → Actions):
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
3. Push to `main` (or run the workflow manually). The workflow will:
	- Install dependencies and build with Vite using base path `/<repo>/`
	- Copy `dist/index.html` to `dist/404.html` for SPA fallback
	- Add `.nojekyll` to prevent Jekyll processing
	- Upload and deploy the artifact to GitHub Pages

URLs:
- Default: `https://<owner>.github.io/<repo>/` (e.g., `https://abhi-singhs.github.io/slackhub-messenger/`)

Notes:
- Vite’s base path must match the Pages path; the workflow derives it from the repository name.
- If you use a custom domain, you can set base to `/` by building with `--base=/` and adjusting the workflow accordingly.
- All Supabase credentials are read from repository secrets at build time; no server-side keys are used.