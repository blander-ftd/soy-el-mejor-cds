
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import AppLogo from '@/components/app-logo';
import { Shield, Users, UserCheck, BarChart3, FileText, Trophy } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(identifier, password);
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
          description: 'Credenciales no válidas. Por favor, inténtalo de nuevo.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error de Conexión',
        description: 'No se pudo conectar con el servidor. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAccess = async (path: string, roleName: string) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // In development, set a user based on the role and navigate
      const roleMap: Record<string, string> = {
        '/admin': 'Admin',
        '/supervisor': 'Supervisor', 
        '/coordinator': 'Coordinator',
        '/collaborator': 'Collaborator',
        '/survey': 'Collaborator', // Survey can be accessed by collaborators
        '/results': 'Admin' // Results can be viewed by admins
      };
      
      const targetRole = roleMap[path] || 'Admin';
      
      // Try to log in with a demo user of the appropriate role
      const demoEmails: Record<string, string> = {
        'Admin': 'admin@example.com',
        'Supervisor': 'supervisor.tech@example.com',
        'Coordinator': 'coordinator.tech@example.com',
        'Collaborator': 'collaborator.tech@example.com'
      };
      
      const demoEmail = demoEmails[targetRole];
      if (demoEmail) {
        const success = await login(demoEmail, 'demo'); // Use any password in dev mode
        if (success) {
          toast({
            title: 'Acceso Directo',
            description: `Navegando a ${roleName} como usuario de demostración...`,
          });
          router.push(path);
          return;
        }
      }
    }
    
    toast({
      title: 'Acceso Directo',
      description: `Navegando a ${roleName}...`,
    });
    router.push(path);
  };

  const quickAccessButtons = [
    { path: '/admin', label: 'Administrador', icon: Shield, description: 'Gestión completa del sistema' },
    { path: '/supervisor', label: 'Supervisor', icon: UserCheck, description: 'Supervisión de equipos' },
    { path: '/coordinator', label: 'Coordinador', icon: Users, description: 'Coordinación de actividades' },
    { path: '/collaborator', label: 'Colaborador', icon: Users, description: 'Participación en votaciones' },
    { path: '/survey', label: 'Encuesta', icon: FileText, description: 'Completar encuestas' },
    { path: '/results', label: 'Resultados', icon: BarChart3, description: 'Ver resultados de votaciones' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <Card>
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
                <Label htmlFor="identifier">Correo Electrónico o Cédula</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="tu@email.com o 12345678"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading || !identifier || !password}>
                {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              <Trophy className="size-5" />
              Acceso Directo
            </CardTitle>
            <CardDescription>Navega directamente a las diferentes secciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {quickAccessButtons.map((button) => {
                const IconComponent = button.icon;
                return (
                  <Button
                    key={button.path}
                    variant="outline"
                    size="sm"
                    className="h-auto p-3 flex flex-col items-center gap-2 text-xs"
                    onClick={() => handleQuickAccess(button.path, button.label)}
                  >
                    <IconComponent className="size-4" />
                    <span className="font-medium">{button.label}</span>
                  </Button>
                );
              })}
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground text-center">
              Estas opciones te permiten explorar las diferentes funcionalidades sin necesidad de iniciar sesión.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
