import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { HardHat } from "lucide-react";

export default function SurveyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Survey</h1>
      <Card>
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>This page is not yet complete.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <HardHat className="h-16 w-16 text-muted-foreground" />
            <p className="max-w-md text-muted-foreground">
                We're working hard to build the survey page. Please check back soon!
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
