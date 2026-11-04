// Protección del PIN docente: solo se guarda un hash PBKDF2 con sal, nunca el PIN.
import type { Profesor } from '../types/models'

const ITERACIONES = 210_000

const aHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

const desdeHex = (hex: string) =>
  Uint8Array.from(hex.match(/.{2}/g) ?? [], (par) => parseInt(par, 16))

async function derivar(pin: string, sal: Uint8Array): Promise<string> {
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal as BufferSource, iterations: ITERACIONES },
    clave,
    256
  )
  return aHex(new Uint8Array(bits))
}

export async function crearCredencial(pin: string): Promise<{ pinHash: string; pinSalt: string }> {
  const sal = crypto.getRandomValues(new Uint8Array(16))
  return { pinHash: await derivar(pin, sal), pinSalt: aHex(sal) }
}

export async function verificarPin(profesor: Profesor, pin: string): Promise<boolean> {
  if (profesor.pinHash && profesor.pinSalt) {
    return (await derivar(pin, desdeHex(profesor.pinSalt))) === profesor.pinHash
  }
  // Perfil creado antes de esta versión, con el PIN en texto plano.
  return profesor.pin === pin
}

/** Copia del perfil sin datos de acceso, para mantener en memoria durante la sesión. */
export function sinCredenciales(profesor: Profesor): Profesor {
  const { pin: _pin, pinHash: _hash, pinSalt: _sal, ...publico } = profesor
  return publico
}

/** Código temporal de 8 caracteres, sin letras ni números que se confundan al dictarlo. */
export function generarCodigoSincronizacion(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 símbolos: el módulo no introduce sesgo
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => alfabeto[b % alfabeto.length]).join('')
}
