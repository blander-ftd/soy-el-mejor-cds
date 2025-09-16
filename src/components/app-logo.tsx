import { cn } from "@/lib/utils"

export default function AppLogo({ className }: { className?: string }) {
  return (
    <svg 
      className={cn("h-10 w-10", className)}
      viewBox="0 0 512 512" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>ionicons-v5-f</title>
      <path
        d="M400,240c-8.89-89.54-71-144-144-144-69,0-113.44,48.2-128,96C68,198,16,235.59,16,304c0,66,54,112,120,112H396c55,0,100-27.44,100-88C496,268.18,443,242.24,400,240Z"
        style={{
          fill: 'none',
          stroke: 'hsl(var(--primary))',
          strokeLinejoin: 'round',
          strokeWidth: '32px',
        }}
      />
      <polyline
        points="317 208 209.2 336 163 284.8"
        style={{
          fill: 'none',
          stroke: 'hsl(var(--primary))',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '32px',
        }}
      />
    </svg>
  );
}
