import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile) {
      role = profile.role;
    }
  }

  // Comprobar si hay admins para redirigir a setup si es necesario
  const isSetupRoute = path === '/admin/setup';
  const isAdminLoginRoute = path === '/admin/login';
  const isAdminRoute = path.startsWith('/admin') && !isSetupRoute && !isAdminLoginRoute;
  const isHomeRoute = path.startsWith('/home');
  const isLoginRoute = path === '/login';

  if (isSetupRoute || isAdminLoginRoute || isAdminRoute) {
    // Solo verificar si hay admins si no estamos logueados o estamos en setup/login admin
    if (!user || isSetupRoute || isAdminLoginRoute) {
      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
      const hasAdmins = !!admins;

      if (!hasAdmins && !isSetupRoute) {
        return NextResponse.redirect(new URL('/admin/setup', request.url));
      }
      if (hasAdmins && isSetupRoute) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }
  }

  // Rutas logueado
  if (user) {
    if (role === 'admin') {
      if (isLoginRoute || isAdminLoginRoute || isSetupRoute || isHomeRoute) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } else if (role === 'company') {
      if (isLoginRoute || isAdminLoginRoute || isSetupRoute || isAdminRoute) {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    }
  } else {
    // Rutas sin loguear
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isHomeRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (path === '/') {
    if (user) {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/home', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
