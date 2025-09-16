"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AppLogo from '@/components/app-logo';
import { users } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // In a real app, you'd have an async call here.
    setTimeout(() => {
      const success = login(email);
      if (success) {
        toast({
          title: 'Inicio de Sesión Exitoso',
          description: '¡Bienvenido de vuelta!',
        });
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Inicio de Sesión Fallido',
          description: 'Correo electrónico o contraseña no válidos. Por favor, inténtalo de nuevo.',
        });
        setIsLoading(false);
      }
    }, 1000);
  };
  
  const displayUsers = users.reduce((acc, user) => {
    if (!acc.some(u => u.role === user.role)) {
        acc.push(user);
    }
    return acc;
  }, [] as User[]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AppLogo className="size-12" />
          </div>
          <CardTitle className="text-2xl">Soy El Mejor</CardTitle>
          <CardDescription>Inicia sesión para emitir tu voto</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Seleccionar Usuario (para demostración)</Label>
              <Select value={email} onValueChange={setEmail} required>
                <SelectTrigger id="email">
                  <SelectValue placeholder="Selecciona un usuario para iniciar sesión" />
                </SelectTrigger>
                <SelectContent>
                  {displayUsers.map((user) => (
                    <SelectItem key={user.id} value={user.email} className="truncate">
                      <span className="truncate">{user.name} ({user.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !email}>
              {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
