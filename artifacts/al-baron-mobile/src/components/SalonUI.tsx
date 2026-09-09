import React, { ReactNode } from 'react';
import { CalendarDays, Home, LucideIcon, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'wouter';
import { useLocation } from 'wouter';
import { usePhoneAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Screen({ children, scroll = true, className }: { children: ReactNode; scroll?: boolean; className?: string }) {
  return (
    <div className={cn("relative isolate min-h-[100dvh] w-full bg-transparent flex flex-col", scroll ? "overflow-y-auto" : "overflow-hidden", className)}>
      <div className="sky-scene" aria-hidden="true">
        <div className="sky-stars sky-stars-far" />
        <div className="sky-stars sky-stars-near" />
        <div className="scissor-constellation">
          <span className="scissor-handle scissor-handle-top" />
          <span className="scissor-handle scissor-handle-bottom" />
          <span className="scissor-pivot" />
          <span className="scissor-arm scissor-arm-top" />
          <span className="scissor-arm scissor-arm-bottom" />
          {Array.from({ length: 14 }, (_, index) => <span key={index} className="scissor-star" />)}
        </div>
      </div>
      <div className="relative z-10 flex-1 w-full max-w-md mx-auto p-5 pb-28 flex flex-col">
        {children}
      </div>
    </div>
  );
}

const navigationItems = [
  { href: '/', label: 'الرئيسية', icon: Home, testId: 'link-bottom-home' },
  { href: '/booking', label: 'الحجز', icon: CalendarDays, testId: 'link-bottom-booking' },
  { href: '/account', label: 'حسابي', icon: UserRound, testId: 'link-bottom-account' },
  { href: '/admin', label: 'الإدارة', icon: ShieldCheck, testId: 'link-bottom-admin' },
];

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = usePhoneAuth();
  const visibleItems = navigationItems.filter((item) => item.href !== '/admin' || user?.role === 'admin');

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav
        aria-label="التنقل الرئيسي"
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between rounded-[24px] border border-primary/20 bg-card/95 p-2 shadow-[0_-8px_30px_rgba(0,0,0,0.28)] backdrop-blur-md"
      >
        {visibleItems.map(({ href, label, icon: Icon, testId }) => {
          const active = href === '/' ? location === '/' : href === '/account' ? location === '/account' || location === '/queue' : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              data-testid={testId}
              className={cn(
                'flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-[17px] px-1 text-[10px] font-bold transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("barber-card relative bg-card/80 rounded-[20px] overflow-hidden border border-white/10 backdrop-blur-xl", className)} {...props}>
      {children}
    </div>
  );
}

export function IconButton({ icon: Icon, label, onPress, filled }: { icon: LucideIcon; label: string; onPress?: () => void; filled?: boolean }) {
  return (
    <button 
      onClick={onPress}
      aria-label={label}
      data-testid={`btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-opacity active:opacity-70",
        filled ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
      )}
    >
      <Icon size={20} />
    </button>
  );
}

export function IconButtonLink({ icon: Icon, label, href, filled, onPress }: { icon: LucideIcon; label: string; href: string; filled?: boolean; onPress?: () => void }) {
  return (
    <Link href={href} onClick={onPress} className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center transition-opacity active:opacity-70",
      filled ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
    )} aria-label={label} data-testid={`link-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <Icon size={20} />
    </Link>
  );
}

export function LogoMark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none flex-row-reverse">
      <div className={cn(
        "rounded-full border border-primary flex items-center justify-center bg-card shrink-0",
        compact ? "w-10 h-10" : "w-12 h-12"
      )}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("text-primary", compact ? "w-5 h-5" : "w-6 h-6")}>
          <path d="M2 17L12 22L22 17" />
          <path d="M2 12L12 17L22 12" />
          <path d="M2 7L12 12L22 7" />
        </svg>
      </div>
      {!compact && (
        <div className="text-right">
          <div className="text-lg font-bold text-foreground leading-tight">البارون</div>
          <div className="text-[10px] text-primary tracking-wider uppercase font-bold">BARON</div>
        </div>
      )}
    </div>
  );
}

export function StatusPill({ children, positive }: { children: ReactNode; positive?: boolean }) {
  return (
    <div className={cn(
      "px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center justify-center border",
      positive 
        ? "bg-success/10 border-success/30 text-success" 
        : "bg-primary/10 border-primary/30 text-primary"
    )}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-row-reverse justify-between items-end mt-7 mb-4">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {action && (
        onAction ? (
          <button onClick={onAction} className="text-xs font-bold text-primary active:opacity-70">{action}</button>
        ) : (
          <span className="text-xs font-bold text-primary">{action}</span>
        )
      )}
    </div>
  );
}

export function GoldButton({ title, icon: Icon, onPress, disabled, secondary }: { title: string; icon?: LucideIcon; onPress?: () => void; disabled?: boolean; secondary?: boolean }) {
  return (
    <button 
      onClick={onPress} 
      disabled={disabled}
      className={cn(
        "w-full h-14 rounded-2xl flex flex-row-reverse items-center justify-center gap-2 transition-all active:scale-[0.98]",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        secondary 
          ? "bg-secondary text-foreground border border-border" 
          : "bg-primary text-primary-foreground shadow-[0_4px_14px_rgba(212,175,55,0.25)]"
      )}
    >
      {Icon && <Icon size={20} className={secondary ? "text-primary" : "text-primary-foreground"} />}
      <span className="font-bold text-sm">{title}</span>
    </button>
  );
}
