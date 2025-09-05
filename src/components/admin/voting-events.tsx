"use client";

import { votingEvents } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Play, StopCircle, PlusCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function VotingEvents() {
  return (
    <div className="space-y-6">
        <div className="flex justify-end">
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Event
            </Button>
        </div>
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
                <span className="sr-only">Actions</span>
            </TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {votingEvents.map((event) => (
            <TableRow key={event.id}>
                <TableCell className="font-medium">{event.month}</TableCell>
                <TableCell>{event.department ?? 'All Departments'}</TableCell>
                <TableCell>
                <Badge
                    className={cn({
                        "bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/10 dark:text-green-400": event.status === 'Active',
                        "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400": event.status === 'Pending',
                        "bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400": event.status === 'Closed',
                    })}
                >{event.status}</Badge>
                </TableCell>
                <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem><Play className="mr-2 h-4 w-4"/>Start Event</DropdownMenuItem>
                    <DropdownMenuItem><Pencil className="mr-2 h-4 w-4"/>Edit Event</DropdownMenuItem>
                    <DropdownMenuItem><StopCircle className="mr-2 h-4 w-4"/>End Event</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
        <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="message" className="font-semibold">Engaging Message for Winner Announcement</Label>
            <Textarea id="message" placeholder="Type a fun, engaging message to show with the results..." />
            <Button>Save Message</Button>
        </div>
    </div>
  );
}
