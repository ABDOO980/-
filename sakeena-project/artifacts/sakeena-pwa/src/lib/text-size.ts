import { readStorage, writeStorage } from '@/lib/sakeena';

// The reader's own text size, on top of the phone's font setting. Every font size in
// the app is in rem, so changing the root size resizes the whole app together.
export const TEXT_SCALE_KEY = 'sakeena.text-scale';
export const textScaleSteps = [
  { value: 90, label: 'أصغر' },
  { value: 100, label: 'افتراضي' },
  { value: 115, label: 'كبير' },
  { value: 130, label: 'أكبر' },
  { value: 150, label: 'الأكبر' },
] as const;

export const getTextScale = () => {
  const value = readStorage<number>(TEXT_SCALE_KEY, 100);
  return value >= 80 && value <= 160 ? value : 100;
};
export const applyTextScale = (value: number) => { document.documentElement.style.fontSize = `${value}%`; };
export const setTextScale = (value: number) => { writeStorage(TEXT_SCALE_KEY, value); applyTextScale(value); };
