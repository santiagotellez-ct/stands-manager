'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';
import { assignStandType } from '@/app/admin/(dashboard)/empresas/[id]/actions';

export function AssignStandCard({ companyId, standTypes }: { companyId: string, standTypes: any[] }) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTypeChange = (val: string) => {
    setSelectedType(val);
    const type = standTypes.find(t => t.id === val);
    if (type && type.default_return_available_at) {
      setReturnDate(new Date(type.default_return_available_at).toISOString().slice(0, 16));
    }
  };

  const handleAssign = async () => {
    if (!selectedType || !returnDate) {
      toast.error('Completa los campos', { description: 'Selecciona un tipo y una fecha de devolución.' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await assignStandType(companyId, selectedType, returnDate);
      if (result.error) {
        toast.error('Error al asignar', { description: result.error });
      } else {
        toast.success('Stand asignado correctamente', { description: 'Ahora puedes subir las fotos para esta empresa.' });
      }
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-brand border-2">
      <CardHeader>
        <CardTitle>Sin stand asignado</CardTitle>
        <CardDescription>
          Asigna un tipo de stand para crear la instancia de esta empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de stand</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo de stand" />
              </SelectTrigger>
              <SelectContent>
                {standTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fecha de devolución</Label>
            <Input 
              type="datetime-local" 
              value={returnDate} 
              onChange={(e) => setReturnDate(e.target.value)} 
            />
          </div>
        </div>
        <Button 
          className="bg-brand hover:bg-brand-hover text-white w-full sm:w-auto" 
          onClick={handleAssign}
          disabled={isLoading || !selectedType || !returnDate}
        >
          {isLoading ? 'Asignando...' : 'Asignar tipo de stand'}
        </Button>
      </CardContent>
    </Card>
  );
}
