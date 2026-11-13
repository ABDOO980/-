import { Bell, BookOpen, ChevronLeft, Eye, EyeOff, HelpCircle, LayoutDashboard, LogOut, Tv, Megaphone, MessageSquare, Scale, Timer, Trash2, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { quizCategories } from '@/features/quiz/quiz-data';
import { API_BASE } from '@/lib/api-base';

type GroupDua = { id: number; kind: string; beneficiaryName: string | null; prayerText: string; hidden: boolean; createdAt: string };
type Stats = Record<string, number>;
type Counter = { key: string; label: string; count: number; target: number | null; periodKey: string | null };
type AdminHadith = { id: number; title: string; text: string; source: string; explanation: string };
type AdminQuestion = { id: number; category: string; difficulty: string; question: string; choices: string[]; correct: number };
type AdminFatwa = { id: number; category: string; question: string; answer: string; source: string };
type AdminAnnouncement = { id: number; title: string; body: string; active: boolean; createdAt: string };
type Tab = 'overview' | 'live' | 'messages' | 'quiz' | 'hadith' | 'fatwa' | 'duas' | 'counters';

const tabs: [Tab, string, LucideIcon][] = [
  ['overview', 'نظرة عامة', LayoutDashboard], ['live', 'البث المباشر', Tv], ['messages', 'رسائل', Megaphone], ['quiz', 'المسابقات', HelpCircle], ['hadith', 'الأحاديث', BookOpen],
  ['fatwa', 'الفتاوى', Scale], ['duas', 'الأدعية', MessageSquare], ['counters', 'العدادات', Timer],
];

const inputCls = 'w-full rounded-xl border border-input bg-background px-3 py-3 text-sm';
const btnCls = 'rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50';
const Card = ({ title, children }: { title?: string; children: ReactNode }) => (
  <section className="mb-4 rounded-[1.25rem] border border-card-border bg-card p-4">{title && <h2 className="mb-3 text-sm font-bold text-accent">{title}</h2>}{children}</section>
);
const Row = ({ children, faded }: { children: ReactNode; faded?: boolean }) => <div className={`mb-2 rounded-xl border border-card-border bg-background p-3 ${faded ? 'opacity-50' : ''}`}>{children}</div>;

export default function AdminPage() {
  const [key, setKey] = useState(() => sessionStorage.getItem('sakeena.admin-key') ?? '');
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [duas, setDuas] = useState<GroupDua[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [hadiths, setHadiths] = useState<AdminHadith[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [fatwas, setFatwas] = useState<AdminFatwa[]>([]);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [live, setLive] = useState({ makkah: '', madinah: '' });
  const [msg, setMsg] = useState({ title: '', body: '', push: true, inApp: true });
  const [newHadith, setNewHadith] = useState({ title: '', text: '', source: '', explanation: '' });
  const [newQuestion, setNewQuestion] = useState({ category: quizCategories[0]?.id ?? 'fiqh', difficulty: 'easy', question: '', choices: ['', '', '', ''], correct: 0 });
  const [newFatwa, setNewFatwa] = useState({ category: '', question: '', answer: '', source: '' });

  const call = async (path: string, init?: RequestInit) => {
    const unreachable = 'تعذّر الوصول إلى السيرفر. تأكد أن السيرفر منشور ويعمل (انظر ملف DEPLOY-AR.md).';
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-admin-key': key, ...init?.headers } });
    } catch { throw new Error(unreachable); }
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      if (!body) throw new Error(unreachable);
      throw new Error(body.message ?? 'فشل الطلب');
    }
    return body;
  };
  const run = async (action: () => Promise<void>, success?: string) => {
    setBusy(true); setNotice(null);
    try { await action(); if (success) setNotice(success); } catch (e) { setNotice((e as Error).message); } finally { setBusy(false); }
  };

  const load = async () => {
    try {
      const [duasRes, countersRes, statsRes, hadithsRes, questionsRes, fatwasRes, annRes] = await Promise.all([call('/admin/duas'), call('/admin/counters'), call('/admin/stats'), call('/admin/hadiths'), call('/admin/quiz-questions'), call('/admin/fatwas'), call('/admin/announcements').catch(() => ({ announcements: [] }))]);
      setStats(statsRes); setHadiths(hadithsRes.hadiths); setQuestions(questionsRes.questions); setFatwas(fatwasRes.fatwas);
      setDuas(duasRes.duas); setCounters(countersRes.counters); setAnnouncements(annRes.announcements);
      fetch(`${API_BASE}/api/live-streams`).then((r) => r.json()).then((j) => setLive({ makkah: j.streams?.makkah ?? '', madinah: j.streams?.madinah ?? '' })).catch(() => undefined);
      setUnlocked(true); sessionStorage.setItem('sakeena.admin-key', key); setError(null);
    } catch (e) { setError((e as Error).message); setUnlocked(false); }
  };
  const logout = () => { sessionStorage.removeItem('sakeena.admin-key'); setKey(''); setUnlocked(false); };

  const sendMessage = () => run(async () => {
    if (!msg.title.trim() || !msg.body.trim()) throw new Error('اكتب العنوان والنص.');
    if (!msg.push && !msg.inApp) throw new Error('اختر طريقة واحدة للإرسال على الأقل.');
    if (!window.confirm('إرسال هذه الرسالة لكل المستخدمين؟')) return;
    let pushed = 0;
    if (msg.push) pushed = (await call('/admin/broadcast', { method: 'POST', body: JSON.stringify({ title: msg.title, body: msg.body }) })).sentToSubscriptions;
    if (msg.inApp) { const r = await call('/admin/announcements', { method: 'POST', body: JSON.stringify({ title: msg.title, body: msg.body }) }); setAnnouncements((c) => [r.announcement, ...c]); }
    setMsg({ ...msg, title: '', body: '' });
    setNotice(`تم الإرسال${msg.push ? ` · إشعار إلى ${pushed} جهاز` : ''}${msg.inApp ? ' · رسالة داخل التطبيق' : ''}`);
  });
  const toggleAnnouncement = (a: AdminAnnouncement) => run(async () => { await call(`/admin/announcements/${a.id}`, { method: 'PATCH', body: JSON.stringify({ active: !a.active }) }); setAnnouncements((c) => c.map((x) => x.id === a.id ? { ...x, active: !a.active } : x)); });
  const deleteAnnouncement = (id: number) => run(async () => { if (!window.confirm('حذف هذه الرسالة؟')) return; await call(`/admin/announcements/${id}`, { method: 'DELETE' }); setAnnouncements((c) => c.filter((x) => x.id !== id)); });

  const addQuestion = () => run(async () => {
    const choices = newQuestion.choices.map((c) => c.trim()).filter(Boolean);
    if (!newQuestion.question.trim() || choices.length < 2) throw new Error('اكتب السؤال وخيارين على الأقل.');
    if (!newQuestion.choices[newQuestion.correct]?.trim()) throw new Error('اختر إجابة صحيحة من الخيارات المكتوبة.');
    const correct = newQuestion.choices.slice(0, newQuestion.correct).filter((c) => c.trim()).length;
    const r = await call('/admin/quiz-questions', { method: 'POST', body: JSON.stringify({ ...newQuestion, choices, correct }) });
    setQuestions((c) => [...c, r.question]); setNewQuestion({ ...newQuestion, question: '', choices: ['', '', '', ''], correct: 0 });
  }, 'تمت إضافة السؤال');
  const deleteQuestion = (id: number) => run(async () => { if (!window.confirm('حذف هذا السؤال؟')) return; await call(`/admin/quiz-questions/${id}`, { method: 'DELETE' }); setQuestions((c) => c.filter((q) => q.id !== id)); });

  const addHadith = () => run(async () => {
    if (!newHadith.title.trim() || !newHadith.text.trim() || !newHadith.source.trim()) throw new Error('العنوان والنص والمصدر مطلوبة.');
    const r = await call('/admin/hadiths', { method: 'POST', body: JSON.stringify(newHadith) });
    setHadiths((c) => [...c, r.hadith]); setNewHadith({ title: '', text: '', source: '', explanation: '' });
  }, 'تمت إضافة الحديث');
  const deleteHadith = (id: number) => run(async () => { if (!window.confirm('حذف هذا الحديث؟')) return; await call(`/admin/hadiths/${id}`, { method: 'DELETE' }); setHadiths((c) => c.filter((h) => h.id !== id)); });

  const addFatwa = () => run(async () => {
    if (!newFatwa.category.trim() || !newFatwa.question.trim() || !newFatwa.answer.trim() || !newFatwa.source.trim()) throw new Error('كل الحقول مطلوبة بما فيها المصدر.');
    const r = await call('/admin/fatwas', { method: 'POST', body: JSON.stringify(newFatwa) });
    setFatwas((c) => [...c, r.fatwa]); setNewFatwa({ category: '', question: '', answer: '', source: '' });
  }, 'تمت إضافة الفتوى');
  const deleteFatwa = (id: number) => run(async () => { if (!window.confirm('حذف هذه الفتوى؟')) return; await call(`/admin/fatwas/${id}`, { method: 'DELETE' }); setFatwas((c) => c.filter((f) => f.id !== id)); });

  const saveLive = () => run(async () => { const r = await call('/admin/live-streams', { method: 'PUT', body: JSON.stringify(live) }); setLive({ makkah: r.streams.makkah ?? '', madinah: r.streams.madinah ?? '' }); }, 'تم حفظ روابط البث');
  const toggleHide = (dua: GroupDua) => run(async () => { await call(`/admin/duas/${dua.id}/hide`, { method: 'PATCH', body: JSON.stringify({ hidden: !dua.hidden }) }); setDuas((c) => c.map((d) => d.id === dua.id ? { ...d, hidden: !d.hidden } : d)); });
  const setCounter = (counterKey: string, value: number) => run(async () => { await call(`/admin/counters/${counterKey}`, { method: 'PATCH', body: JSON.stringify({ count: value }) }); setCounters((c) => c.map((x) => x.key === counterKey ? { ...x, count: value } : x)); }, 'تم حفظ العداد');

  if (!unlocked) {
    return (
      <div dir="rtl" className="rise-in mx-auto max-w-sm pt-10">
        <div className="mb-6 text-center"><span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><LayoutDashboard size={26} /></span><h1 className="font-arabic text-3xl font-bold">لوحة التحكم</h1><p className="mt-1 text-xs text-muted-foreground">للمشرف فقط</p></div>
        <input value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void load()} placeholder="مفتاح الإدارة" type="password" className={`${inputCls} mb-3`} data-testid="input-admin-key" />
        <button onClick={() => void load()} className={`${btnCls} w-full`} data-testid="button-admin-login">دخول</button>
        {error && <p className="mt-3 text-center text-sm text-destructive" role="alert">{error}</p>}
        <Link href="/more" className="mt-6 block text-center text-xs text-muted-foreground">العودة للتطبيق</Link>
      </div>
    );
  }

  const statCards: [string, number | undefined][] = stats ? [['المستخدمون', stats.users], ['نشطون اليوم', stats.activeLast24h], ['نشطون هذا الأسبوع', stats.activeLast7d], ['أجهزة الإشعارات', stats.pushSubscriptions], ['أدعية مرسلة', stats.duasSubmitted], ['غرف المسابقات', stats.quizRoomsCreated], ['مشاركات منافسة الجمعة', stats.weeklyChallengeEntries]] : [];

  return (
    <div dir="rtl" className="rise-in pb-8">
      <header className="mb-4 flex items-center justify-between">
        <div><h1 className="font-arabic text-3xl font-bold">لوحة التحكم</h1><p className="text-xs text-muted-foreground">أدِر محتوى سَكينة ورسائلها</p></div>
        <button onClick={logout} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs" data-testid="button-admin-logout"><LogOut size={14} />خروج</button>
      </header>
      <nav className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2" aria-label="أقسام لوحة التحكم">
        {tabs.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => { setTab(id); setNotice(null); }} className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold ${tab === id ? 'bg-primary text-primary-foreground' : 'border border-card-border bg-card'}`} data-testid={`tab-admin-${id}`}><Icon size={14} />{label}</button>)}
      </nav>
      {notice && <p className="mb-4 rounded-xl bg-secondary p-3 text-center text-sm" role="status" data-testid="text-admin-notice">{notice}</p>}

      {tab === 'overview' && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">{statCards.map(([label, value]) => <div key={label} className="rounded-2xl border border-card-border bg-card p-4"><strong className="block text-3xl text-accent">{(value ?? 0).toLocaleString('ar-EG')}</strong><small className="text-xs text-muted-foreground">{label}</small></div>)}</div>
          <button onClick={() => void load()} className={`${btnCls} w-full`}>تحديث الأرقام</button>
          <div className="mt-4 grid gap-2">{tabs.slice(1).map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className="flex items-center justify-between rounded-xl border border-card-border bg-card p-4 text-sm"><span className="flex items-center gap-3"><Icon size={18} className="text-accent" />{label}</span><ChevronLeft size={16} className="text-muted-foreground" /></button>)}</div>
        </>
      )}

      {tab === 'live' && (
        <Card title="روابط البث المباشر للحرمين">
          <p className="mb-3 text-xs leading-6 text-muted-foreground">الصق رابط البث من يوتيوب (رابط الفيديو المباشر أو رابط القناة الذي يحتوي على channel/UC...). اختياري: إن تركته فارغًا يعرض التطبيق القناة الرسمية تلقائيًا (قناة القرآن الكريم لمكة، وقناة السنة النبوية للمدينة).</p>
          <label className="mb-3 block text-xs font-semibold">بث مكة المكرمة<input value={live.makkah} onChange={(e) => setLive({ ...live, makkah: e.target.value })} dir="ltr" placeholder="https://www.youtube.com/watch?v=..." className={`${inputCls} mt-1`} data-testid="input-admin-live-makkah" /></label>
          <label className="mb-4 block text-xs font-semibold">بث المدينة المنورة<input value={live.madinah} onChange={(e) => setLive({ ...live, madinah: e.target.value })} dir="ltr" placeholder="https://www.youtube.com/watch?v=..." className={`${inputCls} mt-1`} data-testid="input-admin-live-madinah" /></label>
          <button onClick={() => void saveLive()} disabled={busy} className={`${btnCls} w-full`} data-testid="button-admin-live-save">حفظ</button>
          <p className="mt-3 text-[0.6875rem] leading-5 text-muted-foreground">ملاحظة: يتغير رابط فيديو البث المباشر أحيانًا عند إعادة تشغيل البث، فإن توقف البث اضبط الرابط من جديد، أو استخدم رابط القناة.</p>
        </Card>
      )}

      {tab === 'messages' && (
        <>
          <Card title="رسالة لكل المستخدمين">
            <input value={msg.title} onChange={(e) => setMsg({ ...msg, title: e.target.value })} placeholder="العنوان" maxLength={80} className={`${inputCls} mb-2`} data-testid="input-admin-msg-title" />
            <textarea value={msg.body} onChange={(e) => setMsg({ ...msg, body: e.target.value })} placeholder="نص الرسالة" rows={4} maxLength={300} className={`${inputCls} mb-3`} data-testid="input-admin-msg-body" />
            <label className="mb-2 flex items-center gap-3 text-sm"><input type="checkbox" checked={msg.inApp} onChange={(e) => setMsg({ ...msg, inApp: e.target.checked })} className="size-4 accent-primary" />تظهر داخل التطبيق (لكل من يفتحه)</label>
            <label className="mb-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={msg.push} onChange={(e) => setMsg({ ...msg, push: e.target.checked })} className="size-4 accent-primary" /><span className="flex items-center gap-1.5"><Bell size={14} />إشعار على الهاتف (لمن فعّل الإشعارات)</span></label>
            <button onClick={() => void sendMessage()} disabled={busy} className={`${btnCls} w-full`} data-testid="button-admin-send">إرسال</button>
          </Card>
          <Card title={`الرسائل السابقة (${announcements.length})`}>
            {announcements.map((a) => (
              <Row key={a.id} faded={!a.active}>
                <strong className="block text-sm">{a.title}</strong><p className="my-1 text-xs leading-6 text-muted-foreground">{a.body}</p>
                <div className="flex items-center gap-2 text-xs"><span className="flex-1 text-muted-foreground">{new Date(a.createdAt).toLocaleDateString('ar-EG')} · {a.active ? 'ظاهرة' : 'مخفية'}</span>
                  <button onClick={() => void toggleAnnouncement(a)} className="rounded-lg border border-border px-3 py-1.5">{a.active ? 'إخفاء' : 'إظهار'}</button>
                  <button onClick={() => void deleteAnnouncement(a.id)} className="rounded-lg border border-border p-1.5 text-destructive" aria-label="حذف"><Trash2 size={14} /></button></div>
              </Row>
            ))}
            {announcements.length === 0 && <p className="text-center text-xs text-muted-foreground">لا توجد رسائل بعد.</p>}
          </Card>
        </>
      )}

      {tab === 'quiz' && (
        <>
          <Card title="إضافة سؤال للمسابقة">
            <select value={newQuestion.category} onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })} className={`${inputCls} mb-2`}>{quizCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            <select value={newQuestion.difficulty} onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })} className={`${inputCls} mb-2`}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select>
            <textarea value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} placeholder="نص السؤال" rows={2} className={`${inputCls} mb-3`} data-testid="input-admin-question" />
            {newQuestion.choices.map((choice, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <input type="radio" name="correct" checked={newQuestion.correct === i} onChange={() => setNewQuestion({ ...newQuestion, correct: i })} className="size-4 accent-primary" aria-label={`الخيار ${i + 1} هو الصحيح`} />
                <input value={choice} onChange={(e) => setNewQuestion({ ...newQuestion, choices: newQuestion.choices.map((c, j) => j === i ? e.target.value : c) })} placeholder={`الخيار ${i + 1}`} className={inputCls} data-testid={`input-admin-choice-${i}`} />
              </div>
            ))}
            <p className="mb-3 text-[0.6875rem] text-muted-foreground">اضغط الدائرة بجوار الإجابة الصحيحة.</p>
            <button onClick={() => void addQuestion()} disabled={busy} className={`${btnCls} w-full`} data-testid="button-admin-add-question">إضافة السؤال</button>
          </Card>
          <Card title={`أسئلة أضفتها (${questions.length})`}>
            {questions.map((q) => <Row key={q.id}><p className="mb-1 text-sm font-semibold">{q.question}</p><p className="mb-2 text-xs text-muted-foreground">{q.choices.map((c, i) => i === q.correct ? `✓ ${c}` : c).join(' · ')}</p><button onClick={() => void deleteQuestion(q.id)} className="text-xs text-destructive">حذف</button></Row>)}
            {questions.length === 0 && <p className="text-center text-xs text-muted-foreground">لم تضف أسئلة بعد.</p>}
          </Card>
        </>
      )}

      {tab === 'hadith' && (
        <>
          <Card title="إضافة حديث">
            <input value={newHadith.title} onChange={(e) => setNewHadith({ ...newHadith, title: e.target.value })} placeholder="العنوان" className={`${inputCls} mb-2`} />
            <textarea value={newHadith.text} onChange={(e) => setNewHadith({ ...newHadith, text: e.target.value })} placeholder="نص الحديث" rows={3} className={`${inputCls} mb-2`} />
            <input value={newHadith.source} onChange={(e) => setNewHadith({ ...newHadith, source: e.target.value })} placeholder="المصدر (مثل: رواه البخاري)" className={`${inputCls} mb-2`} />
            <textarea value={newHadith.explanation} onChange={(e) => setNewHadith({ ...newHadith, explanation: e.target.value })} placeholder="شرح مختصر (اختياري)" rows={2} className={`${inputCls} mb-3`} />
            <button onClick={() => void addHadith()} disabled={busy} className={`${btnCls} w-full`}>إضافة الحديث</button>
          </Card>
          <Card title={`الأحاديث (${hadiths.length})`}>
            {hadiths.map((h) => <Row key={h.id}><strong className="block text-sm">{h.title}</strong><p className="my-1 text-xs leading-6 text-muted-foreground">{h.text}</p><button onClick={() => void deleteHadith(h.id)} className="text-xs text-destructive">حذف</button></Row>)}
          </Card>
        </>
      )}

      {tab === 'fatwa' && (
        <>
          <Card title="إضافة فتوى">
            <input value={newFatwa.category} onChange={(e) => setNewFatwa({ ...newFatwa, category: e.target.value })} placeholder="التصنيف (الصلاة، الصيام...)" className={`${inputCls} mb-2`} />
            <textarea value={newFatwa.question} onChange={(e) => setNewFatwa({ ...newFatwa, question: e.target.value })} placeholder="السؤال" rows={2} className={`${inputCls} mb-2`} />
            <textarea value={newFatwa.answer} onChange={(e) => setNewFatwa({ ...newFatwa, answer: e.target.value })} placeholder="الجواب" rows={4} className={`${inputCls} mb-2`} />
            <input value={newFatwa.source} onChange={(e) => setNewFatwa({ ...newFatwa, source: e.target.value })} placeholder="المصدر (مطلوب للتوثيق)" className={`${inputCls} mb-3`} />
            <button onClick={() => void addFatwa()} disabled={busy} className={`${btnCls} w-full`}>إضافة الفتوى</button>
          </Card>
          <Card title={`الفتاوى (${fatwas.length})`}>
            {fatwas.map((f) => <Row key={f.id}><p className="text-[0.6875rem] text-accent">{f.category}</p><strong className="block text-sm">{f.question}</strong><p className="my-1 text-xs leading-6 text-muted-foreground">{f.answer}</p><button onClick={() => void deleteFatwa(f.id)} className="text-xs text-destructive">حذف</button></Row>)}
          </Card>
        </>
      )}

      {tab === 'duas' && (
        <Card title={`الأدعية المرسلة (${duas.length})`}>
          {duas.map((d) => <Row key={d.id} faded={d.hidden}><p className="mb-1 text-[0.6875rem] text-muted-foreground">{d.kind === 'person' ? `لـ: ${d.beneficiaryName}` : 'دعاء للأمة'} · {new Date(d.createdAt).toLocaleString('ar-EG')}</p><p className="mb-2 text-sm leading-7">{d.prayerText}</p><button onClick={() => void toggleHide(d)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs">{d.hidden ? <><Eye size={13} />إظهار</> : <><EyeOff size={13} />إخفاء</>}</button></Row>)}
          {duas.length === 0 && <p className="text-center text-xs text-muted-foreground">لا توجد أدعية بعد.</p>}
        </Card>
      )}

      {tab === 'counters' && (
        <Card title="العدادات الجماعية">
          {counters.map((c) => <Row key={c.key}><div className="flex items-center gap-3"><span className="min-w-0 flex-1 text-sm">{c.label}<small className="block text-[0.6875rem] text-muted-foreground">{c.key}</small></span><input type="number" defaultValue={c.count} onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== c.count) void setCounter(c.key, v); }} className="w-28 rounded-xl border border-input bg-background px-3 py-2 text-center text-sm" /></div></Row>)}
          <p className="mt-2 text-[0.6875rem] text-muted-foreground">يُحفظ الرقم عند الخروج من الخانة.</p>
        </Card>
      )}
    </div>
  );
}
