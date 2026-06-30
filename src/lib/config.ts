export const siteConfig = {
  phone: '',
  hours: 'จันทร์ - เสาร์: 09:00 - 18:00',
  hoursEn: 'Mon - Sat: 09:00 - 18:00',
  socials: { instagram: '', facebook: '', pinterest: '' },
} as const;

export function getActiveSocials(): string[] {
  return Object.values(siteConfig.socials).filter(Boolean);
}

export function getActivePhone(): string | null {
  return siteConfig.phone || null;
}
