import * as bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, email: string, role: string, secret: string): string {
  // Simple JWT implementation for edge runtime
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { 
    userId, 
    email, 
    role, 
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };
  
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));
  const signature = btoa(secret + base64Header + base64Payload);
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

export function verifyToken(token: string, secret: string): any {
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = btoa(secret + header + payload);
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    const decoded = JSON.parse(atob(payload));
    
    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

export function generateRandomToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
