
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
                collaboratorName: collaborator?.name ?? 'Unknown',
                collaboratorAvatar: collaborator?.avatar ?? '',
                eventName: event?.month ?? 'Unknown Event',
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
            !nominatedForActiveEventIds.includes(member.id) &&
            member.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [teamMembers, nominatedForActiveEventIds, searchTerm]);
    
    
    const handleNominate = (collaborator: User) => {
        if (!activeEvent) {
             toast({
                variant: "destructive",
                title: "Nomination Failed",
                description: "There is no active nomination period.",
            });
            return;
        }

        if (myNominationsForActiveEvent.length >= nominationLimit) {
            toast({
                variant: "destructive",
                title: "Nomination Limit Reached",
                description: `You can only nominate up to ${nominationLimit} collaborator(s) for this event.`,
            });
            return;
        }
        
        const isAlreadyNominated = myNominations.some(n => n.collaboratorId === collaborator.id && n.eventId === activeEvent.id);
        if (isAlreadyNominated) {
             toast({
                variant: "destructive",
                title: "Already Nominated",
                description: `${collaborator.name} has already been nominated for this event.`,
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
            title: "Nomination Sent!",
            description: `${collaborator.name} has been nominated for ${activeEvent.month}.`,
        });
    }

    const handleRemoveNomination = (nominationId: string) => {
        setNominations(prev => prev.filter(n => n.id !== nominationId));
        toast({
            title: "Nomination Retracted",
            description: "The nomination has been successfully removed.",
        });
    }

  return (
    <div className="space-y-6">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Nomination Center: {currentUser.department}</h1>
            <p className="text-muted-foreground">Nominate outstanding collaborators from your department for the "Soy El Mejor" award.</p>
        </div>

        {!activeEvent ? (
            <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <CalendarOff className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Active Nomination Period</h3>
                    <p className="max-w-md text-muted-foreground">
                        There are no active voting events for your department at the moment. Please check back later.
                    </p>
                </CardContent>
            </Card>
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle>Nominate for {activeEvent.month}</CardTitle>
                    <CardDescription>
                        Select a collaborator to nominate. You can nominate up to {nominationLimit} collaborator(s). 
                        ({myNominationsForActiveEvent.length}/{nominationLimit} nominated)
                    </CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name..." 
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
                                <TableHead>Collaborator</TableHead>
                                <TableHead className="text-right">Action</TableHead>
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
                                            Nominate
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {filteredAndAvailableTeamMembers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                        {teamMembers.length > 0 ? "No collaborators found matching your search." : "All eligible collaborators have been nominated."}
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
                <CardTitle className="flex items-center gap-2"><UserCheck /> Current Nominations</CardTitle>
                <CardDescription>A list of all collaborators you have nominated.</CardDescription>
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
                                        Nominated for <span className="font-semibold">{nom.eventName}</span> on {new Date(nom.nominationDate).toLocaleDateString()}
                                     </p>
                                 </div>
                             </div>
                             <Button 
                                size="sm" 
                                variant="outline" 
                                disabled={!nom.eventIsActive}
                                onClick={() => handleRemoveNomination(nom.id)}
                                aria-label="Remove nomination"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                             </Button>
                         </div>
                    ))}
                    {myNominations.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">You haven't made any nominations yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
