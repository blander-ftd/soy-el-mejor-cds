"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from "@/context/auth-context";
import { users, nominations, votingEvents } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserX, CalendarOff } from 'lucide-react';
import type { User } from '@/lib/types';


export default function CollaboratorPage() {
  const { currentUser } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const { toast } = useToast();

  const activeEvent = useMemo(() => 
    votingEvents.find(event => 
        (event.department === currentUser?.department || event.department === 'All Departments') 
        && event.status === 'Active'
    ), [currentUser?.department]);

  const nominees = useMemo(() => {
    if (!activeEvent || !currentUser) return [];

    const eventNominations = nominations.filter(nom => nom.eventId === activeEvent.id);
    const nomineeIds = [...new Set(eventNominations.map(nom => nom.collaboratorId))];
    
    return nomineeIds
      .map(id => users.find(u => u.id === id && u.id !== currentUser.id)) // Exclude current user from nominees list
      .filter(Boolean) as User[];
  }, [activeEvent, currentUser]);

  const voteLimit = useMemo(() => {
    const n = nominees.length;
    if (n <= 1) return 0;
    return Math.min(n - 1, 3);
  }, [nominees]);

  if (!currentUser) return null;

  const handleVote = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length < voteLimit) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const submitVote = () => {
    toast({
        title: "¡Voto Enviado!",
        description: `Gracias por participar. Tu voto por ${selected.length} candidato(s) ha sido registrado.`,
    });
    setSelected([]);
  }

  if (!activeEvent) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
             <Card className="w-full max-w-lg text-center">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
                    <CalendarOff className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Hay un Período de Votación Activo</h3>
                    <p className="max-w-md text-muted-foreground">
                        Actualmente no hay ningún evento de votación activo para tu departamento.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (nominees.length === 0) {
     return (
        <div className="flex items-center justify-center h-[60vh]">
             <Card className="w-full max-w-lg text-center">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
                    <UserX className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Hay Nominados para Votar</h3>
                    <p className="max-w-md text-muted-foreground">
                        Actualmente no hay colaboradores nominados para el evento de {activeEvent.month}.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Emite tu Voto</h1>
      <p className="text-muted-foreground">
        {voteLimit > 0 
          ? `Selecciona hasta ${voteLimit} colega(s) de tu departamento que crees que merecen ser 'Soy El Mejor'.`
          : "No hay suficientes nominados para realizar una votación."
        }
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {nominees.map(nominee => (
          <Card 
            key={nominee.id} 
            className={`transition-all ${selected.includes(nominee.id) ? 'border-primary ring-2 ring-primary' : ''}`}
          >
            <CardContent className="p-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={nominee.avatar} />
                <AvatarFallback>{nominee.name.split(' ').map((n:string) => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{nominee.name}</h3>
              <p className="text-sm text-muted-foreground">{nominee.department}</p>
            </CardContent>
            <CardFooter className="flex justify-center p-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`vote-${nominee.id}`} 
                  checked={selected.includes(nominee.id)}
                  onCheckedChange={() => handleVote(nominee.id)}
                  disabled={(selected.length >= voteLimit && !selected.includes(nominee.id)) || voteLimit === 0}
                />
                <label
                  htmlFor={`vote-${nominee.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Votar por {nominee.name.split(' ')[0]}
                </label>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end mt-6">
        <Button size="lg" disabled={selected.length === 0} onClick={submitVote}>
          Enviar mis {selected.length} Voto(s)
        </Button>
      </div>
    </div>
  );
}
