import { Logo } from '@/components/Logo';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8 text-center">
          <Logo size="lg" className="mb-6" />
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">{title}</h1>
          <p className="text-sm text-neutral-500">{subtitle}</p>
        </div>
        <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
