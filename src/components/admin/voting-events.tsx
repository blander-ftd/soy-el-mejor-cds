"use client";

import { useState, useEffect } from "react";
import { votingEvents as initialVotingEvents, departments } from "@/lib/data";
import type { VotingEvent, Department } from "@/lib/types";
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
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const surveyQuestionSchema = z.object({
    title: z.string().min(1, "El título de la pregunta es requerido."),
    body: z.string().min(1, "El cuerpo de la pregunta es requerido."),
});

const eventFormSchema = z.object({
    id: z.string().optional(),
    month: z.string().min(1, "El nombre del evento es requerido."),
    department: z.string().min(1, "El departamento es requerido."),
    dateRange: z.object({
        from: z.date({ required_error: "La fecha de inicio del evento es requerida."}),
        to: z.date({ required_error: "La fecha de fin del evento es requerida."}),
    }),
    nominationEndDate: z.date({ required_error: "La fecha de fin de nominación es requerida."}),
    votingEndDate: z.date({ required_error: "La fecha de fin de votación es requerida."}),
    evaluationEndDate: z.date({ required_error: "La fecha de fin de evaluación es requerida."}),
    surveyQuestions: z.array(surveyQuestionSchema).length(5, "Debes proporcionar exactamente 5 preguntas de encuesta."),
}).refine(data => data.dateRange.to > data.dateRange.from, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio.",
    path: ["dateRange"],
}).refine(data => data.nominationEndDate >= data.dateRange.from && data.nominationEndDate <= data.dateRange.to, {
    message: "Debe estar dentro de las fechas del evento.",
    path: ["nominationEndDate"],
}).refine(data => data.votingEndDate > data.nominationEndDate, {
    message: "Debe ser posterior a la fase de nominación.",
    path: ["votingEndDate"],
}).refine(data => data.votingEndDate <= data.dateRange.to, {
    message: "Debe estar dentro de las fechas del evento.",
    path: ["votingEndDate"],
}).refine(data => data.evaluationEndDate > data.votingEndDate, {
    message: "Debe ser posterior a la fase de votación.",
    path: ["evaluationEndDate"],
}).refine(data => data.evaluationEndDate.toDateString() === data.dateRange.to.toDateString(), {
    message: "Debe ser la fecha de fin del evento.",
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
        { title: 'Trabajo en Equipo y Colaboración', body: '¿Qué tan bien colabora esta persona con otros hacia un objetivo común?' },
        { title: 'Innovación y Creatividad', body: '¿Aporta esta persona ideas nuevas y creativas o mejora los procesos existentes?' },
        { title: 'Liderazgo y Mentoría', body: '¿Demuestra esta persona cualidades de liderazgo o mentorea activamente a otros?' },
        { title: 'Resolución de Problemas y Resiliencia', body: '¿Cuán efectiva es esta persona para superar desafíos y encontrar soluciones?' },
        { title: 'Impacto y Contribución', body: '¿Cuál ha sido la contribución o impacto más significativo de esta persona este mes?' }
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
            department: data.department as Department | "All Departments",
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
            title: isEditing ? "¡Evento Actualizado!" : "¡Evento Creado!",
            description: `El evento "${data.month}" para ${data.department} ha sido ${isEditing ? 'actualizado' : 'programado'}.`,
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
                        Crear Evento
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>{editingEvent ? 'Editar' : 'Crear Nuevo'} Evento de Votación</DialogTitle>
                        <DialogDescription>
                           {editingEvent ? 'Actualiza los detalles del evento a continuación.' : 'Define los parámetros y el cronograma para el nuevo evento de votación.'}
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
                                                <FormLabel>Nombre del Evento</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ej., Agosto 2024" {...field} />
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
                                                <FormLabel>Departamento</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona un departamento" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="All Departments">Todos los Departamentos</SelectItem>
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
                                            <FormLabel>Duración del Evento</FormLabel>
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
                                                            {format(field.value.from, "LLL dd, y", { locale: es })} -{" "}
                                                            {format(field.value.to, "LLL dd, y", { locale: es })}
                                                            </>
                                                        ) : (
                                                            format(field.value.from, "LLL dd, y", { locale: es })
                                                        )
                                                        ) : (
                                                        <span>Elige un rango de fechas</span>
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
                                                        locale={es}
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
                                            <FormLabel>1. Fin Fase de Nominación</FormLabel>
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
                                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
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
                                                    locale={es}
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
                                            <FormLabel>2. Fin Fase de Votación</FormLabel>
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
                                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
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
                                                    locale={es}
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
                                            <FormLabel>3. Fin Fase de Evaluación</FormLabel>
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
                                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
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
                                                    locale={es}
                                                />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-6 border-t pt-4">
                                    <FormLabel>Preguntas de la Encuesta</FormLabel>
                                    <FormDescription>Define las 5 preguntas para la encuesta de evaluación de pares.</FormDescription>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                                        {[...Array(5)].map((_, index) => (
                                            <div key={index} className="space-y-2 rounded-lg border p-4">
                                                 <FormLabel className="text-sm">Pregunta {index + 1}</FormLabel>
                                                 <FormField
                                                    control={form.control}
                                                    name={`surveyQuestions.${index}.title`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-normal text-muted-foreground text-xs">Título</FormLabel>
                                                            <FormControl><Input placeholder="ej., Trabajo en Equipo" {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                 <FormField
                                                    control={form.control}
                                                    name={`surveyQuestions.${index}.body`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                             <FormLabel className="font-normal text-muted-foreground text-xs">Cuerpo de la Pregunta</FormLabel>
                                                            <FormControl><Textarea placeholder="Introduce la pregunta completa para la encuesta..." {...field} /></FormControl>
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
                                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                                    <Button type="submit">{editingEvent ? 'Guardar Cambios' : 'Crear Evento'}</Button>
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
            <TableHead>Mes</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>
                <span className="sr-only">Acciones</span>
            </TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {votingEvents.map((event) => (
            <TableRow key={event.id}>
                <TableCell className="font-medium">{event.month}</TableCell>
                <TableCell>{event.department ?? 'Todos los Departamentos'}</TableCell>
                <TableCell>
                <Badge
                    className={cn({
                        "bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/10 dark:text-green-400": event.status === 'Active',
                        "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400": event.status === 'Pending',
                        "bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400": event.status === 'Closed',
                    })}
                >{event.status === 'Active' ? 'Activo' : event.status === 'Pending' ? 'Pendiente' : 'Cerrado'}</Badge>
                </TableCell>
                <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menú</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleEdit(event)}><Pencil className="mr-2 h-4 w-4"/>Editar Evento</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
        <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="message" className="font-semibold">Mensaje Atractivo para el Anuncio del Ganador</Label>
            <Textarea id="message" placeholder="Escribe un mensaje divertido y atractivo para mostrar con los resultados..." />
            <Button>Guardar Mensaje</Button>
        </div>
    </div>
  );
}
