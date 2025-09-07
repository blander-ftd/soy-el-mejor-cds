
"use client";

import * as React from "react";
import { useAuth } from "@/context/auth-context";
import { users, nominations, votingEvents } from "@/lib/data";
import type { SurveyQuestion, User } from "@/lib/types";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, CalendarOff, UserX } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function SurveyPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [api, setApi] = React.useState<any>();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [evaluations, setEvaluations] = React.useState<Record<string, number[]>>({});

  const activeEvent = React.useMemo(() => 
    votingEvents.find(event => event.status === 'Active'), 
  []);

  const nominees = React.useMemo(() => {
    if (!activeEvent || !currentUser) return [];
    
    // Filter nominations for the active event
    const eventNominations = nominations.filter(nom => nom.eventId === activeEvent.id);
    const nomineeIds = [...new Set(eventNominations.map(nom => nom.collaboratorId))];

    // Get user details for each nominee
    return nomineeIds
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as User[];
  }, [activeEvent, currentUser]);

  const surveyQuestions: SurveyQuestion[] = activeEvent?.surveyQuestions || [];
  
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
  
  const handleSubmit = (nomineeId: string) => {
    const nominee = users.find(u => u.id === nomineeId);
    toast({
        title: "Evaluation Submitted!",
        description: `Your evaluation for ${nominee?.name} has been recorded.`,
        action: <CheckCircle className="text-green-500" />
    });
  };

  if (!activeEvent) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
             <Card className="w-full max-w-lg text-center">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
                    <CalendarOff className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-xl font-semibold">No Active Survey Period</h3>
                    <p className="max-w-md text-muted-foreground">
                        There are no active events requiring a survey at the moment.
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
                    <h3 className="text-xl font-semibold">No Nominees to Evaluate</h3>
                    <p className="max-w-md text-muted-foreground">
                        There are currently no nominated collaborators to evaluate for the {activeEvent.month} event.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Peer Evaluation Survey</h1>
        <p className="text-muted-foreground">
            Evaluate your nominated colleagues for the {activeEvent.month} event. 
            Your feedback is crucial for selecting the winner.
        </p>
      </div>

      <Carousel setApi={setApi} className="w-full max-w-2xl mx-auto">
        <CarouselContent>
          {nominees.map((nominee, index) => (
            <CarouselItem key={nominee.id}>
              <Card>
                <CardHeader className="text-center">
                    <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary">
                        <AvatarImage src={nominee.avatar} />
                        <AvatarFallback>{nominee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl">Evaluating: {nominee.name}</CardTitle>
                    <CardDescription>{nominee.department}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-4">
                  {surveyQuestions.map((q, qIndex) => (
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
                                value={[evaluations[nominee.id]?.[qIndex] ?? 5]}
                                onValueChange={(value) => handleSliderChange(nominee.id, qIndex, value)}
                           />
                           <span className="text-xs font-bold w-4 text-center">10</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <Button onClick={() => handleSubmit(nominee.id)} size="lg" className="w-full">
                        Submit Evaluation for {nominee.name.split(' ')[0]}
                    </Button>
                     <p className="text-xs text-muted-foreground">
                        Evaluated {currentSlide + 1} of {nominees.length}
                    </p>
                </CardFooter>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
      </Carousel>
    </div>
  );
}
