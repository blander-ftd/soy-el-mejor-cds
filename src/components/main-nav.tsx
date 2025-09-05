"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';
import { LayoutDashboard, Users, Vote, Trophy, ShieldCheck, Briefcase, User, ClipboardList } from 'lucide-react';

const navLinks = [
  { href: '/admin', label: 'Admin Dashboard', icon: ShieldCheck, roles: ['Admin'] },
  { href: '/supervisor', label: 'Nominations', icon: Briefcase, roles: ['Supervisor'] },
  { href: '/coordinator', label: 'Team View', icon: Briefcase, roles: ['Coordinator'] },
  { href: '/collaborator', label: 'Vote', icon: Vote, roles: ['Collaborator'] },
  { href: '/results', label: 'Results', icon: Trophy, roles: ['Admin', 'Supervisor', 'Coordinator', 'Collaborator'] },
  { href: '/survey', label: 'Survey', icon: ClipboardList, roles: ['Admin', 'Supervisor', 'Coordinator', 'Collaborator'] },
];

interface MainNavProps {
  role: Role;
}

export function MainNav({ role }: MainNavProps) {
  const pathname = usePathname();
  const userLinks = navLinks.filter(link => link.roles.includes(role));

  return (
    <div className="grid items-start px-4 text-sm font-medium">
      {userLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            pathname === href && 'bg-muted text-primary'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
