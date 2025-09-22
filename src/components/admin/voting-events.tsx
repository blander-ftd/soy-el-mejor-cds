"use client";

import { useState, useEffect } from "react";
import { votingEventService, auditLogService, nominationService, voteService, surveyEvaluationService, userService, departmentService } from "@/lib/firebase-service";
import { useAuth } from "@/context/auth-context";
import type { VotingEvent, EventDepartment, Nomination, Vote, SurveyEvaluation, User, Department } from "@/models";
import { Timestamp } from "firebase/firestore";
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
import { MoreHorizontal, Pencil, PlusCircle, Calendar as CalendarIcon, Users, Vote as VoteIcon, Star, X, Plus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const surveyQuestionSchema = z.object({
    title: z.string().min(1, "El título de la pregunta es requerido."),
    body: z.string().min(1, "El cuerpo de la pregunta es requerido."),
});

const eventFormSchema = z.object({
    id: z.string().optional(),
    month: z.string()
        .min(3, "El nombre del evento debe tener al menos 3 caracteres.")
        .max(50, "El nombre del evento no puede exceder 50 caracteres.")
        .regex(/^[a-zA-ZÀ-ÿ0-9\s]+$/, "El nombre solo puede contener letras, números y espacios."),
    dateRange: z.object({
        from: z.date({ required_error: "La fecha de inicio del evento es requerida."}),
        to: z.date({ required_error: "La fecha de fin del evento es requerida."}),
    }),
    nominationEndDate: z.date({ required_error: "La fecha de fin de nominación es requerida."}),
    votingEndDate: z.date({ required_error: "La fecha de fin de votación es requerida."}),
    evaluationEndDate: z.date({ required_error: "La fecha de fin de evaluación es requerida."}),
    surveyQuestions: z.array(surveyQuestionSchema).length(5, "Debes proporcionar exactamente 5 preguntas de encuesta."),
    winnerMessage: z.string().optional(),
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
}).refine(data => data.evaluationEndDate <= data.dateRange.to, {
    message: "Debe ser anterior o igual a la fecha de fin del evento.",
    path: ["evaluationEndDate"],
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const defaultFormValues: EventFormValues = {
    month: "",
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
    winnerMessage: undefined,
}


export function VotingEvents() {
    const [open, setOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<VotingEvent | null>(null);
    const [votingEvents, setVotingEvents] = useState<VotingEvent[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // New action dialogs state
    const [nominationDialogOpen, setNominationDialogOpen] = useState(false);
    const [votingDialogOpen, setVotingDialogOpen] = useState(false);
    const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<VotingEvent | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");
    const [departmentUsers, setDepartmentUsers] = useState<User[]>([]);
    const [nominations, setNominations] = useState<Nomination[]>([]);
    const [selectedNominees, setSelectedNominees] = useState<string[]>([]);
    const [surveyScores, setSurveyScores] = useState<Record<string, number[]>>({});
    
    const { toast } = useToast();
    const { currentUser } = useAuth();

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: defaultFormValues,
    });

    // Load voting events from Firebase
    useEffect(() => {
        loadVotingEvents();
    }, []);

    const loadVotingEvents = async () => {
        try {
            setLoading(true);
            const [firebaseEvents, departmentsData] = await Promise.all([
                votingEventService.getAll(),
                departmentService.getActiveOnly()
            ]);
            setVotingEvents(firebaseEvents);
            setDepartments(departmentsData);
        } catch (error) {
            console.error('Error loading voting events:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los eventos de votación.",
            });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (open && editingEvent) {
            const dateRange = {
                from: editingEvent.startDate?.toDate() || new Date(),
                to: editingEvent.endDate?.toDate() || addDays(new Date(), 20),
            };
            form.reset({
                ...editingEvent,
                month: editingEvent.month || "",
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


    async function onSubmit(data: EventFormValues) {
        if (isSubmitting) return; // Prevent double submission
        
        try {
            setIsSubmitting(true);
            const isEditing = !!editingEvent;
            
            // Validate dates
            if (data.dateRange.from >= data.dateRange.to) {
                toast({
                    variant: "destructive",
                    title: "Error de Validación",
                    description: "La fecha de fin debe ser posterior a la fecha de inicio.",
                });
                return;
            }

            if (data.nominationEndDate > data.votingEndDate || data.votingEndDate > data.evaluationEndDate) {
                toast({
                    variant: "destructive",
                    title: "Error de Validación",
                    description: "Las fechas de las fases deben estar en orden cronológico.",
                });
                return;
            }

            // Check for existing events with same name
            if (!isEditing) {
                const existingEvent = votingEvents.find(e => 
                    e.month.toLowerCase().trim() === data.month.toLowerCase().trim()
                );
                if (existingEvent) {
                    toast({
                        variant: "destructive",
                        title: "Error de Validación",
                        description: "Ya existe un evento con este nombre.",
                    });
                    return;
                }
            }
            
            if (isEditing && editingEvent) {
                // For editing, update the single event
                const eventData: any = {
                    month: data.month.trim(),
                    department: editingEvent.department,
                    startDate: Timestamp.fromDate(data.dateRange.from),
                    endDate: Timestamp.fromDate(data.dateRange.to),
                    nominationEndDate: Timestamp.fromDate(data.nominationEndDate),
                    votingEndDate: Timestamp.fromDate(data.votingEndDate),
                    evaluationEndDate: Timestamp.fromDate(data.evaluationEndDate),
                    status: editingEvent.status,
                    surveyQuestions: data.surveyQuestions.map(q => ({
                        title: q.title.trim(),
                        body: q.body.trim()
                    })),
                    createdBy: currentUser?.id
                };

                // Only add winnerMessage if it has content
                if (data.winnerMessage?.trim()) {
                    eventData.winnerMessage = data.winnerMessage.trim();
                }

                await votingEventService.update(editingEvent.id, eventData);
                
                // Log the action
                if (currentUser) {
                    await auditLogService.logAction(
                        currentUser.id,
                        currentUser.name,
                        'Editar Evento',
                        { 
                            eventId: editingEvent.id, 
                            eventName: data.month, 
                            department: editingEvent.department,
                            changes: Object.keys(eventData)
                        },
                        { 
                            resourceId: editingEvent.id, 
                            resourceType: 'event', 
                            severity: 'medium',
                            success: true
                        }
                    );
                }
            } else {
                // For creating new events, create one event for all departments
                const eventData: any = {
                    month: data.month.trim(),
                    department: "All Departments" as const,
                    startDate: Timestamp.fromDate(data.dateRange.from),
                    endDate: Timestamp.fromDate(data.dateRange.to),
                    nominationEndDate: Timestamp.fromDate(data.nominationEndDate),
                    votingEndDate: Timestamp.fromDate(data.votingEndDate),
                    evaluationEndDate: Timestamp.fromDate(data.evaluationEndDate),
                    status: "Pending" as const,
                    surveyQuestions: data.surveyQuestions.map(q => ({
                        title: q.title.trim(),
                        body: q.body.trim()
                    })),
                    createdBy: currentUser?.id
                };

                // Only add winnerMessage if it has content
                if (data.winnerMessage?.trim()) {
                    eventData.winnerMessage = data.winnerMessage.trim();
                }

                const eventId = await votingEventService.create(eventData);
                
                // Log the action for the created event
                if (currentUser) {
                    await auditLogService.logAction(
                        currentUser.id,
                        currentUser.name,
                        'Crear Evento',
                        { 
                            eventId: eventId, 
                            eventName: data.month, 
                            department: "All Departments",
                            startDate: data.dateRange.from.toISOString(),
                            endDate: data.dateRange.to.toISOString()
                        },
                        { 
                            resourceId: eventId, 
                            resourceType: 'event', 
                            severity: 'medium',
                            success: true
                        }
                    );
                }
            }

            // Reload events to get the updated list
            await loadVotingEvents();

            toast({
                title: isEditing ? "¡Evento Actualizado Exitosamente!" : "¡Evento Creado Exitosamente!",
                description: isEditing 
                    ? `El evento "${data.month}" ha sido actualizado correctamente.`
                    : `El evento "${data.month}" ha sido creado para todos los departamentos.`,
            });
            
            // Reset form and close dialog
            form.reset(defaultFormValues);
            setEditingEvent(null);
            setOpen(false);
            
        } catch (error: any) {
            console.error('Error saving voting event:', error);
            
            // Log failed action
            if (currentUser) {
                await auditLogService.logAction(
                    currentUser.id,
                    currentUser.name,
                    editingEvent ? 'Editar Evento' : 'Crear Evento',
                    { 
                        attemptedEventName: data.month,
                        error: error.message
                    },
                    { 
                        ...(editingEvent?.id && { resourceId: editingEvent.id }),
                        resourceType: 'event', 
                        severity: 'high',
                        success: false,
                        errorMessage: error.message
                    }
                );
            }
            
            toast({
                variant: "destructive",
                title: `Error al ${editingEvent ? 'Actualizar' : 'Crear'} Evento`,
                description: error.message || `No se pudo ${editingEvent ? 'actualizar' : 'crear'} el evento. Inténtalo de nuevo.`,
            });
        } finally {
            setIsSubmitting(false);
        }
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

    // Load all collaborators (regardless of department)
    const loadDepartmentUsers = async (department: string) => {
        try {
            // Load all users with role "Collaborator" from the selected department
            const allUsers = await userService.getAll();
            const collaborators = allUsers.filter(user => 
                user.role === 'Collaborator' && user.department === department
            );
            setDepartmentUsers(collaborators);
        } catch (error) {
            console.error('Error loading department collaborators:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los colaboradores del departamento.",
            });
        }
    };

    // Load nominations for an event
    const loadNominations = async (eventId: string) => {
        try {
            const eventNominations = await nominationService.getByEvent(eventId);
            setNominations(eventNominations);
        } catch (error) {
            console.error('Error loading nominations:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar las nominaciones.",
            });
        }
    };

    // Handle nomination action
    const handleNominationAction = (event: VotingEvent) => {
        setSelectedEvent(event);
        setSelectedDepartment("");
        setDepartmentUsers([]);
        setNominations([]);
        setNominationDialogOpen(true);
    };

    // Handle voting action
    const handleVotingAction = (event: VotingEvent) => {
        setSelectedEvent(event);
        setSelectedDepartment("");
        setDepartmentUsers([]);
        setNominations([]);
        setSelectedNominees([]);
        setVotingDialogOpen(true);
    };

    // Handle survey action
    const handleSurveyAction = (event: VotingEvent) => {
        setSelectedEvent(event);
        setSelectedDepartment("");
        setDepartmentUsers([]);
        setNominations([]);
        setSurveyScores({});
        setSurveyDialogOpen(true);
    };

    // Handle department selection for actions
    const handleDepartmentSelect = async (department: string) => {
        setSelectedDepartment(department);
        if (selectedEvent) {
            await loadDepartmentUsers(department);
            await loadNominations(selectedEvent.id);
        }
    };

    // Handle nomination submission
    const handleNominationSubmit = async () => {
        if (!selectedEvent || !selectedDepartment || !currentUser) return;

        try {
            setIsSubmitting(true);
            
            // Get current nominations for this event and department
            const currentNominations = nominations.filter(nom => 
                nom.eventId === selectedEvent.id && 
                departmentUsers.some(user => user.id === nom.collaboratorId && user.department === selectedDepartment)
            );

            // Get selected user IDs
            const selectedUserIds = selectedNominees;
            
            // Find nominations to remove (currently nominated but not selected)
            const nominationsToRemove = currentNominations.filter(nom => 
                !selectedUserIds.includes(nom.collaboratorId)
            );

            // Find new nominations to add (selected but not currently nominated)
            const currentlyNominatedIds = currentNominations.map(nom => nom.collaboratorId);
            const nominationsToAdd = selectedUserIds.filter(userId => 
                !currentlyNominatedIds.includes(userId)
            );

            // Add new nominations
            for (const userId of nominationsToAdd) {
                await nominationService.create({
                    eventId: selectedEvent.id,
                    collaboratorId: userId,
                    nominatedById: currentUser.id,
                    nominationDate: Timestamp.now(),
                    department: selectedDepartment,
                    isActive: true
                });
            }

            // Remove old nominations (mark as inactive)
            // Note: We don't actually delete, just mark as inactive
            // This would require an update method in nominationService

            await auditLogService.logAction(
                currentUser.id,
                currentUser.name,
                'Gestionar Nominaciones',
                {
                    eventId: selectedEvent.id,
                    department: selectedDepartment,
                    added: nominationsToAdd.length,
                    removed: nominationsToRemove.length
                },
                {
                    resourceId: selectedEvent.id,
                    resourceType: 'event',
                    severity: 'medium',
                    success: true
                }
            );

            toast({
                title: "¡Nominaciones Actualizadas!",
                description: `Se actualizaron las nominaciones para ${selectedDepartment}.`,
            });

            setNominationDialogOpen(false);
            
        } catch (error: any) {
            console.error('Error managing nominations:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron actualizar las nominaciones.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle voting submission
    const handleVotingSubmit = async () => {
        if (!selectedEvent || !selectedDepartment || !currentUser || selectedNominees.length === 0) return;

        try {
            setIsSubmitting(true);

            await voteService.create({
                eventId: selectedEvent.id,
                voterId: currentUser.id,
                votedForIds: selectedNominees,
                voteDate: Timestamp.now(),
                voterDepartment: currentUser.department,
                isValid: true
            });

            await auditLogService.logAction(
                currentUser.id,
                currentUser.name,
                'Manejo de Votos',
                {
                    eventId: selectedEvent.id,
                    department: selectedDepartment,
                    votedFor: selectedNominees.length
                },
                {
                    resourceId: selectedEvent.id,
                    resourceType: 'event',
                    severity: 'medium',
                    success: true
                }
            );

            toast({
                title: "¡Votos Registrados!",
                description: `Se registraron los votos para ${selectedDepartment}.`,
            });

            setVotingDialogOpen(false);
            
        } catch (error: any) {
            console.error('Error adding votes:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron registrar los votos.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle survey submission
    const handleSurveySubmit = async () => {
        if (!selectedEvent || !selectedDepartment || !currentUser || Object.keys(surveyScores).length === 0) return;

        try {
            setIsSubmitting(true);

            // Submit evaluations for each nominated user
            for (const [userId, scores] of Object.entries(surveyScores)) {
                await surveyEvaluationService.create({
                    eventId: selectedEvent.id,
                    evaluatorId: currentUser.id,
                    evaluatedUserId: userId,
                    scores: scores,
                    evaluationDate: Timestamp.now(),
                    evaluatorDepartment: currentUser.department,
                    evaluatedUserDepartment: selectedDepartment,
                    isValid: true
                });
            }

            await auditLogService.logAction(
                currentUser.id,
                currentUser.name,
                'Agregar Puntos de Encuesta',
                {
                    eventId: selectedEvent.id,
                    department: selectedDepartment,
                    evaluationsCount: Object.keys(surveyScores).length
                },
                {
                    resourceId: selectedEvent.id,
                    resourceType: 'event',
                    severity: 'medium',
                    success: true
                }
            );

            toast({
                title: "¡Evaluaciones Registradas!",
                description: `Se registraron las evaluaciones para ${selectedDepartment}.`,
            });

            setSurveyDialogOpen(false);
            
        } catch (error: any) {
            console.error('Error adding survey evaluations:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron registrar las evaluaciones.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle survey score change
    const handleSurveyScoreChange = (userId: string, questionIndex: number, value: number[]) => {
        setSurveyScores(prev => ({
            ...prev,
            [userId]: (prev[userId] || Array(selectedEvent?.surveyQuestions?.length || 5).fill(5)).map((score, index) => 
                index === questionIndex ? value[0] : score
            )
        }));
    };



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
                           {editingEvent ? 'Actualiza los detalles del evento a continuación.' : 'Define los parámetros y el cronograma para el nuevo evento de votación. Se creará un solo evento que incluirá a todos los departamentos.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="month"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del Evento</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ej., Agosto 2024" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Se creará un solo evento que incluirá a todos los departamentos.
                                                </FormDescription>
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

                                <div className="space-y-4 border-t pt-4">
                                    <FormField
                                        control={form.control}
                                        name="winnerMessage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mensaje para el Ganador (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        placeholder="Escribe un mensaje personalizado para mostrar con los resultados del ganador..."
                                                        disabled={isSubmitting}
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Este mensaje se mostrará junto con los resultados del evento.
                                                </FormDescription>
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
                                                            <FormControl><Input placeholder="ej., Trabajo en Equipo" disabled={isSubmitting} {...field} /></FormControl>
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
                                                            <FormControl><Textarea placeholder="Introduce la pregunta completa para la encuesta..." disabled={isSubmitting} {...field} /></FormControl>
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
                                    {/* Debug validation errors */}
                                    {!form.formState.isValid && Object.keys(form.formState.errors).length > 0 && (
                                        <div className="w-full mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                            <p className="text-sm font-medium text-destructive mb-2">Errores de validación:</p>
                                            <ul className="text-xs text-destructive space-y-1">
                                                {Object.entries(form.formState.errors).map(([field, error]) => (
                                                    <li key={field}>
                                                        <strong>{field}:</strong> {error?.message || 'Error de validación'}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => setOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting || !form.formState.isValid}
                                        title={!form.formState.isValid ? "Por favor, completa todos los campos correctamente" : ""}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent mr-2"></div>
                                                {editingEvent ? 'Actualizando...' : 'Creando...'}
                                            </>
                                        ) : (
                                            <>
                                                {editingEvent ? (
                                                    <>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Guardar Cambios
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                        Crear Evento
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </Button>
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
            <TableHead>Evento</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fechas</TableHead>
            <TableHead>
                <span className="sr-only">Acciones</span>
            </TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent mr-2"></div>
                            Cargando eventos...
                        </div>
                    </TableCell>
                </TableRow>
            ) : votingEvents.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay eventos de votación registrados
                    </TableCell>
                </TableRow>
            ) : (
                votingEvents.map((event) => (
                <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.month}</TableCell>
                    <TableCell>
                        <Badge variant="outline">
                            {event.department}
                        </Badge>
                    </TableCell>
                    <TableCell>
                    <Badge
                        className={cn({
                            "bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/10 dark:text-green-400": event.status === 'Active',
                            "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400": event.status === 'Pending',
                            "bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400": event.status === 'Closed',
                        })}
                    >{event.status === 'Active' ? 'Activo' : event.status === 'Pending' ? 'Pendiente' : 'Cerrado'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {event.startDate && event.endDate ? (
                            `${format(event.startDate.toDate(), "dd/MM/yy", { locale: es })} - ${format(event.endDate.toDate(), "dd/MM/yy", { locale: es })}`
                        ) : (
                            'Sin fechas'
                        )}
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
                        <DropdownMenuItem onSelect={() => handleEdit(event)}>
                            <Pencil className="mr-2 h-4 w-4"/>
                            Editar Evento
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleNominationAction(event)}>
                            <Users className="mr-2 h-4 w-4"/>
                            Gestionar Nominaciones
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleVotingAction(event)}>
                            <VoteIcon className="mr-2 h-4 w-4"/>
                            Manejo de Votos
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleSurveyAction(event)}>
                            <Star className="mr-2 h-4 w-4"/>
                            Agregar Puntos de Encuesta
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            )}
        </TableBody>
        </Table>


        <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="message" className="font-semibold">Mensaje Atractivo para el Anuncio del Ganador</Label>
            <Textarea id="message" placeholder="Escribe un mensaje divertido y atractivo para mostrar con los resultados..." />
            <Button>Guardar Mensaje</Button>
        </div>

        {/* Nomination Management Dialog */}
        <Dialog open={nominationDialogOpen} onOpenChange={setNominationDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Gestionar Nominaciones</DialogTitle>
                    <DialogDescription>
                        Selecciona un departamento y gestiona las nominaciones para el evento "{selectedEvent?.month}".
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="department-select">Departamento</Label>
                        <Select value={selectedDepartment} onValueChange={handleDepartmentSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un departamento" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.name} value={dept.name}>{dept.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {selectedDepartment && departmentUsers.length > 0 && (
                        <div>
                            <Label>Usuarios del Departamento</Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                                {departmentUsers.map((user) => {
                                    const isNominated = nominations.some(nom => nom.collaboratorId === user.id);
                                    return (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={user.id}
                                                checked={selectedNominees.includes(user.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedNominees(prev => [...prev, user.id]);
                                                    } else {
                                                        setSelectedNominees(prev => prev.filter(id => id !== user.id));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={user.id} className="flex-1">
                                                {user.name}
                                                {isNominated && <Badge variant="secondary" className="ml-2">Nominado</Badge>}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setNominationDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleNominationSubmit} 
                        disabled={isSubmitting || !selectedDepartment}
                    >
                        {isSubmitting ? "Guardando..." : "Guardar Nominaciones"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Voting Dialog */}
        <Dialog open={votingDialogOpen} onOpenChange={setVotingDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manejo de Votos</DialogTitle>
                    <DialogDescription>
                        Selecciona un departamento y vota por los candidatos nominados para el evento "{selectedEvent?.month}".
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="department-select">Departamento</Label>
                        <Select value={selectedDepartment} onValueChange={handleDepartmentSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un departamento" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.name} value={dept.name}>{dept.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {selectedDepartment && nominations.length > 0 && (
                        <div>
                            <Label>Candidatos Nominados</Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                                {nominations
                                    .filter(nom => departmentUsers.some(user => user.id === nom.collaboratorId))
                                    .map((nomination) => {
                                        const user = departmentUsers.find(u => u.id === nomination.collaboratorId);
                                        if (!user) return null;
                                        
                                        return (
                                            <div key={nomination.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={nomination.id}
                                                    checked={selectedNominees.includes(user.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedNominees(prev => [...prev, user.id]);
                                                        } else {
                                                            setSelectedNominees(prev => prev.filter(id => id !== user.id));
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={nomination.id} className="flex-1">
                                                    {user.name}
                                                </Label>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                    
                    {selectedDepartment && nominations.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                            No hay candidatos nominados en este departamento.
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setVotingDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleVotingSubmit} 
                        disabled={isSubmitting || !selectedDepartment || selectedNominees.length === 0}
                    >
                        {isSubmitting ? "Registrando..." : "Registrar Votos"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Survey Evaluation Dialog */}
        <Dialog open={surveyDialogOpen} onOpenChange={setSurveyDialogOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Agregar Puntos de Encuesta</DialogTitle>
                    <DialogDescription>
                        Selecciona un departamento y evalúa a los candidatos nominados para el evento "{selectedEvent?.month}".
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="department-select">Departamento</Label>
                        <Select value={selectedDepartment} onValueChange={handleDepartmentSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un departamento" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.name} value={dept.name}>{dept.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {selectedDepartment && nominations.length > 0 && selectedEvent?.surveyQuestions && (
                        <div className="space-y-6">
                            <Label>Evaluar Candidatos Nominados</Label>
                            {nominations
                                .filter(nom => departmentUsers.some(user => user.id === nom.collaboratorId))
                                .map((nomination) => {
                                    const user = departmentUsers.find(u => u.id === nomination.collaboratorId);
                                    if (!user) return null;
                                    
                                    const userScores = surveyScores[user.id] || Array(selectedEvent.surveyQuestions.length).fill(5);
                                    
                                    return (
                                        <div key={nomination.id} className="border rounded-lg p-4 space-y-4">
                                            <h4 className="font-semibold">{user.name}</h4>
                                            {selectedEvent.surveyQuestions.map((question, index) => (
                                                <div key={index} className="space-y-2">
                                                    <Label className="text-sm font-medium">{question.title}</Label>
                                                    <p className="text-sm text-muted-foreground">{question.body}</p>
                                                    <div className="flex items-center space-x-4">
                                                        <span className="text-sm">1</span>
                                                        <Slider
                                                            value={[userScores[index]]}
                                                            onValueChange={(value) => handleSurveyScoreChange(user.id, index, value)}
                                                            max={10}
                                                            min={1}
                                                            step={1}
                                                            className="flex-1"
                                                        />
                                                        <span className="text-sm">10</span>
                                                        <Badge variant="outline" className="min-w-[3rem] text-center">
                                                            {userScores[index]}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                    
                    {selectedDepartment && nominations.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                            No hay candidatos nominados en este departamento.
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setSurveyDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSurveySubmit} 
                        disabled={isSubmitting || !selectedDepartment || Object.keys(surveyScores).length === 0}
                    >
                        {isSubmitting ? "Registrando..." : "Registrar Evaluaciones"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
