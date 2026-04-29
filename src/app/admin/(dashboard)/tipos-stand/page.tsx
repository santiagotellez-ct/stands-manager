import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export const revalidate = 0;

export default async function StandTypesPage() {
  const { data: standTypes } = await supabaseAdmin
    .from('stand_types')
    .select(`
      id,
      name,
      description,
      created_at,
      stand_type_elements(count),
      stands(count)
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Tipos de stand"
        description="Plantillas que se replican al asignar a cada empresa"
        action={
          <Link href="/admin/tipos-stand/nuevo">
            <Button className="bg-brand hover:bg-brand-hover text-white">
              <Plus className="mr-2 h-4 w-4" /> Nuevo tipo
            </Button>
          </Link>
        }
      />

      {(!standTypes || standTypes.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200 rounded-lg border-dashed">
          <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No hay tipos de stand</h3>
          <p className="text-neutral-500 mb-6 text-center max-w-[400px]">
            Los tipos de stand son plantillas reutilizables. Crea uno para empezar a asignarlo a las empresas.
          </p>
          <Link href="/admin/tipos-stand/nuevo">
            <Button className="bg-brand hover:bg-brand-hover text-white">
              <Plus className="mr-2 h-4 w-4" /> Crear mi primer tipo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standTypes.map((type: any) => (
            <Link key={type.id} href={`/admin/tipos-stand/${type.id}`}>
              <Card className="hover:border-brand transition-colors cursor-pointer h-full flex flex-col">
                <CardHeader>
                  <CardTitle>{type.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {type.description || 'Sin descripción'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex flex-col gap-2 text-sm text-neutral-600">
                    <div>
                      <span className="font-medium text-neutral-900">{type.stand_type_elements?.[0]?.count || 0}</span> elementos
                    </div>
                    <div>
                      <span className="font-medium text-neutral-900">{type.stands?.[0]?.count || 0}</span> empresas asignadas
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-neutral-100 text-xs text-neutral-400">
                  Creado el {format(new Date(type.created_at), 'dd/MM/yyyy')}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
