"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { users, nominations, votingEvents } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Clock, Users, Vote, BarChart3, ChevronDown } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import type { Department } from "@/lib/types";

// Helper to find the most recently closed event
const findLastClosedEvent = () => {
  return votingEvents
    .filter(event => event.status === 'Closed' && event.endDate)
    .sort((a, b) => b.endDate!.getTime() - a.endDate!.getTime())[0];
};

// Helper to find the current active event
const findActiveEvent = () => {
  const now = new Date();
  return votingEvents.find(event => 
    event.status === 'Active' && 
    event.startDate && 
    event.endDate && 
    now >= event.startDate && 
    now <= event.endDate
  );
};

// Helper to get events filtered by department
const getEventsByDepartment = (department?: Department | "All Departments") => {
  if (!department || department === "All Departments") {
    return votingEvents;
  }
  return votingEvents.filter(event => 
    event.department === department || event.department === "All Departments"
  );
};

// Helper to get available departments from events
const getAvailableDepartments = (): (Department | "All Departments")[] => {
  const departments = new Set<Department | "All Departments">();
  votingEvents.forEach(event => {
    if (event.department) {
      departments.add(event.department);
    }
  });
  return Array.from(departments).sort();
};

// Helper to determine current phase of an active event
const getCurrentPhase = (event: any) => {
  if (!event || !event.startDate) return null;
  
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  // Calculate phase dates (7 days nomination, 7 days voting, rest evaluation)
  const nominationEndDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const votingEndDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  if (now >= startDate && now <= nominationEndDate) {
    return { 
      phase: 'nomination', 
      label: 'Nominaciones', 
      icon: Users,
      progress: ((now.getTime() - startDate.getTime()) / (nominationEndDate.getTime() - startDate.getTime())) * 100
    };
  } else if (now > nominationEndDate && now <= votingEndDate) {
    return { 
      phase: 'voting', 
      label: 'Votación', 
      icon: Vote,
      progress: ((now.getTime() - nominationEndDate.getTime()) / (votingEndDate.getTime() - nominationEndDate.getTime())) * 100
    };
  } else if (now > votingEndDate && now <= endDate) {
    return { 
      phase: 'evaluation', 
      label: 'Evaluación', 
      icon: BarChart3,
      progress: ((now.getTime() - votingEndDate.getTime()) / (endDate.getTime() - votingEndDate.getTime())) * 100
    };
  }
  
  return null;
};

// Helper to get nominations for a specific event
const getEventNominations = (eventId: string) => {
  return nominations.filter(n => n.eventId === eventId);
};

