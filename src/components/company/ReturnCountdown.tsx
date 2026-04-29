'use client';

import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReturnCountdown({ targetDateStr }: { targetDateStr: string }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isReady, setIsReady] = useState(false);
  const targetDate = new Date(targetDateStr).getTime();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        clearInterval(interval);
        setIsReady(true);
        router.refresh();
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, router]);

  if (isReady) return null;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <Clock className="h-16 w-16 text-neutral-400 mb-6" />
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">Devolución aún no disponible</h2>
      <p className="text-neutral-500 text-center max-w-[500px] mb-8">
        Podrás completar la entrega de tu stand cuando finalice el evento, a partir del {new Date(targetDateStr).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}.
      </p>

      <div className="flex gap-4 mb-10">
        <div className="flex flex-col items-center bg-white border border-neutral-200 rounded-lg w-20 py-3 shadow-sm">
          <span className="text-3xl font-bold text-neutral-900">{timeLeft.days}</span>
          <span className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Días</span>
        </div>
        <div className="flex flex-col items-center bg-white border border-neutral-200 rounded-lg w-20 py-3 shadow-sm">
          <span className="text-3xl font-bold text-neutral-900">{timeLeft.hours}</span>
          <span className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Horas</span>
        </div>
        <div className="flex flex-col items-center bg-white border border-neutral-200 rounded-lg w-20 py-3 shadow-sm">
          <span className="text-3xl font-bold text-neutral-900">{timeLeft.minutes}</span>
          <span className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Min</span>
        </div>
        <div className="flex flex-col items-center bg-white border border-neutral-200 rounded-lg w-20 py-3 shadow-sm">
          <span className="text-3xl font-bold text-neutral-900">{timeLeft.seconds}</span>
          <span className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Seg</span>
        </div>
      </div>

      <Link href="/home">
        <Button variant="outline">Volver al inicio</Button>
      </Link>
    </div>
  );
}
