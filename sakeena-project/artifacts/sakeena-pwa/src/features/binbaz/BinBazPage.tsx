import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import { PageFrame } from '@/features/knowledge/PageFrame';
import { binBazCategories, binBazFatwas } from './binbaz-data';

export default function BinBazPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('الكل');
  const [open, setOpen] = useState<number | null>(null);
  const list = binBazFatwas.filter((f) => (category === 'الكل' || f.category === category) && `${f.question} ${f.answer}`.includes(query.trim()));
  return (
    <PageFrame title="فتاوى ابن باز" intro="ملخصات مبسّطة بالمعنى لأحكام معروفة عن الشيخ عبدالعزيز بن باز رحمه الله.">
      <div className="mb-4 flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card px-4 py-3">
        <Search size={18} className="text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="ابحث في الفتاوى..." aria-label="البحث في الفتاوى" data-testid="input-binbaz-search" />
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {['الكل', ...binBazCategories].map((name) => (
          <button key={name} type="button" onClick={() => setCategory(name)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${category === name ? 'bg-primary text-primary-foreground' : 'border border-card-border bg-card'}`}>{name}</button>
        ))}
      </div>
      <div className="space-y-3">
        {list.length === 0 && <p className="rounded-xl bg-secondary p-4 text-center text-sm">لا توجد نتائج.</p>}
        {list.map((f) => (
          <div key={f.id} className="rounded-[1.25rem] border border-card-border bg-card p-4">
            <button type="button" onClick={() => setOpen(open === f.id ? null : f.id)} className="flex w-full items-center justify-between gap-3 text-right" data-testid={`button-binbaz-${f.id}`}>
              <span><span className="mb-1 block text-xs text-accent">{f.category}</span><strong className="leading-7">{f.question}</strong></span>
              <ChevronDown size={20} className={`shrink-0 text-accent transition-transform ${open === f.id ? 'rotate-180' : ''}`} />
            </button>
            {open === f.id && <p className="mt-3 border-t border-border/50 pt-3 leading-8">{f.answer}</p>}
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-xl border border-card-border bg-card p-4 text-xs leading-6 text-muted-foreground">
        تنبيه: هذه ملخصات بتصرّف وليست نص الفتاوى الأصلية. للاستفادة والنقل راجع الفتوى الأصلية في المصادر الرسمية للشيخ (مجموع فتاوى ومقالات الشيخ ابن باز، وموقعه الرسمي)، ولمسألتك الخاصة اسأل أهل العلم.
      </p>
    </PageFrame>
  );
}
