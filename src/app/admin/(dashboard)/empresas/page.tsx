import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Building2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export const revalidate = 0;

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || '';
  const filter = resolvedSearchParams.filter || 'all';

  let query = supabaseAdmin
    .from('users')
    .select(`
      id,
      name,
      email,
      created_at,
      stands_with_computed_status!left (
        id,
        computed_status,
        stand_types (name)
      )
    `)
    .eq('role', 'company');

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  // Supabase postgrest doesn't easily allow filtering by whether a joined table exists natively in the same query without an inner join.
  // We'll fetch all and filter in memory since the list might not be massive, or we can just fetch and filter.
  const { data: companies } = await query.order('created_at', { ascending: false });

  let filteredCompanies = companies || [];
  if (filter === 'with-stand') {
    filteredCompanies = filteredCompanies.filter(c => !!c.stands_with_computed_status);
  } else if (filter === 'without-stand') {
    filteredCompanies = filteredCompanies.filter(c => !c.stands_with_computed_status);
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return <span className="text-neutral-400">—</span>;
    switch (status) {
      case 'pending_delivery': return <Badge variant="outline" className="text-neutral-500">Pendiente</Badge>;
      case 'delivered': return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Entregado</Badge>;
      case 'awaiting_return': return <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">Esperando dev.</Badge>;
      case 'returned': return <Badge variant="outline" className="text-green-500 border-green-200 bg-green-50">Devuelto</Badge>;
      default: return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Gestiona los perfiles de empresas participantes"
        action={
          <Link href="/admin/empresas/nueva">
            <Button className="bg-brand hover:bg-brand-hover text-white">
              <Plus className="mr-2 h-4 w-4" /> Nueva empresa
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input 
            name="q" 
            defaultValue={q} 
            placeholder="Buscar por nombre de empresa..." 
            className="pl-9"
          />
          {filter && <input type="hidden" name="filter" value={filter} />}
        </form>
        <div className="flex gap-2">
          <Link href={`?q=${q}&filter=all`}>
            <Button variant={filter === 'all' ? 'default' : 'outline'} className={filter === 'all' ? 'bg-neutral-900 text-white' : ''}>
              Todas
            </Button>
          </Link>
          <Link href={`?q=${q}&filter=with-stand`}>
            <Button variant={filter === 'with-stand' ? 'default' : 'outline'} className={filter === 'with-stand' ? 'bg-neutral-900 text-white' : ''}>
              Con stand
            </Button>
          </Link>
          <Link href={`?q=${q}&filter=without-stand`}>
            <Button variant={filter === 'without-stand' ? 'default' : 'outline'} className={filter === 'without-stand' ? 'bg-neutral-900 text-white' : ''}>
              Sin stand
            </Button>
          </Link>
        </div>
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200 rounded-lg border-dashed">
          <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No hay empresas</h3>
          <p className="text-neutral-500 mb-6 text-center max-w-[400px]">
            No se encontraron empresas con los filtros actuales.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario / Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Stand asignado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company: any) => {
                const stand = Array.isArray(company.stands_with_computed_status) 
                  ? company.stands_with_computed_status[0] 
                  : company.stands_with_computed_status;
                return (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="text-sm text-neutral-500">{company.email || '—'}</TableCell>
                    <TableCell>
                      {stand?.stand_types?.name ? (
                        <span className="text-sm">{(stand.stand_types as any)?.name}</span>
                      ) : (
                        <span className="text-sm text-neutral-400">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(stand?.computed_status)}</TableCell>
                    <TableCell className="text-sm text-neutral-500">
                      {format(new Date(company.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/empresas/${company.id}`}>
                        <Button variant="ghost" size="sm">Ver / Editar</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
