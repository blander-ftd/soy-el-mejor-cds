"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client-side to avoid hydration mismatch
    setTime(new Date());

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!time) {
    return <div className="text-sm text-primary-foreground font-medium hidden md:block w-56"></div>; // Placeholder for SSR
  }

  return (
    <div className="text-sm text-primary-foreground font-medium hidden md:block">
      {format(time, 'PPP p', { locale: es })}
    </div>
  );
}
