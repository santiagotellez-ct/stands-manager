import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { format } from 'date-fns';
import { AdminsActions } from '@/components/admin/AdminsActions';
import { NewAdminDialog } from '@/components/admin/NewAdminDialog';

export const revalidate = 0;

export default async function AdminsPage() {
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', 'admin')
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Administradores"
        description="Gestiona los accesos administrativos del sistema"
        action={<NewAdminDialog />}
      />

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Fecha creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins?.map((admin: any) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell className="text-sm text-neutral-500">
                  {format(new Date(admin.created_at), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <AdminsActions admin={admin} totalAdmins={admins.length} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
