"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { users } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const winner = users.find(u => u.id === 'user-6'); // Mock winner
const voteData = [
  { name: 'Emily W.', votes: 15 },
  { name: 'James B.', votes: 12 },
  { name: 'Linda M.', votes: 9 },
  { name: 'Alex J.', votes: 8 },
];

export default function ResultsPage() {
  if (!winner) return <p>No winner selected yet.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">This Month's Winner</h1>

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
              "For her outstanding contribution to the new marketing campaign and for always going the extra mile. Your hard work inspires us all. Well done, Emily!"
            </p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Voting Results</CardTitle>
                <CardDescription>Final vote count for the top nominees.</CardDescription>
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
