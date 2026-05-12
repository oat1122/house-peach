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
  before: { en: 'Before', th: 'ก่อน' },
  after: { en: 'After', th: 'หลัง' },
  beforeAfterCompare: {
    en: 'Compare before / after',
    th: 'เปรียบเทียบภาพก่อน/หลัง',
  },
  switchToSlider: { en: 'Switch to slider', th: 'เปลี่ยนเป็นโหมดเลื่อน' },
  switchToToggle: { en: 'Switch to toggle', th: 'เปลี่ยนเป็นโหมดสลับ' },
  galleryProcess: { en: 'Process', th: 'ระหว่างทำ' },
  galleryDetail: { en: 'Detail', th: 'รายละเอียด' },
} as const satisfies Labels;

export type LabelKey = keyof typeof labels;
