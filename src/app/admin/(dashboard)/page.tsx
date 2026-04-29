import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Building2, Package, CheckCircle2, Inbox } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  // Stats
  const [{ count: typesCount }, { count: companiesCount }, { count: standsCount }, { count: returnedCount }] = await Promise.all([
    supabaseAdmin.from('stand_types').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'company'),
    supabaseAdmin.from('stands').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('stands_with_computed_status').select('*', { count: 'exact', head: true }).eq('computed_status', 'returned'),
  ]);

  // Last 5 assignments
  const { data: recentStands } = await supabaseAdmin
    .from('stands_with_computed_status')
    .select(`
      id,
      assigned_at,
      computed_status,
      users:company_id(name),
      stand_types:stand_type_id(name)
    `)
    .order('assigned_at', { ascending: false })
    .limit(5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_delivery':
        return <Badge variant="outline" className="text-neutral-500">Pendiente de entrega</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Entregado</Badge>;
      case 'awaiting_return':
        return <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Esperando devolución</Badge>;
      case 'returned':
        return <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Devuelto</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general del estado de los stands en el evento." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de stand</CardTitle>
            <Package className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typesCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas inscritas</CardTitle>
            <Building2 className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companiesCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stands asignados</CardTitle>
            <Inbox className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{standsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stands devueltos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returnedCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas asignaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {recentStands && recentStands.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo de stand</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha asignación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStands.map((stand: any) => (
                  <TableRow key={stand.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/empresas/${stand.id}`} className="hover:underline">
                        {stand.users?.name || 'Empresa eliminada'}
                      </Link>
                    </TableCell>
                    <TableCell>{stand.stand_types?.name}</TableCell>
                    <TableCell>{getStatusBadge(stand.computed_status)}</TableCell>
                    <TableCell>{new Date(stand.assigned_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              No hay stands asignados todavía.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
