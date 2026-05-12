/**
 * Pure helpers for resolving work domain enum values to human-readable TH labels.
 * Extracted from page.tsx (where they lived as local constants) so they can be
 * reused by WorkMetaSidebar and future listing pages.
 */

export const ROOM_TYPE_LABELS_TH: Readonly<Record<string, string>> = {
  living: 'ห้องนั่งเล่น',
  bedroom: 'ห้องนอน',
  kitchen: 'ห้องครัว',
  bathroom: 'ห้องน้ำ',
  office: 'ห้องทำงาน',
  outdoor: 'พื้นที่ภายนอก',
  full_house: 'ทั้งบ้าน',
  other: 'อื่น ๆ',
};

export const BUDGET_LABELS_TH: Readonly<Record<string, string>> = {
  under_100k: 'ต่ำกว่า 100,000',
  '100k_300k': '100,000 – 300,000',
  '300k_700k': '300,000 – 700,000',
  '700k_1.5m': '700,000 – 1.5M',
  '1.5m_plus': '1.5M ขึ้นไป',
};

export function resolveRoomTypeLabel(roomType: string): string {
  return ROOM_TYPE_LABELS_TH[roomType] ?? roomType;
}

export function resolveBudgetLabel(budgetRange: string | null): string | null {
  if (!budgetRange) return null;
  return BUDGET_LABELS_TH[budgetRange] ?? budgetRange;
}
