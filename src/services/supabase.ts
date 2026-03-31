/**
 * Supabase client for Ghost Tac Toe online features.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://zfgarlonyoesdlwebnbt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZ2FybG9ueW9lc2Rsd2VibmJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MjcwNDYsImV4cCI6MjA5MDUwMzA0Nn0.SXsH1bMt4_x9xOpIzihLvr0sgGSG5hDcW7KTktPj5FA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
