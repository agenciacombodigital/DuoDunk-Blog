import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (isAdmin && !isLoading) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading || isAdmin) {
    return null; // Deixa o AuthProvider lidar com o loading
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="text-center mb-8">
          <img 
            src="/images/duodunk-logoV2.svg" 
            alt="Duo Dunk Logo" 
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Admin</h1>
          <p className="text-gray-400 text-sm">Faça login para acessar o painel administrativo.</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#FA007D', // Cor primária do DuoDunk
                  brandAccent: '#C9006A',
                  defaultButtonBackground: '#1f2937', // Gray-800
                  defaultButtonBorder: '#374151', // Gray-700
                  defaultButtonText: '#ffffff',
                  inputBackground: '#111827', // Gray-900
                  inputBorder: '#374151',
                  inputLabelText: '#d1d5db', // Gray-300
                },
              },
            },
          }}
          theme="dark"
          providers={[]}
          redirectTo={window.location.origin + '/admin'}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'exemplo@duodunk.com.br',
                password_input_placeholder: '••••••••',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Faça login',
              },
              sign_up: {
                email_label: 'Seu e-mail',
                password_label: 'Crie uma senha',
                email_input_placeholder: 'exemplo@duodunk.com.br',
                password_input_placeholder: '••••••••',
                button_label: 'Cadastrar',
                social_provider_text: 'Cadastrar com {{provider}}',
                link_text: 'Não tem uma conta? Cadastre-se',
              },
              forgotten_password: {
                email_label: 'Seu e-mail',
                email_input_placeholder: 'exemplo@duodunk.com.br',
                button_label: 'Enviar instruções de recuperação',
                link_text: 'Esqueceu sua senha?',
              },
              update_password: {
                password_label: 'Nova senha',
                password_input_placeholder: '••••••••',
                button_label: 'Atualizar senha',
              },
            },
          }}
        />
      </div>
    </div>
  );
}