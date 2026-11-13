import { ArrowRight, Headphones, Tv } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'wouter';
import { HlsPlayer } from './HlsPlayer';
import { useLiveStreams } from '@/lib/sakeena-api';
import { channelEmbedUrl, DEFAULT_CHANNELS, LIVE_SOURCES, searchLiveUrl, toEmbedUrl } from './embed';

const places = [
  { id: 'makkah' as const, title: 'المسجد الحرام', city: 'مكة المكرمة', search: 'بث مباشر الحرم المكي' },
  { id: 'madinah' as const, title: 'المسجد النبوي', city: 'المدينة المنورة', search: 'بث مباشر المسجد النبوي' },
];

export default function LivePage() {
  const { data } = useLiveStreams();
  const [hlsFailed, setHlsFailed] = useState<Record<string, boolean>>({});
  const fail = useCallback((id: string) => setHlsFailed((c) => ({ ...c, [id]: true })), []);
  return (
    <div className="rise-in mx-auto max-w-2xl pb-6" dir="rtl">
      <header className="mb-5 text-center"><p className="mb-1 text-xs text-muted-foreground">من الحرمين الشريفين</p><h1 className="font-arabic text-3xl font-bold">البث المباشر</h1></header>
      <div className="space-y-5">
        {places.map((place) => {
          const link = data?.[place.id] ?? null;
          // The admin's link wins; otherwise play the official channel inside the app.
          const adminEmbed = toEmbedUrl(link);
          const embed = adminEmbed ?? channelEmbedUrl(DEFAULT_CHANNELS[place.id]);
          const useHls = !adminEmbed && !hlsFailed[place.id];
          return (
            <article key={place.id} className="overflow-hidden rounded-[1.5rem] border border-card-border bg-card" data-testid={`card-live-${place.id}`}>
              <div className="flex items-center gap-3 p-4">
                <span className="grid size-11 place-items-center rounded-full bg-secondary text-accent"><Tv size={20} /></span>
                <div className="flex-1"><h2 className="text-base font-bold">{place.title}</h2><p className="text-xs text-muted-foreground">{place.city}</p></div>
                <span className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-[0.6875rem] font-bold text-destructive"><span className="size-1.5 animate-pulse rounded-full bg-destructive" />مباشر</span>
              </div>
              {useHls ? (
                <HlsPlayer sources={LIVE_SOURCES[place.id]} title={`بث ${place.title}`} onFail={() => fail(place.id)} />
              ) : (
                <div className="aspect-video w-full bg-black">
                  <iframe src={embed} title={`بث ${place.title}`} className="size-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" data-testid={`iframe-live-${place.id}`} />
                </div>
              )}
              <p className="px-4 py-3 text-center text-[0.6875rem] leading-5 text-muted-foreground">
                البث الرسمي لهيئة الإذاعة والتلفزيون السعودية. إن لم يظهر الفيديو، <a href={link ?? searchLiveUrl(place.search)} target="_blank" rel="noreferrer" className="underline" data-testid={`link-live-fallback-${place.id}`}>افتحه على يوتيوب</a>.
              </p>
            </article>
          );
        })}
      </div>
      <Link href="/radio" className="mt-5 flex items-center gap-3 rounded-[1.25rem] border border-card-border bg-card p-4 text-sm font-semibold" data-testid="link-live-to-radio"><Headphones size={18} className="text-accent" />تفضّل الاستماع فقط؟ افتح إذاعة القرآن</Link>
      <Link href="/more" className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
    </div>
  );
}
