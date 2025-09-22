"use client";

import React, { useState, useEffect } from "react";
import { userService, auditLogService, departmentService } from "@/lib/firebase-service";
import { useAuth } from "@/context/auth-context";
import type { User, UserRole, Department } from "@/models";
import type { Role } from "@/lib/types";
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
import { MoreHorizontal, Pencil, Trash2, UserPlus, Upload, Search } from "lucide-react";
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
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

const createUserFormSchema = (departmentNames: string[]) => z.object({
    id: z.string().optional(),
    name: z.string()
        .min(2, "El nombre debe tener al menos 2 caracteres.")
        .max(50, "El nombre no puede exceder 50 caracteres.")
        .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "El nombre solo puede contener letras y espacios.")
        .refine((val) => val.replace(/[^a-zA-ZÀ-ÿ]/g, '').length >= 3, "El nombre debe contener al menos 3 letras."),
    email: z.string()
        .optional()
        .or(z.literal(""))
        .refine((val) => !val || val === "" || z.string().email().safeParse(val).success, "Dirección de correo electrónico inválida.")
        .refine((val) => !val || val === "" || val.length >= 5, "El correo debe tener al menos 5 caracteres.")
        .refine((val) => !val || val === "" || val.length <= 100, "El correo no puede exceder 100 caracteres."),
    cedula: z.string()
        .min(1, "La cédula es requerida.")
        .regex(/^\d{7,10}$/, "La cédula debe tener entre 7 y 10 dígitos."),
    role: z.enum(["Admin", "Supervisor", "Coordinator", "Collaborator"], {
        errorMap: () => ({ message: "Selecciona un rol válido." })
    }),
    department: z.string().optional(),
}).refine((data) => {
    // Department is required for all roles except Admin
    if (data.role !== "Admin" && (!data.department || data.department.trim() === "")) {
        return false;
    }
    // For Admin role, department should be empty or undefined
    if (data.role === "Admin" && data.department && data.department.trim() !== "") {
        return false;
    }
    // If department is provided for non-Admin, it must be valid
    if (data.role !== "Admin" && data.department && departmentNames.length > 0 && !departmentNames.includes(data.department)) {
        return false;
    }
    return true;
}, {
    message: "El departamento es requerido para este rol.",
    path: ["department"]
});

