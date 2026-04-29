'use client';

import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/tipos-stand', label: 'Tipos de stand' },
  { href: '/admin/empresas', label: 'Empresas' },
  { href: '/admin/admins', label: 'Admins' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('users').select('name').eq('id', data.user.id).single().then(({ data: profile }) => {
          if (profile) setUserName(profile.name);
        });
      }
    });
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : 'A';

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="h-16 bg-white border-b border-neutral-200 fixed top-0 w-full z-10">
        <div className="h-full max-w-[1280px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-8 h-full">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="text-sm font-medium text-neutral-500">Admin</span>
            </div>
            
            <nav className="hidden md:flex h-full gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`h-full flex items-center px-3 text-sm font-medium transition-colors border-b-2 ${
                      isActive
                        ? 'border-brand text-neutral-900'
                        : 'border-transparent text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900 hidden sm:block">{userName}</span>
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-neutral-100 text-neutral-900">{initial}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Mobile menu trigger could go here */}
            <button className="md:hidden p-2 -mr-2 text-neutral-500">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="pt-24 md:pt-32 min-h-screen max-w-[1280px] mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
