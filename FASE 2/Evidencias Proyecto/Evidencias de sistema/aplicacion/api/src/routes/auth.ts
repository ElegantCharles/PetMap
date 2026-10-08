import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { env } from '../config/env';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const rawEmail = req.body?.email;
    const rawPassword = req.body?.password;
    const rawNombre = req.body?.nombre_completo ?? req.body?.nombre;

    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string' || typeof rawNombre !== 'string') {
      return res.status(400).json({
        error: 'Todos los campos son obligatorios',
      });
    }

    const email = rawEmail.trim().toLowerCase();
    const nombreCompleto = rawNombre.trim();

    if (!email || !nombreCompleto || !rawPassword) {
      return res.status(400).json({
        error: 'Todos los campos son obligatorios',
      });
    }

    if (email.length > 255 || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        error: 'El formato del correo electrónico no es válido',
      });
    }

    if (nombreCompleto.length > 150) {
      return res.status(400).json({
        error: 'El nombre completo no puede superar los 150 caracteres',
      });
    }

    const hasValidLength = rawPassword.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(rawPassword);
    const hasNumber = /[0-9]/.test(rawPassword);

    if (!hasValidLength || !hasLetter || !hasNumber) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres e incluir letras y números',
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 LIMIT 1',
      [email]
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return res.status(409).json({
        error: 'El correo electrónico ya está registrado',
      });
    }

    const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);

    const insertResult = await pool.query(
      `INSERT INTO usuarios (email, password_hash, nombre_completo)
       VALUES ($1, $2, $3)
       RETURNING id, email, nombre_completo, created_at`,
      [email, passwordHash, nombreCompleto]
    );

    return res.status(201).json({
      user: insertResult.rows[0],
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505') {
      return res.status(409).json({
        error: 'El correo electrónico ya está registrado',
      });
    }

    return res.status(500).json({
      error: 'Error interno al registrar el usuario',
    });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const rawEmail = req.body?.email;
    const rawPassword = req.body?.password;

    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    const email = rawEmail.trim().toLowerCase();

    if (!email || !rawPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, nombre_completo, created_at
       FROM usuarios
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    const isPasswordValid = await bcrypt.compare(rawPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    if (!env.jwt.secret) {
      return res.status(500).json({
        error: 'Error interno de autenticación',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre_completo: user.nombre_completo,
        created_at: user.created_at,
      },
    });
  } catch {
    return res.status(500).json({
      error: 'Error interno al iniciar sesión',
    });
  }
});

router.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'No autorizado',
      });
    }

    const result = await pool.query(
      `SELECT id, email, nombre_completo, created_at
       FROM usuarios
       WHERE id = $1
       LIMIT 1`,
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'No autorizado',
      });
    }

    return res.status(200).json({
      user,
    });
  } catch {
    return res.status(500).json({
      error: 'Error interno al obtener el perfil',
    });
  }
});

export default router;

