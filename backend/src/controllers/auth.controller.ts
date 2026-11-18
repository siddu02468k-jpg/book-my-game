import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../db/store';
import { JWT_SECRET, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../types';
import { emailService } from '../utils/emailService';

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, purpose } = req.body;
    if (!email || !String(email).includes('@')) {
      res.status(400).json({ success: false, error: 'A valid email address is required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const actionPurpose = purpose === 'reset_password' ? 'reset_password' : 'register';

    if (actionPurpose === 'register') {
      const existing = store.findUserByEmail(cleanEmail);
      if (existing) {
        res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please sign in with your password.'
        });
        return;
      }
    } else if (actionPurpose === 'reset_password') {
      const existing = store.findUserByEmail(cleanEmail);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'No account registered with this email address. Please sign up first.'
        });
        return;
      }
    }

    const result = await emailService.sendOtp(cleanEmail, actionPurpose);
    if (!result.success) {
      res.status(429).json({ success: false, error: result.message, retryAfter: result.retryAfter });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      previewCode: result.previewCode
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to dispatch verification code.' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, purpose } = req.body;
    if (!email || !code) {
      res.status(400).json({ success: false, error: 'Email and 6-digit verification code are required.' });
      return;
    }

    const result = emailService.verifyOtp(email, code, purpose);
    if (!result.valid) {
      res.status(400).json({ success: false, error: result.error || 'Invalid code.' });
      return;
    }

    res.json({
      success: true,
      message: 'Email address successfully verified!'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Verification failed.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, error: 'Email, verification code, and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = store.findUserByEmail(cleanEmail);
    if (!user) {
      res.status(404).json({ success: false, error: 'No account found with this email address.' });
      return;
    }

    const verifyCheck = emailService.verifyOtp(cleanEmail, otp, 'reset_password');
    if (!verifyCheck.valid) {
      res.status(400).json({ success: false, error: verifyCheck.error || 'Invalid or expired verification code.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.emailVerified = true;
    store.updateUser(user);
    emailService.clearOtp(cleanEmail);

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Password reset failed.' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role, otp } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (store.findUserByEmail(cleanEmail)) {
      res.status(409).json({ success: false, error: 'An account with this email already exists. Please sign in.' });
      return;
    }

    // Email OTP Verification requirement:
    // User must either supply valid OTP or have previously verified OTP in this session
    if (otp) {
      const otpCheck = emailService.verifyOtp(cleanEmail, otp, 'register');
      if (!otpCheck.valid) {
        res.status(400).json({ success: false, error: otpCheck.error || 'Invalid OTP code.' });
        return;
      }
    } else if (!emailService.isEmailVerified(cleanEmail)) {
      res.status(400).json({
        success: false,
        error: 'Please verify your email address using the 6-digit OTP code before completing registration.'
      });
      return;
    }

    emailService.clearOtp(cleanEmail);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
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
      message: 'Account registered and email verified successfully!',
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

    const cleanEmail = String(email).trim().toLowerCase();
    const user = store.findUserByEmail(cleanEmail);
    if (!user) {
      res.status(401).json({ success: false, error: 'No registered account found with this email address. Please register.' });
      return;
    }

    // If user signed up via Google with no password, prompt them to use Google Sign-In
    if (!user.passwordHash && user.authProvider === 'google') {
      res.status(400).json({
        success: false,
        error: 'This account was registered using Google. Please click "Continue with Google" to sign in.'
      });
      return;
    }

    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Incorrect password for this account. Please try again or reset your password.' });
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
