"use client";

import { useState, useEffect } from "react";
import { auditLogService, userService } from "@/lib/firebase-service";
import { useAuth } from "@/context/auth-context";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
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
import { 
  Eye, 
  Undo2, 
  Calendar as CalendarIcon, 
  Filter, 
  X,
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { AuditLog, User, AuditAction } from "@/models";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function AuditLog() {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showUndoDialog, setShowUndoDialog] = useState(false);
    const [undoingLog, setUndoingLog] = useState<AuditLog | null>(null);
    const [isUndoing, setIsUndoing] = useState(false);
    
    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        action: 'all',
        userId: 'all',
        severity: 'all',
        resourceType: 'all',
        dateRange: { from: undefined, to: undefined } as DateRange
    });

    const { currentUser } = useAuth();
    const { toast } = useToast();

    // Available actions for filtering
    const availableActions: AuditAction[] = [
        'Inicio de Sesión',
        'Cierre de Sesión', 
        'Crear Usuario',
        'Editar Usuario',
        'Eliminar Usuario',
        'Crear Evento',
        'Editar Evento',
        'Eliminar Evento',
        'Crear Departamento',
        'Editar Departamento',
        'Eliminar Departamento',
        'Nominar Colaborador',
        'Votar',
        'Completar Encuesta',
        'Ver Resultados',
        'Exportar Datos',
        'Cambiar Configuración',
        'Deshacer Acción'
    ];

    useEffect(() => {
        loadAuditData();
    }, []);

    const loadAuditData = async () => {
        try {
            setLoading(true);
            const [logs, userList] = await Promise.all([
                auditLogService.getFilteredLogs({
                    action: filters.action && filters.action !== 'all' ? filters.action : undefined,
                    userId: filters.userId && filters.userId !== 'all' ? filters.userId : undefined,
                    severity: filters.severity && filters.severity !== 'all' ? filters.severity : undefined,
                    resourceType: filters.resourceType && filters.resourceType !== 'all' ? filters.resourceType : undefined,
                    startDate: filters.dateRange.from,
                    endDate: filters.dateRange.to,
                    limit: 100
                }),
                userService.getAll()
            ]);
            setAuditLogs(logs);
            setUsers(userList);
        } catch (error) {
            console.error('Error loading audit data:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los registros de auditoría.",
            });
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        loadAuditData();
    };

    const clearFilters = () => {
        setFilters({
            action: 'all',
            userId: 'all',
            severity: 'all',
            resourceType: 'all',
            dateRange: { from: undefined, to: undefined }
        });
        // Reload with cleared filters
        setTimeout(() => loadAuditData(), 100);
    };

    const getActionUserName = (userId: string) => {
        return users.find(u => u.id === userId)?.name ?? 'Usuario Desconocido';
    };

    const getSeverityBadge = (severity?: string) => {
        const severityColors = {
            low: "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400",
            medium: "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400",
            high: "bg-orange-500/20 text-orange-700 hover:bg-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400",
            critical: "bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400"
        };

        return (
            <Badge className={severityColors[severity as keyof typeof severityColors] || severityColors.low}>
                {severity || 'low'}
            </Badge>
        );
    };

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setShowDetailDialog(true);
    };

    const handleUndo = (log: AuditLog) => {
        setUndoingLog(log);
        setShowUndoDialog(true);
    };

    const confirmUndo = async () => {
        if (!undoingLog || !currentUser) return;

        try {
            setIsUndoing(true);
            const success = await auditLogService.undoAction(
                undoingLog.id,
                currentUser.id,
                currentUser.name
            );

            if (success) {
                toast({
                    title: "Acción Deshecha",
                    description: `La acción "${undoingLog.action}" ha sido deshecha exitosamente.`,
                });
                loadAuditData(); // Reload to show the undo action
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudo deshacer la acción. Puede que ya haya sido deshecha o no sea reversible.",
                });
            }
        } catch (error) {
            console.error('Error undoing action:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Ocurrió un error al deshacer la acción.",
            });
        } finally {
            setIsUndoing(false);
            setShowUndoDialog(false);
            setUndoingLog(null);
        }
    };

    const canUndo = (log: AuditLog) => {
        return log.canUndo && !log.isUndone && log.oldState && currentUser?.role === 'Admin';
    };

    return (
        <div className="space-y-4">
            {/* Filters Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                    </Button>
                    <Button
                        variant="outline"
                        onClick={loadAuditData}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Actualizar
                    </Button>
                </div>
                {(filters.action !== 'all' || filters.userId !== 'all' || filters.severity !== 'all' || filters.resourceType !== 'all' || filters.dateRange.from) && (
                    <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Limpiar Filtros
                    </Button>
                )}
            </div>

            {/* Filter Controls */}
            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                    <div>
                        <Label htmlFor="action-filter">Acción</Label>
                        <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas las acciones" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las acciones</SelectItem>
                                {availableActions.map(action => (
                                    <SelectItem key={action} value={action}>{action}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="user-filter">Usuario</Label>
                        <Select value={filters.userId} onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los usuarios" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los usuarios</SelectItem>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="severity-filter">Severidad</Label>
                        <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas las severidades" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las severidades</SelectItem>
                                <SelectItem value="low">Baja</SelectItem>
                                <SelectItem value="medium">Media</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="critical">Crítica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="resource-filter">Tipo de Recurso</Label>
                        <Select value={filters.resourceType} onValueChange={(value) => setFilters(prev => ({ ...prev, resourceType: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los tipos</SelectItem>
                                <SelectItem value="user">Usuario</SelectItem>
                                <SelectItem value="event">Evento</SelectItem>
                                <SelectItem value="department">Departamento</SelectItem>
                                <SelectItem value="nomination">Nominación</SelectItem>
                                <SelectItem value="vote">Voto</SelectItem>
                                <SelectItem value="system">Sistema</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="md:col-span-2">
                        <Label>Rango de Fechas</Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal flex-1",
                                            !filters.dateRange.from && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateRange.from ? format(filters.dateRange.from, "PPP", { locale: es }) : "Fecha inicio"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateRange.from}
                                        onSelect={(date) => setFilters(prev => ({ 
                                            ...prev, 
                                            dateRange: { ...prev.dateRange, from: date } 
                                        }))}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal flex-1",
                                            !filters.dateRange.to && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateRange.to ? format(filters.dateRange.to, "PPP", { locale: es }) : "Fecha fin"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filters.dateRange.to}
                                        onSelect={(date) => setFilters(prev => ({ 
                                            ...prev, 
                                            dateRange: { ...prev.dateRange, to: date } 
                                        }))}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="md:col-span-3 flex justify-end">
                        <Button onClick={applyFilters}>Aplicar Filtros</Button>
                    </div>
                </div>
            )}

            {/* Audit Logs Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Marca de Tiempo</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Severidad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Detalles</TableHead>
                        <TableHead>
                            <span className="sr-only">Acciones</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                                <div className="flex items-center justify-center">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent mr-2"></div>
                                    Cargando registros de auditoría...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : auditLogs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No hay registros de auditoría disponibles
                            </TableCell>
                        </TableRow>
                    ) : (
                        auditLogs.map((log) => (
                            <TableRow key={log.id} className={log.isUndone ? "opacity-50" : ""}>
                                <TableCell>
                                    {format(log.timestamp.toDate(), "PPP p", { locale: es })}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {log.userName || getActionUserName(log.userId)}
                                </TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                                <TableCell>
                                    {log.isUndone ? (
                                        <Badge variant="destructive">Deshecho</Badge>
                                    ) : log.success ? (
                                        <Badge variant="default">Exitoso</Badge>
                                    ) : (
                                        <Badge variant="destructive">Fallido</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono text-xs max-w-xs truncate">
                                    {JSON.stringify(log.details)}
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
                                            <DropdownMenuItem onSelect={() => handleViewDetails(log)}>
                                                <Eye className="mr-2 h-4 w-4"/>
                                                Ver Detalles
                                            </DropdownMenuItem>
                                            {canUndo(log) && (
                                                <DropdownMenuItem onSelect={() => handleUndo(log)}>
                                                    <Undo2 className="mr-2 h-4 w-4"/>
                                                    Deshacer
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalles del Registro de Auditoría</DialogTitle>
                        <DialogDescription>
                            Información completa del registro seleccionado
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-semibold">ID:</Label>
                                    <p className="font-mono text-sm">{selectedLog.id}</p>
                                </div>
                                <div>
                                    <Label className="font-semibold">Fecha y Hora:</Label>
                                    <p>{format(selectedLog.timestamp.toDate(), "PPP p", { locale: es })}</p>
                                </div>
                                <div>
                                    <Label className="font-semibold">Usuario:</Label>
                                    <p>{selectedLog.userName || getActionUserName(selectedLog.userId)}</p>
                                </div>
                                <div>
                                    <Label className="font-semibold">Acción:</Label>
                                    <p>{selectedLog.action}</p>
                                </div>
                                <div>
                                    <Label className="font-semibold">Severidad:</Label>
                                    <div>{getSeverityBadge(selectedLog.severity)}</div>
                                </div>
                                <div>
                                    <Label className="font-semibold">Estado:</Label>
                                    <div>
                                        {selectedLog.isUndone ? (
                                            <Badge variant="destructive">Deshecho</Badge>
                                        ) : selectedLog.success ? (
                                            <Badge variant="default">Exitoso</Badge>
                                        ) : (
                                            <Badge variant="destructive">Fallido</Badge>
                                        )}
                                    </div>
                                </div>
                                {selectedLog.resourceType && (
                                    <div>
                                        <Label className="font-semibold">Tipo de Recurso:</Label>
                                        <p>{selectedLog.resourceType}</p>
                                    </div>
                                )}
                                {selectedLog.resourceId && (
                                    <div>
                                        <Label className="font-semibold">ID del Recurso:</Label>
                                        <p className="font-mono text-sm">{selectedLog.resourceId}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label className="font-semibold">Detalles:</Label>
                                <pre className="mt-2 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>

                            {selectedLog.oldState && (
                                <div>
                                    <Label className="font-semibold">Estado Anterior:</Label>
                                    <pre className="mt-2 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                                        {JSON.stringify(selectedLog.oldState, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.newState && (
                                <div>
                                    <Label className="font-semibold">Estado Nuevo:</Label>
                                    <pre className="mt-2 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                                        {JSON.stringify(selectedLog.newState, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.errorMessage && (
                                <div>
                                    <Label className="font-semibold">Mensaje de Error:</Label>
                                    <p className="mt-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                        {selectedLog.errorMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowDetailDialog(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Undo Confirmation Dialog */}
            <AlertDialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Deshacer Acción</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres deshacer la acción "{undoingLog?.action}"?
                            Esta operación restaurará el estado anterior del recurso y no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUndoing}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmUndo}
                            disabled={isUndoing}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isUndoing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent mr-2"></div>
                                    Deshaciendo...
                                </>
                            ) : (
                                <>
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Deshacer
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
