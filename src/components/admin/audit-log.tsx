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
import { es } from 'date-fns/locale';

export function AuditLog() {
    const getActionUserName = (userId: string) => {
        return users.find(u => u.id === userId)?.name ?? 'Usuario Desconocido';
    }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Marca de Tiempo</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Acción</TableHead>
          <TableHead>Detalles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auditLogs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{format(log.timestamp, "PPP p", { locale: es })}</TableCell>
            <TableCell className="font-medium">{getActionUserName(log.userId)}</TableCell>
            <TableCell>{log.action}</TableCell>
            <TableCell className="font-mono text-xs">{JSON.stringify(log.details)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
