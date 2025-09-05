import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import { VotingEvents } from "@/components/admin/voting-events";
import { AuditLog } from "@/components/admin/audit-log";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, Vote, Activity } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events"><Vote className="mr-2 h-4 w-4"/>Voting Events</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>User Management</TabsTrigger>
          <TabsTrigger value="audit"><Activity className="mr-2 h-4 w-4"/>Audit Log</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Voting Events</CardTitle>
                    <CardDescription>Start, edit, and end voting events for each department.</CardDescription>
                </CardHeader>
                <CardContent>
                    <VotingEvents />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="users">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Users</CardTitle>
                    <CardDescription>View and manage all user accounts in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserManagement />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="audit">
            <Card>
                <CardHeader>
                    <CardTitle>Audit Log</CardTitle>
                    <CardDescription>Track all significant actions performed within the application.</CardDescription>
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
