import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidPastOrTodayDate(dateStr: string): { valid: boolean; isFuture: boolean } {
  if (!DATE_REGEX.test(dateStr)) {
    return { valid: false, isFuture: false };
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { valid: false, isFuture: false };
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  if (parsed.getTime() > todayUtc) {
    return { valid: false, isFuture: true };
  }

  return { valid: true, isFuture: false };
}

async function fetchEnrichedPet(petId: number, userId: number) {
  const result = await pool.query(
    `SELECT
      m.id,
      m.nombre,
      m.especie_id,
      e.nombre AS especie_nombre,
      m.raza_id,
      r.nombre AS raza_nombre,
      TO_CHAR(m.fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
      m.sexo,
      m.esterilizado,
      m.numero_chip,
      m.foto_url,
      um.es_tutor_principal,
      m.created_at,
      m.updated_at
    FROM usuarios_mascotas um
    INNER JOIN mascotas m ON m.id = um.mascota_id
    INNER JOIN especies e ON e.id = m.especie_id
    LEFT JOIN razas r ON r.id = m.raza_id
    WHERE um.mascota_id = $1 AND um.usuario_id = $2
    LIMIT 1`,
    [petId, userId]
  );

  const pet = result.rows[0];
  if (!pet) {
    return null;
  }

  const tutorsResult = await pool.query(
    `SELECT
      u.id,
      u.nombre_completo,
      u.email,
      um.es_tutor_principal
    FROM usuarios_mascotas um
    INNER JOIN usuarios u ON u.id = um.usuario_id
    WHERE um.mascota_id = $1
    ORDER BY um.es_tutor_principal DESC, u.nombre_completo ASC`,
    [petId]
  );

  return {
    ...pet,
    tutores: tutorsResult.rows,
  };
}

router.get('/species', async (_req: Request, res: Response) => {
  try {
    const speciesResult = await pool.query(
      'SELECT id, nombre FROM especies ORDER BY id ASC'
    );
    const breedsResult = await pool.query(
      'SELECT id, especie_id, nombre FROM razas ORDER BY nombre ASC'
    );

    const species = speciesResult.rows.map((sp) => ({
      id: sp.id,
      nombre: sp.nombre,
      razas: breedsResult.rows.filter((br) => br.especie_id === sp.id),
    }));

    return res.status(200).json({ species });
  } catch {
    return res.status(500).json({
      error: 'Error al obtener el catálogo de especies y razas',
    });
  }
});

router.get('/species/:id/breeds', async (req: Request, res: Response) => {
  try {
    const especieId = Number(req.params.id);
    if (!Number.isInteger(especieId) || especieId <= 0) {
      return res.status(400).json({
        error: 'Identificador de especie inválido',
      });
    }

    const result = await pool.query(
      'SELECT id, especie_id, nombre FROM razas WHERE especie_id = $1 ORDER BY nombre ASC',
      [especieId]
    );

    return res.status(200).json({
      breeds: result.rows,
    });
  } catch {
    return res.status(500).json({
      error: 'Error al obtener las razas de la especie',
    });
  }
});

router.get('/pets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const result = await pool.query(
      `SELECT
        m.id,
        m.nombre,
        m.especie_id,
        e.nombre AS especie_nombre,
        m.raza_id,
        r.nombre AS raza_nombre,
        TO_CHAR(m.fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
        m.sexo,
        m.esterilizado,
        m.numero_chip,
        m.foto_url,
        um.es_tutor_principal,
        m.created_at,
        m.updated_at
      FROM usuarios_mascotas um
      INNER JOIN mascotas m ON m.id = um.mascota_id
      INNER JOIN especies e ON e.id = m.especie_id
      LEFT JOIN razas r ON r.id = m.raza_id
      WHERE um.usuario_id = $1
      ORDER BY m.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      pets: result.rows,
    });
  } catch {
    return res.status(500).json({
      error: 'Error al listar las mascotas',
    });
  }
});

router.get('/pets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const petId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!Number.isInteger(petId) || petId <= 0) {
      return res.status(400).json({ error: 'Identificador de mascota inválido' });
    }

    const pet = await fetchEnrichedPet(petId, userId);

    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    return res.status(200).json({ pet });
  } catch {
    return res.status(500).json({
      error: 'Error al obtener la ficha de la mascota',
    });
  }
});

router.post('/pets', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const rawNombre = req.body?.nombre;
    const especieId = Number(req.body?.especie_id);
    const razaId = req.body?.raza_id !== undefined && req.body?.raza_id !== null && req.body?.raza_id !== ''
      ? Number(req.body.raza_id)
      : null;
    const fechaNacimiento = req.body?.fecha_nacimiento;
    const rawSexo = req.body?.sexo;
    const esterilizado = Boolean(req.body?.esterilizado);
    const numeroChip = typeof req.body?.numero_chip === 'string' && req.body.numero_chip.trim()
      ? req.body.numero_chip.trim()
      : null;
    const fotoUrl = typeof req.body?.foto_url === 'string' && req.body.foto_url.trim()
      ? req.body.foto_url.trim()
      : null;

    if (typeof rawNombre !== 'string' || !rawNombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la mascota es obligatorio' });
    }

    const nombre = rawNombre.trim();
    if (nombre.length > 100) {
      return res.status(400).json({ error: 'El nombre no puede superar los 100 caracteres' });
    }

    if (!Number.isInteger(especieId) || especieId <= 0) {
      return res.status(400).json({ error: 'Debes seleccionar una especie válida' });
    }

    if (typeof fechaNacimiento !== 'string' || !fechaNacimiento.trim()) {
      return res.status(400).json({ error: 'La fecha de nacimiento es obligatoria (YYYY-MM-DD)' });
    }

    const dateCheck = isValidPastOrTodayDate(fechaNacimiento.trim());
    if (dateCheck.isFuture) {
      return res.status(400).json({ error: 'La fecha de nacimiento no puede ser una fecha futura' });
    }
    if (!dateCheck.valid) {
      return res.status(400).json({ error: 'El formato de la fecha de nacimiento no es válido (YYYY-MM-DD)' });
    }

    const sexo = typeof rawSexo === 'string' ? rawSexo.trim().toLowerCase() : '';
    if (sexo !== 'macho' && sexo !== 'hembra') {
      return res.status(400).json({ error: 'El sexo debe ser macho o hembra' });
    }

    if (numeroChip && numeroChip.length > 50) {
      return res.status(400).json({ error: 'El número de chip no puede superar los 50 caracteres' });
    }

    const spResult = await client.query('SELECT id FROM especies WHERE id = $1 LIMIT 1', [especieId]);
    if (spResult.rowCount === 0) {
      return res.status(400).json({ error: 'La especie seleccionada no existe' });
    }

    if (razaId !== null) {
      if (!Number.isInteger(razaId) || razaId <= 0) {
        return res.status(400).json({ error: 'La raza seleccionada no es válida' });
      }
      const brResult = await client.query(
        'SELECT id FROM razas WHERE id = $1 AND especie_id = $2 LIMIT 1',
        [razaId, especieId]
      );
      if (brResult.rowCount === 0) {
        return res.status(400).json({ error: 'La raza no pertenece a la especie seleccionada' });
      }
    }

    await client.query('BEGIN');

    const insertPet = await client.query(
      `INSERT INTO mascotas (
        nombre,
        especie_id,
        raza_id,
        fecha_nacimiento,
        sexo,
        esterilizado,
        numero_chip,
        foto_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [nombre, especieId, razaId, fechaNacimiento.trim(), sexo, esterilizado, numeroChip, fotoUrl]
    );

    const newPetId = insertPet.rows[0].id as number;

    await client.query(
      `INSERT INTO usuarios_mascotas (usuario_id, mascota_id, es_tutor_principal)
       VALUES ($1, $2, TRUE)`,
      [userId, newPetId]
    );

    await client.query('COMMIT');

    const pet = await fetchEnrichedPet(newPetId, userId);

    return res.status(201).json({ pet });
  } catch {
    await client.query('ROLLBACK').catch(() => undefined);
    return res.status(500).json({
      error: 'Error al registrar la mascota',
    });
  } finally {
    client.release();
  }
});

