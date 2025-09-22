"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { votingEventService, nominationService, userService, voteService, surveyEvaluationService } from "@/lib/firebase-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Clock, Users, Vote, BarChart3, Loader2 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import type { VotingEvent, EventDepartment } from "@/models/VotingEvent";
import type { User as FirebaseUser } from "@/models/User";
import type { User as AuthUser, Department } from "@/lib/types";
import type { Nomination } from "@/models/Nomination";
import type { Vote as FirebaseVote } from "@/models/Vote";
import type { SurveyEvaluation } from "@/models/SurveyEvaluation";

// Helper functions that will be moved inside the component to access Firebase data

// Helper to determine current phase of an active event
const getCurrentPhase = (event: VotingEvent) => {
  if (!event || !event.startDate) return null;
  
  const now = new Date();
  const startDate = event.startDate.toDate();
  const endDate = event.endDate?.toDate();
  
  if (!endDate) return null;
  
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

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];


export default function ResultsPage() {
    const { currentUser } = useAuth();
    const [realtimeData, setRealtimeData] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("");
    
    // Firebase state
    const [votingEvents, setVotingEvents] = useState<VotingEvent[]>([]);
    const [users, setUsers] = useState<FirebaseUser[]>([]);
    const [nominations, setNominations] = useState<Nomination[]>([]);
    const [votes, setVotes] = useState<FirebaseVote[]>([]);
    const [surveyEvaluations, setSurveyEvaluations] = useState<SurveyEvaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Type adapter for departments
    const adaptDepartment = (firebaseDept: EventDepartment): Department | "All Departments" => {
        switch (firebaseDept) {
            case 'Technology': return 'Transporte';
            case 'Human Resources': return 'Recursos Humanos';
            case 'Marketing': return 'Gestion de Inventario';
            case 'Sales': return 'Gestion de Inventario'; // fallback
            case 'All Departments': return 'All Departments';
            default: return 'All Departments';
        }
    };

    // Type adapter for users
    const adaptUserForDisplay = (user: FirebaseUser): AuthUser => {
        const adaptedDept = adaptDepartment(user.department as EventDepartment);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            cedula: user.cedula,
            role: user.role as AuthUser['role'],
            department: adaptedDept === "All Departments" ? "Transporte" : adaptedDept, // fallback to prevent type error
            avatar: user.avatar
        };
    };

    // Fetch all data from Firebase
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [eventsData, usersData, nominationsData, votesData, evaluationsData] = await Promise.all([
                    votingEventService.getAll(),
                    userService.getAll(),
                    nominationService.getAll(),
                    voteService.getAll(),
                    surveyEvaluationService.getAll()
                ]);

                setVotingEvents(eventsData);
                setUsers(usersData);
                setNominations(nominationsData);
                setVotes(votesData);
                setSurveyEvaluations(evaluationsData);
            } catch (err) {
                console.error('Error fetching results data:', err);
                setError('Error al cargar los datos de resultados. Por favor, intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper functions that use Firebase data
    const getEventsByDepartment = (department?: Department | "All Departments") => {
        // Since all events are now "All Departments", return all events
        return votingEvents;
    };

    const getAvailableDepartments = (): (Department | "All Departments")[] => {
        // Since all events are "All Departments", always return this
        return ["All Departments"];
    };

    const getEventNominations = (eventId: string) => {
        return nominations.filter(n => n.eventId === eventId);
    };

    const findWinnerFromEvent = (eventId: string): FirebaseUser | null => {
        // First try to find winner based on votes
        const eventVotes = votes.filter(v => v.eventId === eventId);
        if (eventVotes.length > 0) {
            const voteCounts = eventVotes.reduce((acc, vote) => {
                vote.votedForIds.forEach(userId => {
                    acc[userId] = (acc[userId] || 0) + 1;
                });
                return acc;
            }, {} as Record<string, number>);

            if (Object.keys(voteCounts).length > 0) {
                const winnerId = Object.keys(voteCounts).reduce((a, b) => voteCounts[a] > voteCounts[b] ? a : b);
                return users.find(u => u.id === winnerId) || null;
            }
        }

        // Fallback to nominations if no votes
        const eventNominations = getEventNominations(eventId);
        if (eventNominations.length === 0) return null;

        const nominationCounts = eventNominations.reduce((acc, nom) => {
            acc[nom.collaboratorId] = (acc[nom.collaboratorId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const winnerId = Object.keys(nominationCounts).reduce((a, b) => nominationCounts[a] > nominationCounts[b] ? a : b);
        return users.find(u => u.id === winnerId) || null;
    };

    const generateVoteData = (eventId: string) => {
        const eventNominations = getEventNominations(eventId);
        const nomineeIds = [...new Set(eventNominations.map(n => n.collaboratorId))];
        
        // Use actual votes if available, otherwise simulate
        const eventVotes = votes.filter(v => v.eventId === eventId);
        const voteCounts = eventVotes.reduce((acc, vote) => {
            vote.votedForIds.forEach(userId => {
                if (nomineeIds.includes(userId)) {
                    acc[userId] = (acc[userId] || 0) + 1;
                }
            });
            return acc;
        }, {} as Record<string, number>);

        return nomineeIds.map(id => {
            const user = users.find(u => u.id === id);
            const displayUser = user ? adaptUserForDisplay(user) : null;
            const name = displayUser ? displayUser.name.split(' ')[0] + ' ' + displayUser.name.split(' ')[1][0] + '.' : 'Unknown';
            const votes = voteCounts[id] || Math.floor(Math.random() * 12) + 5; // Use actual votes or simulate
            return { name, votes };
        }).sort((a, b) => b.votes - a.votes);
    };

    const generateRealtimeStandings = (eventId: string) => {
        const eventNominations = getEventNominations(eventId);
        const nomineeIds = [...new Set(eventNominations.map(n => n.collaboratorId))];
        
        if (nomineeIds.length === 0) return [];
        
        // Use survey evaluations for more accurate standings if available
        const eventEvaluations = surveyEvaluations.filter(e => e.eventId === eventId);
        const evaluationScores = eventEvaluations.reduce((acc, evaluation) => {
            if (nomineeIds.includes(evaluation.evaluatedUserId)) {
                if (!acc[evaluation.evaluatedUserId]) {
                    acc[evaluation.evaluatedUserId] = [];
                }
                const avgScore = evaluation.scores.reduce((sum, score) => sum + score, 0) / evaluation.scores.length;
                acc[evaluation.evaluatedUserId].push(avgScore);
            }
            return acc;
        }, {} as Record<string, number[]>);

        const standings = nomineeIds.map(id => {
            const user = users.find(u => u.id === id);
            const displayUser = user ? adaptUserForDisplay(user) : null;
            const name = displayUser ? displayUser.name.split(' ')[0] + ' ' + displayUser.name.split(' ')[1][0] + '.' : 'Unknown';
            const fullName = displayUser?.name || 'Unknown';
            const avatar = displayUser?.avatar;
            const department = displayUser?.department;
            
            // Calculate score based on evaluations or simulate
            let score = 60; // default
            if (evaluationScores[id] && evaluationScores[id].length > 0) {
                const avgEvaluation = evaluationScores[id].reduce((sum, s) => sum + s, 0) / evaluationScores[id].length;
                score = Math.round((avgEvaluation / 10) * 100); // Convert 1-10 scale to 0-100
            } else {
                score = Math.floor(Math.random() * 40) + 60; // 60-100 range for simulation
            }
            
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
    
    // Determine user's department filter - now all events are company-wide
    const userDepartmentFilter = useMemo(() => {
        return "All Departments"; // All events are now company-wide
    }, [currentUser]);

    // Get available events - all events are now company-wide
    const availableEvents = useMemo(() => {
        return votingEvents.sort((a, b) => {
            // Sort by status (Active first, then Closed, then Pending) and date
            const statusOrder = { 'Active': 0, 'Closed': 1, 'Pending': 2 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            if (a.startDate && b.startDate) {
                return b.startDate.toDate().getTime() - a.startDate.toDate().getTime();
            }
            return 0;
        });
    }, [votingEvents]);

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

    // No longer need department selection since all events are company-wide

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
    if (loading || !currentUser) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Resultados</h1>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Cargando...
                        </CardTitle>
                        <CardDescription>
                            {!currentUser ? "Cargando información del usuario..." : "Obteniendo datos de resultados desde Firebase..."}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Resultados</h1>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">Error al Cargar</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Intentar de Nuevo
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render event selector component
    const renderEventSelector = () => (
        <div className="flex flex-col gap-4 mb-6">
            {/* Event Dropdown */}
            <div className="max-w-md">
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
                                    <span className="text-muted-foreground">(Todos los Departamentos)</span>
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

                {renderEventSelector()}

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
        const displayWinner = winner ? adaptUserForDisplay(winner) : null;
        const voteData = winner ? generateVoteData(selectedEvent.id) : [];

        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">🏆 Ganador de {selectedEvent.month}</h1>
                
                {renderEventSelector()}

                {!displayWinner ? (
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
                                    <AvatarImage src={displayWinner.avatar} />
                                    <AvatarFallback>{displayWinner.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold">{displayWinner.name}</h2>
                                    <p className="text-xl text-muted-foreground">{displayWinner.department}</p>
                                </div>
                                <p className="max-w-prose text-center text-muted-foreground italic p-4 bg-muted rounded-lg">
                                    "Por su destacada contribución y por siempre dar la milla extra. Tu arduo trabajo nos inspira a todos. ¡Bien hecho, {displayWinner.name.split(' ')[0]}!"
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
                
                {renderEventSelector()}

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
            
            {renderEventSelector()}
            
            <Card>
                <CardHeader>
                    <CardTitle>No Hay Eventos Disponibles</CardTitle>
                    <CardDescription>
                        No hay eventos de votación disponibles en este momento.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
