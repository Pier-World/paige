// Encryption utilities for OAuth tokens using AES-GCM
// Uses Web Crypto API with the MASTER_ENCRYPTION_KEY

const ENCRYPTION_KEY_RAW = Deno.env.get('MASTER_ENCRYPTION_KEY');

if (!ENCRYPTION_KEY_RAW) {
  throw new Error('MASTER_ENCRYPTION_KEY environment variable is required');
}

// Convert the key string to a CryptoKey for AES-GCM
// The key should be 32 bytes (256 bits) for AES-256-GCM
// If provided as base64, decode it; otherwise use it directly as UTF-8
let encryptionKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (encryptionKey) {
    return encryptionKey;
  }

  try {
    // Try to decode as base64 first
    let keyBytes: Uint8Array;
    try {
      const decoded = Uint8Array.from(atob(ENCRYPTION_KEY_RAW), (c) => c.charCodeAt(0));
      keyBytes = decoded;
    } catch {
      // If not base64, treat as UTF-8 and derive key
      const encoder = new TextEncoder();
      const keyData = encoder.encode(ENCRYPTION_KEY_RAW);
      // Use HKDF or simple hash to derive 32-byte key
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
      keyBytes = new Uint8Array(hashBuffer);
    }

    // Ensure key is exactly 32 bytes for AES-256
    if (keyBytes.length !== 32) {
      // Hash to get exactly 32 bytes
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyBytes);
      keyBytes = new Uint8Array(hashBuffer);
    }

    encryptionKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    return encryptionKey;
  } catch (error) {
    throw new Error(`Failed to initialize encryption key: ${error.message}`);
  }
}

export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return '';

  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate a random 12-byte IV (initialization vector) for GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt using AES-GCM
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    // Combine IV and ciphertext, then encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Encode as base64 for storage
    const base64 = btoa(String.fromCharCode(...combined));
    return base64;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

export async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext) return '';

  try {
    const key = await getEncryptionKey();

    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

    // Extract IV (first 12 bytes) and ciphertext (rest)
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Decrypt using AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encrypted
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}

