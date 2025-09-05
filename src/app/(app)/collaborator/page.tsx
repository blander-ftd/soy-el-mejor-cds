"use client";

import React, { useState } from 'react';
import { useAuth } from "@/context/auth-context";
import { users, nominations } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function CollaboratorPage() {
  const { currentUser } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const { toast } = useToast();

  if (!currentUser) return null;

  const nominees = nominations.map(nom => users.find(u => u.id === nom.collaboratorId)).filter(Boolean) as any[];

  const handleVote = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length < 3) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const submitVote = () => {
    toast({
        title: "Vote Submitted!",
        description: `Thank you for participating. Your vote for ${selected.length} candidate(s) has been recorded.`,
    });
    setSelected([]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Cast Your Vote</h1>
      <p className="text-muted-foreground">
        Select up to 3 colleagues from your department who you believe deserve to be 'Soy El Mejor'.
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
                  disabled={selected.length >= 3 && !selected.includes(nominee.id)}
                />
                <label
                  htmlFor={`vote-${nominee.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Vote for {nominee.name.split(' ')[0]}
                </label>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end mt-6">
        <Button size="lg" disabled={selected.length === 0} onClick={submitVote}>
          Submit My {selected.length} Vote(s)
        </Button>
      </div>
    </div>
  );
}
