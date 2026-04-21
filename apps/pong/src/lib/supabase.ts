import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://tzktdancflpwkchftzyo.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6a3RkYW5jZmxwd2tjaGZ0enlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTYzODEsImV4cCI6MjA5MTc5MjM4MX0.g72Dz-Hlp7i1zY05UgLqcvtEfyMYHybRWxDdEclDaSc';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
