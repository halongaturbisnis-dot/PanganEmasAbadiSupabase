/**
 * LIBS/CRYPTO.TS
 * Client-side lightweight data obfuscation/encryption.
 * Note: This is for basic security on stored data, not bank-level security.
 */

// Simple Base64-based obfuscation (Lightweight)
export const obfuscate = (data: string): string => {
  return btoa(unescape(encodeURIComponent(data)));
};

export const deobfuscate = (data: string): string => {
  return decodeURIComponent(escape(atob(data)));
};

/**
 * Advanced: Using Web Crypto API for real AES encryption (if needed)
 * This requires asynchronous operations.
 */
export const encryptData = async (data: string, secretKey: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const keyBytes = encoder.encode(secretKey);

  const hash = await crypto.subtle.digest('SHA-256', keyBytes);
  const key = await crypto.subtle.importKey(
    'raw', 
    hash, 
    { name: 'AES-GCM' }, 
    false, 
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, 
    key, 
    dataBytes
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...Array.from(combined)));
};

export const decryptData = async (encryptedBase64: string, secretKey: string): Promise<string> => {
  try {
    const combined = new Uint8Array(
      atob(encryptedBase64).split('').map((c) => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(secretKey);
    const hash = await crypto.subtle.digest('SHA-256', keyBytes);
    const key = await crypto.subtle.importKey(
      'raw', 
      hash, 
      { name: 'AES-GCM' }, 
      false, 
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, 
      key, 
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error('Decryption failed', e);
    return '';
  }
};
