import { API_CONFIG } from '../config/api';
import { getSession } from './auth';

export type TreatmentCategory =
  | 'vacuna'
  | 'desparasitacion_interna'
  | 'desparasitacion_externa';

export interface TreatmentCatalogItem {
  id: number;
  especie_id: number;
  especie_nombre: string;
  categoria: TreatmentCategory;
  nombre: string;
  intervalo_refuerzo_dias: number | null;
  descripcion: string | null;
}

export interface PetTreatmentRecord {
  id: number;
  mascota_id: number;
  tratamiento_id: number;
  tratamiento_nombre: string;
  tratamiento_categoria: TreatmentCategory;
  intervalo_refuerzo_dias: number | null;
  fecha_aplicacion: string;
  fecha_proximo_refuerzo: string | null;
  lote_producto: string | null;
  veterinaria_nombre: string | null;
  notas: string | null;
  creado_en: string;
}

export interface CalendarEventItem {
  id: number;
  mascota_id: number;
  mascota_nombre: string;
  especie_nombre: string;
  tratamiento_id: number;
  tratamiento_nombre: string;
  tratamiento_categoria: TreatmentCategory;
  fecha_aplicacion: string;
  fecha_proximo_refuerzo: string;
  veterinaria_nombre: string | null;
  dias_restantes: number;
  estado: 'vencido' | 'proximo' | 'al_dia';
}

export interface TreatmentPayload {
  tratamiento_id: number;
  fecha_aplicacion: string;
  fecha_proximo_refuerzo?: string | null;
  lote_producto?: string | null;
  veterinaria_nombre?: string | null;
  notas?: string | null;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  return headers;
}

export async function fetchTreatmentCatalog(
  especieId?: number,
  categoria?: TreatmentCategory
): Promise<TreatmentCatalogItem[]> {
  const params = new URLSearchParams();
  if (especieId) {
    params.set('especie_id', String(especieId));
  }
  if (categoria) {
    params.set('categoria', categoria);
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TREATMENTS.CATALOG}${qs}`
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al obtener catálogo de tratamientos');
  }
  return data.treatments;
}

export async function fetchPetTreatments(
  petId: number
): Promise<PetTreatmentRecord[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.TREATMENTS(petId)}`,
    { headers }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al obtener carnet sanitario');
  }
  return data.records;
}

export async function createPetTreatment(
  petId: number,
  payload: TreatmentPayload
): Promise<PetTreatmentRecord> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.TREATMENTS(petId)}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al registrar aplicación');
  }
  return data.record;
}

export async function updatePetTreatment(
  petId: number,
  recordId: number,
  payload: TreatmentPayload
): Promise<PetTreatmentRecord> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.TREATMENT_DETAIL(petId, recordId)}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al actualizar aplicación');
  }
  return data.record;
}

export async function deletePetTreatment(
  petId: number,
  recordId: number
): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.TREATMENT_DETAIL(petId, recordId)}`,
    {
      method: 'DELETE',
      headers,
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al eliminar aplicación');
  }
}

export async function fetchCalendar(): Promise<CalendarEventItem[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CALENDAR.LIST}`,
    { headers }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al cargar calendario sanitario');
  }
  return data.events;
}

export function formatCategoryLabel(categoria: TreatmentCategory): string {
  if (categoria === 'vacuna') {
    return 'Vacuna';
  }
  if (categoria === 'desparasitacion_interna') {
    return 'Desp. Interna';
  }
  return 'Desp. Externa';
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeSuggestedBoosterDate(
  fechaAplicacion: string,
  intervaloDias: number | null
): string {
  if (!intervaloDias || intervaloDias <= 0) {
    return '';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaAplicacion.trim())) {
    return '';
  }
  const baseDate = new Date(`${fechaAplicacion.trim()}T00:00:00Z`);
  if (Number.isNaN(baseDate.getTime())) {
    return '';
  }
  baseDate.setUTCDate(baseDate.getUTCDate() + intervaloDias);
  return baseDate.toISOString().slice(0, 10);
}

export function getBoosterStatus(fechaProximoRefuerzo: string | null): {
  status: 'vencido' | 'proximo' | 'al_dia' | 'sin_fecha';
  label: string;
  daysDiff: number | null;
} {
  if (!fechaProximoRefuerzo) {
    return { status: 'sin_fecha', label: 'Sin refuerzo pendiente', daysDiff: null };
  }
  const target = new Date(`${fechaProximoRefuerzo.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) {
    return { status: 'sin_fecha', label: 'Sin refuerzo pendiente', daysDiff: null };
  }
  const todayIso = getTodayIsoDate();
  const today = new Date(`${todayIso}T00:00:00Z`);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) {
    return {
      status: 'vencido',
      label: `Vencido hace ${Math.abs(diffDays)} d`,
      daysDiff: diffDays,
    };
  }
  if (diffDays <= 30) {
    return {
      status: 'proximo',
      label: diffDays === 0 ? 'Vence hoy' : `Próximo en ${diffDays} d`,
      daysDiff: diffDays,
    };
  }
  return {
    status: 'al_dia',
    label: `Al día (${diffDays} d)`,
    daysDiff: diffDays,
  };
}
