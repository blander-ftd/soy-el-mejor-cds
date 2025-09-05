import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center size-12 bg-primary text-primary-foreground rounded-full", className)}>
      <Trophy className="size-6" />
    </div>
  );
}
