import { API_CONFIG } from '../config/api';
import { getSession } from './auth';

export interface Breed {
  id: number;
  especie_id: number;
  nombre: string;
}

export interface Species {
  id: number;
  nombre: string;
  razas: Breed[];
}

export interface PetTutor {
  id: number;
  nombre_completo: string;
  email: string;
  es_tutor_principal: boolean;
}

export interface Pet {
  id: number;
  nombre: string;
  especie_id: number;
  especie_nombre: string;
  raza_id: number | null;
  raza_nombre: string | null;
  fecha_nacimiento: string;
  sexo: 'macho' | 'hembra';
  esterilizado: boolean;
  numero_chip: string | null;
  foto_url: string | null;
  es_tutor_principal: boolean;
  tutores?: PetTutor[];
}

export interface PetFormPayload {
  nombre: string;
  especie_id: number;
  raza_id: number | null;
  fecha_nacimiento: string;
  sexo: 'macho' | 'hembra';
  esterilizado: boolean;
  numero_chip?: string | null;
  foto_url?: string | null;
}

export function formatPetAge(fechaNacimiento: string): string {
  const parts = fechaNacimiento.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return fechaNacimiento;
  }

  const [birthYear, birthMonth, birthDay] = parts;
  const now = new Date();
  let years = now.getFullYear() - birthYear;
  let months = now.getMonth() + 1 - birthMonth;

  if (now.getDate() < birthDay) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    return 'Recién nacido';
  }

  if (years === 0 && months <= 0) {
    return 'Menos de 1 mes';
  }

  if (years === 0) {
    return months === 1 ? '1 mes' : `${months} meses`;
  }

  const yearLabel = years === 1 ? '1 año' : `${years} años`;
  if (months === 0) {
    return yearLabel;
  }

  const monthLabel = months === 1 ? '1 mes' : `${months} meses`;
  return `${yearLabel} y ${monthLabel}`;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  if (!session?.token) {
    throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.token}`,
  };
}

export async function fetchSpeciesCatalog(): Promise<Species[]> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SPECIES.LIST}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo cargar el catálogo de especies');
  }

  return (data.species || []) as Species[];
}

export async function fetchPets(): Promise<Pet[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.LIST}`, {
    method: 'GET',
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo obtener el listado de mascotas');
  }

  return (data.pets || []) as Pet[];
}

export async function fetchPetById(id: number): Promise<Pet> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.DETAIL(id)}`, {
    method: 'GET',
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo cargar la ficha de la mascota');
  }

  return data.pet as Pet;
}

export async function createPet(payload: PetFormPayload): Promise<Pet> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.LIST}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo registrar la mascota');
  }

  return data.pet as Pet;
}

export async function updatePet(id: number, payload: PetFormPayload): Promise<Pet> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.DETAIL(id)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo actualizar la mascota');
  }

  return data.pet as Pet;
}

export async function deletePet(id: number): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.DETAIL(id)}`, {
    method: 'DELETE',
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo eliminar la mascota');
  }
}

export async function addPetTutor(id: number, email: string): Promise<Pet> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PETS.TUTORS(id)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo asociar al cotutor');
  }

  return data.pet as Pet;
}
