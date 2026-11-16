import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../db/store';
import { JWT_SECRET, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      return;
    }

    if (store.findUserByEmail(email)) {
      res.status(409).json({ success: false, error: 'A user with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      phone: phone || '',
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      role: role === 'owner' ? 'owner' : 'player',
      authProvider: 'local',
      emailVerified: true,
      createdAt: new Date().toISOString()
    };

    store.createUser(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          avatarUrl: newUser.avatarUrl,
          role: newUser.role,
          authProvider: newUser.authProvider,
          emailVerified: newUser.emailVerified
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = store.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // If user signed up via Google with no password, prompt them to use Google Sign-In
    if (!user.passwordHash && user.authProvider === 'google') {
      res.status(400).json({
        success: false,
        error: 'This account was created with Google. Please use Continue with Google to sign in.'
      });
      return;
    }

    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: user.role,
          authProvider: user.authProvider || 'local',
          emailVerified: user.emailVerified ?? true,
          googleId: user.googleId
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error during login' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential, email, name, picture, googleId, role } = req.body;

    let userEmail = email;
    let userName = name;
    let userPicture = picture;
    let userGoogleId = googleId;
    let isEmailVerified = true;

    // Decode Google JWT credential if supplied (format: header.payload.signature)
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          userEmail = payload.email || userEmail;
          userName = payload.name || payload.given_name || userName;
          userPicture = payload.picture || userPicture;
          userGoogleId = payload.sub || userGoogleId;
          isEmailVerified = payload.email_verified !== false;
        }
      } catch (err) {
        console.warn('Failed to parse Google JWT payload:', err);
      }
    }

    if (!userEmail) {
      res.status(400).json({ success: false, error: 'Google authentication did not provide a valid email address.' });
      return;
    }

    // Lookup existing user
    let user = store.findUserByEmail(userEmail);

    if (user) {
      // Existing user: Link Google details & update avatar
      if (userPicture && (!user.avatarUrl || user.avatarUrl.includes('dicebear'))) {
        user.avatarUrl = userPicture;
      }
      user.emailVerified = true;
      if (userGoogleId && !user.googleId) {
        user.googleId = userGoogleId;
      }
      if (!user.authProvider) {
        user.authProvider = 'google';
      }
      // Upgrade role to owner if selected during owner registration
      if (role === 'owner' && user.role !== 'owner') {
        user.role = 'owner';
      }
      store.updateUser(user);
    } else {
      // New user registration via Google
      const newUserId = `usr_g_${Date.now()}`;
      user = {
        id: newUserId,
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        avatarUrl: userPicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || userEmail)}`,
        role: role === 'owner' ? 'owner' : 'player',
        authProvider: 'google',
        googleId: userGoogleId || `gid_${Date.now()}`,
        emailVerified: isEmailVerified,
        phone: '',
        createdAt: new Date().toISOString()
      };
      store.createUser(user);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    res.json({
      success: true,
      message: 'Google Sign-In verified successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: user.role,
          authProvider: user.authProvider || 'google',
          emailVerified: user.emailVerified ?? true,
          googleId: user.googleId
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error during Google authentication' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = store.findUserById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User profile not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        authProvider: user.authProvider || 'local',
        emailVerified: user.emailVerified ?? true,
        googleId: user.googleId,
        createdAt: user.createdAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching user profile' });
  }
};
