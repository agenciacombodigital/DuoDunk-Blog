import { supabase } from './supabase';

// Removemos a senha fixa e a lógica de sessionStorage
// A autenticação será gerenciada pelo Supabase

export async function logout() {
  await supabase.auth.signOut();
}

// As funções isAuthenticated e authenticate serão substituídas pelo useAuth hook
// Mantemos o arquivo para exportar o logout, mas ele será atualizado para usar o Supabase