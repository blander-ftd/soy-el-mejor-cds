"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { users, nominations, votingEvents } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useMemo } from "react";

// Helper to find the most recently closed event
const findLastClosedEvent = () => {
  return votingEvents
    .filter(event => event.status === 'Closed' && event.endDate)
    .sort((a, b) => b.endDate!.getTime() - a.endDate!.getTime())[0];
};

// Helper to get nominations for a specific event
const getEventNominations = (eventId: string) => {
  return nominations.filter(n => n.eventId === eventId);
};

// Helper to find the winner based on most nominations for an event
const findWinnerFromEvent = (eventId: string) => {
  const eventNominations = getEventNominations(eventId);
  if (eventNominations.length === 0) return null;

  const nominationCounts = eventNominations.reduce((acc, nom) => {
    acc[nom.collaboratorId] = (acc[nom.collaboratorId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const winnerId = Object.keys(nominationCounts).reduce((a, b) => nominationCounts[a] > nominationCounts[b] ? a : b);
  
  return users.find(u => u.id === winnerId) || null;
};

// Mock data generation for the chart based on event nominations
const generateVoteData = (eventId: string) => {
    const eventNominations = getEventNominations(eventId);
    const nomineeIds = [...new Set(eventNominations.map(n => n.collaboratorId))];
    
    // Simulate votes for nominees - giving winner the most votes
    const winnerId = findWinnerFromEvent(eventId)?.id;

    return nomineeIds.map(id => {
        const user = users.find(u => u.id === id);
        const name = user ? user.name.split(' ')[0] + ' ' + user.name.split(' ')[1][0] + '.' : 'Unknown';
        let votes = Math.floor(Math.random() * 12) + 5; // random votes between 5 and 16
        if(id === winnerId) {
            votes = Math.floor(Math.random() * 5) + 15; // winner gets more votes (15-19)
        }
        return { name, votes };
    }).sort((a, b) => b.votes - a.votes);
};


export default function ResultsPage() {

    const { winner, voteData, lastEvent } = useMemo(() => {
        const lastEvent = findLastClosedEvent();
        if (!lastEvent) {
            return { winner: null, voteData: [], lastEvent: null };
        }
        const winner = findWinnerFromEvent(lastEvent.id);
        const voteData = winner ? generateVoteData(lastEvent.id) : [];
        return { winner, voteData, lastEvent };
    }, []);

    if (!winner || !lastEvent) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Results</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>No Results Available</CardTitle>
                        <CardDescription>There are no results from previous events to display yet.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Winner for {lastEvent.month}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="text-center">
            <Trophy className="mx-auto h-12 w-12 text-yellow-500" />
            <CardTitle className="text-4xl font-bold">Soy El Mejor!</CardTitle>
            <CardDescription className="text-lg">Congratulations to our Employee of the Month!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32 border-4 border-primary" data-ai-hint="person face">
              <AvatarImage src={winner.avatar} />
              <AvatarFallback>{winner.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-3xl font-bold">{winner.name}</h2>
              <p className="text-xl text-muted-foreground">{winner.department}</p>
            </div>
            <p className="max-w-prose text-center text-muted-foreground italic p-4 bg-muted rounded-lg">
              "For their outstanding contribution and for always going the extra mile. Your hard work inspires us all. Well done, {winner.name.split(' ')[0]}!"
            </p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Voting Results</CardTitle>
                <CardDescription>Final vote count for the top nominees in {lastEvent.month}.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={voteData} layout="vertical" margin={{ left: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                        />
                        <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
