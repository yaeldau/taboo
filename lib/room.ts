import { customAlphabet } from "nanoid";

// 6-char alphanumeric (lowercase), ~1B possible rooms — plenty for MVP
const generateId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function createRoomId(): string {
  return generateId();
}
