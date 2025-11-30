import { createClient } from '@supabase/supabase-js';

// 1. Definição explícita das variáveis
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. Limpeza de segurança (remove aspas e espaços extras que podem vir do .env)
const cleanUrl = supabaseUrl ? supabaseUrl.replace(/["']/g, "").trim() : "";
const cleanKey = supabaseKey ? supabaseKey.replace(/["']/g, "").trim() : "";

console.log("--- [Supabase Server Connect] ---");
console.log("URL Alvo:", cleanUrl);
console.log("Key usada:", cleanKey ? `${cleanKey.slice(0, 10)}... (Tamanho: ${cleanKey.length})` : "VAZIA");

if (!cleanUrl || !cleanKey) {
  throw new Error("❌ Erro Fatal: NEXT_PUBLIC_SUPABASE_URL ou ANON_KEY não encontradas no .env.local");
}

// 3. Criação do Cliente
export const supabaseServer = createClient(cleanUrl, cleanKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});