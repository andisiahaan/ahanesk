'use client';
import { useTheme } from '@/providers/theme-provider';
import { cn } from '@/lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex items-center justify-center size-9 rounded-full',
        'border border-border bg-muted text-muted-foreground',
        'hover:bg-secondary hover:text-foreground transition-colors',
        className,
      )}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
