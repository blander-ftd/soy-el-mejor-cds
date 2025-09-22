"use client";

import { useState, useEffect } from "react";
import { departmentService, userService, auditLogService } from "@/lib/firebase-service";
import { useAuth } from "@/context/auth-context";
import type { Department, User } from "@/models";
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
import { MoreHorizontal, Pencil, Building2, Plus, X } from "lucide-react";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const departmentFormSchema = z.object({
    name: z.string()
        .min(2, "El nombre del departamento debe tener al menos 2 caracteres.")
        .max(50, "El nombre del departamento no puede exceder 50 caracteres.")
        .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "El nombre solo puede contener letras y espacios."),
    displayName: z.string()
        .min(2, "El nombre de visualización debe tener al menos 2 caracteres.")
        .max(50, "El nombre de visualización no puede exceder 50 caracteres."),
    description: z.string().optional(),
    supervisorIds: z.array(z.string()).optional(),
    coordinatorIds: z.array(z.string()).optional(),
    winnersQuantity: z.number()
        .min(1, "La cantidad de ganadores debe ser al menos 1.")
        .max(10, "La cantidad de ganadores no puede exceder 10."),
    isActive: z.boolean(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

const defaultFormValues: DepartmentFormValues = {
    name: "",
    displayName: "",
    description: "",
    supervisorIds: [],
    coordinatorIds: [],
    winnersQuantity: 1,
    isActive: true,
};

export function DepartmentManagement() {
    const [open, setOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { currentUser } = useAuth();

    const form = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentFormSchema),
        defaultValues: defaultFormValues,
    });

    // Load departments and users from Firebase
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [departmentsData, usersData] = await Promise.all([
                departmentService.getAll(),
                userService.getAll()
            ]);
            setDepartments(departmentsData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los datos.",
            });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (open && editingDepartment) {
            form.reset({
                name: editingDepartment.name || "",
                displayName: editingDepartment.displayName || editingDepartment.name || "",
                description: editingDepartment.description || "",
                supervisorIds: editingDepartment.supervisorIds || [],
                coordinatorIds: editingDepartment.coordinatorIds || [],
                winnersQuantity: editingDepartment.winnersQuantity || 1,
                isActive: editingDepartment.isActive ?? true,
            });
        } else if (!open) {
            form.reset(defaultFormValues);
            setEditingDepartment(null);
        }
    }, [open, editingDepartment, form]);

    async function onSubmit(data: DepartmentFormValues) {
        if (isSubmitting) return;
        
        try {
            setIsSubmitting(true);
            const isEditing = !!editingDepartment;
            
            // Check for existing departments with same name (only when creating or changing name)
            if (!isEditing || (isEditing && editingDepartment.name !== data.name)) {
                const existingDepartment = departments.find(d => 
                    d.name.toLowerCase().trim() === data.name.toLowerCase().trim() &&
                    d.id !== editingDepartment?.id
                );
                if (existingDepartment) {
                    toast({
                        variant: "destructive",
                        title: "Error de Validación",
                        description: "Ya existe un departamento con este nombre.",
                    });
                    return;
                }
            }
            
            const departmentData = {
                name: data.name.trim(),
                displayName: data.displayName.trim(),
                description: data.description?.trim() || undefined,
                supervisorIds: data.supervisorIds || [],
                coordinatorIds: data.coordinatorIds || [],
                winnersQuantity: data.winnersQuantity,
                isActive: data.isActive,
                // Keep existing collaborator IDs if editing
                collaboratorIds: editingDepartment?.collaboratorIds || [],
            };

            if (isEditing && editingDepartment) {
                await departmentService.update(editingDepartment.id, departmentData);
                
                // Log the action
                if (currentUser) {
                    await auditLogService.logAction(
                        currentUser.id,
                        currentUser.name,
                        'Editar Departamento',
                        { 
                            departmentId: editingDepartment.id, 
                            departmentName: data.name,
                            changes: Object.keys(departmentData)
                        },
                        { 
                            resourceId: editingDepartment.id, 
                            resourceType: 'department', 
                            severity: 'medium',
                            success: true
                        }
                    );
                }
            } else {
                const departmentId = await departmentService.create(departmentData);
                
                // Log the action
                if (currentUser) {
                    await auditLogService.logAction(
                        currentUser.id,
                        currentUser.name,
                        'Crear Departamento',
                        { 
                            departmentId, 
                            departmentName: data.name,
                            winnersQuantity: data.winnersQuantity
                        },
                        { 
                            resourceId: departmentId, 
                            resourceType: 'department', 
                            severity: 'medium',
                            success: true
                        }
                    );
                }
            }

            // Reload departments to get the updated list
            await loadData();

            toast({
                title: isEditing ? "¡Departamento Actualizado!" : "¡Departamento Creado!",
                description: `El departamento "${data.displayName}" ha sido ${isEditing ? 'actualizado' : 'creado'} correctamente.`,
            });
            
            // Reset form and close dialog
            form.reset(defaultFormValues);
            setEditingDepartment(null);
            setOpen(false);
            
        } catch (error: any) {
            console.error('Error saving department:', error);
            
            // Log failed action
            if (currentUser) {
                await auditLogService.logAction(
                    currentUser.id,
                    currentUser.name,
                    editingDepartment ? 'Editar Departamento' : 'Crear Departamento',
                    { 
                        attemptedDepartmentName: data.name,
                        error: error.message
                    },
                    { 
                        resourceId: editingDepartment?.id,
                        resourceType: 'department', 
                        severity: 'high',
                        success: false,
                        errorMessage: error.message
                    }
                );
            }
            
            toast({
                variant: "destructive",
                title: `Error al ${editingDepartment ? 'Actualizar' : 'Crear'} Departamento`,
                description: error.message || `No se pudo ${editingDepartment ? 'actualizar' : 'crear'} el departamento. Inténtalo de nuevo.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleEdit = (department: Department) => {
        setEditingDepartment(department);
        setOpen(true);
    };

    // Get user names by IDs
    const getUserNames = (userIds: string[] | undefined) => {
        if (!userIds || userIds.length === 0) return 'No asignado';
        return userIds.map(id => {
            const user = users.find(u => u.id === id);
            return user?.name || 'Usuario no encontrado';
        }).join(', ');
    };

    // Filter users by role
    const supervisors = users.filter(u => u.role === 'Supervisor');
    const coordinators = users.filter(u => u.role === 'Coordinator');

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setOpen(true)}>
                            <Building2 className="mr-2 h-4 w-4" />
                            Crear Departamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingDepartment ? 'Editar' : 'Crear Nuevo'} Departamento</DialogTitle>
                            <DialogDescription>
                               {editingDepartment ? 'Actualiza la información del departamento.' : 'Configura un nuevo departamento en el sistema.'}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del Departamento</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ej., Technology" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Nombre interno del departamento (usado en el sistema)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="displayName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre de Visualización</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ej., Tecnología" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Nombre mostrado a los usuarios
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Descripción del departamento y sus responsabilidades..."
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="supervisorIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Supervisores</FormLabel>
                                                <div className="space-y-2">
                                                    {/* Selected supervisors pills */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {field.value?.map(supervisorId => {
                                                            const supervisor = users.find(u => u.id === supervisorId);
                                                            return supervisor ? (
                                                                <Badge key={supervisorId} variant="secondary" className="flex items-center gap-1">
                                                                    {supervisor.name}
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                                                        onClick={() => {
                                                                            const newValue = field.value?.filter(id => id !== supervisorId) || [];
                                                                            field.onChange(newValue);
                                                                        }}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </Badge>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                    {/* Add supervisor dropdown */}
                                                    <Select 
                                                        onValueChange={(value) => {
                                                            if (value && !field.value?.includes(value)) {
                                                                const newValue = [...(field.value || []), value];
                                                                field.onChange(newValue);
                                                            }
                                                        }}
                                                        value=""
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Agregar supervisor" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {supervisors
                                                                .filter(supervisor => !field.value?.includes(supervisor.id))
                                                                .map(supervisor => (
                                                                    <SelectItem key={supervisor.id} value={supervisor.id}>
                                                                        {supervisor.name}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="coordinatorIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Coordinadores</FormLabel>
                                                <div className="space-y-2">
                                                    {/* Selected coordinators pills */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {field.value?.map(coordinatorId => {
                                                            const coordinator = users.find(u => u.id === coordinatorId);
                                                            return coordinator ? (
                                                                <Badge key={coordinatorId} variant="secondary" className="flex items-center gap-1">
                                                                    {coordinator.name}
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                                                        onClick={() => {
                                                                            const newValue = field.value?.filter(id => id !== coordinatorId) || [];
                                                                            field.onChange(newValue);
                                                                        }}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </Badge>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                    {/* Add coordinator dropdown */}
                                                    <Select 
                                                        onValueChange={(value) => {
                                                            if (value && !field.value?.includes(value)) {
                                                                const newValue = [...(field.value || []), value];
                                                                field.onChange(newValue);
                                                            }
                                                        }}
                                                        value=""
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Agregar coordinador" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {coordinators
                                                                .filter(coordinator => !field.value?.includes(coordinator.id))
                                                                .map(coordinator => (
                                                                    <SelectItem key={coordinator.id} value={coordinator.id}>
                                                                        {coordinator.name}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="winnersQuantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cantidad de Ganadores</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" 
                                                        min="1" 
                                                        max="10"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Número de ganadores permitidos en eventos de votación
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado</FormLabel>
                                                <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value.toString()}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="true">Activo</SelectItem>
                                                        <SelectItem value="false">Inactivo</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                <DialogFooter>
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
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent mr-2"></div>
                                                {editingDepartment ? 'Actualizando...' : 'Creando...'}
                                            </>
                                        ) : (
                                            <>
                                                {editingDepartment ? (
                                                    <>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Guardar Cambios
                                                    </>
                                                ) : (
                                                    <>
                                                        <Building2 className="mr-2 h-4 w-4" />
                                                        Crear Departamento
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Supervisor</TableHead>
                        <TableHead>Coordinador</TableHead>
                        <TableHead>Ganadores</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>
                            <span className="sr-only">Acciones</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex items-center justify-center">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent mr-2"></div>
                                    Cargando departamentos...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : departments.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No hay departamentos registrados
                            </TableCell>
                        </TableRow>
                    ) : (
                        departments.map((department) => (
                            <TableRow key={department.id}>
                                <TableCell>
                                    <div>
                                        <div className="font-medium">{department.displayName || department.name}</div>
                                        {department.description && (
                                            <div className="text-sm text-muted-foreground">{department.description}</div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {department.supervisorIds && department.supervisorIds.length > 0 ? (
                                            department.supervisorIds.map(supervisorId => {
                                                const supervisor = users.find(u => u.id === supervisorId);
                                                return supervisor ? (
                                                    <Badge key={supervisorId} variant="outline" className="text-xs">
                                                        {supervisor.name}
                                                    </Badge>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-muted-foreground text-sm">No asignado</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {department.coordinatorIds && department.coordinatorIds.length > 0 ? (
                                            department.coordinatorIds.map(coordinatorId => {
                                                const coordinator = users.find(u => u.id === coordinatorId);
                                                return coordinator ? (
                                                    <Badge key={coordinatorId} variant="outline" className="text-xs">
                                                        {coordinator.name}
                                                    </Badge>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-muted-foreground text-sm">No asignado</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {department.winnersQuantity || 1}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={department.isActive ? "default" : "secondary"}
                                    >
                                        {department.isActive ? 'Activo' : 'Inactivo'}
                                    </Badge>
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
                                            <DropdownMenuItem onSelect={() => handleEdit(department)}>
                                                <Pencil className="mr-2 h-4 w-4"/>
                                                Editar Departamento
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
