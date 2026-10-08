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

function mapCatalogRow(row: Record<string, unknown>): TreatmentCatalogItem {
  return {
    id: Number(row.id),
    especie_id: Number(row.especie_id),
    especie_nombre: String(row.especie_nombre || ''),
    categoria: (row.categoria || row.tipo || 'vacuna') as TreatmentCategory,
    nombre: String(row.nombre || ''),
    intervalo_refuerzo_dias:
      typeof row.intervalo_refuerzo_dias === 'number'
        ? row.intervalo_refuerzo_dias
        : typeof row.dias_sugeridos_refuerzo === 'number'
        ? row.dias_sugeridos_refuerzo
        : null,
    descripcion:
      typeof row.descripcion === 'string'
        ? row.descripcion
        : row.es_obligatoria === true
        ? 'Vacuna obligatoria recomendada'
        : null,
  };
}

function mapRecordRow(row: Record<string, unknown>): PetTreatmentRecord {
  return {
    id: Number(row.id),
    mascota_id: Number(row.mascota_id),
    tratamiento_id: Number(row.tratamiento_id),
    tratamiento_nombre: String(row.tratamiento_nombre || ''),
    tratamiento_categoria: (row.tratamiento_categoria ||
      row.tratamiento_tipo ||
      'vacuna') as TreatmentCategory,
    intervalo_refuerzo_dias:
      typeof row.intervalo_refuerzo_dias === 'number'
        ? row.intervalo_refuerzo_dias
        : typeof row.dias_sugeridos_refuerzo === 'number'
        ? row.dias_sugeridos_refuerzo
        : null,
    fecha_aplicacion: String(row.fecha_aplicacion || ''),
    fecha_proximo_refuerzo:
      typeof row.fecha_proximo_refuerzo === 'string'
        ? row.fecha_proximo_refuerzo
        : null,
    lote_producto:
      typeof row.lote_producto === 'string'
        ? row.lote_producto
        : typeof row.veterinario_nombre === 'string'
        ? row.veterinario_nombre
        : null,
    veterinaria_nombre:
      typeof row.veterinaria_nombre === 'string'
        ? row.veterinaria_nombre
        : typeof row.clinica_nombre === 'string'
        ? row.clinica_nombre
        : null,
    notas:
      typeof row.notas === 'string'
        ? row.notas
        : typeof row.observaciones === 'string'
        ? row.observaciones
        : null,
    creado_en: String(row.creado_en || row.created_at || ''),
  };
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
  const rawList = Array.isArray(data.treatments) ? data.treatments : [];
  return rawList.map(mapCatalogRow);
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
  const rawList = Array.isArray(data.treatments)
    ? data.treatments
    : Array.isArray(data.records)
    ? data.records
    : [];
  return rawList.map(mapRecordRow);
}

export async function createPetTreatment(
  petId: number,
  payload: TreatmentPayload
): Promise<PetTreatmentRecord> {
  const headers = await getAuthHeaders();
  const body = {
    tratamiento_id: payload.tratamiento_id,
    fecha_aplicacion: payload.fecha_aplicacion,
    fecha_proximo_refuerzo: payload.fecha_proximo_refuerzo ?? null,
    clinica_nombre: payload.veterinaria_nombre ?? null,
    veterinario_nombre: payload.lote_producto ?? null,
    observaciones: payload.notas ?? null,
  };
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.TREATMENTS(petId)}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al registrar aplicación');
  }
  return mapRecordRow(data.treatment || data.record || {});
}

export async function updatePetTreatment(
  petId: number,
  recordId: number,
  payload: TreatmentPayload
): Promise<PetTreatmentRecord> {
  const headers = await getAuthHeaders();
  const body = {
    tratamiento_id: payload.tratamiento_id,
    fecha_aplicacion: payload.fecha_aplicacion,
    fecha_proximo_refuerzo: payload.fecha_proximo_refuerzo ?? null,
    clinica_nombre: payload.veterinaria_nombre ?? null,
    veterinario_nombre: payload.lote_producto ?? null,
    observaciones: payload.notas ?? null,
  };
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.TREATMENT_DETAIL(petId, recordId)}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al actualizar aplicación');
  }
  return mapRecordRow(data.treatment || data.record || {});
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
  const rawList = Array.isArray(data.reminders)
    ? data.reminders
    : Array.isArray(data.events)
    ? data.events
    : [];
  return rawList.map((row: Record<string, unknown>) => {
    const rawEstado = String(row.estado_refuerzo || row.estado || 'vigente');
    const estado: 'vencido' | 'proximo' | 'al_dia' =
      rawEstado === 'atrasado' || rawEstado === 'vencido'
        ? 'vencido'
        : rawEstado === 'proximo'
        ? 'proximo'
        : 'al_dia';
    return {
      id: Number(row.id),
      mascota_id: Number(row.mascota_id),
      mascota_nombre: String(row.mascota_nombre || ''),
      especie_nombre: String(row.especie_nombre || ''),
      tratamiento_id: Number(row.tratamiento_id),
      tratamiento_nombre: String(row.tratamiento_nombre || ''),
      tratamiento_categoria: (row.tratamiento_categoria ||
        row.tratamiento_tipo ||
        'vacuna') as TreatmentCategory,
      fecha_aplicacion: String(row.fecha_aplicacion || ''),
      fecha_proximo_refuerzo: String(row.fecha_proximo_refuerzo || ''),
      veterinaria_nombre:
        typeof row.clinica_nombre === 'string'
          ? row.clinica_nombre
          : typeof row.veterinaria_nombre === 'string'
          ? row.veterinaria_nombre
          : null,
      dias_restantes: Number(row.dias_restantes ?? 0),
      estado,
    };
  });
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
