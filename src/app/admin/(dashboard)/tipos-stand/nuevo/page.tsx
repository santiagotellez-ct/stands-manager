import { PageHeader } from '@/components/PageHeader';
import { StandTypeForm } from '@/components/forms/StandTypeForm';

export default function NewStandTypePage() {
  return (
    <div className="max-w-[800px] mx-auto pb-12">
      <PageHeader title="Nuevo tipo de stand" description="Crea una plantilla para poder asignarla a las empresas" />
      <StandTypeForm />
    </div>
  );
}
