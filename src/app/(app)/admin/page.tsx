import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import { VotingEvents } from "@/components/admin/voting-events";
import { AuditLog } from "@/components/admin/audit-log";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, Vote, Activity } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>

      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events"><Vote className="mr-2 h-4 w-4"/>Eventos de Votación</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="audit"><Activity className="mr-2 h-4 w-4"/>Registro de Auditoría</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
            <Card>
                <CardHeader>
                    <CardTitle>Gestionar Eventos de Votación</CardTitle>
                    <CardDescription>Iniciar, editar y finalizar eventos de votación.</CardDescription>
                </CardHeader>
                <CardContent>
                    <VotingEvents />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="users">
            <Card>
                <CardHeader>
                    <CardTitle>Gestionar Usuarios</CardTitle>
                    <CardDescription>Ver, agregar y administrar cuentas de usuario en el sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserManagement />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="audit">
            <Card>
                <CardHeader>
                    <CardTitle>Registro de Auditoría</CardTitle>
                    <CardDescription>Rastrear todas las acciones significativas realizadas dentro de la aplicación.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AuditLog />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
