
"use client";

import * as React from "react";
import { useAuth } from "@/context/auth-context";
import { votingEventService, nominationService, userService, surveyEvaluationService } from "@/lib/firebase-service";
import type { VotingEvent, SurveyQuestion } from "@/models/VotingEvent";
import type { User as FirebaseUser } from "@/models/User";
import type { User as AuthUser } from "@/lib/types";
import type { Nomination } from "@/models/Nomination";
import { Timestamp } from "firebase/firestore";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, CalendarOff, UserX, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function SurveyPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [api, setApi] = React.useState<any>();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [evaluations, setEvaluations] = React.useState<Record<string, number[]>>({});
  
  // Firebase state
  const [activeEvent, setActiveEvent] = React.useState<VotingEvent | null>(null);
  const [nominees, setNominees] = React.useState<FirebaseUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submittingFor, setSubmittingFor] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const surveyQuestions: SurveyQuestion[] = activeEvent?.surveyQuestions || [];

  // Type adapter to convert Firebase User to display format
  const adaptUserForDisplay = (user: FirebaseUser): AuthUser => ({
    id: user.id,
    name: user.name,
    email: user.email,
    cedula: user.cedula,
    role: user.role as AuthUser['role'],
    department: user.department === 'Technology' ? 'Transporte' : 
                user.department === 'Human Resources' ? 'Recursos Humanos' :
                user.department === 'Marketing' ? 'Gestion de Inventario' :
                'Transporte', // fallback
    avatar: user.avatar
  });

  // Fetch data from Firebase
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get active voting events
        const activeEvents = await votingEventService.getActive();
        const currentActiveEvent = activeEvents.length > 0 ? activeEvents[0] : null;
        setActiveEvent(currentActiveEvent);

        if (currentActiveEvent) {
          // Get nominations for the active event
          const eventNominations = await nominationService.getByEvent(currentActiveEvent.id);
          const nomineeIds = [...new Set(eventNominations.map(nom => nom.collaboratorId))];

          // Get user details for each nominee
          if (nomineeIds.length > 0) {
            const allUsers = await userService.getAll();
            const nomineeUsers = nomineeIds
              .map(id => allUsers.find(u => u.id === id))
              .filter((user): user is FirebaseUser => user !== undefined);
            setNominees(nomineeUsers);
          } else {
            setNominees([]);
          }
        } else {
          setNominees([]);
        }
      } catch (err) {
        console.error('Error fetching survey data:', err);
        setError('Error al cargar los datos de la encuesta. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  React.useEffect(() => {
    if (!api) return;
    setCurrentSlide(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  const handleSliderChange = (nomineeId: string, questionIndex: number, value: number[]) => {
    setEvaluations(prev => ({
      ...prev,
      [nomineeId]: (prev[nomineeId] || Array(surveyQuestions.length).fill(5)).map((v, i) => i === questionIndex ? value[0] : v)
    }));
  };
  
  const handleSubmit = async (nomineeId: string) => {
    if (!currentUser || !activeEvent) return;

    const nominee = nominees.find(u => u.id === nomineeId);
    if (!nominee) return;

    const scores = evaluations[nomineeId] || Array(surveyQuestions.length).fill(5);

    try {
      setSubmittingFor(nomineeId);

      // Map auth user department to Firebase department
      const mapDepartment = (dept: AuthUser['department']): string => {
        switch (dept) {
          case 'Transporte': return 'Technology';
          case 'Recursos Humanos': return 'Human Resources';
          case 'Gestion de Inventario': return 'Marketing';
          default: return 'Technology';
        }
      };

      // Create survey evaluation
      await surveyEvaluationService.create({
        eventId: activeEvent.id,
        evaluatorId: currentUser.id,
        evaluatedUserId: nomineeId,
        scores: scores,
        evaluationDate: Timestamp.now(),
        evaluatorDepartment: mapDepartment(currentUser.department),
        evaluatedUserDepartment: nominee.department,
        isValid: true
      });

      toast({
        title: "¡Evaluación Enviada!",
        description: `Tu evaluación para ${nominee.name} ha sido registrada exitosamente.`,
        action: <CheckCircle className="text-green-500" />
      });

      // Clear the evaluation for this nominee
      setEvaluations(prev => {
        const updated = { ...prev };
        delete updated[nomineeId];
        return updated;
      });

    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast({
        title: "Error al Enviar",
        description: `Hubo un problema al enviar tu evaluación para ${nominee.name}. Por favor, intenta de nuevo.`,
        variant: "destructive"
      });
    } finally {
      setSubmittingFor(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
            <h3 className="text-xl font-semibold">Cargando Encuesta...</h3>
            <p className="max-w-md text-muted-foreground">
              Obteniendo los datos de la encuesta desde Firebase.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <CalendarOff className="h-16 w-16 text-destructive" />
            <h3 className="text-xl font-semibold">Error al Cargar</h3>
            <p className="max-w-md text-muted-foreground">
              {error}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Intentar de Nuevo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeEvent) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
             <Card className="w-full max-w-lg text-center">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
                    <CalendarOff className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Hay Período de Encuesta Activo</h3>
                    <p className="max-w-md text-muted-foreground">
                        No hay eventos activos que requieran una encuesta en este momento.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (nominees.length === 0) {
     return (
        <div className="flex items-center justify-center h-[60vh]">
             <Card className="w-full max-w-lg text-center">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
                    <UserX className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Hay Nominados para Evaluar</h3>
                    <p className="max-w-md text-muted-foreground">
                        Actualmente no hay colaboradores nominados para evaluar en el evento de {activeEvent.month}.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Encuesta de Evaluación de Pares</h1>
        <p className="text-muted-foreground">
            Evalúa a tus colegas nominados para el evento de {activeEvent.month}. 
            Tus comentarios son cruciales para seleccionar al ganador.
        </p>
      </div>

      <Carousel setApi={setApi} className="w-full max-w-2xl mx-auto">
        <CarouselContent>
          {nominees.map((nominee, index) => {
            const displayUser = adaptUserForDisplay(nominee);
            return (
            <CarouselItem key={nominee.id}>
              <Card>
                <CardHeader className="text-center">
                    <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary">
                        <AvatarImage src={displayUser.avatar} />
                        <AvatarFallback>{displayUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl">Evaluando a: {displayUser.name}</CardTitle>
                    <CardDescription>{displayUser.department}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-4">
                  {surveyQuestions.map((q, qIndex) => {
                    const value = evaluations[nominee.id]?.[qIndex] ?? 5;
                    return(
                        <div key={qIndex} className="space-y-3">
                          <div className="text-center">
                            <Label htmlFor={`slider-${index}-${qIndex}`} className="font-semibold">{q.title}</Label>
                            <p className="text-sm text-muted-foreground">{q.body}</p>
                          </div>
                          <div className="flex items-center gap-4">
                              <span className="text-xs font-bold w-4 text-center">1</span>
                               <Slider
                                    id={`slider-${index}-${qIndex}`}
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={[value]}
                                    onValueChange={(value) => handleSliderChange(nominee.id, qIndex, value)}
                               />
                               <span className="text-sm font-semibold w-6 text-center tabular-nums">{value}</span>
                               <span className="text-xs font-bold w-4 text-center">10</span>
                          </div>
                        </div>
                    )
                  })}
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <Button 
                      onClick={() => handleSubmit(nominee.id)} 
                      size="lg" 
                      className="w-full"
                      disabled={submittingFor === nominee.id}
                    >
                      {submittingFor === nominee.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        `Enviar Evaluación para ${displayUser.name.split(' ')[0]}`
                      )}
                    </Button>
                     <p className="text-xs text-muted-foreground">
                        Evaluado {currentSlide + 1} de {nominees.length}
                    </p>
                </CardFooter>
              </Card>
            </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
      </Carousel>
    </div>
  );
}
