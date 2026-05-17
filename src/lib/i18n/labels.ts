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

  // ── Contact page (public /contact) ─────────────────────────────────────
  contactKicker: { en: 'Start a project · เริ่มโปรเจกต์', th: 'Start a project · เริ่มโปรเจกต์' },
  contactHeroTitle: {
    en: "Let's talk about the home you've been dreaming of",
    th: 'มาคุยเรื่องบ้านที่คุณฝันถึงกัน',
  },
  contactHeroLead: {
    en: 'Share a few details about your space — we will reply within 2 business days.',
    th: 'เล่ารายละเอียดเกี่ยวกับห้องของคุณสักหน่อย เราจะตอบกลับภายใน 2 วันทำการ',
  },
  contactFormName: { en: 'Your name', th: 'ชื่อของคุณ' },
  contactFormEmail: { en: 'Email', th: 'อีเมล' },
  contactFormPhone: { en: 'Phone (optional)', th: 'เบอร์โทร (ไม่บังคับ)' },
  contactFormService: { en: 'Service type', th: 'ประเภทบริการ' },
  contactFormBudget: { en: 'Budget range (optional)', th: 'งบประมาณ (ไม่บังคับ)' },
  contactFormBudgetPlaceholder: { en: 'Select a range', th: 'เลือกช่วงงบประมาณ' },
  contactFormDescription: { en: 'Tell us about your project', th: 'เล่าเกี่ยวกับโปรเจกต์ของคุณ' },
  contactFormDescriptionHelp: {
    en: 'Room type, style, timeline, anything that helps us understand your space.',
    th: 'ประเภทห้อง สไตล์ที่ชอบ ช่วงเวลา หรือสิ่งใดก็ตามที่จะช่วยให้เราเข้าใจห้องของคุณ',
  },
  contactFormSubmit: { en: 'Send message', th: 'ส่งข้อความ' },
  contactFormSubmitting: { en: 'Sending…', th: 'กำลังส่ง…' },
  contactSuccessTitle: { en: 'Thank you — message received', th: 'ขอบคุณ — ได้รับข้อความแล้ว' },
  contactSuccessBody: {
    en: 'We will reply to your email within 2 business days.',
    th: 'เราจะตอบกลับทางอีเมลของคุณภายใน 2 วันทำการ',
  },
  contactSuccessSecondaryCta: { en: 'Browse our works', th: 'ดูผลงานของเรา' },
  contactErrorGeneric: {
    en: 'Could not send — please try again.',
    th: 'ส่งข้อความไม่สำเร็จ — ลองใหม่อีกครั้ง',
  },
  // service type labels (public dropdown + admin badge)
  serviceFullDesign: { en: 'Full interior design', th: 'ออกแบบทั้งหมด' },
  serviceConsultation: { en: 'Consultation', th: 'ปรึกษาออกแบบ' },
  servicePartial: { en: 'Partial / single room', th: 'บางส่วน / ห้องเดียว' },
  serviceOther: { en: 'Other', th: 'อื่น ๆ' },
  // ── Admin /inquiries ───────────────────────────────────────────────────
  inquiryStatusNew: { en: 'New', th: 'ใหม่' },
  inquiryStatusContacted: { en: 'Contacted', th: 'ติดต่อแล้ว' },
  inquiryStatusClosed: { en: 'Closed', th: 'ปิดงาน' },

  // ── Home page copy ─────────────────────────────────────────────────────
  homeHeroEyebrow: { en: 'Works', th: 'ผลงาน' },
  homeHeroH1Line1: { en: 'Rooms that feel', th: 'ห้องที่อบอุ่น' },
  homeHeroH1Line2: { en: 'like a hug', th: 'เหมือนกอด' },
  homeHeroLead: {
    en: 'Quiet rooms. Soft details. Genuine warmth.',
    th: 'ห้องดี ไม่ต้องดัง ดีเทลเรียบ อบอุ่มถึงใจ',
  },
  homeHeroCtaPrimary: { en: 'See our work', th: 'ดูผลงาน' },
  homeHeroCtaSecondary: { en: 'Start a project →', th: 'เริ่มโปรเจกต์ →' },
  homeStatsTitle: { en: 'Who we are', th: 'เกี่ยวกับเรา' },
  homeStatsBody: {
    en: 'A warm-tone minimalist studio based in Bangkok',
    th: 'สตูดิโอตกแต่งบ้านแนว warm-tone minimalist กรุงเทพฯ',
  },
  homeStat1Value: { en: '12+', th: '12+' },
  homeStat1Label: { en: 'Projects', th: 'ผลงาน' },
  homeStat2Value: { en: '80+', th: '80+' },
  homeStat2Label: { en: 'Clients', th: 'ลูกค้า' },
  homeStat3Value: { en: '4.9★', th: '4.9★' },
  homeStat3Label: { en: 'Reviews', th: 'รีวิว' },
  homeDiscoverEyebrow: { en: 'Featured work', th: 'ผลงานเด่น' },
  homeDiscoverH2: { en: 'Find work that speaks to you', th: 'ค้นพบงานออกแบบที่ใช่สำหรับคุณ' },
  homeDiscoverBody: {
    en: 'We specialise in warm-tone minimalist interiors at every scale — from a single room to a full house.',
    th: 'เราเชี่ยวชาญงานตกแต่งภายในแนว warm-tone minimalist ทุกขนาดพื้นที่ ตั้งแต่ห้องเดี่ยวจนถึงบ้านทั้งหลัง',
  },
  homeDiscoverSeeAll: { en: 'See all works →', th: 'ดูผลงานทั้งหมด →' },
  homeAboutEyebrow: { en: 'About us', th: 'เกี่ยวกับเรา' },
  homeAboutH2: { en: 'A warm-tone interior studio', th: 'สตูดิโอตกแต่งบ้านสไตล์ warm-tone' },
  homeAboutBody1: {
    en: 'We believe a great home should feel warm — whatever the size.',
    th: 'เราเชื่อว่าบ้านที่ดีควรรู้สึกอบอุ่น ไม่ว่าจะขนาดเท่าไหร่',
  },
  homeAboutBody2: {
    en: 'Working with care for detail — from concept to handover.',
    th: 'ทำงานด้วยความใส่ใจในรายละเอียด ตั้งแต่ concept จนจบโปรเจกต์',
  },
  homeAboutCta: { en: 'Start a project', th: 'เริ่มโปรเจกต์' },
  homeRecentEyebrow: { en: 'Recent works', th: 'ผลงานล่าสุด' },
  homeRecentH2: { en: 'Our latest work', th: 'งานล่าสุดของเรา' },
  homeRecentSeeAll: { en: 'See all works →', th: 'ดูผลงานทั้งหมด →' },
} as const satisfies Labels;

export type LabelKey = keyof typeof labels;
