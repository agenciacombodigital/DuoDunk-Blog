import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticate } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticate(password)) {
      toast.success('Login bem-sucedido!');
      navigate('/admin');
    } else {
      toast.error('Senha incorreta.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-sm bg-[#1a1a1a] border-gray-800 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
          <CardDescription>Digite a senha para acessar o painel de admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-black border-gray-700 focus:ring-cyan-500"
              />
            </div>
            <Button type="submit" className="w-full btn-cyan">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}