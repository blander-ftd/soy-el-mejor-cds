"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';
import { LayoutDashboard, Users, Vote, Trophy, ShieldCheck, Briefcase, User, ClipboardList } from 'lucide-react';
import { votingEvents } from '@/lib/data';
import { addDays } from 'date-fns';
import { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
    roles: Role[];
    disabledCheck?: (phases: PhaseInfo) => boolean;
    disabledTooltip?: string;
}

const navLinks: NavLink[] = [
  { href: '/admin', label: 'Panel Admin', icon: ShieldCheck, roles: ['Admin'] },
  { 
    href: '/supervisor', 
    label: 'Nominaciones', 
    icon: Briefcase, 
    roles: ['Supervisor'],
    disabledCheck: (phases) => !phases.isNominationActive,
    disabledTooltip: "Las nominaciones están actualmente cerradas."
  },
  { href: '/coordinator', label: 'Vista de Equipo', icon: Briefcase, roles: ['Coordinator'] },
  { 
    href: '/collaborator', 
    label: 'Votar', 
    icon: Vote, 
    roles: ['Collaborator'],
    disabledCheck: (phases) => !phases.isVotingActive,
    disabledTooltip: "El período de votación no está activo."
  },
  { 
    href: '/survey', 
    label: 'Encuesta', 
    icon: ClipboardList, 
    roles: ['Supervisor', 'Coordinator'],
    disabledCheck: (phases) => !phases.isEvaluationActive,
    disabledTooltip: "El período de evaluación de pares no está activo."
  },
  { href: '/results', label: 'Resultados', icon: Trophy, roles: ['Admin', 'Supervisor', 'Coordinator', 'Collaborator'] },
];

interface PhaseInfo {
    isNominationActive: boolean;
    isVotingActive: boolean;
    isEvaluationActive: boolean;
}

const getPhaseInfo = (): PhaseInfo => {
    const now = new Date();
    const activeEvent = votingEvents.find(event => event.status === 'Active' && event.startDate && event.endDate && now >= event.startDate && now <= event.endDate);

    if (!activeEvent || !activeEvent.startDate) {
        return { isNominationActive: false, isVotingActive: false, isEvaluationActive: false };
    }

    const nominationEndDate = addDays(activeEvent.startDate, 7);
    const votingEndDate = addDays(activeEvent.startDate, 14);
    const evaluationEndDate = activeEvent.endDate!;

    return {
        isNominationActive: now >= activeEvent.startDate && now <= nominationEndDate,
        isVotingActive: now > nominationEndDate && now <= votingEndDate,
        isEvaluationActive: now > votingEndDate && now <= evaluationEndDate,
    };
};

interface MainNavProps {
  role: Role;
}

export function MainNav({ role }: MainNavProps) {
  const pathname = usePathname();
  const userLinks = navLinks.filter(link => link.roles.includes(role));
  const phaseInfo = useMemo(() => getPhaseInfo(), []);

  return (
    <TooltipProvider>
      <div className="grid items-start px-4 text-sm font-medium">
        {userLinks.map(({ href, label, icon: Icon, disabledCheck, disabledTooltip }) => {
            const isDisabled = disabledCheck ? disabledCheck(phaseInfo) : false;
            
            const linkContent = (
                 <Link
                    key={href}
                    href={isDisabled ? '#' : href}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                        pathname === href && !isDisabled && 'bg-muted text-primary',
                        isDisabled && 'cursor-not-allowed opacity-50'
                    )}
                    onClick={(e) => isDisabled && e.preventDefault()}
                    aria-disabled={isDisabled}
                    tabIndex={isDisabled ? -1 : undefined}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </Link>
            );

            if (isDisabled && disabledTooltip) {
                 return (
                    <Tooltip key={href}>
                        <TooltipTrigger asChild>
                            <div className="w-full">{linkContent}</div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>{disabledTooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                 );
            }

            return linkContent;
        })}
      </div>
    </TooltipProvider>
  );
}
