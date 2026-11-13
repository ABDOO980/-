import { CheckCircle2, LocateFixed, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateQiblaBearing } from '@/lib/sakeena';
import { Header } from '@/app/layout';

const KAABA = { lat: 21.4225, lng: 39.8262 };
const ALIGN_TOLERANCE = 4; // degrees

type Coords = { latitude: number; longitude: number };
type OrientationEvt = DeviceOrientationEvent & { webkitCompassHeading?: number };

const norm = (deg: number) => ((deg % 360) + 360) % 360;
// shortest signed difference a - b in (-180, 180]
const diff = (a: number, b: number) => ((a - b + 540) % 360) - 180;

function distanceKm(from: Coords) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(KAABA.lat - from.latitude);
  const dLng = rad(KAABA.lng - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(KAABA.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function Qibla() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationState, setLocationState] = useState<'loading' | 'ok' | 'failed'>('loading');
  const [heading, setHeading] = useState<number | null>(null);
  const [sensor, setSensor] = useState<'idle' | 'active' | 'denied' | 'unsupported'>('idle');
  const smoothed = useRef<number | null>(null);
  const gotAbsolute = useRef(false);
  const wasAligned = useRef(false);

  const locate = useCallback(() => {
    setLocationState('loading');
    if (!navigator.geolocation) { setLocationState('failed'); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => { setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocationState('ok'); },
      () => setLocationState('failed'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);
  useEffect(() => { locate(); }, [locate]);

  const onOrientation = useCallback((event: Event) => {
    const e = event as OrientationEvt;
    let value: number | null = null;
    if (typeof e.webkitCompassHeading === 'number') value = e.webkitCompassHeading; // iOS: true compass heading
    else if (event.type === 'deviceorientationabsolute' && typeof e.alpha === 'number') { gotAbsolute.current = true; value = norm(360 - e.alpha); }
    else if (event.type === 'deviceorientation' && !gotAbsolute.current && e.absolute && typeof e.alpha === 'number') value = norm(360 - e.alpha);
    if (value === null) return;
    // low-pass filter, wrap-safe, so the dial does not jitter
    const prev = smoothed.current;
    const next = prev === null ? value : norm(prev + diff(value, prev) * 0.2);
    smoothed.current = next;
    setHeading(next);
    setSensor('active');
  }, []);

  const startSensor = useCallback(async () => {
    const Orientation = window.DeviceOrientationEvent as (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }) | undefined;
    if (!Orientation) { setSensor('unsupported'); return; }
    if (typeof Orientation.requestPermission === 'function') {
      try {
        if ((await Orientation.requestPermission()) !== 'granted') { setSensor('denied'); return; }
      } catch { setSensor('denied'); return; }
    }
    window.addEventListener('deviceorientationabsolute', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);
    window.setTimeout(() => setSensor((s) => (s === 'idle' ? 'unsupported' : s)), 2500);
  }, [onOrientation]);

  useEffect(() => {
    const Orientation = window.DeviceOrientationEvent as (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }) | undefined;
    if (Orientation && typeof Orientation.requestPermission !== 'function') void startSensor(); // Android/desktop: no permission prompt
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrientation, true);
      window.removeEventListener('deviceorientation', onOrientation, true);
    };
  }, [onOrientation, startSensor]);

  const bearing = coords ? calculateQiblaBearing(coords.latitude, coords.longitude) : null;
  const dialRotation = heading === null ? 0 : -heading; // dial turns so N points north
  const error = bearing !== null && heading !== null ? diff(bearing, heading) : null; // + = turn right
  const aligned = error !== null && Math.abs(error) <= ALIGN_TOLERANCE;

  useEffect(() => {
    if (aligned && !wasAligned.current) navigator.vibrate?.(60);
    wasAligned.current = aligned;
  }, [aligned]);

  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const cardinals: [string, number][] = [['ش', 0], ['شرق', 90], ['ج', 180], ['غرب', 270]];

  return (
    <div className="rise-in pb-4">
      <Header eyebrow="دليلك إلى البيت الحرام" title="اتجاه القبلة" />

      <div className={`mb-4 rounded-2xl p-4 text-center transition-colors ${aligned ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`} role="status" data-testid="text-qibla-status">
        {aligned ? (
          <p className="flex items-center justify-center gap-2 text-lg font-bold"><CheckCircle2 size={22} />أنت في اتجاه القبلة</p>
        ) : error !== null ? (
          <p className="text-lg font-bold">{error > 0 ? `لُفّ يمينًا ${Math.round(Math.abs(error))}°` : `لُفّ يسارًا ${Math.round(Math.abs(error))}°`}</p>
        ) : bearing !== null ? (
          <p className="text-sm">القبلة على بُعد <strong className="font-mono-app text-base" data-testid="text-qibla-bearing">{Math.round(bearing)}°</strong> من الشمال. فعّل البوصلة لتتبّعها.</p>
        ) : (
          <p className="text-sm">{locationState === 'loading' ? 'جارٍ تحديد موقعك...' : 'نحتاج موقعك لحساب الاتجاه'}</p>
        )}
      </div>

      <section className="mx-auto mb-5 w-full max-w-[360px]" data-testid="card-qibla-compass" aria-label="بوصلة القبلة">
        <svg viewBox="0 0 300 300" className="w-full">
          {/* fixed pointer showing the phone's forward direction */}
          <polygon points="150,4 140,24 160,24" className={aligned ? 'text-accent' : 'text-primary'} fill="currentColor" />
          <g style={{ transform: `rotate(${dialRotation}deg)`, transformOrigin: '150px 150px', transition: 'transform 0.15s linear' }}>
            <circle cx="150" cy="150" r="118" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-border" />
            <circle cx="150" cy="150" r="96" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" opacity="0.6" />
            {ticks.map((deg) => (
              <line key={deg} x1="150" y1="32" x2="150" y2={deg % 30 === 0 ? 46 : 39} stroke="currentColor" strokeWidth={deg % 30 === 0 ? 2 : 1} className="text-muted-foreground" transform={`rotate(${deg} 150 150)`} />
            ))}
            {cardinals.map(([label, deg]) => (
              <text key={label} x="150" y="68" textAnchor="middle" fontSize={label.length > 1 ? 11 : 14} fontWeight="700" fill="currentColor" className={deg === 0 ? 'text-destructive' : 'text-foreground'} transform={`rotate(${deg} 150 150)`}>{label}</text>
            ))}
            {bearing !== null && (
              <g transform={`rotate(${bearing} 150 150)`}>
                <line x1="150" y1="150" x2="150" y2="74" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-accent" />
                {/* Kaaba marker */}
                <rect x="138" y="44" width="24" height="24" rx="3" fill="#1b1b1b" stroke="currentColor" strokeWidth="1.5" className="text-accent" />
                <rect x="138" y="50" width="24" height="5" fill="currentColor" className="text-accent" />
              </g>
            )}
          </g>
          <circle cx="150" cy="150" r="9" className="text-primary" fill="currentColor" />
        </svg>
      </section>

      <div className="mb-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl border border-card-border bg-card p-4"><p className="text-xs text-muted-foreground">زاوية القبلة</p><strong className="font-mono-app text-2xl text-primary">{bearing !== null ? `${Math.round(bearing)}°` : '—'}</strong></div>
        <div className="rounded-2xl border border-card-border bg-card p-4"><p className="text-xs text-muted-foreground">المسافة إلى الكعبة</p><strong className="font-mono-app text-2xl text-primary">{coords ? `${Math.round(distanceKm(coords)).toLocaleString('ar-EG')} كم` : '—'}</strong></div>
      </div>

      <div className="space-y-3">
        {sensor === 'active' ? (
          <p className="flex items-center gap-2 rounded-xl bg-secondary p-3 text-xs"><CheckCircle2 size={16} className="text-accent" />البوصلة تعمل. حرّك هاتفك ببطء بشكل أفقي.</p>
        ) : (
          <button type="button" onClick={startSensor} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground" data-testid="button-enable-compass">تفعيل البوصلة</button>
        )}
        {sensor === 'denied' && <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive" role="alert">لم يُسمح بمستشعر الاتجاه. فعّله من إعدادات المتصفح ثم أعد المحاولة.</p>}
        {sensor === 'unsupported' && <p className="rounded-xl bg-secondary p-3 text-xs">جهازك لا يوفّر مستشعر اتجاه، فاستخدم الزاوية المعروضة (من الشمال) مع بوصلة أخرى.</p>}
        <div className="flex items-center gap-3 rounded-2xl border border-card-border bg-card p-4">
          <LocateFixed size={18} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{locationState === 'ok' ? 'تم تحديد موقعك' : locationState === 'loading' ? 'جارٍ تحديد الموقع...' : 'تعذر تحديد الموقع'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{coords ? `${coords.latitude.toFixed(2)}°، ${coords.longitude.toFixed(2)}°` : 'فعّل صلاحية الموقع للمتصفح'}</p>
          </div>
          <button type="button" onClick={locate} className="grid size-9 place-items-center rounded-xl border border-border" aria-label="إعادة تحديد الموقع" data-testid="button-qibla-relocate"><RefreshCw size={16} /></button>
        </div>
        <p className="text-center text-[0.6875rem] leading-5 text-muted-foreground">للحصول على أدق نتيجة ابتعد عن المعادن والمغناطيس، وعاير البوصلة بتحريك الهاتف على شكل ٨.</p>
      </div>
    </div>
  );
}
