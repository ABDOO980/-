import { ArrowRight, Bell, BellRing, CalendarDays, CheckCircle2, Moon, Send, Sparkles, Star, Sunrise, Sunset, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { apiFetch } from '@/lib/api-client';
import { subscribeToPushNotifications } from '@/lib/push-client';
import { loadNotifSettings, pullNotifSettings, pushNotifSettings, storeNotifSettings, type NotifSettings } from '@/lib/notif-settings';
import type { Preferences } from '@/lib/sakeena-api';

type BoolKey = { [K in keyof NotifSettings]: NotifSettings[K] extends boolean ? K : never }[keyof NotifSettings];
type Item = [BoolKey, string, string];
type Section = { id: string; title: string; hint: string; icon: LucideIcon; items: Item[] };

// Reminders are grouped by the part of the day they belong to.
const sections: Section[] = [
  { id: 'salah', title: 'الصلوات', hint: 'تهيّأ قبل الوقت ولبِّ النداء', icon: Bell, items: [
    ['prayerBefore', 'قبل الأذان بعشر دقائق', 'وقت كافٍ للوضوء والاستعداد'],
    ['prayerNow', 'عند دخول الوقت', 'مع فائدة قصيرة عن الصلاة']] },
  { id: 'morning', title: 'الفجر والصباح', hint: 'ابدأ يومك بذكر الله', icon: Sunrise, items: [
    ['morningStart', 'افتتاح أذكار الصباح', 'بعد الفجر بربع ساعة'],
    ['catchFajr', 'لحاق الفجر', 'قبل الشروق بنصف ساعة، لمن لم يفتح التطبيق منذ الفجر'],
    ['beforeDuha', 'فرصة الضحى', 'قبل دخول الظهر بنصف ساعة']] },
  { id: 'evening', title: 'العصر والمساء', hint: 'اختم نهارك بالذكر', icon: Sunset, items: [
    ['eveningStart', 'افتتاح أذكار المساء', 'بعد العصر بربع ساعة'],
    ['eveningEnd', 'آخر وقت للمساء', 'قبل المغرب بعشرين دقيقة']] },
  { id: 'night', title: 'الليل', hint: 'خلوة مع الله في ثلثه الأخير', icon: Moon, items: [
    ['qiyam', 'الثلث الأخير من الليل', 'يُحسب تلقائيًا من مغرب بلدك وفجرها'],
    ['qiyamStrong', 'تنبيه ملحّ للقيام', 'يبقى على الشاشة باهتزاز أقوى حتى تضغط عليه'],
    ['mulk', 'سورة الملك قبل النوم', 'بعد العشاء بساعة ونصف']] },
  { id: 'friday', title: 'الجمعة وليلتها', hint: 'يوم الاجتماع والدعاء', icon: Star, items: [
    ['salawat', 'الصلاة على النبي ﷺ', 'الخميس بعد المغرب، والجمعة قبل الصلاة بساعة'],
    ['kahf', 'سورة الكهف', 'بعد فجر الجمعة بنصف ساعة'],
    ['answerHour', 'ساعة الإجابة', 'قبل مغرب الجمعة بساعة']] },
  { id: 'occasions', title: 'المناسبات والأيام الفاضلة', hint: 'بحسب التقويم الهجري', icon: CalendarDays, items: [
    ['monThu', 'صيام الاثنين والخميس', 'مساء الأحد والأربعاء'],
    ['whiteDays', 'الأيام البيض', 'مساء ١٢ و١٣ و١٤ من كل شهر هجري'],
    ['arafah', 'يوم عرفة', 'قبله بليلة وفي صباحه'],
    ['ashura', 'تاسوعاء وعاشوراء', 'قبلهما بليلة'],
    ['eid', 'تكبير العيد', 'صباح الفطر والأضحى']] },
];

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-secondary'}`}>
      <span className={`absolute top-1 size-5 rounded-full bg-background shadow transition-all ${checked ? 'left-1' : 'left-6'}`} />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotifSettings>(loadNotifSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);

  // Bring in the copy saved on the server (it may be newer, e.g. from another device).
  useEffect(() => { pullNotifSettings().then((remote) => { setSettings((current) => { const merged = { ...remote, master: current.master }; storeNotifSettings(merged); return merged; }); }).catch(() => undefined); }, []);

  const update = useCallback((patch: Partial<NotifSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      storeNotifSettings(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => { pushNotifSettings(next).catch(() => setMessage('تعذّر حفظ التغيير على السيرفر. سيُحفظ على جهازك فقط.')); }, 500);
      return next;
    });
  }, []);

  // The server computes prayer times from the person's coordinates and time zone.
  const shareLocation = async () => {
    const position = await new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 8000, maximumAge: 3_600_000 });
    });
    if (!position) return false;
    const existing = await apiFetch<{ preferences: Preferences | null }>('/preferences').then((r) => r.preferences).catch(() => null);
    await apiFetch('/preferences', { method: 'PUT', body: JSON.stringify({
      preferredReciter: existing?.preferredReciter, theme: existing?.theme, prayerCity: existing?.prayerCity, prayerCountry: existing?.prayerCountry,
      prayerLat: position.coords.latitude, prayerLng: position.coords.longitude, notificationsEnabled: true,
    }) });
    return true;
  };

  const enable = async () => {
    setBusy(true); setMessage('');
    try {
      if (!('Notification' in window)) { setMessage('متصفحك لا يدعم الإشعارات. على الآيفون ثبّت التطبيق على الشاشة الرئيسية أولًا.'); return; }
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') { setMessage('لم تسمح بالإشعارات. يمكنك السماح بها من إعدادات المتصفح ثم المحاولة.'); return; }
      if (!(await subscribeToPushNotifications())) { setMessage('تعذّر التفعيل. تأكد أن السيرفر يعمل وأن مفاتيح الإشعارات (VAPID) مضبوطة عليه.'); return; }
      const located = await shareLocation().catch(() => false);
      update({ master: true });
      setMessage(located ? 'تم التفعيل. ستصلك التنبيهات بحسب مواقيت مكانك.' : 'تم التفعيل، لكن بدون موقعك ستُحسب المواقيت لمدينة افتراضية. اسمح بالموقع ثم أعد التفعيل.');
    } finally { setBusy(false); }
  };

  const sendTest = async () => {
    setBusy(true); setMessage('');
    try { await apiFetch('/notification-test', { method: 'POST' }); setMessage('أرسلنا تنبيهًا تجريبيًا، يصلك خلال لحظات.'); }
    catch { setMessage('تعذّر الإرسال. تأكد من تشغيل السيرفر ومفاتيح VAPID.'); }
    finally { setBusy(false); }
  };

  const active = settings.master && permission === 'granted';
  const enabledCount = (items: Item[]) => items.filter(([key]) => settings[key]).length;

  return (
    <div className="rise-in pb-8" dir="rtl">
      <header className="relative mb-5 flex min-h-14 items-center justify-center border-b border-border/50 pb-4">
        <Link href="/more" className="absolute right-0 grid size-9 place-items-center text-accent" aria-label="رجوع"><ArrowRight size={22} /></Link>
        <div className="text-center"><p className="mb-1 text-[0.6875rem] text-muted-foreground">تذكيرات هادئة في أوقاتها</p><h1 className="font-arabic text-[1.75rem] font-bold leading-tight">تنبيهات سَكينة</h1></div>
      </header>

      <section className="mb-5 rounded-[1.5rem] bg-primary p-5 text-primary-foreground" data-testid="card-notif-status">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">{active ? <BellRing size={24} /> : <Bell size={24} />}</span>
          <div className="min-w-0 flex-1">
            <strong className="block text-base">{active ? 'التنبيهات تعمل' : 'التنبيهات متوقفة'}</strong>
            <p className="mt-1 text-xs leading-5 opacity-85">{active ? 'تصلك حتى والتطبيق مغلق.' : 'فعّلها لتصلك التذكيرات في وقتها، حتى والتطبيق مغلق.'}</p>
          </div>
          {active && <Switch checked label="إيقاف كل التنبيهات" onChange={() => update({ master: false })} />}
        </div>
        {!active && <button type="button" onClick={() => void enable()} disabled={busy} className="mt-4 w-full rounded-full bg-accent py-3 text-sm font-bold text-accent-foreground disabled:opacity-60" data-testid="button-notif-enable">{busy ? 'جارٍ التفعيل...' : 'تفعيل التنبيهات'}</button>}
        {active && <button type="button" onClick={() => void sendTest()} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary-foreground/15 py-3 text-sm font-semibold disabled:opacity-60" data-testid="button-notif-test"><Send size={16} />أرسل تنبيهًا تجريبيًا</button>}
        {permission === 'denied' && <p className="mt-3 text-xs leading-5 opacity-85">الإشعارات محظورة لهذا الموقع. اسمح بها من إعدادات المتصفح.</p>}
        {message && <p className="mt-3 flex items-start gap-2 rounded-xl bg-primary-foreground/10 p-3 text-xs leading-5" role="status"><CheckCircle2 size={15} className="mt-0.5 shrink-0" />{message}</p>}
      </section>

      <div className={`space-y-4 ${active ? '' : 'pointer-events-none opacity-50'}`} aria-disabled={!active}>
        {sections.map(({ id, title, hint, icon: Icon, items }) => (
          <section key={id} className="overflow-hidden rounded-[1.5rem] border border-card-border bg-card" data-testid={`section-notif-${id}`}>
            <header className="flex items-center gap-3 border-b border-border/50 bg-secondary/40 px-4 py-3">
              <span className="grid size-9 place-items-center rounded-xl bg-background text-accent"><Icon size={18} /></span>
              <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">{title}</h2><p className="text-[0.6875rem] text-muted-foreground">{hint}</p></div>
              <span className="rounded-full bg-background px-2.5 py-1 font-mono-app text-[0.6875rem] text-accent">{enabledCount(items)}/{items.length}</span>
            </header>
            <div className="divide-y divide-border/40">
              {items.map(([key, label, detail]) => (
                <div key={key} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><small className="mt-0.5 block text-xs leading-5 text-muted-foreground">{detail}</small></div>
                  <Switch checked={settings[key]} label={label} onChange={(value) => update(key === 'qiyamStrong' && value ? { qiyamStrong: true, qiyam: true } : { [key]: value } as Partial<NotifSettings>)} />
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="overflow-hidden rounded-[1.5rem] border border-card-border bg-card" data-testid="section-notif-companion">
          <header className="flex items-center gap-3 border-b border-border/50 bg-secondary/40 px-4 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-background text-accent"><Sparkles size={18} /></span>
            <div className="min-w-0 flex-1"><h2 className="text-sm font-bold">رفيق يومك</h2><p className="text-[0.6875rem] text-muted-foreground">جرعات صغيرة تبقيك قريبًا</p></div>
          </header>
          <div className="divide-y divide-border/40">
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1"><strong className="block text-sm">إشراقة اليوم</strong><small className="mt-0.5 block text-xs leading-5 text-muted-foreground">آية أو حديث أو ذكر، يتغيّر كل يوم</small></div>
                <Switch checked={settings.dailyLight} label="إشراقة اليوم" onChange={(value) => update({ dailyLight: value })} />
              </div>
              {settings.dailyLight && (
                <label className="mt-3 flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-xs">وقت الوصول
                  <input type="time" value={settings.dailyLightTime} onChange={(e) => e.target.value && update({ dailyLightTime: e.target.value })} className="rounded-lg border border-card-border bg-background px-3 py-1.5 font-mono-app text-sm" data-testid="input-notif-daily-time" />
                </label>
              )}
            </div>
            <div className="px-4 py-3.5">
              <strong className="block text-sm">نفحات الذكر على مدار اليوم</strong>
              <small className="mt-0.5 block text-xs leading-5 text-muted-foreground">كم نفحة تريد يوميًا؟ تُوزَّع بين التاسعة صباحًا والتاسعة مساءً</small>
              <div className="mt-3 flex gap-2" role="radiogroup" aria-label="عدد نفحات الذكر">
                {[0, 3, 5, 8, 12].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={settings.doses === n} onClick={() => update({ doses: n })} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${settings.doses === n ? 'bg-primary text-primary-foreground' : 'border border-card-border bg-background'}`} data-testid={`button-notif-doses-${n}`}>{n === 0 ? 'بدون' : n}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1"><strong className="block text-sm">حافظ على سلسلتك</strong><small className="mt-0.5 block text-xs leading-5 text-muted-foreground">تنبيه واحد في الثامنة والنصف مساءً إن لم تفتح التطبيق اليوم</small></div>
              <Switch checked={settings.streak} label="حافظ على سلسلتك" onChange={(value) => update({ streak: value })} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1"><strong className="block text-sm">أكمِل ما بدأت</strong><small className="mt-0.5 block text-xs leading-5 text-muted-foreground">إن تركت أذكارًا قبل إتمامها، يذكّرك التطبيق بعد ساعات</small></div>
              <Switch checked={settings.resume} label="أكمل ما بدأت" onChange={(value) => update({ resume: value })} />
            </div>
          </div>
        </section>
      </div>
      <p className="mt-5 text-center text-[0.6875rem] leading-5 text-muted-foreground">تُحسب المواقيت من موقعك. وتعمل التنبيهات من سيرفر سَكينة، فهي تحتاج أن يكون السيرفر منشورًا.</p>
    </div>
  );
}
