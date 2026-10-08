import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseUtcDate(dateStr: string): Date | null {
  if (!DATE_REGEX.test(dateStr)) {
    return null;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function addDaysToDateString(dateStr: string, days: number): string {
  const base = parseUtcDate(dateStr);
  if (!base) {
    return dateStr;
  }
  base.setUTCDate(base.getUTCDate() + days);
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(base.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function computeReminderStatus(fechaRefuerzo: string | null): {
  estado: 'atrasado' | 'proximo' | 'vigente' | 'sin_refuerzo';
  dias_restantes: number | null;
} {
  if (!fechaRefuerzo) {
    return { estado: 'sin_refuerzo', dias_restantes: null };
  }
  const target = parseUtcDate(fechaRefuerzo);
  if (!target) {
    return { estado: 'sin_refuerzo', dias_restantes: null };
  }
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - todayUtc) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { estado: 'atrasado', dias_restantes: diffDays };
  }
  if (diffDays <= 30) {
    return { estado: 'proximo', dias_restantes: diffDays };
  }
  return { estado: 'vigente', dias_restantes: diffDays };
}

async function fetchTreatmentRecordById(recordId: number) {
  const result = await pool.query(
    `SELECT
      ht.id,
      ht.mascota_id,
      m.nombre AS mascota_nombre,
      ht.tratamiento_id,
      ct.nombre AS tratamiento_nombre,
      ct.tipo AS tratamiento_tipo,
      ct.dias_sugeridos_refuerzo,
      ct.es_obligatoria,
      ht.numero_dosis,
      TO_CHAR(ht.fecha_aplicacion, 'YYYY-MM-DD') AS fecha_aplicacion,
      TO_CHAR(ht.fecha_proximo_refuerzo, 'YYYY-MM-DD') AS fecha_proximo_refuerzo,
      ht.veterinario_nombre,
      ht.clinica_nombre,
      ht.observaciones,
      ht.created_at,
      ht.updated_at
    FROM historial_tratamientos ht
    INNER JOIN catalogo_tratamientos ct ON ct.id = ht.tratamiento_id
    INNER JOIN mascotas m ON m.id = ht.mascota_id
    WHERE ht.id = $1
    LIMIT 1`,
    [recordId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const statusInfo = computeReminderStatus(row.fecha_proximo_refuerzo);
  return {
    ...row,
    estado_refuerzo: statusInfo.estado,
    dias_restantes: statusInfo.dias_restantes,
  };
}

router.get('/treatments', async (req: Request, res: Response) => {
  try {
    const rawEspecieId = req.query.especie_id;

    if (rawEspecieId !== undefined && rawEspecieId !== '') {
      const especieId = Number(rawEspecieId);
      if (!Number.isInteger(especieId) || especieId <= 0) {
        return res.status(400).json({ error: 'Identificador de especie inválido' });
      }

      const result = await pool.query(
        `SELECT
          id,
          especie_id,
          tipo,
          nombre,
          dias_sugeridos_refuerzo,
          es_obligatoria
        FROM catalogo_tratamientos
        WHERE especie_id = $1
        ORDER BY es_obligatoria DESC, tipo ASC, nombre ASC`,
        [especieId]
      );

      return res.status(200).json({ treatments: result.rows });
    }

    const result = await pool.query(
      `SELECT
        id,
        especie_id,
        tipo,
        nombre,
        dias_sugeridos_refuerzo,
        es_obligatoria
      FROM catalogo_tratamientos
      ORDER BY especie_id ASC, es_obligatoria DESC, tipo ASC, nombre ASC`
    );

    return res.status(200).json({ treatments: result.rows });
  } catch {
    return res.status(500).json({
      error: 'Error al consultar el catálogo de vacunas y tratamientos',
    });
  }
});

router.get('/pets/:id/treatments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const petId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!Number.isInteger(petId) || petId <= 0) {
      return res.status(400).json({ error: 'Identificador de mascota inválido' });
    }

    const accessCheck = await pool.query(
      'SELECT 1 FROM usuarios_mascotas WHERE mascota_id = $1 AND usuario_id = $2 LIMIT 1',
      [petId, userId]
    );

    if (accessCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const result = await pool.query(
      `SELECT
        ht.id,
        ht.mascota_id,
        m.nombre AS mascota_nombre,
        ht.tratamiento_id,
        ct.nombre AS tratamiento_nombre,
        ct.tipo AS tratamiento_tipo,
        ct.dias_sugeridos_refuerzo,
        ct.es_obligatoria,
        ht.numero_dosis,
        TO_CHAR(ht.fecha_aplicacion, 'YYYY-MM-DD') AS fecha_aplicacion,
        TO_CHAR(ht.fecha_proximo_refuerzo, 'YYYY-MM-DD') AS fecha_proximo_refuerzo,
        ht.veterinario_nombre,
        ht.clinica_nombre,
        ht.observaciones,
        ht.created_at,
        ht.updated_at
      FROM historial_tratamientos ht
      INNER JOIN catalogo_tratamientos ct ON ct.id = ht.tratamiento_id
      INNER JOIN mascotas m ON m.id = ht.mascota_id
      WHERE ht.mascota_id = $1
      ORDER BY ht.fecha_aplicacion DESC, ht.id DESC`,
      [petId]
    );

    const treatments = result.rows.map((row) => {
      const statusInfo = computeReminderStatus(row.fecha_proximo_refuerzo);
      return {
        ...row,
        estado_refuerzo: statusInfo.estado,
        dias_restantes: statusInfo.dias_restantes,
      };
    });

    return res.status(200).json({ treatments });
  } catch {
    return res.status(500).json({
      error: 'Error al obtener el carnet sanitario de la mascota',
    });
  }
});

router.post('/pets/:id/treatments', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const petId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!Number.isInteger(petId) || petId <= 0) {
      return res.status(400).json({ error: 'Identificador de mascota inválido' });
    }

    const petCheck = await pool.query(
      `SELECT m.id, m.especie_id
       FROM usuarios_mascotas um
       INNER JOIN mascotas m ON m.id = um.mascota_id
       WHERE um.mascota_id = $1 AND um.usuario_id = $2
       LIMIT 1`,
      [petId, userId]
    );

    if (petCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const petEspecieId = petCheck.rows[0].especie_id as number;
    const tratamientoId = Number(req.body?.tratamiento_id);
    const numeroDosis = req.body?.numero_dosis !== undefined ? Number(req.body.numero_dosis) : 1;
    const rawFechaAplicacion = typeof req.body?.fecha_aplicacion === 'string'
      ? req.body.fecha_aplicacion.trim()
      : '';
    const rawFechaRefuerzo = typeof req.body?.fecha_proximo_refuerzo === 'string'
      ? req.body.fecha_proximo_refuerzo.trim()
      : '';
    const veterinarioNombre = typeof req.body?.veterinario_nombre === 'string' && req.body.veterinario_nombre.trim()
      ? req.body.veterinario_nombre.trim()
      : null;
    const clinicaNombre = typeof req.body?.clinica_nombre === 'string' && req.body.clinica_nombre.trim()
      ? req.body.clinica_nombre.trim()
      : null;
    const observaciones = typeof req.body?.observaciones === 'string' && req.body.observaciones.trim()
      ? req.body.observaciones.trim()
      : null;

    if (!Number.isInteger(tratamientoId) || tratamientoId <= 0) {
      return res.status(400).json({ error: 'Debes seleccionar una vacuna o tratamiento válido' });
    }

    if (!Number.isInteger(numeroDosis) || numeroDosis < 1) {
      return res.status(400).json({ error: 'El número de dosis debe ser un entero mayor o igual a 1' });
    }

    const parsedAplicacion = parseUtcDate(rawFechaAplicacion);
    if (!parsedAplicacion) {
      return res.status(400).json({ error: 'La fecha de aplicación es obligatoria en formato AAAA-MM-DD' });
    }

    const catalogLookup = await pool.query(
      `SELECT id, especie_id, dias_sugeridos_refuerzo
       FROM catalogo_tratamientos
       WHERE id = $1
       LIMIT 1`,
      [tratamientoId]
    );

    if (catalogLookup.rowCount === 0) {
      return res.status(400).json({ error: 'El tratamiento seleccionado no existe en el catálogo' });
    }

    const catalogItem = catalogLookup.rows[0];
    if (catalogItem.especie_id !== petEspecieId) {
      return res.status(400).json({ error: 'El tratamiento seleccionado no corresponde a la especie de la mascota' });
    }

    let finalFechaRefuerzo: string | null = null;

    if (rawFechaRefuerzo) {
      const parsedRefuerzo = parseUtcDate(rawFechaRefuerzo);
      if (!parsedRefuerzo) {
        return res.status(400).json({ error: 'El formato de la fecha de próximo refuerzo no es válido (AAAA-MM-DD)' });
      }
      if (parsedRefuerzo.getTime() < parsedAplicacion.getTime()) {
        return res.status(400).json({
          error: 'La fecha del próximo refuerzo no puede ser anterior a la fecha de aplicación',
        });
      }
      finalFechaRefuerzo = rawFechaRefuerzo;
    } else if (typeof catalogItem.dias_sugeridos_refuerzo === 'number' && catalogItem.dias_sugeridos_refuerzo > 0) {
      finalFechaRefuerzo = addDaysToDateString(rawFechaAplicacion, catalogItem.dias_sugeridos_refuerzo);
    }

    const duplicateCheck = await pool.query(
      `SELECT id
       FROM historial_tratamientos
       WHERE mascota_id = $1
         AND tratamiento_id = $2
         AND numero_dosis = $3
         AND fecha_aplicacion = $4
       LIMIT 1`,
      [petId, tratamientoId, numeroDosis, rawFechaAplicacion]
    );

    if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
      return res.status(409).json({
        error: 'Ya existe un registro para esta misma dosis y tratamiento en la fecha indicada',
      });
    }

    const insertResult = await pool.query(
      `INSERT INTO historial_tratamientos (
        mascota_id,
        tratamiento_id,
        numero_dosis,
        fecha_aplicacion,
        fecha_proximo_refuerzo,
        veterinario_nombre,
        clinica_nombre,
        observaciones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        petId,
        tratamientoId,
        numeroDosis,
        rawFechaAplicacion,
        finalFechaRefuerzo,
        veterinarioNombre,
        clinicaNombre,
        observaciones,
      ]
    );

    const createdId = insertResult.rows[0].id as number;
    const treatment = await fetchTreatmentRecordById(createdId);

    return res.status(201).json({ treatment });
  } catch {
    return res.status(500).json({
      error: 'Error al registrar la dosis en el carnet sanitario',
    });
  }
});

router.put('/pets/:id/treatments/:recordId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const petId = Number(req.params.id);
    const recordId = Number(req.params.recordId);

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!Number.isInteger(petId) || petId <= 0 || !Number.isInteger(recordId) || recordId <= 0) {
      return res.status(400).json({ error: 'Identificador inválido' });
    }

    const accessCheck = await pool.query(
      'SELECT 1 FROM usuarios_mascotas WHERE mascota_id = $1 AND usuario_id = $2 LIMIT 1',
      [petId, userId]
    );

    if (accessCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const existingCheck = await pool.query(
      'SELECT id FROM historial_tratamientos WHERE id = $1 AND mascota_id = $2 LIMIT 1',
      [recordId, petId]
    );

    if (existingCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Registro sanitario no encontrado' });
    }

    const numeroDosis = req.body?.numero_dosis !== undefined ? Number(req.body.numero_dosis) : 1;
    const rawFechaAplicacion = typeof req.body?.fecha_aplicacion === 'string'
      ? req.body.fecha_aplicacion.trim()
      : '';
    const rawFechaRefuerzo = typeof req.body?.fecha_proximo_refuerzo === 'string'
      ? req.body.fecha_proximo_refuerzo.trim()
      : '';
    const veterinarioNombre = typeof req.body?.veterinario_nombre === 'string' && req.body.veterinario_nombre.trim()
      ? req.body.veterinario_nombre.trim()
      : null;
    const clinicaNombre = typeof req.body?.clinica_nombre === 'string' && req.body.clinica_nombre.trim()
      ? req.body.clinica_nombre.trim()
      : null;
    const observaciones = typeof req.body?.observaciones === 'string' && req.body.observaciones.trim()
      ? req.body.observaciones.trim()
      : null;

    if (!Number.isInteger(numeroDosis) || numeroDosis < 1) {
      return res.status(400).json({ error: 'El número de dosis debe ser un entero mayor o igual a 1' });
    }

    const parsedAplicacion = parseUtcDate(rawFechaAplicacion);
    if (!parsedAplicacion) {
      return res.status(400).json({ error: 'La fecha de aplicación es obligatoria en formato AAAA-MM-DD' });
    }

    let finalFechaRefuerzo: string | null = null;
    if (rawFechaRefuerzo) {
      const parsedRefuerzo = parseUtcDate(rawFechaRefuerzo);
      if (!parsedRefuerzo) {
        return res.status(400).json({ error: 'El formato de la fecha de próximo refuerzo no es válido (AAAA-MM-DD)' });
      }
      if (parsedRefuerzo.getTime() < parsedAplicacion.getTime()) {
        return res.status(400).json({
          error: 'La fecha del próximo refuerzo no puede ser anterior a la fecha de aplicación',
        });
      }
      finalFechaRefuerzo = rawFechaRefuerzo;
    }

    await pool.query(
      `UPDATE historial_tratamientos
       SET numero_dosis = $1,
           fecha_aplicacion = $2,
           fecha_proximo_refuerzo = $3,
           veterinario_nombre = $4,
           clinica_nombre = $5,
           observaciones = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND mascota_id = $8`,
      [
        numeroDosis,
        rawFechaAplicacion,
        finalFechaRefuerzo,
        veterinarioNombre,
        clinicaNombre,
        observaciones,
        recordId,
        petId,
      ]
    );

    const treatment = await fetchTreatmentRecordById(recordId);
    return res.status(200).json({ treatment });
  } catch {
    return res.status(500).json({
      error: 'Error al actualizar el registro sanitario',
    });
  }
});

router.delete('/pets/:id/treatments/:recordId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const petId = Number(req.params.id);
    const recordId = Number(req.params.recordId);

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!Number.isInteger(petId) || petId <= 0 || !Number.isInteger(recordId) || recordId <= 0) {
      return res.status(400).json({ error: 'Identificador inválido' });
    }

    const accessCheck = await pool.query(
      'SELECT 1 FROM usuarios_mascotas WHERE mascota_id = $1 AND usuario_id = $2 LIMIT 1',
      [petId, userId]
    );

    if (accessCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const deleteResult = await pool.query(
      'DELETE FROM historial_tratamientos WHERE id = $1 AND mascota_id = $2',
      [recordId, petId]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Registro sanitario no encontrado' });
    }

    return res.status(200).json({
      message: 'Registro sanitario eliminado correctamente',
    });
  } catch {
    return res.status(500).json({
      error: 'Error al eliminar el registro sanitario',
    });
  }
});

router.get('/calendar', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const result = await pool.query(
      `SELECT
        ht.id,
        ht.mascota_id,
        m.nombre AS mascota_nombre,
        e.nombre AS especie_nombre,
        ht.tratamiento_id,
        ct.nombre AS tratamiento_nombre,
        ct.tipo AS tratamiento_tipo,
        ct.es_obligatoria,
        ht.numero_dosis,
        TO_CHAR(ht.fecha_aplicacion, 'YYYY-MM-DD') AS fecha_aplicacion,
        TO_CHAR(ht.fecha_proximo_refuerzo, 'YYYY-MM-DD') AS fecha_proximo_refuerzo,
        ht.veterinario_nombre,
        ht.clinica_nombre
      FROM usuarios_mascotas um
      INNER JOIN mascotas m ON m.id = um.mascota_id
      INNER JOIN especies e ON e.id = m.especie_id
      INNER JOIN historial_tratamientos ht ON ht.mascota_id = m.id
      INNER JOIN catalogo_tratamientos ct ON ct.id = ht.tratamiento_id
      WHERE um.usuario_id = $1
        AND ht.fecha_proximo_refuerzo IS NOT NULL
      ORDER BY ht.fecha_proximo_refuerzo ASC, ht.id ASC`,
      [userId]
    );

    const reminders = result.rows.map((row) => {
      const statusInfo = computeReminderStatus(row.fecha_proximo_refuerzo);
      return {
        ...row,
        estado_refuerzo: statusInfo.estado,
        dias_restantes: statusInfo.dias_restantes,
      };
    });

    return res.status(200).json({ reminders });
  } catch {
    return res.status(500).json({
      error: 'Error al consultar el calendario sanitario',
    });
  }
});

export default router;
