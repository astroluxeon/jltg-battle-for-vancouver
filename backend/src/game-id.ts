import {randomInt} from 'crypto';

// Keep O and I; omit the visually similar digits 0 and 1.
export const GAME_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';

export function generateGameId(): string {
  return Array.from({length: 6}, () => GAME_ID_ALPHABET[randomInt(GAME_ID_ALPHABET.length)]!).join('');
}
