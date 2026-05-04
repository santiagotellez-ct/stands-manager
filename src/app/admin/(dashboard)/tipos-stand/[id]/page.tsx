import { PageHeader } from '@/components/PageHeader';
import { StandTypeForm } from '@/components/forms/StandTypeForm';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DeleteStandTypeButton } from '@/components/DeleteStandTypeButton';

export const revalidate = 0;

export default async function EditStandTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: standType } = await supabaseAdmin
    .from('stand_types')
    .select('*, elements:stand_type_elements(*), checklist:stand_type_checklist_items(*)')
    .eq('id', id)
    .single();

  if (!standType) {
    notFound();
  }

  // Fetch companies that have this stand type
  const { data: stands } = await supabaseAdmin
    .from('stands_with_computed_status')
    .select('id, computed_status, users:company_id(name)')
    .eq('stand_type_id', id);

  // Format initial data
  const initialData = {
    ...standType,
    default_return_available_at: standType.default_return_available_at 
      ? new Date(standType.default_return_available_at).toISOString().slice(0, 16) 
      : '',
    elements: standType.elements?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [],
    checklist: standType.checklist?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [{ title: '' }]
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_delivery': return <Badge variant="outline" className="text-neutral-500">Pendiente</Badge>;
      case 'delivered': return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Entregado</Badge>;
      case 'awaiting_return': return <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Esperando dev.</Badge>;
      case 'returned': return <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Devuelto</Badge>;
      default: return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="max-w-[800px] mx-auto pb-12 space-y-8">
      <PageHeader title={`Editar: ${standType.name}`} description="Modifica los detalles de esta plantilla" />
      
      <StandTypeForm initialData={initialData} />

      <Card>
        <CardHeader>
          <CardTitle>Empresas asignadas</CardTitle>
          <p className="text-sm text-neutral-500">Estas empresas tienen una instancia de este tipo de stand.</p>
        </CardHeader>
        <CardContent>
          {stands && stands.length > 0 ? (
            <div className="space-y-3">
              {stands.map((stand: any) => (
                <div key={stand.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                  <span className="font-medium">{stand.users?.name || 'Desconocida'}</span>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(stand.computed_status)}
                    <Link href={`/admin/empresas/${stand.id}`} className="text-sm text-brand hover:underline">
                      Ver stand
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Ninguna empresa tiene asignado este tipo de stand.</p>
          )}
        </CardContent>
      </Card>
      
      <div className="border border-red-200 bg-red-50 p-6 rounded-lg mt-8">
        <h3 className="text-red-800 font-medium mb-2">Zona Peligrosa</h3>
        <p className="text-sm text-red-600 mb-4">
          Eliminar este tipo de stand es una acción irreversible. No se puede eliminar si hay empresas con stands de este tipo asignados.
        </p>
        <DeleteStandTypeButton id={id} standsCount={stands?.length || 0} />
      </div>
    </div>
  );
}


