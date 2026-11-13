import { readStorage, writeStorage } from '@/lib/sakeena';

// The name a person chose to appear under in competitions and shared khatmahs.
export const NAME_KEY = 'sakeena.display-name.v1';
export const getSavedName = () => readStorage<string>(NAME_KEY, '');
export const saveName = (name: string) => writeStorage(NAME_KEY, name.trim());
