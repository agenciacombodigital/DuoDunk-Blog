import { createClient } from '@supabase/supabase-js';

// Fallback values from Dyad context
const FALLBACK_URL = 'https://brerfpcfkyptkzygyzxl.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTM2MjUsImV4cCI6MjA3NTI4OTYyNX0.E_325y4DDXWxxeB19aYRQA9RHrqFF1aR6jkEYeq6H0M';

// 1. Definição explícita das variáveis
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. Limpeza de segurança e aplicação de fallback
const cleanUrl = (supabaseUrl || FALLBACK_URL).replace(/["']/g, "").trim();
const cleanKey = (supabaseKey || FALLBACK_ANON_KEY).replace(/["']/g, "").trim();

console.log("--- [Supabase Server Connect] ---");
console.log("URL Alvo:", cleanUrl);
console.log("Key usada:", cleanKey ? `${cleanKey.slice(0, 10)}... (Tamanho: ${cleanKey.length})` : "VAZIA");

// 3. Criação do Cliente
export const supabaseServer = createClient(cleanUrl, cleanKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});