// Toda alteração no cardápio (criar, editar, remover) exige a palavra mágica.
// Leitura e pedidos continuam abertos, senão a cidade não conseguiria consultar
// o cardápio nem comer aqui.
//
// O valor vem de MAGIC_WORD (defina na Vercel para trocar). O padrão é a palavra
// mágica de sempre, para o projeto funcionar recém-clonado — se for proteger algo
// que importe, configure a env var.
const DEFAULT_MAGIC_WORD = "por favor";

export function getMagicWord(): string {
  return process.env.MAGIC_WORD?.trim() || DEFAULT_MAGIC_WORD;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isMagicWordValid(attempt: string | undefined): boolean {
  if (!attempt) return false;
  return normalize(attempt) === normalize(getMagicWord());
}

export class MagicWordError extends Error {
  constructor() {
    super("Palavra mágica incorreta. Alterações no cardápio exigem a palavra mágica.");
    this.name = "MagicWordError";
  }
}

export function requireMagicWord(attempt: string | undefined): void {
  if (!isMagicWordValid(attempt)) {
    throw new MagicWordError();
  }
}
