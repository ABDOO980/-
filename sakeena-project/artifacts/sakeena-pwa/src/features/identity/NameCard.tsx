import { UserRound } from 'lucide-react';
import { useState } from 'react';
import { useUpdateDisplayName } from '@/lib/sakeena-api';
import { getSavedName, saveName } from '@/lib/display-name';

// Asks for a name before someone takes part in a public competition, so the
// leaderboard shows real names instead of anonymous numbers.
export function NameCard({ title = 'اكتب اسمك أولًا', hint = 'سيظهر اسمك أمام المشاركين. يمكنك استخدام اسم مستعار.', onSaved }: { title?: string; hint?: string; onSaved: (name: string) => void }) {
  const [name, setName] = useState(getSavedName());
  const [error, setError] = useState('');
  const update = useUpdateDisplayName();
  const submit = () => {
    const value = name.trim();
    if (value.length < 2) { setError('اكتب اسمًا من حرفين على الأقل.'); return; }
    setError('');
    update.mutate(value, {
      onSuccess: () => { saveName(value); onSaved(value); },
      onError: () => setError('تعذّر حفظ الاسم، تأكد من الاتصال وحاول مرة أخرى.'),
    });
  };
  return (
    <section className="mb-6 rounded-[1.5rem] border border-accent bg-card p-5 text-center" data-testid="card-name-gate">
      <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-secondary text-accent"><UserRound size={22} /></span>
      <h2 className="mb-1 text-lg font-bold">{title}</h2>
      <p className="mb-4 text-xs leading-6 text-muted-foreground">{hint}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} maxLength={30} placeholder="اسمك" className="mb-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-center text-base" data-testid="input-display-name" />
      {error && <p className="mb-3 text-xs text-destructive" role="alert">{error}</p>}
      <button type="button" onClick={submit} disabled={update.isPending} className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60" data-testid="button-save-display-name">{update.isPending ? 'جارٍ الحفظ...' : 'حفظ والمتابعة'}</button>
    </section>
  );
}
