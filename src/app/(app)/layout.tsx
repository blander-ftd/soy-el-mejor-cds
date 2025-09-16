"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import AppLogo from '@/components/app-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import LiveClock from '@/components/live-clock';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-card sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2 font-semibold">
            <div className="size-10">
              <AppLogo />
            </div>
            <span>Soy El Mejor</span>
          </div>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <MainNav role={currentUser.role} />
        </nav>
      </aside>

      <div className="flex flex-col sm:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-primary px-6">
          <LiveClock />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserNav user={currentUser} />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
