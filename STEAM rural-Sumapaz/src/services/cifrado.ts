// Cifrado AES-256-GCM con clave derivada por PBKDF2, para respaldos y sincronización en red.

const ITERACIONES = 210_000
const FORMATO = 'steam-rural-cifrado'

type Sobre = {
  formato: typeof FORMATO
  version: 1
  iteraciones: number
  sal: string
  iv: string
  datos: string
}

function aBase64(bytes: Uint8Array): string {
  let binario = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binario)
}

function desdeBase64(texto: string): Uint8Array<ArrayBuffer> {
  const binario = atob(texto)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

async function materialDeClave(secreto: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ])
}

async function derivarClave(secreto: string, sal: Uint8Array<ArrayBuffer>, iteraciones: number) {
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteraciones },
    await materialDeClave(secreto),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function cifrarTexto(texto: string, secreto: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const clave = await derivarClave(secreto, sal, ITERACIONES)
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, clave, new TextEncoder().encode(texto))
  const sobre: Sobre = {
    formato: FORMATO,
    version: 1,
    iteraciones: ITERACIONES,
    sal: aBase64(sal),
    iv: aBase64(iv),
    datos: aBase64(new Uint8Array(cifrado)),
  }
  return JSON.stringify(sobre)
}

export function esSobreCifrado(valor: any): boolean {
  return valor?.formato === FORMATO
}

/** Lanza un Error si la clave es incorrecta o el contenido fue alterado. */
export async function descifrarSobre(sobre: Sobre, secreto: string): Promise<string> {
  try {
    const clave = await derivarClave(secreto, desdeBase64(sobre.sal), sobre.iteraciones)
    const plano = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: desdeBase64(sobre.iv) },
      clave,
      desdeBase64(sobre.datos)
    )
    return new TextDecoder().decode(plano)
  } catch {
    throw new Error('La clave es incorrecta o los datos están dañados.')
  }
}

/**
 * El código visible nunca viaja por la red: de él se deriva este token de acceso,
 * independiente de la clave de cifrado (que usa una sal aleatoria).
 */
export async function tokenDeAcceso(codigo: string): Promise<string> {
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('steam-rural-p2p-acceso'),
      iterations: ITERACIONES,
    },
    await materialDeClave(codigo),
    256
  )
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function normalizarCodigo(codigo: string): string {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, '')
}
