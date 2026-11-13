import { getSavedName, saveName } from '@/lib/display-name';
import { ArrowRight, Check, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { shareOrCopy } from '@/lib/sakeena';
import { apiFetch } from '@/lib/api-client';

type Claim = { juzNumber: number; nickname: string; userId: number; completedAt: string | null };
type GroupKhatmah = { group: { code: string; title: string }; claims: Claim[] };

export default function GroupKhatmahPage() {
  const [state, setState] = useState<GroupKhatmah | null>(null);
  const [title, setTitle] = useState('ختمة عائلتي');
  const [nickname, setNickname] = useState(getSavedName());
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const { groupKhatmah } = await apiFetch<{ groupKhatmah: { code: string; title: string } }>('/group-khatmah', { method: 'POST', body: JSON.stringify({ title }) });
    setState({ group: groupKhatmah, claims: [] });
  };

  const load = async (code: string) => {
    try {
      const result = await apiFetch<GroupKhatmah>(`/group-khatmah/${code}`);
      setState(result);
      setError(null);
    } catch {
      setError('لم يتم العثور على ختمة بهذا الرمز.');
    }
  };

  const claim = async (juzNumber: number) => {
    if (!state || !nickname.trim()) { setError('اكتب اسمك أولًا.'); return; }
    try {
      saveName(nickname);
      const result = await apiFetch<GroupKhatmah>(`/group-khatmah/${state.group.code}/claim`, { method: 'POST', body: JSON.stringify({ nickname: nickname.trim(), juzNumber }) });
      setState(result);
    } catch {
      setError('هذا الجزء محجوز بالفعل.');
    }
  };

  const complete = async (juzNumber: number) => {
    if (!state) return;
    const result = await apiFetch<GroupKhatmah>(`/group-khatmah/${state.group.code}/juz/${juzNumber}/complete`, { method: 'PATCH' });
    setState(result);
  };

  if (!state) {
    return (
      <div className="rise-in mx-auto max-w-md">
        <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">وزّعوا الثلاثين جزءًا بينكم</p><h1 className="font-arabic text-3xl font-bold">ختمة جماعية</h1></header>
        {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-center text-xs text-destructive">{error}</p>}
        <section className="mb-6 rounded-2xl border border-card-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">إنشاء ختمة جديدة</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اسم الختمة" className="mb-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
          <button onClick={() => void create()} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground" data-testid="button-create-group-khatmah">إنشاء</button>
        </section>
        <section className="rounded-2xl border border-card-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">الانضمام برمز</p>
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="رمز الختمة" className="mb-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-center font-mono-app text-lg tracking-widest" />
          <button onClick={() => void load(joinCode.trim())} className="w-full rounded-xl border border-accent px-4 py-3 text-sm font-bold text-accent" data-testid="button-join-group-khatmah">انضمام</button>
        </section>
        <Link href="/more" className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
      </div>
    );
  }

  const completedCount = state.claims.filter((c) => c.completedAt).length;

  return (
    <div className="rise-in mx-auto max-w-2xl">
      <header className="mb-5 text-center"><h1 className="font-arabic text-2xl font-bold">{state.group.title}</h1><p className="mt-1 text-xs text-muted-foreground">{completedCount} من ٣٠ جزءًا تمت قراءته</p></header>
      <button onClick={() => void shareOrCopy({ title: 'انضم لختمتنا الجماعية في سَكينة', text: `رمز الختمة: ${state.group.code}` })} className="mx-auto mb-5 flex items-center gap-2 rounded-xl border border-accent px-5 py-3 font-mono-app text-xl tracking-widest text-accent" data-testid="button-share-group-khatmah-code"><Share2 size={16} />{state.group.code}</button>
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="اسمك (لحجز جزء)" className="mb-5 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" data-testid="input-khatmah-nickname" />
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
          const claimEntry = state.claims.find((c) => c.juzNumber === juz);
          return (
            <button
              key={juz}
              onClick={() => (claimEntry ? void complete(juz) : void claim(juz))}
              className={`aspect-square rounded-xl border p-1 text-center text-[0.6875rem] ${claimEntry?.completedAt ? 'border-accent bg-accent/25 text-accent' : claimEntry ? 'border-accent/60 bg-secondary/60' : 'border-card-border bg-card'}`}
              data-testid={`button-juz-${juz}`}
            >
              <span className="block font-mono-app text-sm">{juz}</span>
              {claimEntry && <span className="mt-0.5 block truncate text-[0.5625rem]">{claimEntry.completedAt ? <Check size={10} className="mx-auto" /> : claimEntry.nickname}</span>}
            </button>
          );
        })}
      </div>
      <Link href="/more" className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
    </div>
  );
}
