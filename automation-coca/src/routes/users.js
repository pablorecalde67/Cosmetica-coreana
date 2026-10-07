// 👤 ADVANCED USER MANAGEMENT
// Registro, login, perfil, historial de compras

import express from 'express';
import { nanoid } from 'nanoid';
import { authLimiter } from '../middleware/security.js';

const router = express.Router();

// In-memory user storage (usar DB en producción)
const users = new Map();
const sessions = new Map();

// Generate JWT-like token (simple version)
function generateToken() {
  return `token_${nanoid(32)}`;
}

// Middleware: Verify token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  req.userId = session.userId;
  req.user = users.get(session.userId);
  next();
}

// POST /api/users/register - Register new user
router.post('/register', authLimiter, (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Campos requeridos: email, password, name' });
    }

    // Check if user exists
    if (Array.from(users.values()).some((u) => u.email === email)) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }

    const userId = nanoid();
    const user = {
      id: userId,
      email,
      password, // En producción: hashear con bcrypt
      name,
      phone,
      createdAt: new Date(),
      profile: {
        avatar: null,
        bio: '',
        addresses: [],
      },
      orders: [],
      wishlist: [],
      preferences: {
        newsletter: true,
        notifications: true,
      },
    };

    users.set(userId, user);

    // Create session
    const token = generateToken();
    sessions.set(token, {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
      message: 'Usuario registrado exitosamente',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en registro' });
  }
});

// POST /api/users/login - Login user
router.post('/login', authLimiter, (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    // Find user by email
    const user = Array.from(users.values()).find((u) => u.email === email);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Email o password inválido' });
    }

    // Create session
    const token = generateToken();
    sessions.set(token, {
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
      message: 'Login exitoso',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en login' });
  }
});

// GET /api/users/me - Get current user profile
router.get('/me', verifyToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      phone: req.user.phone,
      profile: req.user.profile,
      createdAt: req.user.createdAt,
    },
  });
});

// PUT /api/users/profile - Update profile
router.put('/profile', verifyToken, (req, res) => {
  try {
    const { name, phone, avatar, bio } = req.body;

    if (name) req.user.name = name;
    if (phone) req.user.phone = phone;
    if (avatar) req.user.profile.avatar = avatar;
    if (bio) req.user.profile.bio = bio;

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        profile: req.user.profile,
      },
      message: 'Perfil actualizado',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// POST /api/users/address - Add shipping address
router.post('/address', verifyToken, (req, res) => {
  try {
    const { street, city, state, zipCode, country, isDefault } = req.body;

    const address = {
      id: nanoid(),
      street,
      city,
      state,
      zipCode,
      country,
      isDefault: isDefault || false,
    };

    if (isDefault) {
      req.user.profile.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    req.user.profile.addresses.push(address);

    res.json({
      success: true,
      address,
      message: 'Dirección agregada',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar dirección' });
  }
});

// GET /api/users/orders - Get order history
router.get('/orders', verifyToken, (req, res) => {
  res.json({
    orders: req.user.orders,
    total: req.user.orders.length,
  });
});

// GET /api/users/wishlist - Get wishlist
router.get('/wishlist', verifyToken, (req, res) => {
  res.json({
    wishlist: req.user.wishlist,
    total: req.user.wishlist.length,
  });
});

// POST /api/users/wishlist - Add to wishlist
router.post('/wishlist', verifyToken, (req, res) => {
  try {
    const { productId } = req.body;

    if (!req.user.wishlist.includes(productId)) {
      req.user.wishlist.push(productId);
    }

    res.json({
      success: true,
      wishlist: req.user.wishlist,
      message: 'Producto agregado a favoritos',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar a favoritos' });
  }
});

// POST /api/users/logout - Logout
router.post('/logout', verifyToken, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    sessions.delete(token);
  }

  res.json({
    success: true,
    message: 'Sesión cerrada',
  });
});

export default router;
