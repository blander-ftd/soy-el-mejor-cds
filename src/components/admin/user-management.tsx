"use client";

import React, { useState } from "react";
import { users as initialUsers, departments } from "@/lib/data";
import type { User, Role } from "@/lib/types";
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
import { MoreHorizontal, Pencil, Trash2, UserPlus, Upload } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

const userFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre es requerido."),
    email: z.string().email("Dirección de correo electrónico inválida."),
    role: z.enum(["Admin", "Supervisor", "Coordinator", "Collaborator"]),
    department: z.enum(["Technology", "Marketing", "Sales", "Human Resources"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export function UserManagement() {
    const [users, setUsers] = useState(initialUsers);
    const [isAddUserOpen, setAddUserOpen] = useState(false);
    const [isImportOpen, setImportOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: { name: "", email: "", role: "Collaborator", department: "Technology" },
    });

    function onAddUserSubmit(data: UserFormValues) {
        const newUser: User = {
            id: `user-${Date.now()}`,
            avatar: `https://picsum.photos/seed/${data.name}/100`,
            ...data,
        };
        setUsers(prev => [...prev, newUser]);
        toast({
            title: "¡Usuario Creado!",
            description: `${data.name} ha sido agregado al sistema.`,
        });
        setAddUserOpen(false);
        form.reset();
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
            <div className="flex justify-end gap-2">
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
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" {...form.register("name")} />
                                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input id="email" type="email" {...form.register("email")} />
                                {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="role">Rol</Label>
                                <Select onValueChange={(value: Role) => form.setValue('role', value)} defaultValue={form.getValues('role')}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                                        <SelectItem value="Coordinator">Coordinador</SelectItem>
                                        <SelectItem value="Collaborator">Colaborador</SelectItem>
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.role && <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="department">Departamento</Label>
                                <Select onValueChange={(value) => form.setValue('department', value as any)} defaultValue={form.getValues('department')}>
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="Selecciona un departamento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.department && <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setAddUserOpen(false)}>Cancelar</Button>
                                <Button type="submit">Crear Usuario</Button>
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
            </div>
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
                    {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
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
                            <DropdownMenuItem><Pencil className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </div>
    );
}
