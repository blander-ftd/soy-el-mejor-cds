"use client";

import { useState } from "react";
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
import { MoreHorizontal, Pencil, Play, StopCircle, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { departments } from "@/lib/data";
import { Textarea } from "@/components/ui/textarea";

const eventFormSchema = z.object({
    month: z.string().min(1, "Event name is required."),
    department: z.string().min(1, "Department is required."),
    dateRange: z.object({
        from: z.date({ required_error: "Event start date is required."}),
        to: z.date({ required_error: "Event end date is required."}),
    }),
    nominationEndDate: z.date({ required_error: "Nomination end date is required."}),
    votingEndDate: z.date({ required_error: "Voting end date is required."}),
    evaluationEndDate: z.date({ required_error: "Evaluation end date is required."}),
}).refine(data => data.dateRange.to > data.dateRange.from, {
    message: "End date must be after start date.",
    path: ["dateRange"],
}).refine(data => data.nominationEndDate >= data.dateRange.from && data.nominationEndDate <= data.dateRange.to, {
    message: "Must be within the event dates.",
    path: ["nominationEndDate"],
}).refine(data => data.votingEndDate > data.nominationEndDate, {
    message: "Must be after nomination phase.",
    path: ["votingEndDate"],
}).refine(data => data.votingEndDate <= data.dateRange.to, {
    message: "Must be within the event dates.",
    path: ["votingEndDate"],
}).refine(data => data.evaluationEndDate > data.votingEndDate, {
    message: "Must be after voting phase.",
    path: ["evaluationEndDate"],
}).refine(data => data.evaluationEndDate === data.dateRange.to, {
    message: "Must be the event end date.",
    path: ["evaluationEndDate"],
});

type EventFormValues = z.infer<typeof eventFormSchema>;


export function VotingEvents() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: {
            dateRange: {
                from: new Date(),
                to: addDays(new Date(), 20),
            },
        },
    });

    function onSubmit(data: EventFormValues) {
        console.log(data);
        toast({
            title: "Event Created!",
            description: `The event "${data.month}" for ${data.department} has been scheduled.`,
        });
        setOpen(false);
        form.reset();
    }


  return (
    <div className="space-y-6">
        <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Event
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Voting Event</DialogTitle>
                        <DialogDescription>
                            Define the parameters and timeline for the new voting event.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="month"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Event Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., August 2024" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Department</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a department" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="All Departments">All Departments</SelectItem>
                                                    {departments.map(dep => (
                                                        <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                             <FormField
                                control={form.control}
                                name="dateRange"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Event Duration</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                <Button
                                                    id="date"
                                                    variant={"outline"}
                                                    className={cn(
                                                    "justify-start text-left font-normal",
                                                    !field.value.from && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value?.from ? (
                                                    field.value.to ? (
                                                        <>
                                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                                        {format(field.value.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(field.value.from, "LLL dd, y")
                                                    )
                                                    ) : (
                                                    <span>Pick a date range</span>
                                                    )}
                                                </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={field.value?.from}
                                                    selected={{from: field.value.from, to: field.value.to}}
                                                    onSelect={field.onChange}
                                                    numberOfMonths={2}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                                <FormField
                                    control={form.control}
                                    name="nominationEndDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                        <FormLabel>1. Nomination Phase End</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "justify-start text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < (form.getValues().dateRange.from ?? new Date()) || date > (form.getValues().dateRange.to ?? new Date())}
                                                initialFocus
                                            />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="votingEndDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                        <FormLabel>2. Voting Phase End</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "justify-start text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < (form.getValues().nominationEndDate ?? new Date()) || date > (form.getValues().dateRange.to ?? new Date())}
                                                initialFocus
                                            />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="evaluationEndDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                        <FormLabel>3. Evaluation Phase End</FormLabel>
                                         <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "justify-start text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < (form.getValues().votingEndDate ?? new Date()) || date > (form.getValues().dateRange.to ?? new Date())}
                                                initialFocus
                                            />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Create Event</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
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
