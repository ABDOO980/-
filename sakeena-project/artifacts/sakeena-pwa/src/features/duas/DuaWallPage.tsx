import { ListSkeleton } from '@/components/skeleton';
import { ArrowRight, Clock3, Heart, LoaderCircle, MessageCircle, Send, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { getDeviceId, readStorage, writeStorage } from '@/lib/sakeena';
import { API_BASE } from '@/lib/api-base';

type DuaKind = 'ummah' | 'person';
type DuaStatus = 'waiting' | 'active' | 'finished';
type Dua = {
  id: number;
  kind: DuaKind;
  beneficiaryName: string | null;
  prayerText: string;
  supporterCount: number;
  ameenCount: number;
  turnStartAt: string;
  turnEndAt: string;
  status: DuaStatus;
  remainingMinutes: number;
};

const LOCAL_KEY = 'sakeena.dua-wall.v3';
const initialDuas: Dua[] = []; // no demo data: only real duas shared by real users are shown

function getVisitorId() {
  return getDeviceId();
}

function formatTurn(dua: Dua) {
  if (dua.status === 'active') return `الدور الحالي · متبقٍ ${Math.max(1, dua.remainingMinutes)} دقيقة`;
  if (dua.status === 'waiting') {
    const position = Math.max(1, Math.ceil((new Date(dua.turnStartAt).getTime() - Date.now()) / (2 * 60 * 60 * 1000)));
    return `في الانتظار · الدور بعد ${position} دور`;
  }
  return 'اكتمل الدور · بقي أثر الدعاء';
}

export default function DuaWallPage() {
  const [duas, setDuas] = useState<Dua[]>(() => readStorage(LOCAL_KEY, initialDuas));
  const [kind, setKind] = useState<DuaKind>('ummah');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const activeDua = useMemo(() => duas.find((dua) => dua.status === 'active') ?? duas.find((dua) => dua.status === 'waiting'), [duas]);

  const loadDuas = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dua-wall`, { headers: { 'x-device-id': getDeviceId() } });
      if (!response.ok) throw new Error('load failed');
      const data = await response.json() as { requests?: Dua[] };
      const next = Array.isArray(data.requests) ? data.requests : [];
      setDuas(next);
      writeStorage(LOCAL_KEY, next);
      setError('');
    } catch {
      setError('لا يوجد اتصال بالجدار الجماعي الآن. لن يظهر دعاؤك للآخرين، ولن يصلك دعاؤهم، حتى يعود الاتصال.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDuas();
    const timer = window.setInterval(() => void loadDuas(), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const addDua = async () => {
    const cleanText = text.trim();
    const cleanName = beneficiaryName.trim();
    if (!cleanText || (kind === 'person' && !cleanName)) {
      setNotice(kind === 'person' ? 'اكتب اسم من تدعو له ونص الدعاء.' : 'اكتب نص الدعاء أولًا.');
      return;
    }
    setSubmitting(true);
    setNotice('');
    try {
      const response = await fetch(`${API_BASE}/api/dua-wall`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-device-id': getDeviceId() },
        body: JSON.stringify({ kind, beneficiaryName: cleanName, prayerText: cleanText }),
      });
      const data = await response.json() as { duplicate?: boolean; request?: Dua; message?: string };
      if (!response.ok || !data.request) throw new Error(data.message ?? 'submit failed');
      setDuas((current) => {
        const without = current.filter((dua) => dua.id !== data.request!.id);
        const next = [...without, data.request!].sort((a, b) => new Date(a.turnStartAt).getTime() - new Date(b.turnStartAt).getTime());
        writeStorage(LOCAL_KEY, next);
        return next;
      });
      setText('');
      setBeneficiaryName('');
      setNotice(data.duplicate ? 'الدعوة نفسها موجودة بالفعل، فتم احتساب طلبك عليها بدل إنشاء دور مكرر.' : 'تم إدخال دعائك في الصف الجماعي لمدة ساعتين.');
    } catch {
      setNotice('تعذر نشر الدعاء الآن. حاول مرة أخرى بعد لحظات.');
    } finally {
      setSubmitting(false);
    }
  };

  const ameen = async (dua: Dua) => {
    try {
      const response = await fetch(`${API_BASE}/api/dua-wall/${dua.id}/ameen`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-device-id': getDeviceId() },
        body: JSON.stringify({ visitorId: getVisitorId() }),
      });
      if (!response.ok) throw new Error('ameen failed');
      const data = await response.json() as { request?: Dua };
      if (data.request) {
        setDuas((current) => current.map((item) => item.id === dua.id ? data.request! : item));
      }
    } catch {
      setNotice('تعذر تسجيل آمين الآن.');
    }
  };

  return (
    <div className="rise-in">
      <header className="mb-6 text-center">
        <p className="mb-1 text-xs text-muted-foreground">كل واحد له دور، والكل يؤمّن</p>
        <h1 className="font-arabic text-3xl font-bold">جدار الدعاء الجماعي</h1>
      </header>

      <section className="mb-5 rounded-[1.7rem] bg-primary p-6 text-primary-foreground">
        <div className="flex items-center gap-3"><MessageCircle className="text-accent" size={23} /><span className="text-xs text-accent">دعاء مشترك بين مستخدمي سَكينة</span></div>
        <h2 className="mt-4 font-arabic text-3xl">اكتب دعاءً، وسيأخذ دوره</h2>
        <p className="mt-2 text-xs leading-6 opacity-70">كل دعاء جديد يأخذ دورًا مدته ساعتان. الدعوة المطابقة تمامًا تُحتسب على الدعوة الموجودة بدل تكرارها.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => setKind('ummah')} className={`rounded-xl border px-3 py-3 text-xs ${kind === 'ummah' ? 'border-accent bg-accent text-accent-foreground' : 'border-primary-foreground/20 bg-primary-foreground/10'}`}>دعاء للأمة</button>
          <button onClick={() => setKind('person')} className={`rounded-xl border px-3 py-3 text-xs ${kind === 'person' ? 'border-accent bg-accent text-accent-foreground' : 'border-primary-foreground/20 bg-primary-foreground/10'}`}>دعاء لشخص</button>
        </div>
        {kind === 'person' && <input value={beneficiaryName} onChange={(event) => setBeneficiaryName(event.target.value)} className="mt-2 w-full rounded-xl bg-primary-foreground/10 px-3 py-3 text-sm outline-none placeholder:text-primary-foreground/50" placeholder="اسم الشخص" aria-label="اسم الشخص" />}
        <div className="mt-2 flex gap-2">
          <input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addDua(); }} className="min-w-0 flex-1 rounded-xl bg-primary-foreground/10 px-3 py-3 text-sm outline-none placeholder:text-primary-foreground/50" placeholder={kind === 'person' ? 'اللهم اشفه واشرح صدره...' : 'اللهم انصر أهلنا وفرّج كربهم...'} aria-label="اكتب دعاء" />
          <button onClick={() => void addDua()} disabled={submitting} className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground disabled:opacity-60" aria-label="إضافة الدعاء">{submitting ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}</button>
        </div>
        {notice && <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary-foreground/10 p-3 text-xs leading-6"><button onClick={() => setNotice('')} aria-label="إغلاق التنبيه"><X size={14} /></button><span>{notice}</span></div>}
      </section>

      {activeDua && <section className="mb-5 rounded-[1.5rem] border border-accent/45 bg-secondary/60 p-5" aria-live="polite">
        <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-bold text-accent">الدور الحالي</p><span className="flex items-center gap-1 text-[0.625rem] text-muted-foreground"><Clock3 size={13} />{formatTurn(activeDua)}</span></div>
        <p className="font-arabic text-xl leading-[2]">{activeDua.kind === 'person' && activeDua.beneficiaryName ? `اللهم اشفِ ${activeDua.beneficiaryName}: ` : ''}{activeDua.prayerText}</p>
        <div className="mt-3 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-[0.625rem] text-muted-foreground"><Users size={13} className="text-accent" />{activeDua.supporterCount} طلبًا لهذه الدعوة · {activeDua.ameenCount} آمين</span><button onClick={() => void ameen(activeDua)} className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"><Heart size={15} />آمين</button></div>
      </section>}

      {loading && <ListSkeleton count={3} />}
      {error && <p className="mb-3 rounded-xl border border-accent/30 bg-secondary p-3 text-xs leading-6 text-muted-foreground">{error}</p>}
      <div className="space-y-3">
        {duas.filter((dua) => dua.id !== activeDua?.id).map((dua) => <article key={dua.id} className={`rounded-2xl border p-5 ${dua.status === 'active' ? 'border-accent/50 bg-card' : 'border-card-border bg-card'}`}>
          <div className="mb-3 flex items-center justify-between gap-3"><span className="rounded-full bg-secondary px-2.5 py-1 text-[0.625rem] text-accent">{dua.kind === 'person' ? `دعاء لـ ${dua.beneficiaryName}` : 'دعاء للأمة'}</span><span className="text-[0.625rem] text-muted-foreground">{formatTurn(dua)}</span></div>
          <p className="font-arabic text-xl leading-[2]">{dua.prayerText}</p>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="text-[0.625rem] text-muted-foreground">شارك في الدعاء {dua.supporterCount} شخصًا · آمّن {dua.ameenCount}</span><button onClick={() => void ameen(dua)} className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-accent"><Heart size={15} />آمين</button></div>
        </article>)}
      </div>
      <Link href="/more" className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
    </div>
  );
}