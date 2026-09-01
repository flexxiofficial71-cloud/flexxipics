import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Retrieve or generate a high-entropy 256-bit cryptographically secure JWT secret
function getSecureJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET;
  if (envSecret && envSecret.trim().length >= 16) {
    return envSecret.trim();
  }

  const dataDir = path.join(process.cwd(), 'data');
  const secretFilePath = path.join(dataDir, '.jwt_secret');

  try {
    if (fs.existsSync(secretFilePath)) {
      const stored = fs.readFileSync(secretFilePath, 'utf-8').trim();
      if (stored && stored.length >= 32) {
        return stored;
      }
    }

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Generate 256-bit high-entropy cryptographic hex secret
    const generatedSecret = `pv_sec_${crypto.randomBytes(32).toString('hex')}`;
    fs.writeFileSync(secretFilePath, generatedSecret, { encoding: 'utf-8', mode: 0o600 });
    return generatedSecret;
  } catch {
    return 'pv_sec_9f4b7a1e8c2d5f0e3a6b8c1d4e7f0a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f';
  }
}

const JWT_SECRET = getSecureJwtSecret();

// In-memory brute force lockout tracking: IP -> { failedAttempts: number, lockedUntil: number }
interface LockoutEntry {
  failedAttempts: number;
  lockedUntil: number;
}

const lockoutStore = new Map<string, LockoutEntry>();

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  static generateAdminToken(payload: { id: string; username: string; role: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  static verifyAdminToken(token: string): { id: string; username: string; role: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as any;
    } catch {
      return null;
    }
  }

  static generateFolderAccessToken(folderId: string): string {
    return jwt.sign({ folderId, access: true }, JWT_SECRET, { expiresIn: '4h' });
  }

  static verifyFolderAccessToken(token: string, folderId: string): boolean {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return decoded && decoded.folderId === folderId;
    } catch {
      return false;
    }
  }

  static generateSignedDownloadToken(mediaId: string): string {
    return jwt.sign({ mediaId, type: 'download' }, JWT_SECRET, { expiresIn: '15m' });
  }

  static verifySignedDownloadToken(token: string, mediaId: string): boolean {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return decoded && decoded.mediaId === mediaId && decoded.type === 'download';
    } catch {
      return false;
    }
  }

  static checkBruteForceLockout(key: string): { isLocked: boolean; remainingSeconds: number } {
    const entry = lockoutStore.get(key);
    if (!entry) return { isLocked: false, remainingSeconds: 0 };

    const now = Date.now();
    if (entry.lockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds };
    }

    if (entry.lockedUntil <= now && entry.lockedUntil !== 0) {
      // Cooldown expired, reset
      lockoutStore.delete(key);
    }

    return { isLocked: false, remainingSeconds: 0 };
  }

  static recordFailedAttempt(key: string): { isNowLocked: boolean; remainingSeconds: number; attempts: number } {
    const now = Date.now();
    const entry = lockoutStore.get(key) || { failedAttempts: 0, lockedUntil: 0 };
    entry.failedAttempts += 1;

    if (entry.failedAttempts >= 5) {
      // 30 second cooldown
      entry.lockedUntil = now + 30 * 1000;
      lockoutStore.set(key, entry);
      return { isNowLocked: true, remainingSeconds: 30, attempts: entry.failedAttempts };
    }

    lockoutStore.set(key, entry);
    return { isNowLocked: false, remainingSeconds: 0, attempts: entry.failedAttempts };
  }

  static clearFailedAttempts(key: string) {
    lockoutStore.delete(key);
  }
}
