import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://skooltbvismletpanrwq.supabase.co';
// anon key is safe to expose — RLS policies enforce data isolation per user
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrb29sdGJ2aXNtbGV0cGFucndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0Mjc5OTIsImV4cCI6MjA5NzAwMzk5Mn0.blE56wzcah1qV2CkcQGae6Y2DKds3wRMMUBBUrHD6nQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
