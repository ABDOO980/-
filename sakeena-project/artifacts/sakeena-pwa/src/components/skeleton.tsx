// Calm placeholders shown while content loads, in the app's own colours.
// They pulse gently (and stand still for people who prefer reduced motion).
function Block({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-secondary/70 motion-reduce:animate-none ${className}`} />;
}

export const Skeleton = Block;

export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-[1.25rem] border border-card-border bg-card p-4" aria-hidden="true">
      <Block className="mb-3 h-5 w-2/5" />
      {Array.from({ length: lines }, (_, i) => <Block key={i} className={`mb-2 h-3.5 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />)}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="جارٍ التحميل">
      {Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}
      <span className="sr-only">جارٍ التحميل</span>
    </div>
  );
}

// A page-shaped placeholder: title, intro line, then a few cards.
export function PageSkeleton() {
  return (
    <div className="pb-6" role="status" aria-label="جارٍ التحميل">
      <div className="mb-5 flex flex-col items-center gap-3 border-b border-border/50 pb-4">
        <Block className="h-8 w-40" />
        <Block className="h-3 w-56 max-w-full" />
      </div>
      <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}</div>
      <span className="sr-only">جارٍ التحميل</span>
    </div>
  );
}

// Lines of text, for a surah that is being fetched.
export function VerseSkeleton() {
  const widths = ['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3'];
  return (
    <div className="rounded-2xl border border-border bg-card p-6" role="status" aria-label="جارٍ تحميل السورة">
      {widths.map((width, i) => <Block key={i} className={`mb-4 h-5 ${width} last:mb-0`} />)}
      <span className="sr-only">جارٍ تحميل السورة</span>
    </div>
  );
}
