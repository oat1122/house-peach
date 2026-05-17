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
  // Work meta field labels (sidebar + mobile strip)
  metaRoomType: { en: 'Type', th: 'ประเภทห้อง' },
  metaStyle: { en: 'Style', th: 'สไตล์' },
  metaYear: { en: 'Year completed', th: 'ปีที่เสร็จ' },
  metaLocation: { en: 'Location', th: 'สถานที่' },
  metaArea: { en: 'Area (sq.m.)', th: 'พื้นที่ (ตร.ม.)' },
  metaBudget: { en: 'Budget (THB)', th: 'งบประมาณ (บาท)' },
  // Work gallery section labels
  sectionBeforeAfter: { en: 'Before & After', th: 'ก่อน/หลัง' },
  sectionProcess: { en: 'Process', th: 'กระบวนการ' },
  sectionDetails: { en: 'Details', th: 'รายละเอียด' },
  // Room type labels (TH)
  roomLiving: { en: 'Living room', th: 'ห้องนั่งเล่น' },
  roomBedroom: { en: 'Bedroom', th: 'ห้องนอน' },
  roomKitchen: { en: 'Kitchen', th: 'ห้องครัว' },
  roomBathroom: { en: 'Bathroom', th: 'ห้องน้ำ' },
  roomOffice: { en: 'Home office', th: 'ห้องทำงาน' },
  roomOutdoor: { en: 'Outdoor', th: 'พื้นที่ภายนอก' },
  roomFullHouse: { en: 'Full house', th: 'ทั้งบ้าน' },
  roomOther: { en: 'Other', th: 'อื่น ๆ' },
  // Budget range labels (TH)
  budgetUnder100k: { en: 'Under 100,000', th: 'ต่ำกว่า 100,000' },
  budget100k300k: { en: '100,000 – 300,000', th: '100,000 – 300,000' },
  budget300k700k: { en: '300,000 – 700,000', th: '300,000 – 700,000' },
  budget700k1_5m: { en: '700,000 – 1.5M', th: '700,000 – 1.5M' },
  budget1_5mPlus: { en: '1.5M+', th: '1.5M ขึ้นไป' },
  projectInfo: { en: 'Project info', th: 'ข้อมูลโปรเจกต์' },

  // ── Blog post detail + listing ─────────────────────────────────────────
  breadcrumbBlog: { en: 'Journal', th: 'บทความ' },
  byAuthor: { en: 'By', th: 'โดย' },
  readingMinutes: { en: 'min read', th: 'นาที' },
  tableOfContents: { en: 'Table of contents', th: 'สารบัญ' },
  sharePost: { en: 'Share this post', th: 'แชร์บทความ' },
  copyLink: { en: 'Copy link', th: 'คัดลอกลิงก์' },
  copySuccess: { en: 'Copied!', th: 'คัดลอกแล้ว' },
  backToBlog: { en: 'Back to all posts', th: 'กลับบทความทั้งหมด' },
  relatedPosts: { en: 'You might also like', th: 'บทความที่คุณอาจสนใจ' },
  recentPosts: { en: 'Recent posts', th: 'บทความล่าสุด' },
  readMore: { en: 'Read more', th: 'อ่านเพิ่มเติม' },
  backToTop: { en: 'Back to top', th: 'กลับขึ้นด้านบน' },
  ctaKicker: { en: 'Interior design service', th: 'บริการตกแต่งบ้าน' },
  ctaTitle: { en: 'Ready to transform your space?', th: 'พร้อมเปลี่ยนห้องของคุณ?' },
  ctaDesc: {
    en: 'Our team is ready to listen — no obligation.',
    th: 'ทีมเราพร้อมรับฟัง ไม่มีข้อผูกมัด',
  },
  ctaButton: { en: 'Start a conversation', th: 'เริ่มบทสนทนา' },
  blogListingTitle: { en: 'Journal', th: 'บทความ' },
  blogListingSubtitle: {
    en: 'Inspiration, techniques, and stories from house-peach',
    th: 'แรงบันดาลใจ เทคนิค และเรื่องราวเบื้องหลัง house-peach',
  },
  filterAll: { en: 'All', th: 'ทั้งหมด' },
  shareToFacebook: { en: 'Share to Facebook', th: 'แชร์ไปยัง Facebook' },
  shareToX: { en: 'Share to X', th: 'แชร์ไปยัง X' },
  shareToLine: { en: 'Share to LINE', th: 'แชร์ไปยัง LINE' },
} as const satisfies Labels;

export type LabelKey = keyof typeof labels;