// Helper to find the winner based on most nominations for an event
const findWinnerFromEvent = (eventId: string) => {
  const eventNominations = getEventNominations(eventId);
  if (eventNominations.length === 0) return null;

  const nominationCounts = eventNominations.reduce((acc, nom) => {
    acc[nom.collaboratorId] = (acc[nom.collaboratorId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const winnerId = Object.keys(nominationCounts).reduce((a, b) => nominationCounts[a] > nominationCounts[b] ? a : b);
  
  return users.find(u => u.id === winnerId) || null;
};

// Mock data generation for the chart based on event nominations
const generateVoteData = (eventId: string) => {
    const eventNominations = getEventNominations(eventId);
    const nomineeIds = [...new Set(eventNominations.map(n => n.collaboratorId))];
    
    // Simulate votes for nominees - giving winner the most votes
    const winnerId = findWinnerFromEvent(eventId)?.id;

    return nomineeIds.map(id => {
        const user = users.find(u => u.id === id);
        const name = user ? user.name.split(' ')[0] + ' ' + user.name.split(' ')[1][0] + '.' : 'Unknown';
        let votes = Math.floor(Math.random() * 12) + 5; // random votes between 5 and 16
        if(id === winnerId) {
            votes = Math.floor(Math.random() * 5) + 15; // winner gets more votes (15-19)
        }
        return { name, votes };
    }).sort((a, b) => b.votes - a.votes);
};

// Generate realtime standings data without showing actual vote counts
const generateRealtimeStandings = (eventId: string) => {
    const eventNominations = getEventNominations(eventId);
    const nomineeIds = [...new Set(eventNominations.map(n => n.collaboratorId))];
    
    if (nomineeIds.length === 0) return [];
    
    // Simulate current standings with relative positions
    const standings = nomineeIds.map(id => {
        const user = users.find(u => u.id === id);
        const name = user ? user.name.split(' ')[0] + ' ' + user.name.split(' ')[1][0] + '.' : 'Unknown';
        const fullName = user?.name || 'Unknown';
        const avatar = user?.avatar;
        const department = user?.department;
        
        // Generate a relative score (0-100) for positioning without showing actual votes
        const score = Math.floor(Math.random() * 40) + 60; // 60-100 range for better visual distribution
        
        return { 
            id, 
            name, 
            fullName, 
            avatar, 
            department, 
            score,
            position: 0 // Will be set after sorting
        };
    }).sort((a, b) => b.score - a.score);
    
    // Assign positions
    standings.forEach((item, index) => {
        item.position = index + 1;
    });
    
    return standings;
};

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];


export default function ResultsPage() {
    const { currentUser } = useAuth();
    const [realtimeData, setRealtimeData] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");
    
    // Determine user's department filter
    const userDepartmentFilter = useMemo(() => {
        if (!currentUser) return "All Departments";
        if (currentUser.role === "Admin") return "All Departments"; // Admin can see all
        return currentUser.department; // Non-admin sees only their department
    }, [currentUser]);

    // Get available events based on user's department
    const availableEvents = useMemo(() => {
        const departmentFilter = currentUser?.role === "Admin" ? selectedDepartment || "All Departments" : userDepartmentFilter;
        return getEventsByDepartment(departmentFilter as Department | "All Departments")
            .sort((a, b) => {
                // Sort by status (Active first, then Closed, then Pending) and date
                const statusOrder = { 'Active': 0, 'Closed': 1, 'Pending': 2 };
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                    return statusOrder[a.status] - statusOrder[b.status];
                }
                if (a.startDate && b.startDate) {
                    return b.startDate.getTime() - a.startDate.getTime();
                }
                return 0;
            });
    }, [currentUser, selectedDepartment, userDepartmentFilter]);

    // Get the selected event or default to the first available
    const selectedEvent = useMemo(() => {
        if (selectedEventId) {
            return availableEvents.find(event => event.id === selectedEventId);
        }
        return availableEvents[0] || null;
    }, [selectedEventId, availableEvents]);

    // Update selected event when available events change
    useEffect(() => {
        if (availableEvents.length > 0 && !selectedEventId) {
            setSelectedEventId(availableEvents[0].id);
        }
    }, [availableEvents, selectedEventId]);

    // Initialize department selection for admin users
    useEffect(() => {
        if (currentUser?.role === "Admin" && !selectedDepartment) {
            setSelectedDepartment("All Departments");
        } else if (currentUser?.role !== "Admin" && currentUser?.department) {
            setSelectedDepartment(currentUser.department);
        }
    }, [currentUser, selectedDepartment]);

    const currentPhase = useMemo(() => {
        return selectedEvent && selectedEvent.status === 'Active' ? getCurrentPhase(selectedEvent) : null;
    }, [selectedEvent]);

    // Update realtime data every 5 seconds for active events
    useEffect(() => {
        if (!selectedEvent || selectedEvent.status !== 'Active') return;
        
        const updateData = () => {
            const newData = generateRealtimeStandings(selectedEvent.id);
            setRealtimeData(newData);
        };
        
        updateData(); // Initial load
        const interval = setInterval(updateData, 5000); // Update every 5 seconds
        
        return () => clearInterval(interval);
    }, [selectedEvent]);

    // Loading state
    if (!currentUser) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Resultados</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Cargando...</CardTitle>
                        <CardDescription>Cargando información del usuario...</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Render dropdowns component
    const renderDropdowns = () => (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Department Dropdown - Only for Admin */}
            {currentUser.role === "Admin" && (
                <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Departamento</label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar departamento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Departments">Todos los Departamentos</SelectItem>
                            {getAvailableDepartments().filter(dept => dept !== "All Departments").map((department) => (
                                <SelectItem key={department} value={department}>
                                    {department}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            {/* Event Dropdown */}
            <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Evento</label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar evento" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableEvents.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                                <div className="flex items-center gap-2">
                                    <Badge 
                                        variant={event.status === 'Active' ? 'default' : event.status === 'Closed' ? 'secondary' : 'outline'}
                                        className="text-xs"
                                    >
                                        {event.status}
                                    </Badge>
                                    <span>{event.month}</span>
                                    {event.department && event.department !== "All Departments" && (
                                        <span className="text-muted-foreground">({event.department})</span>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    // If there's a selected active event, show realtime results
    if (selectedEvent && selectedEvent.status === 'Active' && currentPhase) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Resultados en Vivo - {selectedEvent.month}</h1>
                    <Badge variant="outline" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Actualizando cada 5s
                    </Badge>
                </div>

                {renderDropdowns()}

                {/* Current Phase Display */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <currentPhase.icon className="h-6 w-6 text-primary" />
                            <div className="flex-1">
                                <CardTitle>Fase Actual: {currentPhase.label}</CardTitle>
                                <CardDescription>
                                    {currentPhase.phase === 'nomination' && 'Los empleados están nominando a sus colegas'}
                                    {currentPhase.phase === 'voting' && 'Los empleados están votando por los nominados'}
                                    {currentPhase.phase === 'evaluation' && 'Los supervisores están evaluando a los nominados'}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progreso de la fase</span>
                                <span>{Math.round(currentPhase.progress)}%</span>
                            </div>
                            <Progress value={currentPhase.progress} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Current Standings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Posiciones Actuales
                            </CardTitle>
                            <CardDescription>
                                Clasificación en tiempo real (sin mostrar votos específicos)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {realtimeData.slice(0, 5).map((nominee, index) => (
                                    <div key={nominee.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                            {nominee.position}
                                        </div>
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={nominee.avatar} />
                                            <AvatarFallback>{nominee.fullName.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium">{nominee.fullName}</p>
                                            <p className="text-sm text-muted-foreground">{nominee.department}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="w-20 bg-secondary rounded-full h-2">
                                                <div 
                                                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                                                    style={{ width: `${nominee.score}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Distribution Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribución por Departamento</CardTitle>
                            <CardDescription>Nominados por área de trabajo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={realtimeData.reduce((acc: any[], curr) => {
                                            const existing = acc.find(item => item.department === curr.department);
                                            if (existing) {
                                                existing.count += 1;
                                            } else {
                                                acc.push({ department: curr.department, count: 1 });
                                            }
                                            return acc;
                                        }, [])}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ department, count }) => `${department}: ${count}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {realtimeData.reduce((acc: any[], curr) => {
                                            const existing = acc.find(item => item.department === curr.department);
                                            if (!existing) {
                                                acc.push({ department: curr.department, count: 1 });
                                            }
                                            return acc;
                                        }, []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // If there's a selected closed event, show winner
    if (selectedEvent && selectedEvent.status === 'Closed') {
        const winner = findWinnerFromEvent(selectedEvent.id);
        const voteData = winner ? generateVoteData(selectedEvent.id) : [];

        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">🏆 Ganador de {selectedEvent.month}</h1>
                
                {renderDropdowns()}

                {!winner ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Hay Ganador Disponible</CardTitle>
                            <CardDescription>No se pudo determinar un ganador para este evento.</CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader className="text-center">
                                <Trophy className="mx-auto h-12 w-12 text-yellow-500" />
                                <CardTitle className="text-4xl font-bold">¡Soy El Mejor!</CardTitle>
                                <CardDescription className="text-lg">¡Felicitaciones a nuestro Empleado del Mes!</CardDescription>
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
                                    "Por su destacada contribución y por siempre dar la milla extra. Tu arduo trabajo nos inspira a todos. ¡Bien hecho, {winner.name.split(' ')[0]}!"
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Resultados Finales</CardTitle>
                                <CardDescription>Posiciones finales de los nominados en {selectedEvent.month}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={voteData} layout="vertical" margin={{ left: 10 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            formatter={(value) => [`${value} votos`, 'Votos']}
                                        />
                                        <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        );
    }

    // Handle pending events or show selection message
    if (selectedEvent && selectedEvent.status === 'Pending') {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Evento Pendiente - {selectedEvent.month}</h1>
                
                {renderDropdowns()}

                <Card>
                    <CardHeader>
                        <CardTitle>Evento No Iniciado</CardTitle>
                        <CardDescription>
                            Este evento aún no ha comenzado. Los resultados estarán disponibles una vez que el evento esté activo.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // No events available
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Resultados</h1>
            
            {renderDropdowns()}
            
            <Card>
                <CardHeader>
                    <CardTitle>No Hay Eventos Disponibles</CardTitle>
                    <CardDescription>
                        {currentUser.role === "Admin" 
                            ? "No hay eventos disponibles para el departamento seleccionado."
                            : `No hay eventos disponibles para el departamento ${currentUser.department}.`
                        }
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
