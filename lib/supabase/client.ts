import { createClient } from '@supabase/supabase-js';

// Use placeholders if env vars are missing during build time to prevent "Error: supabaseUrl is required" crash.
// Note: Actual data fetching will fail/return empty, but the build will succeed.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // Only log warn in development or build to avoid noise in production if purposefully hidden
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Missing Supabase Environment Variables. Using placeholders.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
