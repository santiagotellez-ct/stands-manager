import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { SignatureSection } from '@/components/company/SignatureSection';

export const revalidate = 0;

export default async function StandDetailPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: stand } = await supabase
    .from('stands_with_computed_status')
    .select(`
      *,
      stand_types (name)
    `)
    .eq('company_id', user.id)
    .maybeSingle();

  if (!stand) {
    notFound();
  }

  const { data: elements } = await supabase
    .from('stand_elements')
    .select('*')
    .eq('stand_id', stand.id)
    .order('sort_order', { ascending: true });

  return (
    <div className="max-w-[1000px] mx-auto pb-20 space-y-8">
      <PageHeader 
        title="Detalle del stand" 
        description={(stand.stand_types as any)?.name}
        action={
          <Link href="/home">
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      {/* Foto general */}
      {stand.general_photo_url && (
        <div className="w-full md:max-w-lg">
          <img src={stand.general_photo_url} alt="Stand General" className="w-full aspect-[21/9] md:aspect-video object-cover rounded-lg shadow-sm border border-neutral-200" />
        </div>
      )}

      {/* Elementos */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Elementos incluidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {elements?.map((el: any) => (
            <Card key={el.id} className="flex flex-row overflow-hidden shadow-sm border-neutral-200 items-center p-3 gap-4">
              {el.delivery_photo_url ? (
                <div className="w-32 md:w-48 shrink-0 aspect-video bg-neutral-100 rounded-md overflow-hidden">
                  <img src={el.delivery_photo_url} alt={el.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-32 md:w-48 shrink-0 aspect-video bg-neutral-100 rounded-md flex items-center justify-center text-xs text-neutral-400">
                  Sin foto
                </div>
              )}
              <div className="flex-1 flex flex-col justify-center">
                <h4 className="font-semibold text-base md:text-lg">{el.name}</h4>
                <p className="text-sm text-neutral-600 mb-1">Cantidad: {el.quantity}</p>
                {el.notes && <p className="text-sm text-neutral-500 italic line-clamp-2">"{el.notes}"</p>}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Firma */}
      {!stand.signed_at ? (
        <SignatureSection standId={stand.id} />
      ) : (
        <Card className="bg-neutral-50 border-neutral-200">
          <CardHeader className="pt-8 sm:pt-6">
            <CardTitle className="text-2xl sm:text-xl text-center sm:text-left">Recepción confirmada</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 pb-10 sm:pb-6">
            {stand.delivery_signature_url && (
              <div className="bg-white p-4 sm:p-2 border border-neutral-200 rounded-md w-full sm:w-auto flex justify-center">
                <img src={stand.delivery_signature_url} alt="Firma" className="h-32 sm:h-20 object-contain" />
              </div>
            )}
            <div className="text-center sm:text-left">
              <p className="font-medium text-lg sm:text-base text-neutral-900 mb-2 sm:mb-1">Has aceptado la entrega de este stand</p>
              <p className="text-sm text-neutral-500">
                Firmado el {format(new Date(stand.signed_at), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
