export type Lang = 'en' | 'th';

type Label = { en: string; th: string };
type Labels = Record<string, Label>;

export const labels = {
  home: { en: 'Home', th: 'หน้าแรก' },
  works: { en: 'Works', th: 'ผลงาน' },
  blog: { en: 'Journal', th: 'บทความ' },
  about: { en: 'About', th: 'เกี่ยวกับเรา' },
  contact: { en: 'Contact', th: 'ติดต่อ' },
  inquireProject: { en: 'Start a project', th: 'เริ่มโปรเจกต์' },
  featuredWork: { en: 'Featured work', th: 'ผลงานเด่น' },
  latestPosts: { en: 'Latest posts', th: 'บทความล่าสุด' },
} as const satisfies Labels;

export type LabelKey = keyof typeof labels;
