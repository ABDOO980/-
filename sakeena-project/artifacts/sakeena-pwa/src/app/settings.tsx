import { TextSizeSettings } from '@/app/text-size-settings';
import { AdhanSettings } from '@/app/adhan';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { type SakeenaSettings, STORAGE_KEYS, DEFAULT_SETTINGS } from '@/lib/sakeena';
import { unsubscribeFromPushNotifications, subscribeToPushNotifications } from '@/lib/push-client';
import { useStoredState } from '@/app/common';
import { Header } from '@/app/layout';

export function SettingsPage() {
  const [settings, setSettings] = useStoredState<SakeenaSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const [theme, setTheme] = useStoredState<'light' | 'dark'>(STORAGE_KEYS.theme, 'dark');
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'granted' | 'denied'>(() => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'idle';
  });
  const requestNotifications = async (enabled: boolean) => {
    if (!enabled) {
      setSettings({ ...settings, notifications: false });
      void unsubscribeFromPushNotifications();
      return;
    }
    if (!('Notification' in window)) {
      setNotificationStatus('denied');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission === 'granted' ? 'granted' : 'denied');
    setSettings({ ...settings, notifications: permission === 'granted' });
    if (permission === 'granted') void subscribeToPushNotifications();
  };
  return <div className="rise-in max-w-2xl"><Header eyebrow="سَكينة" title="الإعدادات" /><section className="rounded-[2rem] border border-card-border bg-card p-6 md:p-8"><h2 className="mb-6 text-lg font-semibold">مواقيت الصلاة</h2><div className="space-y-5"><label className="block"><span className="mb-2 block text-xs text-muted-foreground">المدينة</span><input value={settings.city} onChange={(event) => setSettings({ ...settings, city: event.target.value })} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" data-testid="input-settings-city" /></label><label className="block"><span className="mb-2 block text-xs text-muted-foreground">الدولة</span><input value={settings.country} onChange={(event) => setSettings({ ...settings, country: event.target.value })} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" data-testid="input-settings-country" /></label><label className="block"><span className="mb-2 block text-xs text-muted-foreground">طريقة الحساب</span><select value={settings.method} onChange={(event) => setSettings({ ...settings, method: event.target.value })} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" data-testid="select-calculation-method"><option value="5">الهيئة المصرية العامة للمساحة</option><option value="4">أم القرى، مكة المكرمة</option><option value="2">الجمعية الإسلامية لأمريكا الشمالية ISNA</option><option value="3">رابطة العالم الإسلامي MWL</option></select></label><label className="flex items-center justify-between rounded-xl bg-secondary/60 p-4 text-sm"><span><strong className="block">تذكيرات الصلاة</strong><small className="mt-1 block text-xs text-muted-foreground">{notificationStatus === 'granted' ? 'تم السماح بإشعارات هذا الجهاز' : notificationStatus === 'denied' ? 'لم يتم السماح بالإشعارات' : 'اطلب الإذن لتفعيل التنبيهات'}</small><small className="mt-2 block text-[0.6875rem] leading-5 text-muted-foreground">إشعار قبل الصلاة بـ ١٠ دقائق، وإشعار عند الأذان مع فائدة الصلاة، وتذكير بقيام الليل في ثلثه الأخير، وتذكير بصيام الاثنين والخميس وليلة الجمعة.</small></span><input type="checkbox" checked={settings.notifications} onChange={(event) => void requestNotifications(event.target.checked)} className="size-4 accent-primary" data-testid="input-settings-notifications" /></label></div></section><section className="mt-5 rounded-[2rem] border border-card-border bg-card p-6 md:p-8"><h2 className="mb-5 text-lg font-semibold">المظهر</h2><div className="flex items-center justify-between rounded-xl bg-secondary/60 p-4 text-sm"><span><strong className="block">الوضع {theme === 'light' ? 'الفاتح' : 'الداكن'}</strong><small className="mt-1 block text-xs text-muted-foreground">يُحفظ اختيارك على هذا الجهاز</small></span><button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold" aria-label="تبديل الوضع الفاتح والداكن" data-testid="button-settings-theme">{theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}</button></div></section><TextSizeSettings /><Link href="/notifications" className="mt-5 flex items-center justify-between rounded-[2rem] border border-accent bg-card p-5 text-sm font-semibold" data-testid="link-notification-settings">تخصيص التنبيهات والتذكيرات<span className="text-accent">←</span></Link><AdhanSettings />
      <AdhanSettings /><Link href="/admin" className="mt-4 block text-center text-xs text-muted-foreground underline" data-testid="link-admin">لوحة التحكم (للمشرف)</Link><Link href="/backup" className="mt-5 flex items-center justify-between rounded-2xl border border-card-border bg-card p-4 text-sm"><span>تصدير أو استيراد بياناتك</span><ChevronLeft size={17} className="text-accent" /></Link><p className="mt-5 text-center text-xs text-muted-foreground">تُحفظ الإعدادات تلقائياً على هذا الجهاز.</p></div>;
}
