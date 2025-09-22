"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, AlertCircle, Database, Trash2 } from "lucide-react";
import { uploadTestData, canUploadTestData } from "@/lib/upload-test-data";
import { batchService } from "@/lib/firebase-service";
import { useToast } from "@/hooks/use-toast";
import { testNominatedEntries, users } from "@/lib/data";

export function TestDataUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNominatedData, setShowNominatedData] = useState(false);
  const { toast } = useToast();

  const handleUploadTestData = async () => {
    if (!canUploadTestData()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La carga de datos de prueba solo está disponible en modo desarrollo.",
      });
      return;
    }

    try {
      setIsUploading(true);
      await uploadTestData();
      setUploadComplete(true);
      setShowNominatedData(true);
      toast({
        title: "¡Datos de Prueba Cargados!",
        description: "Los datos de prueba se han cargado exitosamente en Firebase.",
      });
    } catch (error) {
      console.error('Error uploading test data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos de prueba. Verifica la consola para más detalles.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTestData = async () => {
    if (!canUploadTestData()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La eliminación de datos de prueba solo está disponible en modo desarrollo.",
      });
      return;
    }

    // Confirm deletion with user
    const confirmed = window.confirm(
      "⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos de TODAS las colecciones en Firebase.\n\n" +
      "Esto incluye:\n" +
      "• Todos los usuarios\n" +
      "• Todos los eventos de votación\n" +
      "• Todas las nominaciones\n" +
      "• Todos los votos\n" +
      "• Todas las evaluaciones\n" +
      "• Todos los departamentos\n" +
      "• Todos los registros de auditoría\n\n" +
      "¿Estás seguro de que quieres continuar?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      console.log('🗑️ Starting deletion of all Firebase collections...');
      
      // Delete all data from Firebase
      await batchService.deleteAllTestData();
      
      setUploadComplete(false);
      setShowNominatedData(false);
      
      toast({
        title: "¡Datos Eliminados Completamente!",
        description: "Todos los datos han sido eliminados de todas las colecciones de Firebase.",
      });
      
      console.log('✅ All Firebase data deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting Firebase data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron eliminar todos los datos. Verifica la consola para más detalles.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canUploadTestData()) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          La carga de datos de prueba solo está disponible en modo desarrollo.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Datos de Prueba
        </CardTitle>
        <CardDescription>
          Carga datos de prueba en Firebase para poblar las listas de usuarios, eventos, registros de auditoría y listas de nominados por departamento. También permite eliminar TODOS los datos de TODAS las colecciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadComplete ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ¡Datos de prueba cargados exitosamente! Recarga la página para ver los datos en las listas.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleDeleteTestData} 
              disabled={isDeleting}
              variant="destructive"
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent mr-2"></div>
                  Eliminando datos...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar TODOS los Datos
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Esta acción cargará:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Usuarios de ejemplo con diferentes roles</li>
                <li>Eventos de votación de muestra</li>
                <li>Registros de auditoría simulados</li>
                <li>Departamentos predefinidos</li>
                <li>Listas de nominados con votos por departamento</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleUploadTestData} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent mr-2"></div>
                  Cargando datos...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Cargar Datos de Prueba
                </>
              )}
            </Button>
          </div>
        )}

        {/* Display nominated entries when test data is loaded */}
        {showNominatedData && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Datos de Prueba - Listas de Nominados por Departamento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(testNominatedEntries).map(([department, entries]) => (
                <div key={department} className="border rounded-lg p-3">
                  <h5 className="font-medium mb-2 text-primary text-sm">{department}</h5>
                  <div className="space-y-2">
                    {entries.map((entry, index) => {
                      const user = users.find(u => u.id === entry.user);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">{entry.votes} votos</Badge>
                            <Badge variant="outline" className="text-xs">Survey: {entry.surveyResult}</Badge>
                            <span className="font-medium">{user?.name || entry.user}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {entry.event}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
