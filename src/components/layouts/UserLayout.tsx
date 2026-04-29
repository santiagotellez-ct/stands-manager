'use client';

import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';

export function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
    router.push('/login');
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="h-16 bg-white border-b border-neutral-200 fixed top-0 w-full z-10">
        <div className="h-full max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <Logo size="sm" />
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">{userName}</span>
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
          </div>
        </div>
      </header>
      <main className="pt-24 md:pt-32 min-h-screen max-w-[1200px] mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
