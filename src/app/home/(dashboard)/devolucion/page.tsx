import { PageHeader } from '@/components/PageHeader';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ReturnCountdown } from '@/components/company/ReturnCountdown';
import { ReturnUploadForm } from '@/components/company/ReturnUploadForm';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const revalidate = 0;

export default async function ReturnPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: stand } = await supabase
    .from('stands_with_computed_status')
    .select(`*`)
    .eq('company_id', user.id)
    .maybeSingle();

  if (!stand) {
    redirect('/home');
  }

  // Caso C: Ya devuelto
  if (stand.returned_at) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">Devolución completada</h2>
        <p className="text-neutral-500 text-center max-w-[500px] mb-8">
          Completaste la devolución de tu stand el {new Date(stand.returned_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}. Gracias por participar.
        </p>
        <Link href="/home">
          <Button variant="outline">Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  // Caso A: Antes de la fecha
  const now = new Date().getTime();
  const targetDate = new Date(stand.return_available_at).getTime();

  if (now < targetDate) {
    return <ReturnCountdown targetDateStr={stand.return_available_at} />;
  }

  // Caso B: En fecha, no devuelto
  const { data: elements } = await supabase
    .from('stand_elements')
    .select('*')
    .eq('stand_id', stand.id)
    .order('sort_order', { ascending: true });

  return (
    <div className="max-w-[800px] mx-auto pb-20">
      <PageHeader 
        title="Proceso de devolución" 
        description="Sube una foto del estado final de cada evidencia para completar la entrega"
        action={
          <Link href="/home">
            <Button variant="outline">Cancelar</Button>
          </Link>
        }
      />

      <ReturnUploadForm standId={stand.id} elements={elements || []} />
    </div>
  );
}
