import { PageHeader } from '@/components/PageHeader';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import { CompanyInfoForm } from '@/components/admin/company/CompanyInfoForm';
import { AssignStandCard } from '@/components/admin/company/AssignStandCard';
import { StandDetailCard } from '@/components/admin/company/StandDetailCard';
import { DeleteCompanySection } from '@/components/admin/company/DeleteCompanySection';

export const revalidate = 0;

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;

  // Fetch company
  const { data: company } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', companyId)
    .eq('role', 'company')
    .single();

  if (!company) {
    notFound();
  }

  // Fetch all stand types for dropdown
  const { data: standTypes } = await supabaseAdmin
    .from('stand_types')
    .select('id, name, default_return_available_at')
    .order('name');

  // Fetch stand assigned to this company (if any)
  const { data: stand } = await supabaseAdmin
    .from('stands')
    .select(`
      *,
      stand_types (name)
    `)
    .eq('company_id', companyId)
    .maybeSingle();

  // Fetch computed status for the stand if it exists
  let computedStatus = null;
  if (stand) {
    const { data: computed } = await supabaseAdmin
      .from('stands_with_computed_status')
      .select('computed_status')
      .eq('id', stand.id)
      .single();
    if (computed) {
      computedStatus = computed.computed_status;
    }
  }

  // Fetch elements for the stand if it exists
  let standElements = [];
  let checklistItems = [];
  if (stand) {
    const { data: elements } = await supabaseAdmin
      .from('stand_elements')
      .select('*')
      .eq('stand_id', stand.id)
      .order('sort_order', { ascending: true });
    
    if (elements) {
      standElements = elements;
    }

    const { data: checklist } = await supabaseAdmin
      .from('stand_checklist_items')
      .select('*')
      .eq('stand_id', stand.id)
      .order('sort_order', { ascending: true });

    if (checklist) {
      checklistItems = checklist;
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto pb-20 space-y-8">
      <PageHeader 
        title={`Empresa: ${company.name}`} 
        description={company.email && !company.email.endsWith('@stands.internal') ? company.email : 'Sin correo registrado'} 
      />

      {/* 1. Información de la empresa */}
      <CompanyInfoForm company={company} />

      {/* 2. Asignación / Detalle del stand */}
      {!stand ? (
        <AssignStandCard companyId={companyId} standTypes={standTypes || []} />
      ) : (
        <StandDetailCard 
          companyId={company.id} 
          stand={stand} 
          status={computedStatus || stand.status}
          elements={standElements}
          checklistItems={checklistItems}
        />
      )}

      {/* 3. Zona peligrosa */}
      <DeleteCompanySection company={company} />
    </div>
  );
}
