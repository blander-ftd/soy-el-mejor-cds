import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { HardHat } from "lucide-react";

export default function CoordinatorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Panel de Coordinador</h1>
      <Card>
        <CardHeader>
          <CardTitle>¡Bienvenido, Coordinador!</CardTitle>
          <CardDescription>Tu panel está actualmente en construcción.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <HardHat className="h-16 w-16 text-muted-foreground" />
            <p className="max-w-md text-muted-foreground">
                Estamos trabajando duro para construir una vista dedicada para los coordinadores. ¡Vuelve pronto para ver nuevas y emocionantes funciones!
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
