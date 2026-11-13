import { AdhanScheduler } from '@/app/adhan';
import { installScrollMemory, onNavigated } from '@/lib/scroll-memory';

installScrollMemory();
import { Moon, Sun, Home as HomeIcon, BookOpen, Sparkles, Target, BookMarked, Compass, CalendarDays, Settings, Search, ChevronLeft } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { STORAGE_KEYS, readStorage, type SakeenaSettings, DEFAULT_SETTINGS, getCairoMinutes, type PrayerTimes, getPrayerNameArabic, getPrayerBenefit, timeToMinutes, writeStorage } from '@/lib/sakeena';
import FloatingAudioPlayer from '@/features/quran/FloatingAudioPlayer';
import { isNavActive, navItems, usePrayerTimes, useStoredState } from '@/app/common';

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
      <span className="grid size-10 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-sm">
        <span className="font-arabic text-2xl leading-tight">س</span>
      </span>
      <span className="leading-none">
        <strong className="block text-lg tracking-tight">سَكينة</strong>
        <small className="mt-1 block text-[0.625rem] tracking-[.2em] opacity-65">للقرآن والعبادة</small>
      </span>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  return (
    <aside className="hidden min-h-dvh w-[248px] shrink-0 flex-col bg-sidebar px-5 py-7 text-sidebar-foreground md:flex">
      <Brand />
      <div className="my-9 h-px bg-sidebar-border" />
      <nav className="space-y-1.5" aria-label="التنقل الرئيسي">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, location);
          return (
            <Link
              href={href}
              key={href}
              data-testid={`link-nav-${label}`}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold' : 'opacity-75 hover:bg-sidebar-accent hover:opacity-100'}`}
            >
              <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />
              <span>{label}</span>
              {active && <span className="mr-auto size-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-3xl border border-sidebar-border bg-sidebar-accent/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs opacity-70">وردك اليومي</span>
          <span className="font-mono-app text-xs text-accent">3 / 5</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-sidebar/70"><div className="h-full w-3/5 rounded-full bg-accent" /></div>
        <p className="mt-3 text-xs leading-5 opacity-70">خطوة صغيرة، وقلب أكثر حضوراً.</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden" aria-label="التنقل المحمول">
       <div className="mx-auto grid max-w-lg grid-cols-6 items-center">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, location);
          return (
            <Link href={href} key={href} data-testid={`link-mobile-nav-${label}`} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-center text-[length:clamp(0.5625rem,2.7vw,0.75rem)] leading-tight transition-colors ${active ? 'bg-secondary/70 text-accent' : 'text-muted-foreground'}`}>
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              <span className={`max-w-full break-words ${active ? 'font-semibold' : ''}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Header({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <header className="relative mb-6 flex min-h-14 items-center justify-center border-b border-border/50 pb-4 md:items-start md:justify-between md:border-0 md:pb-0">
      <div className="text-center md:text-right">
        {eyebrow && <p className="mb-1 text-[0.6875rem] text-muted-foreground md:text-xs">{eyebrow}</p>}
        <h1 className="font-arabic text-[1.875rem] font-bold leading-tight text-foreground md:text-3xl">{title}</h1>
      </div>
      {action && <div className="absolute left-0 top-0 md:static">{action}</div>}
    </header>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => { onNavigated(); }, [location]);
  const [theme, setTheme] = useStoredState<'light' | 'dark'>(STORAGE_KEYS.theme, 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return (
    <div className="min-h-dvh bg-background">
      <PrayerNotifications />
      <AdhanScheduler />
      <div className="flex min-h-dvh">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <div className="mx-auto max-w-[1280px] px-5 py-6 md:px-10 md:py-9">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
      <FloatingAudioPlayer />
      <CommandPalette />
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="fixed bottom-6 left-6 z-40 hidden size-10 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:text-primary md:grid"
        aria-label={theme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
        data-testid="button-toggle-theme"
      >
        {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
      </button>
    </div>
  );
}

export function CommandPalette() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const commands = [
    ['الرئيسية', '/', HomeIcon], ['المصحف الشريف', '/quran', BookOpen], ['الأذكار والسبحة', '/adhkar', Sparkles],
    ['متتبع العبادات', '/tracker', Target], ['التدبر والإلهام', '/articles', BookMarked], ['الحديث والسيرة', '/hadith', BookMarked],
    ['القبلة', '/qibla', Compass], ['التقويم الهجري', '/calendar', CalendarDays], ['الإعدادات', '/settings', Settings],
  ] as const;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const visible = commands.filter(([label]) => String(label).includes(query));
  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[0.625rem] text-muted-foreground shadow-lg md:flex" aria-label="فتح البحث السريع"><Search size={14} />بحث سريع <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono-app">⌘K</kbd></button>
      {open && <div className="fixed inset-0 z-[60] bg-background/75 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="البحث السريع" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><div className="mx-auto mt-[12vh] max-w-lg overflow-hidden rounded-2xl border border-accent/35 bg-card shadow-2xl"><div className="flex items-center gap-3 border-b border-border p-4"><Search size={18} className="text-accent" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="انتقل إلى..." /><button onClick={() => setOpen(false)} className="text-xs text-muted-foreground">إغلاق</button></div><div className="max-h-[55vh] overflow-y-auto p-2">{visible.map(([label, href, Icon]) => <button key={href} onClick={() => { setLocation(href); setOpen(false); setQuery(''); }} className="flex w-full items-center gap-3 rounded-xl p-3 text-right text-sm hover:bg-secondary"><span className="grid size-9 place-items-center rounded-lg bg-secondary text-accent"><Icon size={17} /></span><span className="flex-1">{label}</span><ChevronLeft size={15} className="text-muted-foreground" /></button>)}{!visible.length && <p className="p-5 text-center text-xs text-muted-foreground">لا توجد وجهة بهذا الاسم.</p>}</div></div></div>}
    </>
  );
}

export function PrayerNotifications() {
  const { prayer } = usePrayerTimes();
  useEffect(() => {
    const check = () => {
      const settings = readStorage<SakeenaSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
      if (!settings.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const current = getCairoMinutes(now);
      const dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(now);
      const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', weekday: 'long' }).format(now);
      const sent = readStorage<Record<string, boolean>>(STORAGE_KEYS.prayerNotifications, {});
      (Object.entries(prayer.timings) as [keyof PrayerTimes['timings'], string][]).forEach(([name, time]) => {
        if (name === 'Sunrise') return;
        const prayerMinutes = Number(time.split(':')[0]) * 60 + Number(time.split(':')[1]);
        const arabicName = getPrayerNameArabic(name);
        if (prayerMinutes - current === 10 && !sent[`${dateKey}-${name}-before`]) {
          new Notification(`تبقى على أذان ${arabicName} 10 دقايق ⏳`, { body: `اذهب واتوضى واستعد لصلاة ${arabicName}`, icon: '/favicon.svg' });
          sent[`${dateKey}-${name}-before`] = true;
        }
        if (prayerMinutes === current && !sent[`${dateKey}-${name}-now`]) {
          new Notification(`حان الآن وقت صلاة ${arabicName} 🕌`, { body: getPrayerBenefit(name), icon: '/favicon.svg' });
          sent[`${dateKey}-${name}-now`] = true;
          if (name === 'Fajr' && (weekday === 'Monday' || weekday === 'Thursday') && !sent[`${dateKey}-fasting`]) {
            new Notification('صيام اليوم سُنّة 🌙', { body: '«تُعرض الأعمال يوم الاثنين والخميس، فأحب أن يُعرض عملي وأنا صائم» (رواه الترمذي)', icon: '/favicon.svg' });
            sent[`${dateKey}-fasting`] = true;
          }
          if (name === 'Maghrib' && weekday === 'Thursday' && !sent[`${dateKey}-friday-night`]) {
            new Notification('ليلة الجمعة ✨', { body: '«أكثروا من الصلاة عليّ ليلة الجمعة ويومها»، ومن قرأ سورة الكهف أضاء له النور بين الجمعتين', icon: '/favicon.svg' });
            sent[`${dateKey}-friday-night`] = true;
          }
        }
      });
      const fajrMinutes = timeToMinutes(prayer.timings.Fajr);
      const maghribMinutes = timeToMinutes(prayer.timings.Maghrib);
      const nightLength = ((fajrMinutes - maghribMinutes) + 1440) % 1440;
      const lastThirdStart = Math.round((fajrMinutes - nightLength / 3 + 1440) % 1440);
      if (current === lastThirdStart && !sent[`${dateKey}-qiyam`]) {
        new Notification('الثلث الأخير من الليل 🌙', { body: '«ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر: من يدعوني فأستجيب له» (متفق عليه)', icon: '/favicon.svg' });
        sent[`${dateKey}-qiyam`] = true;
      }
      writeStorage(STORAGE_KEYS.prayerNotifications, sent);
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [prayer]);
  return null;
}
