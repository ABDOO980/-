import { ArrowRight, ChevronLeft, Headphones, Search, Share2, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { shareOrCopy, speakArabic, writeStorage } from '@/lib/sakeena';
import { useAddFavoriteHadith, useContentHadiths, useFavoriteHadiths, useRemoveFavoriteHadith } from '@/lib/sakeena-api';
import { hadiths as localHadiths } from './hadith-data';

export default function HadithPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const search = useSearch();
  // Deep link from the daily-hadith push notification: /hadith?id=N
  const deepLinkedId = Number(new URLSearchParams(search).get('id'));
  const { data: remoteHadiths } = useContentHadiths();
  const hadiths = remoteHadiths && remoteHadiths.length > 0 ? remoteHadiths : localHadiths;
  const [selected, setSelected] = useState(() => hadiths.find((item) => item.id === deepLinkedId) ?? hadiths[0]);
  const { data: favorites } = useFavoriteHadiths();
  const addFavorite = useAddFavoriteHadith();
  const removeFavorite = useRemoveFavoriteHadith();
  const filtered = hadiths.filter((hadith) => `${hadith.title} ${hadith.text}`.includes(query));
  const favoriteEntry = favorites?.find((item) => item.hadithId === String(selected.id));
  const toggleFavorite = () => {
    if (favoriteEntry) removeFavorite.mutate(favoriteEntry.id);
    else addFavorite.mutate({ hadithId: String(selected.id), hadithText: selected.text, source: selected.source });
  };
  const openAsQuoteCard = () => {
    writeStorage('sakeena.share-card.prefill', { text: selected.text, source: selected.source });
    setLocation('/share-card');
  };
  return (
    <div className="rise-in">
      <header className="mb-6 text-center"><p className="mb-1 text-xs text-muted-foreground">مختارات من الأربعين النووية</p><h1 className="font-arabic text-3xl font-bold">الحديث والسيرة</h1></header>
      <section className="mb-5 rounded-[1.7rem] bg-primary p-6 text-primary-foreground"><p className="text-xs text-accent">سنة اليوم</p><h2 className="mt-3 font-arabic text-3xl">تبسُّمك في وجه أخيك صدقة</h2><p className="mt-2 text-xs opacity-70">ابدأ بها مع أول من تلقاه اليوم.</p></section>
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-card-border bg-card px-4 py-3"><Search size={18} className="text-accent" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="ابحث في الأحاديث..." /></div>
       <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]"><div className="space-y-2">{filtered.map((hadith) => <button key={hadith.id} onClick={() => setSelected(hadith)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-right ${selected.id === hadith.id ? 'border-accent bg-secondary/60' : 'border-card-border bg-card'}`}><span className="grid size-9 place-items-center rounded-full bg-secondary font-mono-app text-xs text-accent">{hadith.id}</span><span className="flex-1"><strong className="block text-sm">{hadith.title}</strong><small className="mt-1 block line-clamp-1 text-[0.625rem] text-muted-foreground">{hadith.text}</small></span><ChevronLeft size={15} className="text-muted-foreground" /></button>)}</div><article className="rounded-[1.7rem] border border-accent/40 bg-card p-6"><div className="mb-5 flex items-center justify-between"><span className="text-xs text-accent">الحديث رقم {selected.id}</span><div className="flex gap-1"><button onClick={toggleFavorite} className={`rounded-lg p-2 ${favoriteEntry ? 'text-accent' : 'text-muted-foreground'}`} aria-label="حفظ الحديث في المفضلة" data-testid="button-favorite-hadith"><Star size={17} fill={favoriteEntry ? 'currentColor' : 'none'} /></button><button onClick={() => void shareOrCopy({ title: selected.title, text: selected.text })} className="rounded-lg p-2 text-muted-foreground" aria-label="مشاركة الحديث"><Share2 size={17} /></button></div></div><h2 className="font-arabic text-3xl">{selected.title}</h2><p className="mt-6 font-arabic text-2xl leading-[2.2]">{selected.text}</p><p className="mt-3 text-xs text-muted-foreground">{selected.source}</p><div className="mt-6 border-t border-border pt-5"><p className="text-xs text-accent">شرح مختصر</p><p className="mt-2 text-sm leading-7 text-muted-foreground">{selected.explanation}</p></div><button onClick={openAsQuoteCard} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-bold text-accent-foreground" data-testid="button-hadith-quote-card"><Share2 size={15} />بطاقة اقتباس جاهزة للمشاركة</button><button onClick={() => speakArabic(`${selected.title}. ${selected.text}. ${selected.explanation}`)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-xs text-muted-foreground"><Headphones size={15} />استماع إلى شرح الحديث</button></article></div>
      <Link href="/more" className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight size={16} />عودة إلى المزيد</Link>
    </div>
  );
}