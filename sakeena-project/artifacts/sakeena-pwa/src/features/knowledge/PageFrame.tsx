import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'wouter';

export function PageFrame({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="rise-in pb-6" dir="rtl">
      <header className="relative mb-5 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
        <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
        <h1 className="font-arabic text-[1.75rem] font-bold">{title}</h1>
      </header>
      {intro && <p className="mb-4 text-center text-sm leading-7 text-muted-foreground">{intro}</p>}
      {children}
    </div>
  );
}

export type Ayah = { text: string; ref: string };
export type Item = { title: string; subtitle?: string; body: string; lesson?: string; ayat?: Ayah[] };

export function Accordion({ items, testId }: { items: Item[]; testId: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.title} className="rounded-[1.25rem] border border-card-border bg-card p-4">
          <button type="button" onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center justify-between gap-3 text-right" data-testid={`${testId}-${index}`}>
            <span><strong className="block text-lg">{item.title}</strong>{item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}</span>
            <ChevronDown size={20} className={`shrink-0 text-accent transition-transform ${open === index ? 'rotate-180' : ''}`} />
          </button>
          {open === index && (
            <div className="mt-3 border-t border-border/50 pt-3">
              <p className="leading-8">{item.body}</p>
              {item.ayat && item.ayat.length > 0 && (
                <div className="mt-3 space-y-2" data-testid="list-related-ayat">
                  <p className="text-[0.6875rem] font-semibold text-accent">آيات ذات صلة</p>
                  {item.ayat.map((ayah) => (
                    <blockquote key={ayah.ref + ayah.text.slice(0, 12)} className="rounded-xl border border-accent/40 bg-background p-3">
                      <p className="font-arabic text-lg leading-[2.1]">﴿{ayah.text}﴾</p>
                      <cite className="text-[0.6875rem] not-italic text-muted-foreground">{ayah.ref}</cite>
                    </blockquote>
                  ))}
                </div>
              )}
              {item.lesson && <p className="mt-3 rounded-xl bg-secondary p-3 text-sm leading-7 text-secondary-foreground"><strong>الدرس: </strong>{item.lesson}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
