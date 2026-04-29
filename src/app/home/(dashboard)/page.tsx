import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { Package, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function CompanyDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).single();

  const { data: stand } = await supabase
    .from('stands_with_computed_status')
    .select(`
      id,
      computed_status,
      return_available_at,
      returned_at,
      general_photo_url,
      stand_types (name)
    `)
    .eq('company_id', user.id)
    .maybeSingle();

  const isReturnAvailable = stand && new Date() >= new Date(stand.return_available_at);

  return (
    <div>
      <PageHeader 
        title={`Hola, ${profile?.name}`} 
        description="Aquí está la información de tu stand" 
      />

      {!stand ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200 rounded-lg border-dashed mt-8">
          <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">Aún no tienes un stand asignado</h3>
          <p className="text-neutral-500 text-center max-w-[400px]">
            Contacta al administrador del evento para que asigne el tipo de stand que te corresponde.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Card Detalle */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Tu stand asignado</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div>
                {stand.general_photo_url && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-neutral-200">
                    <img src={stand.general_photo_url} alt="Stand" className="w-full h-48 object-cover" />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{stand.stand_types?.name}</h3>
                <div className="mb-6">
                  {stand.computed_status === 'pending_delivery' && <Badge variant="outline" className="text-neutral-500">Falta firmar recepción</Badge>}
                  {stand.computed_status === 'delivered' && <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Recepción firmada</Badge>}
                  {stand.computed_status === 'awaiting_return' && <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Esperando devolución</Badge>}
                  {stand.computed_status === 'returned' && <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Devolución completada</Badge>}
                </div>
              </div>
              <Link href="/home/stand">
                <Button className="w-full bg-brand hover:bg-brand-hover text-white">
                  Ver detalle y recepción
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Devolución */}
          <Card className="flex flex-col border-brand/20 bg-brand/5">
            <CardHeader>
              <CardTitle>Devolución del stand</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              {stand.returned_at ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <p className="text-center font-medium text-neutral-900">
                    Devolución completada el {new Date(stand.returned_at).toLocaleDateString()}
                  </p>
                </div>
              ) : isReturnAvailable ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 py-8">
                  <Package className="h-12 w-12 text-brand" />
                  <p className="text-center font-medium text-neutral-900">
                    Ya puedes completar la devolución
                  </p>
                  <Link href="/home/devolucion" className="w-full mt-4">
                    <Button className="w-full bg-brand hover:bg-brand-hover text-white">
                      Iniciar devolución
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4 py-8">
                  <Clock className="h-12 w-12 text-neutral-400" />
                  <div className="text-center">
                    <p className="text-neutral-500 mb-1">Disponible para devolución a partir del:</p>
                    <p className="font-semibold text-neutral-900">
                      {new Date(stand.return_available_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