router.put('/pets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

    const rawNombre = req.body?.nombre;
    const especieId = Number(req.body?.especie_id);
    const razaId = req.body?.raza_id !== undefined && req.body?.raza_id !== null && req.body?.raza_id !== ''
      ? Number(req.body.raza_id)
      : null;
    const fechaNacimiento = req.body?.fecha_nacimiento;
    const rawSexo = req.body?.sexo;
    const esterilizado = Boolean(req.body?.esterilizado);
    const numeroChip = typeof req.body?.numero_chip === 'string' && req.body.numero_chip.trim()
      ? req.body.numero_chip.trim()
      : null;
    const fotoUrl = typeof req.body?.foto_url === 'string' && req.body.foto_url.trim()
      ? req.body.foto_url.trim()
      : null;

    if (typeof rawNombre !== 'string' || !rawNombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la mascota es obligatorio' });
    }

    const nombre = rawNombre.trim();
    if (nombre.length > 100) {
      return res.status(400).json({ error: 'El nombre no puede superar los 100 caracteres' });
    }

    if (!Number.isInteger(especieId) || especieId <= 0) {
      return res.status(400).json({ error: 'Debes seleccionar una especie válida' });
    }

    if (typeof fechaNacimiento !== 'string' || !fechaNacimiento.trim()) {
      return res.status(400).json({ error: 'La fecha de nacimiento es obligatoria (YYYY-MM-DD)' });
    }

    const dateCheck = isValidPastOrTodayDate(fechaNacimiento.trim());
    if (dateCheck.isFuture) {
      return res.status(400).json({ error: 'La fecha de nacimiento no puede ser una fecha futura' });
    }
    if (!dateCheck.valid) {
      return res.status(400).json({ error: 'El formato de la fecha de nacimiento no es válido (YYYY-MM-DD)' });
    }

    const sexo = typeof rawSexo === 'string' ? rawSexo.trim().toLowerCase() : '';
    if (sexo !== 'macho' && sexo !== 'hembra') {
      return res.status(400).json({ error: 'El sexo debe ser macho o hembra' });
    }

    if (numeroChip && numeroChip.length > 50) {
      return res.status(400).json({ error: 'El número de chip no puede superar los 50 caracteres' });
    }

    const spResult = await pool.query('SELECT id FROM especies WHERE id = $1 LIMIT 1', [especieId]);
    if (spResult.rowCount === 0) {
      return res.status(400).json({ error: 'La especie seleccionada no existe' });
    }

    if (razaId !== null) {
      if (!Number.isInteger(razaId) || razaId <= 0) {
        return res.status(400).json({ error: 'La raza seleccionada no es válida' });
      }
      const brResult = await pool.query(
        'SELECT id FROM razas WHERE id = $1 AND especie_id = $2 LIMIT 1',
        [razaId, especieId]
      );
      if (brResult.rowCount === 0) {
        return res.status(400).json({ error: 'La raza no pertenece a la especie seleccionada' });
      }
    }

    await pool.query(
      `UPDATE mascotas
       SET nombre = $1,
           especie_id = $2,
           raza_id = $3,
           fecha_nacimiento = $4,
           sexo = $5,
           esterilizado = $6,
           numero_chip = $7,
           foto_url = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [nombre, especieId, razaId, fechaNacimiento.trim(), sexo, esterilizado, numeroChip, fotoUrl, petId]
    );

    const pet = await fetchEnrichedPet(petId, userId);

    return res.status(200).json({ pet });
  } catch {
    return res.status(500).json({
      error: 'Error al actualizar la mascota',
    });
  }
});

router.delete('/pets/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

    await pool.query('DELETE FROM mascotas WHERE id = $1', [petId]);

    return res.status(200).json({
      message: 'Mascota eliminada correctamente',
    });
  } catch {
    return res.status(500).json({
      error: 'Error al eliminar la mascota',
    });
  }
});

router.post('/pets/:id/tutors', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const petId = Number(req.params.id);
    const rawEmail = req.body?.email;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!Number.isInteger(petId) || petId <= 0) {
      return res.status(400).json({ error: 'Identificador de mascota inválido' });
    }

    if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
      return res.status(400).json({ error: 'Debes indicar el correo electrónico del cotutor' });
    }

    const accessCheck = await pool.query(
      'SELECT 1 FROM usuarios_mascotas WHERE mascota_id = $1 AND usuario_id = $2 LIMIT 1',
      [petId, userId]
    );

    if (accessCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const targetEmail = rawEmail.trim().toLowerCase();
    const userLookup = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 LIMIT 1',
      [targetEmail]
    );

    if (userLookup.rowCount === 0) {
      return res.status(404).json({
        error: 'No existe un usuario registrado con ese correo electrónico',
      });
    }

    const newTutorId = userLookup.rows[0].id as number;

    await pool.query(
      `INSERT INTO usuarios_mascotas (usuario_id, mascota_id, es_tutor_principal)
       VALUES ($1, $2, FALSE)
       ON CONFLICT (usuario_id, mascota_id) DO NOTHING`,
      [newTutorId, petId]
    );

    const pet = await fetchEnrichedPet(petId, userId);

    return res.status(201).json({ pet });
  } catch {
    return res.status(500).json({
      error: 'Error al asociar el cotutor a la mascota',
    });
  }
});

export default router;
