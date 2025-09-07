
"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from "@/context/auth-context";
import { users, nominations as initialNominations, votingEvents } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Award, UserCheck, Trash2, Search, CalendarOff } from "lucide-react";
import { Input } from '@/components/ui/input';
import type { Nomination, User } from '@/lib/types';

export default function SupervisorPage() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const [nominations, setNominations] = useState<Nomination[]>(initialNominations);
    const [searchTerm, setSearchTerm] = useState('');

    if (!currentUser) return null;

    const activeEvent = useMemo(() => 
        votingEvents.find(event => 
            (event.department === currentUser.department || event.department === 'All Departments') 
            && event.status === 'Active'
        ), [currentUser.department]);
        
    const teamMembers = useMemo(() => 
        users.filter(user => 
            user.department === currentUser.department && user.role === 'Collaborator'
        ), [currentUser.department]);

    const nominationLimit = useMemo(() => {
        const n = teamMembers.length;
        if (n <= 1) return 0;
        return Math.min(n - 1, 3);
    }, [teamMembers.length]);
        
    const myNominations = useMemo(() => nominations
        .filter(n => n.nominatedById === currentUser.id)
        .map(nom => {
            const collaborator = users.find(u => u.id === nom.collaboratorId);
            const event = votingEvents.find(e => e.id === nom.eventId);
            return {
                ...nom,
                collaboratorName: collaborator?.name ?? 'Desconocido',
                collaboratorAvatar: collaborator?.avatar ?? '',
                eventName: event?.month ?? 'Evento Desconocido',
                eventIsActive: event?.status === 'Active'
            }
        })
        .sort((a, b) => b.nominationDate.getTime() - a.nominationDate.getTime()), [nominations, currentUser.id]);

    const myNominationsForActiveEvent = useMemo(() => {
        if (!activeEvent) return [];
        return myNominations.filter(n => n.eventId === activeEvent.id);
    }, [myNominations, activeEvent]);

    const nominatedForActiveEventIds = useMemo(() => {
        if (!activeEvent) return [];
        return nominations
            .filter(n => n.eventId === activeEvent.id)
            .map(n => n.collaboratorId);
    }, [nominations, activeEvent]);

    const filteredAndAvailableTeamMembers = useMemo(() => 
        teamMembers.filter(member => 
            !myNominations.some(n => n.collaboratorId === member.id && n.eventId === activeEvent?.id) &&
            !nominatedForActiveEventIds.includes(member.id) &&
            member.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [teamMembers, myNominations, activeEvent, nominatedForActiveEventIds, searchTerm]);
    
    
    const handleNominate = (collaborator: User) => {
        if (!activeEvent) {
             toast({
                variant: "destructive",
                title: "Nominación Fallida",
                description: "No hay un período de nominación activo.",
            });
            return;
        }

        if (myNominationsForActiveEvent.length >= nominationLimit) {
            toast({
                variant: "destructive",
                title: "Límite de Nominaciones Alcanzado",
                description: `Solo puedes nominar hasta ${nominationLimit} colaborador(es) para este evento.`,
            });
            return;
        }
        
        const isAlreadyNominated = myNominations.some(n => n.collaboratorId === collaborator.id && n.eventId === activeEvent.id);
        if (isAlreadyNominated) {
             toast({
                variant: "destructive",
                title: "Ya Nominado",
                description: `${collaborator.name} ya ha sido nominado para este evento.`,
            });
            return;
        }

        const newNomination: Nomination = {
            id: `nom-${Date.now()}`,
            eventId: activeEvent.id,
            collaboratorId: collaborator.id,
            nominatedById: currentUser.id,
            nominationDate: new Date(),
        };

        setNominations(prev => [...prev, newNomination]);
        toast({
            title: "¡Nominación Enviada!",
            description: `${collaborator.name} ha sido nominado para ${activeEvent.month}.`,
        });
    }

    const handleRemoveNomination = (nominationId: string) => {
        setNominations(prev => prev.filter(n => n.id !== nominationId));
        toast({
            title: "Nominación Retirada",
            description: "La nominación ha sido eliminada exitosamente.",
        });
    }

  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Centro de Nominaciones: {currentUser.department}</h1>
            <p className="text-muted-foreground">Nomina a colaboradores destacados de tu departamento para el premio "Soy El Mejor".</p>
        </div>

        {!activeEvent ? (
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <CalendarOff className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Hay Período de Nominación Activo</h3>
                    <p className="max-w-md text-muted-foreground">
                        No hay eventos de votación activos para tu departamento en este momento. Por favor, vuelve más tarde.
                    </p>
                </CardContent>
            </Card>
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle>Nominar para {activeEvent.month}</CardTitle>
                    <CardDescription>
                        Selecciona un colaborador para nominar. Puedes nominar hasta {nominationLimit} colaborador(es). 
                        ({myNominationsForActiveEvent.length}/{nominationLimit} nominados)
                    </CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nombre..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndAvailableTeamMembers.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={member.avatar} />
                                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{member.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleNominate(member)}
                                            disabled={myNominationsForActiveEvent.length >= nominationLimit}
                                        >
                                            <Award className="mr-2 h-4 w-4" />
                                            Nominar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {filteredAndAvailableTeamMembers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                        {teamMembers.length > 0 ? "No se encontraron colaboradores que coincidan con tu búsqueda." : "Todos los colaboradores elegibles han sido nominados."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
      
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCheck /> Nominaciones Actuales</CardTitle>
                <CardDescription>Una lista de todos los colaboradores que has nominado.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {myNominations.map(nom => (
                         <div key={nom.id} className="flex items-center justify-between rounded-lg border p-3">
                             <div className="flex items-center gap-3">
                                 <Avatar>
                                     <AvatarImage src={nom.collaboratorAvatar} />
                                     <AvatarFallback>{nom.collaboratorName.charAt(0)}</AvatarFallback>
                                 </Avatar>
                                 <div>
                                     <p className="font-medium">{nom.collaboratorName}</p>
                                     <p className="text-xs text-muted-foreground">
                                        Nominado para <span className="font-semibold">{nom.eventName}</span> el {new Date(nom.nominationDate).toLocaleDateString()}
                                     </p>
                                 </div>
                             </div>
                             <Button 
                                size="sm" 
                                variant="outline" 
                                disabled={!nom.eventIsActive}
                                onClick={() => handleRemoveNomination(nom.id)}
                                aria-label="Eliminar nominación"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                             </Button>
                         </div>
                    ))}
                    {myNominations.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Aún no has hecho ninguna nominación.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
