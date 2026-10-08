// Formato y cálculo de fechas. La API siempre habla ISO (AAAA-MM-DD); la UI muestra "7 nov 2026".

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIso(iso: string | null | undefined): Date | null {
  const m = ISO.exec((iso ?? '').trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function toIso(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseIso(iso);
  if (!date) return '';
  date.setDate(date.getDate() + days);
  return toIso(date);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Días desde hoy hasta la fecha (negativo = ya pasó). null si la fecha no es válida. */
export function daysFromToday(iso: string | null | undefined): number | null {
  const date = parseIso(iso);
  if (!date) return null;
  return Math.round((date.getTime() - startOfToday().getTime()) / 86400000);
}

/** Días entre hoy y la fecha hacia atrás: 0 = hoy, 1 = ayer. null si no es válida. */
export function daysAgo(iso: string | null | undefined): number | null {
  const d = daysFromToday(iso);
  return d === null ? null : -d;
}

/** '2026-11-07' -> '7 nov 2026'. Si no es una fecha válida, devuelve el texto tal cual. */
export function formatDateLong(iso: string | null | undefined): string {
  const date = parseIso(iso);
  if (!date) return iso ?? '';
  return `${date.getDate()} ${MESES[date.getMonth()]} ${date.getFullYear()}`;
}

/** 30 -> 'En 30 días', 0 -> 'Hoy', -4 -> 'Hace 4 días', 365 -> 'En 1 año'. */
export function formatRelativeDays(n: number): string {
  if (n === 0) return 'Hoy';
  const future = n > 0;
  const a = Math.abs(n);
  let body: string;
  if (a === 1) {
    return future ? 'Mañana' : 'Ayer';
  } else if (a < 60) {
    body = `${a} días`;
  } else if (a >= 350 && a <= 380) {
    body = '1 año';
  } else if (a < 350) {
    body = `${Math.round(a / 30.4)} meses`;
  } else {
    const years = Math.round(a / 365);
    body = years === 1 ? '1 año' : `${years} años`;
  }
  return future ? `En ${body}` : `Hace ${body}`;
}

/** 'Cada 30 días', 'Cada año'. */
export function formatCadence(days: number | null | undefined): string {
  if (!days) return 'Sin refuerzo programado';
  if (days === 365) return 'Cada año';
  return `Cada ${days} días`;
}

/** 'Carlos Echeverría' -> 'CE'. */
export function initials(fullName: string | null | undefined): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}
