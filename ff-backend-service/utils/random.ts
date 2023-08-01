import crypto, { randomBytes } from 'crypto'

export function randomName(bytes = 32): string {
   return crypto.randomBytes(bytes).toString("hex");
}

export function randomNumericString() {
   return parseInt(randomBytes(5).toString("hex"), 16).toString().padStart(8, "0").slice(0, 8);
}