import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { HardHat } from "lucide-react";

export default function CoordinatorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Coordinator Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Coordinator!</CardTitle>
          <CardDescription>Your dashboard is currently under construction.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <HardHat className="h-16 w-16 text-muted-foreground" />
            <p className="max-w-md text-muted-foreground">
                We're working hard to build a dedicated view for Coordinators. Please check back soon for exciting new features!
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
