import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side public Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin/privileged Supabase client (only use in API routes, server actions, or getStaticProps)
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey)
  : supabase;
