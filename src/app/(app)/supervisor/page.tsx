"use client";

import { useAuth } from "@/context/auth-context";
import { users, nominations } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Award, UserCheck } from "lucide-react";

export default function SupervisorPage() {
    const { currentUser } = useAuth();
    const { toast } = useToast();

    if (!currentUser) return null;

    const teamMembers = users.filter(user => user.department === currentUser.department && user.role === 'Collaborator');
    
    const myNominations = nominations
        .filter(n => n.nominatedById === currentUser.id)
        .map(nom => {
            const collaborator = users.find(u => u.id === nom.collaboratorId);
            return {
                ...nom,
                collaboratorName: collaborator?.name ?? 'Unknown',
                collaboratorAvatar: collaborator?.avatar ?? '',
            }
        });
    
    const handleNominate = (collaboratorName: string) => {
        toast({
            title: "Nomination Sent!",
            description: `${collaboratorName} has been nominated for Soy El Mejor.`,
        });
    }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <h1 className="text-3xl font-bold tracking-tight">Nomination Center</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Nominate a Collaborator</CardTitle>
                <CardDescription>Select a collaborator from your department to nominate for this month's award.</CardDescription>
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
                        {teamMembers.map(member => (
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
                                    <Button size="sm" onClick={() => handleNominate(member.name)}>
                                        <Award className="mr-2 h-4 w-4" />
                                        Nominate
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="md:mt-16">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCheck /> Current Nominations</CardTitle>
                <CardDescription>You have nominated the following collaborators for July 2024.</CardDescription>
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
                                 <span className="font-medium">{nom.collaboratorName}</span>
                             </div>
                             <span className="text-sm text-muted-foreground">
                                Nominated on {new Date(nom.nominationDate).toLocaleDateString()}
                             </span>
                         </div>
                    ))}
                    {myNominations.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">You haven't made any nominations yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
