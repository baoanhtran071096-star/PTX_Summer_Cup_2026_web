export type Theme = 'light' | 'dark' | 'summer';
export type Locale = 'vi' | 'en';

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
