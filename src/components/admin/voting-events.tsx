"use client";

import { useState, useEffect } from "react";
import { votingEvents as initialVotingEvents, departments } from "@/lib/data";
import type { VotingEvent } from "@/lib/types";
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
import { MoreHorizontal, Pencil, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const surveyQuestionSchema = z.object({
    title: z.string().min(1, "Question title is required."),
    body: z.string().min(1, "Question body is required."),
});

const eventFormSchema = z.object({
    id: z.string().optional(),
    month: z.string().min(1, "Event name is required."),
    department: z.string().min(1, "Department is required."),
    dateRange: z.object({
        from: z.date({ required_error: "Event start date is required."}),
        to: z.date({ required_error: "Event end date is required."}),
    }),
    nominationEndDate: z.date({ required_error: "Nomination end date is required."}),
    votingEndDate: z.date({ required_error: "Voting end date is required."}),
    evaluationEndDate: z.date({ required_error: "Evaluation end date is required."}),
    surveyQuestions: z.array(surveyQuestionSchema).length(5, "You must provide exactly 5 survey questions."),
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
}).refine(data => data.evaluationEndDate.toDateString() === data.dateRange.to.toDateString(), {
    message: "Must be the event end date.",
    path: ["evaluationEndDate"],
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const defaultFormValues: EventFormValues = {
    month: "",
    department: "",
    dateRange: {
        from: new Date(),
        to: addDays(new Date(), 20),
    },
    nominationEndDate: addDays(new Date(), 7),
    votingEndDate: addDays(new Date(), 14),
    evaluationEndDate: addDays(new Date(), 20),
    surveyQuestions: [
        { title: 'Teamwork & Collaboration', body: 'How well does this person collaborate with others toward a common goal?' },
        { title: 'Innovation & Creativity', body: 'Does this person bring new, creative ideas or improve existing processes?' },
        { title: 'Leadership & Mentorship', body: 'Does this person demonstrate leadership qualities or actively mentor others?' },
        { title: 'Problem Solving & Resilience', body: 'How effective is this person at overcoming challenges and finding solutions?' },
        { title: 'Impact & Contribution', body: 'What has been this person\'s most significant contribution or impact this month?' }
    ],
}


export function VotingEvents() {
    const [open, setOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<VotingEvent | null>(null);
    const [votingEvents, setVotingEvents] = useState(initialVotingEvents);
    const { toast } = useToast();

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: defaultFormValues,
    });
    
    useEffect(() => {
        if (open && editingEvent) {
            const dateRange = {
                from: editingEvent.startDate || new Date(),
                to: editingEvent.endDate || addDays(new Date(), 20),
            };
            form.reset({
                ...editingEvent,
                month: editingEvent.month || "",
                department: editingEvent.department || "",
                dateRange,
                nominationEndDate: addDays(dateRange.from, 7),
                votingEndDate: addDays(dateRange.from, 14),
                evaluationEndDate: dateRange.to,
                surveyQuestions: editingEvent.surveyQuestions?.length === 5 ? editingEvent.surveyQuestions : defaultFormValues.surveyQuestions,
            });
        } else if (!open) {
            form.reset(defaultFormValues);
            setEditingEvent(null);
        }
    }, [open, editingEvent, form]);


    function onSubmit(data: EventFormValues) {
        const isEditing = !!editingEvent;
        
        const eventData: VotingEvent = {
            id: editingEvent?.id || `event-${Date.now()}`,
            month: data.month,
            department: data.department,
            startDate: data.dateRange.from,
            endDate: data.dateRange.to,
            status: editingEvent?.status || "Pending",
            surveyQuestions: data.surveyQuestions,
        };

        setVotingEvents(prev => 
            isEditing
                ? prev.map(e => e.id === editingEvent!.id ? { ...e, ...eventData } : e)
                : [...prev, eventData]
        );

        toast({
            title: isEditing ? "Event Updated!" : "Event Created!",
            description: `The event "${data.month}" for ${data.department} has been ${isEditing ? 'updated' : 'scheduled'}.`,
        });
        setOpen(false);
    }
    
    const handleEdit = (event: VotingEvent) => {
        setEditingEvent(event);
        setOpen(true);
    };

    const handleCreate = () => {
        setEditingEvent(null);
        form.reset(defaultFormValues);
        setOpen(true);
    }


  return (
    <div className="space-y-6">
        <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button onClick={handleCreate}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Event
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>{editingEvent ? 'Edit' : 'Create New'} Voting Event</DialogTitle>
                        <DialogDescription>
                           {editingEvent ? 'Update the event details below.' : 'Define the parameters and timeline for the new voting event.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto pr-6 -mr-6">
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
                                                <Select onValueChange={field.onChange} value={field.value}>
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
                                                        !field.value?.from && "text-muted-foreground"
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
                                                        selected={field.value}
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
                                                    disabled={(date) => !form.getValues().dateRange.from || !form.getValues().dateRange.to || date < form.getValues().dateRange.from || date > form.getValues().dateRange.to}
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
                                                    disabled={(date) => !form.getValues().nominationEndDate || !form.getValues().dateRange.to || date < form.getValues().nominationEndDate || date > form.getValues().dateRange.to}
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
                                                    disabled={(date) => !form.getValues().votingEndDate || !form.getValues().dateRange.to || date < form.getValues().votingEndDate || date > form.getValues().dateRange.to}
                                                    initialFocus
                                                />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-6 border-t pt-4">
                                    <FormLabel>Survey Questions</FormLabel>
                                    <FormDescription>Define the 5 questions for the peer evaluation survey.</FormDescription>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                                        {[...Array(5)].map((_, index) => (
                                            <div key={index} className="space-y-2 rounded-lg border p-4">
                                                 <FormLabel className="text-sm">Question {index + 1}</FormLabel>
                                                 <FormField
                                                    control={form.control}
                                                    name={`surveyQuestions.${index}.title`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-normal text-muted-foreground text-xs">Title</FormLabel>
                                                            <FormControl><Input placeholder="e.g., Teamwork & Collaboration" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                 <FormField
                                                    control={form.control}
                                                    name={`surveyQuestions.${index}.body`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                             <FormLabel className="font-normal text-muted-foreground text-xs">Question Body</FormLabel>
                                                            <FormControl><Textarea placeholder="Enter the full question for the survey..." {...field} /></FormControl>
                                                             <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <FormMessage>{form.formState.errors.surveyQuestions?.message}</FormMessage>
                                </div>
                                
                                <DialogFooter className="flex-shrink-0 pt-4 border-t">
                                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit">{editingEvent ? 'Save Changes' : 'Create Event'}</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </div>
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
                    <DropdownMenuItem onSelect={() => handleEdit(event)}><Pencil className="mr-2 h-4 w-4"/>Edit Event</DropdownMenuItem>
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
