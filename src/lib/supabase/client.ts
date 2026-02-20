import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Provide fallback values during build time so the analyzer doesn't crash
export const supabase = createClient(
    env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);
