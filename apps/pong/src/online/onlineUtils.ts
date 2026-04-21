// Pure helpers — no Supabase dependency, fully testable

export function isValidPassword(s: string): boolean {
  return /^\d{4}$/.test(s);
}

export function defaultRoomTitle(): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `퐁 배틀방 #${n}`;
}

export function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function randomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