type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>;

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [isAddUserOpen, setAddUserOpen] = useState(false);
    const [isEditUserOpen, setEditUserOpen] = useState(false);
    const [isImportOpen, setImportOpen] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [isUpdatingUser, setIsUpdatingUser] = useState(false);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState<string>("");
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [createdUserEmail, setCreatedUserEmail] = useState<string>("");
    const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);
    const [pendingUserData, setPendingUserData] = useState<any>(null);
    const [selectedRole, setSelectedRole] = useState<Role>("Collaborator");
    const [selectedEditRole, setSelectedEditRole] = useState<Role>("Collaborator");
    const { toast } = useToast();
    const { currentUser } = useAuth();

    // Get department names for form validation
    const departmentNames = departments.map(dept => dept.name);
    const userFormSchema = createUserFormSchema(departmentNames);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: { 
            name: "", 
            email: "", 
            cedula: "",
            role: "Collaborator", 
            department: "" 
        },
        mode: "onChange"
    });

    // Update form when departments are loaded
    useEffect(() => {
        if (departments.length > 0 && !form.getValues('department') && form.getValues('role') !== 'Admin') {
            form.setValue('department', departments[0].name);
        }
    }, [departments, form]);

    const editForm = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: { 
            name: "", 
            email: "", 
            cedula: "",
            role: "Collaborator", 
            department: departmentNames[0] || "" 
        },
        mode: "onChange"
    });

    // Load users from Firebase
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const [firebaseUsers, departmentsData] = await Promise.all([
                userService.getAll(),
                departmentService.getActiveOnly()
            ]);
            setUsers(firebaseUsers);
            setDepartments(departmentsData);
            setFilteredUsers(firebaseUsers);
        } catch (error) {
            console.error('Error loading users:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los usuarios.",
            });
        } finally {
            setLoading(false);
        }
    };

    // Search functionality
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.cedula && user.cedula.includes(searchTerm))
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    // Edit user functionality
    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setSelectedEditRole(user.role as Role);
        editForm.reset({
            id: user.id,
            name: user.name,
            email: user.email,
            cedula: user.cedula || "",
            role: user.role as Role,
            department: user.department
        });
        setEditUserOpen(true);
    };

    // Delete user functionality
    const handleDeleteUser = (user: User) => {
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete || !currentUser) return;

        try {
            setIsDeletingUser(true);
            
            // Check if trying to delete self
            if (userToDelete.id === currentUser.id) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No puedes eliminar tu propia cuenta.",
                });
                return;
            }

            await userService.delete(userToDelete.id);
            
            // Log the action
            await auditLogService.logAction(
                currentUser.id,
                currentUser.name,
                'Eliminar Usuario',
                { 
                    deletedUserId: userToDelete.id,
                    deletedUserName: userToDelete.name,
                    deletedUserEmail: userToDelete.email
                },
                { 
                    resourceId: userToDelete.id, 
                    resourceType: 'user', 
                    severity: 'high',
                    success: true
                }
            );

            toast({
                title: "Usuario Eliminado",
                description: `El usuario ${userToDelete.name} ha sido eliminado exitosamente.`,
            });

            // Reload users
            await loadUsers();
            
        } catch (error: any) {
            console.error('Error deleting user:', error);
            
            // Log failed action
            if (currentUser) {
                await auditLogService.logAction(
                    currentUser.id,
                    currentUser.name,
                    'Eliminar Usuario',
                    { 
                        attemptedUserId: userToDelete.id,
                        attemptedUserName: userToDelete.name,
                        error: error.message
                    },
                    { 
                        resourceId: userToDelete.id,
                        resourceType: 'user', 
                        severity: 'high',
                        success: false,
                        errorMessage: error.message
                    }
                );
            }
            
            toast({
                variant: "destructive",
                title: "Error al Eliminar Usuario",
                description: error.message || "No se pudo eliminar el usuario. Inténtalo de nuevo.",
            });
        } finally {
            setIsDeletingUser(false);
            setShowDeleteDialog(false);
            setUserToDelete(null);
        }
    };

    // Generate email from name
    const generateEmailFromName = (name: string): string => {
        const cleanName = name.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase();
        const namePrefix = cleanName.substring(0, 3);
        return `${namePrefix}@soyelmejor.com`;
    };

    // Handle user creation with email confirmation
    const createUserWithData = async (userData: any) => {
        try {
            setIsCreatingUser(true);
            
            const finalEmail = userData.email || generateEmailFromName(userData.name);
            
            // Validate email uniqueness
            const existingUser = users.find(u => u.email.toLowerCase() === finalEmail.toLowerCase());
            if (existingUser) {
                toast({
                    variant: "destructive",
                    title: "Error de Validación",
                    description: "Ya existe un usuario con este correo electrónico.",
                });
                return;
            }

            const newUserData: any = {
                name: userData.name.trim(),
                email: finalEmail.toLowerCase().trim(),
                role: userData.role,
                avatar: `https://picsum.photos/seed/${encodeURIComponent(userData.name)}/100`,
            };

            // Only add department if not Admin and has value
            if (userData.role !== 'Admin' && userData.department) {
                newUserData.department = userData.department;
            }

            // Only add cedula if it has a value
            if (userData.cedula?.trim()) {
                newUserData.cedula = userData.cedula.trim();
            }

            // Create user with Firebase Auth credentials
            let result, userId;
            try {
                console.log('Attempting to create user with data:', newUserData);
                result = await userService.createWithAuth(newUserData);
                userId = result.userId;
                console.log('User created successfully with auth:', result);
            } catch (error: any) {
                console.error('Error creating user with auth:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details
                });
                
                // Check if it's a specific validation error
                if (error.message?.includes('Missing required fields') || 
                    error.message?.includes('Cedula is required') ||
                    error.message?.includes('Department is required')) {
                    toast({
                        variant: "destructive",
                        title: "Error de Validación",
                        description: error.message,
                    });
                    return;
                }
                
                console.warn('Firebase Function not available, falling back to regular user creation:', error.message);
                
                // Fallback to regular user creation (without auth credentials)
                userId = await userService.create(newUserData);
                result = { 
                    userId, 
                    tempPassword: 'N/A - Function not available' 
                };
                
                toast({
                    variant: "destructive",
                    title: "Advertencia",
                    description: "Usuario creado sin credenciales de autenticación. La función de Firebase no está disponible.",
                });
            }
            
            // Log the action for audit trail
            if (currentUser) {
                await auditLogService.logAction(
                    currentUser.id,
                    currentUser.name,
                    'Crear Usuario',
                    { 
                        newUserId: userId, 
                        userName: userData.name, 
                        userRole: userData.role,
                        userDepartment: userData.department,
                        userEmail: finalEmail
                    },
                    { 
                        resourceId: userId, 
                        resourceType: 'user', 
                        severity: 'medium',
                        success: true
                    }
                );
            }

            // Reload users to get the updated list
            await loadUsers();

            // Show generated password to admin
            setGeneratedPassword(result.tempPassword);
            setCreatedUserEmail(finalEmail);
            setShowPasswordDialog(true);

            toast({
                title: "¡Usuario Creado Exitosamente!",
                description: `${userData.name} ha sido creado con credenciales de autenticación.`,
            });
            
            // Reset form and close dialog
            form.reset({
                name: "",
                email: "",
                role: "Collaborator",
                department: "Technology",
                cedula: ""
            });
            setAddUserOpen(false);
            
        } catch (error: any) {
            console.error('Error creating user:', error);
            
            // Log failed action
            if (currentUser) {
                await auditLogService.logAction(
                    currentUser.id,
                    currentUser.name,
                    'Crear Usuario',
                    { 
                        attemptedUserName: userData.name,
                        attemptedUserEmail: userData.email,
                        error: error.message
                    },
                    { 
                        resourceType: 'user', 
                        severity: 'high',
                        success: false,
                        errorMessage: error.message
                    }
                );
            }
            
            toast({
                variant: "destructive",
                title: "Error al Crear Usuario",
                description: error.message || "No se pudo crear el usuario. Inténtalo de nuevo.",
            });
        } finally {
            setIsCreatingUser(false);
        }
    };

    async function onAddUserSubmit(data: UserFormValues) {
        if (isCreatingUser) return; // Prevent double submission
        
        // Check if email is provided
        if (!data.email || data.email.trim() === "") {
            // Show confirmation dialog for generated email
            const generatedEmail = generateEmailFromName(data.name);
            setPendingUserData({ ...data, generatedEmail });
            setShowEmailConfirmDialog(true);
            return;
        }

        // Proceed with provided email
        await createUserWithData(data);
    }

    async function onEditUserSubmit(data: UserFormValues) {
        if (isUpdatingUser || !editingUser || !currentUser) return;
        
        try {
            setIsUpdatingUser(true);
            
            // Validate email uniqueness (excluding current user)
            const existingUser = users.find(u => 
                u.email.toLowerCase() === (data.email || "").toLowerCase() && 
                u.id !== editingUser.id
            );
            if (existingUser) {
                toast({
                    variant: "destructive",
                    title: "Error de Validación",
                    description: "Ya existe un usuario con este correo electrónico.",
                });
                return;
            }

            // Validate cedula uniqueness (excluding current user)
            if (data.cedula) {
                const existingCedula = users.find(u => 
                    u.cedula === data.cedula && 
                    u.id !== editingUser.id
                );
                if (existingCedula) {
                    toast({
                        variant: "destructive",
                        title: "Error de Validación",
                        description: "Ya existe un usuario con esta cédula.",
                    });
                    return;
                }
            }

            // Store old state for audit log
            const oldState = {
                name: editingUser.name,
                email: editingUser.email,
                cedula: editingUser.cedula,
                role: editingUser.role,
                department: editingUser.department
            };

            const updatedUserData: any = {
                name: data.name.trim(),
                email: (data.email || "").toLowerCase().trim(),
                role: data.role,
            };

            // Only add department if not Admin and has value
            if (data.role !== 'Admin' && data.department) {
                updatedUserData.department = data.department;
            }

            // Only add cedula if it has a value
            if (data.cedula?.trim()) {
                updatedUserData.cedula = data.cedula.trim();
            }

            await userService.update(editingUser.id, updatedUserData);
            
            // Log the action with old and new state
            await auditLogService.logAction(
                currentUser.id,
                currentUser.name,
                'Editar Usuario',
                { 
                    userId: editingUser.id, 
                    userName: data.name,
                    changes: Object.keys(updatedUserData)
                },
                { 
                    resourceId: editingUser.id, 
                    resourceType: 'user', 
                    severity: 'medium',
                    success: true,
                    oldState,
                    newState: updatedUserData,
                    canUndo: true
                }
            );

            toast({
                title: "¡Usuario Actualizado Exitosamente!",
                description: `El usuario ${data.name} ha sido actualizado correctamente.`,
            });

            // Reset form and close dialog
            editForm.reset();
            setEditUserOpen(false);
            setEditingUser(null);
            
            // Reload users to get updated data
            await loadUsers();
            
        } catch (error: any) {
            console.error('Error updating user:', error);
            
            // Log failed action
            if (currentUser) {
                await auditLogService.logAction(
                    currentUser.id,
                    currentUser.name,
                    'Editar Usuario',
                    { 
                        attemptedUserId: editingUser.id,
                        attemptedUserName: data.name,
                        error: error.message
                    },
                    { 
                        resourceId: editingUser.id,
                        resourceType: 'user', 
                        severity: 'high',
                        success: false,
                        errorMessage: error.message
                    }
                );
            }
            
            toast({
                variant: "destructive",
                title: "Error al Actualizar Usuario",
                description: error.message || "No se pudo actualizar el usuario. Inténtalo de nuevo.",
            });
        } finally {
            setIsUpdatingUser(false);
        }
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const bstr = event.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws) as any[];

                    const newUsers = data.map(row => ({
                        id: `user-${Date.now()}-${Math.random()}`,
                        name: row.name,
                        email: row.email,
                        role: row.role,
                        department: row.department,
                        avatar: `https://picsum.photos/seed/${row.name}/100`,
                    }));
                    
                    setUsers(prev => [...prev, ...newUsers]);
                    toast({
                        title: 'Importación Exitosa',
                        description: `${newUsers.length} usuarios han sido importados.`,
                    });
                    setImportOpen(false);
                } catch (error) {
                     toast({
                        variant: 'destructive',
                        title: 'Importación Fallida',
                        description: 'Hubo un error al analizar el archivo de Excel.',
                    });
                }
            };
            reader.readAsBinaryString(file);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Buscar por nombre o cédula..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                <Dialog open={isAddUserOpen} onOpenChange={setAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2"/> Agregar Usuario</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                            <DialogDescription>
                                Completa el formulario para agregar un nuevo usuario al sistema.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(onAddUserSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre Completo *</Label>
                                    <Input 
                                        id="name" 
                                        placeholder="Ej: Juan Pérez"
                                        disabled={isCreatingUser}
                                        {...form.register("name")} 
                                    />
                                    {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cedula">Cédula *</Label>
                                    <Input 
                                        id="cedula" 
                                        placeholder="Ej: 12345678"
                                        disabled={isCreatingUser}
                                        {...form.register("cedula")} 
                                    />
                                    {form.formState.errors.cedula && <p className="text-sm text-destructive">{form.formState.errors.cedula.message}</p>}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="Ej: juan.perez@empresa.com (opcional - se generará automáticamente)"
                                    disabled={isCreatingUser}
                                    {...form.register("email")} 
                                />
                                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Rol *</Label>
                                    <Select 
                                        onValueChange={(value: Role) => {
                                            form.setValue('role', value);
                                            setSelectedRole(value);
                                            if (value === 'Admin') {
                                                form.setValue('department', '');
                                            } else if (departments.length > 0) {
                                                form.setValue('department', departments[0].name);
                                            }
                                        }} 
                                        defaultValue={form.getValues('role')}
                                        disabled={isCreatingUser}
                                    >
                                        <SelectTrigger id="role">
                                            <SelectValue placeholder="Selecciona un rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Admin">Administrador</SelectItem>
                                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                                            <SelectItem value="Coordinator">Coordinador</SelectItem>
                                            <SelectItem value="Collaborator">Colaborador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.role && <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">
                                        Departamento {selectedRole !== 'Admin' ? '*' : ''}
                                    </Label>
                                    <Select 
                                        onValueChange={(value) => form.setValue('department', value as any)} 
                                        defaultValue={form.getValues('department')}
                                        disabled={isCreatingUser || selectedRole === 'Admin'}
                                    >
                                        <SelectTrigger id="department">
                                            <SelectValue placeholder={
                                                selectedRole === 'Admin' 
                                                    ? "No aplica para Administradores" 
                                                    : "Selecciona un departamento"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(dept => <SelectItem key={dept.name} value={dept.name}>{dept.displayName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.department && <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>}
                                </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                                * Campos obligatorios
                            </div>
                            
                            <DialogFooter>
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
                                    onClick={() => setAddUserOpen(false)}
                                    disabled={isCreatingUser}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isCreatingUser || !form.formState.isValid}
                                    title={!form.formState.isValid ? "Por favor, completa todos los campos correctamente" : ""}
                                >
                                    {isCreatingUser ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent mr-2"></div>
                                            Creando...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Crear Usuario
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isImportOpen} onOpenChange={setImportOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Upload className="mr-2"/> Importar desde Excel</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Importar Usuarios desde Excel</DialogTitle>
                            <DialogDescription>
                                Sube un archivo de Excel con las columnas: name, email, role, department.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Label htmlFor="excel-file">Archivo Excel</Label>
                            <Input id="excel-file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                            <p className="text-xs text-muted-foreground">
                                Asegúrate de que tu archivo tenga las columnas correctas. Los roles deben ser uno de: Admin, Supervisor, Coordinator, Collaborator. Los departamentos deben coincidir con los existentes.
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={isEditUserOpen} onOpenChange={setEditUserOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Usuario</DialogTitle>
                            <DialogDescription>
                                Modifica la información del usuario seleccionado.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={editForm.handleSubmit(onEditUserSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Nombre Completo *</Label>
                                    <Input 
                                        id="edit-name" 
                                        placeholder="Ej: Juan Pérez"
                                        disabled={isUpdatingUser}
                                        {...editForm.register("name")} 
                                    />
                                    {editForm.formState.errors.name && (
                                        <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">Correo Electrónico</Label>
                                    <Input 
                                        id="edit-email" 
                                        type="email" 
                                        placeholder="juan@empresa.com (opcional)"
                                        disabled={isUpdatingUser}
                                        {...editForm.register("email")} 
                                    />
                                    {editForm.formState.errors.email && (
                                        <p className="text-sm text-destructive">{editForm.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-cedula">Cédula *</Label>
                                    <Input 
                                        id="edit-cedula" 
                                        placeholder="12345678"
                                        disabled={isUpdatingUser}
                                        {...editForm.register("cedula")} 
                                    />
                                    {editForm.formState.errors.cedula && (
                                        <p className="text-sm text-destructive">{editForm.formState.errors.cedula.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">Rol *</Label>
                                    <Select 
                                        disabled={isUpdatingUser}
                                        value={editForm.watch("role")} 
                                        onValueChange={(value) => {
                                            editForm.setValue("role", value as Role);
                                            setSelectedEditRole(value as Role);
                                            if (value === 'Admin') {
                                                editForm.setValue('department', undefined);
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Admin">Administrador</SelectItem>
                                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                                            <SelectItem value="Coordinator">Coordinador</SelectItem>
                                            <SelectItem value="Collaborator">Colaborador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {editForm.formState.errors.role && (
                                        <p className="text-sm text-destructive">{editForm.formState.errors.role.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="edit-department">
                                        Departamento {selectedEditRole !== 'Admin' ? '*' : ''}
                                    </Label>
                                    <Select 
                                        disabled={isUpdatingUser || selectedEditRole === 'Admin'}
                                        value={editForm.watch("department")} 
                                        onValueChange={(value) => editForm.setValue("department", value as any)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={
                                                selectedEditRole === 'Admin' 
                                                    ? "No aplica para Administradores" 
                                                    : "Selecciona un departamento"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.name} value={dept.name}>{dept.displayName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {editForm.formState.errors.department && (
                                        <p className="text-sm text-destructive">{editForm.formState.errors.department.message}</p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setEditUserOpen(false)}
                                    disabled={isUpdatingUser}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isUpdatingUser || !editForm.formState.isValid}
                                >
                                    {isUpdatingUser ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent mr-2"></div>
                                            Actualizando...
                                        </>
                                    ) : (
                                        <>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Actualizar Usuario
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres eliminar al usuario "{userToDelete?.name}"?
                            Esta acción no se puede deshacer y eliminará permanentemente toda la información del usuario.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingUser}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteUser}
                            disabled={isDeletingUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingUser ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent mr-2"></div>
                                    Eliminando...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Usuario
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Generated Password Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Usuario Creado Exitosamente</DialogTitle>
                        <DialogDescription>
                            El usuario ha sido creado con credenciales de autenticación. La contraseña se generó usando las primeras 3 letras del nombre + la cédula.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="user-email">Email del Usuario</Label>
                            <Input
                                id="user-email"
                                value={createdUserEmail}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="generated-password">Contraseña Inicial</Label>
                            <div className="flex space-x-2">
                                <Input
                                    id="generated-password"
                                    value={generatedPassword}
                                    readOnly
                                    className="bg-muted font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedPassword);
                                        toast({
                                            title: "¡Copiado!",
                                            description: "La contraseña inicial ha sido copiada al portapapeles.",
                                        });
                                    }}
                                >
                                    Copiar
                                </Button>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                                <strong>Información:</strong> La contraseña se genera usando las primeras 3 letras del nombre + la cédula.
                                Proporciona esta información al usuario de forma segura.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowPasswordDialog(false)}>
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Confirmation Dialog */}
            <Dialog open={showEmailConfirmDialog} onOpenChange={setShowEmailConfirmDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Email Generado</DialogTitle>
                        <DialogDescription>
                            No se proporcionó un email. ¿Deseas usar el email generado automáticamente?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Generado</Label>
                            <Input
                                value={pendingUserData?.generatedEmail || ""}
                                readOnly
                                className="bg-muted font-mono"
                            />
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                                <strong>Información:</strong> El email se genera usando las primeras 3 letras del nombre + "@soyelmejor.com"
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowEmailConfirmDialog(false);
                                setPendingUserData(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={async () => {
                                setShowEmailConfirmDialog(false);
                                if (pendingUserData) {
                                    await createUserWithData(pendingUserData);
                                    setPendingUserData(null);
                                }
                            }}
                        >
                            Confirmar y Crear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Correo Electrónico</TableHead>
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
                                    Cargando usuarios...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : filteredUsers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>{user.role === 'Admin' ? 'N/A' : user.department}</TableCell>
                            <TableCell>{user.email}</TableCell>
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
                                <DropdownMenuItem onSelect={() => handleEditUser(user)}>
                                    <Pencil className="mr-2 h-4 w-4"/>Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="text-destructive" 
                                    onSelect={() => handleDeleteUser(user)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4"/>Eliminar
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
        </div>
    );
}
