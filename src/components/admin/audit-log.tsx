"use client";

import { auditLogs, users } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

export function AuditLog() {
    const getActionUserName = (userId: string) => {
        return users.find(u => u.id === userId)?.name ?? 'Unknown User';
    }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auditLogs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{format(log.timestamp, "PPP p")}</TableCell>
            <TableCell className="font-medium">{getActionUserName(log.userId)}</TableCell>
            <TableCell>{log.action}</TableCell>
            <TableCell className="font-mono text-xs">{JSON.stringify(log.details)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
