# Plan — Image crop integration for `admin/media`

> พอร์ตระบบ crop ภาพจาก `E:\tiers-list` มาใช้ใน `src/app/(admin)/admin/media` ของ house-peach
>
> สถานะ: **approved — ready to implement** (decisions §3 ตอบครบ 2026-05-11)

---

## 1. สิ่งที่อยู่ใน `E:\tiers-list` (ที่จะดูดมา)

| ไฟล์ | บทบาท | บรรทัด |
|---|---|---|
| `src/lib/image-upload-config.ts` | **constants** — target size, zoom range, output mime/extension, mime allowlist | 21 |
| `src/lib/image-processing.ts` | **pure functions** — `loadImageMetrics`, `getCropBounds`, `clampCropState`, `getCenteredCropState`, `nextCropStateForZoom`, `createCroppedImageFile` (canvas draw + `toBlob('image/webp', 0.92)`) | 265 |
| `src/components/common/image-crop-dialog.tsx` | **client UI** — portal-based dialog, pointer drag canvas, zoom slider 1×–4×, preview ที่ 320 px, แบ่ง hooks 6 ตัว (`useImageMetricsLoader`, `usePreviewGeometry`, `usePointerDrag`, `useCropConfirm`) | 710 |

### Flow ของ tiers-list

```
user เลือกไฟล์
  ↓
isCroppableImageType(file) ? (jpeg/png/webp)
  ├─ ไม่ใช่ (เช่น gif) → skip crop, upload เลย
  └─ ใช่ → push เข้า pendingCropQueue
       ↓
  ImageCropDialog เปิด (เห็นทีละไฟล์)
       ↓
  user drag + zoom (1×–4×)
       ↓
  ใช้รูปนี้ → createCroppedImageFile()
       ↓
  Canvas draw → toBlob('image/webp', 0.92)
       ↓
  return File(webp, ≤5MB) → onConfirm(file)
       ↓
  caller upload file ไป server
```

### ✅ ยืนยันจาก source จริง (post-survey 2026-05-11)

- `ImageCropDialog` มี props `targetWidth/targetHeight` (default 1080×1080) อยู่แล้ว — preset selector ใส่จาก parent ได้ทันที, ไม่ต้องแก้ลึก
- Pure functions ใน `image-processing.ts` รับ `targetWidth/Height` เป็น arg ทุกตัว — flexible พอ
- ใช้ `@/components/ui/button` + `lucide-react` — house-peach มี ✓
- TH messages พร้อมใช้
- `cursor-grab` / `cursor-grabbing` ตรงกับ `.claude/rules/uxui.md §11` ✓
- ใช้ shadcn neutral tokens (`bg-card`, `text-foreground`, `border-border`, `bg-muted`, `text-destructive`, `accent-primary`) — **house-peach `shadcn init` ใส่ tokens เหล่านี้ครบใน globals.css แล้ว ใช้ตรง ๆ ได้ ไม่ต้อง remap**

---

## 2. สิ่งที่ `house-peach` มีอยู่แล้ว (ที่ต้องเข้ากัน)

| ไฟล์ | บทบาท |
|---|---|
| `src/app/api/upload/route.ts` | POST `/api/upload` → `createMediaAsset({ buffer, title, alt, createdById })` |
| `src/lib/services/imageProcess.ts` | sharp validate + re-encode → **3 webp variants** (400 / 800 / original) + `ImageStore` interface |
| `src/lib/services/media.ts` | DB insert `media_assets` row |
| `src/app/(admin)/admin/media/page.tsx` | RSC list + tabs (assets / pairs) |
| `src/components/admin/media/MediaUploadDialog.tsx` | client upload UI — multi-file queue, title/alt fields, optional pair mode (2 ไฟล์ before/after) |

### Flow ปัจจุบัน

เลือกไฟล์ → กรอก title/alt → submit → fetch `/api/upload` (raw file) → server sharp resize → DB row

### ข้อต่างจาก tiers-list

- `ImageStore` interface pluggable + 3 variants (server-side)
- มี media library กลาง + pairs (before/after)
- mime sniff + rate limit ครบ
- ยังไม่มี crop client-side

---

## 3. Decisions (resolved 2026-05-11)

| # | คำถาม | คำตอบ |
|---|---|---|
| A | crop optional หรือ mandatory | **A.1 — optional** (admin เลือก crop หรือข้ามได้, ไฟล์ที่ไม่กด crop ส่งดิบ server resize ปกติ) |
| B | aspect strategy | **B.1 — preset dropdown 5 ตัว** (`1:1` / `16:10` / `3:2` / `2:1` / `free`) |
| C | output strategy | **C.1 — client crop → 1 file → server resize 3 variants** (ใช้ infra เดิม) |
| D | GIF | **D.1 — reject ใน UI + tooltip** (server allowlist ปฏิเสธอยู่แล้ว, UI ป้องกัน confusion) |

### ตีความ "free" preset

mode `free` หมายถึง **upload เดิมไม่ครอป** — ไม่เปิด dialog. row นี้ส่ง raw file ขึ้น server resize ปกติ. ตรงนี้ใช้ได้กับรูปที่ admin จัด aspect มาเองแล้ว (เช่น cover ที่ออกแบบใน Figma แล้ว export 1600×1000 มาตรง ๆ) — preset selector ถูกใช้เป็น UI affordance ที่ชี้แจงให้รู้

> 🔧 **ทางขยาย (อยู่นอก scope นี้):** ถ้าอยากให้ free crop เปิด dialog ลาก crop rectangle ขนาดอะไรก็ได้ — ต้องเพิ่ม resize handles 8 จุดบน CropCanvas + ปรับ `getCropBounds` ให้รับ aspect = null. ประมาณ +2 ชม. นอกเหนือ Phase 1-3

---

## 4. Plan การ port

### Phase 1 — Port pure utilities (15 นาที)

ดูดมา **ไม่แก้** ยกเว้น constants:

| ปลายทาง | ต้นทาง |
|---|---|
| `src/lib/imageCrop/config.ts` ⭐ ใหม่ | `tiers-list/src/lib/image-upload-config.ts` |
| `src/lib/imageCrop/processing.ts` ⭐ ใหม่ | `tiers-list/src/lib/image-processing.ts` |

**สิ่งที่ต้องแก้ใน `config.ts`:**

- ลบ `IMAGE_TARGET_SIZE = 1080`, `IMAGE_RECOMMENDED_SIZE_LABEL`, `IMAGE_RECOMMENDED_RATIO_LABEL` (square-only)
- คง `IMAGE_UPLOAD_LIMIT_BYTES`, `IMAGE_CROP_PREVIEW_SIZE`, `IMAGE_CROP_MIN_ZOOM`, `IMAGE_CROP_MAX_ZOOM`, `IMAGE_OUTPUT_MIME`, `IMAGE_OUTPUT_EXTENSION`, `CROPPABLE_IMAGE_MIME`
- ลบ `LEGACY_UPLOAD_ALLOWED_MIME` (เราเลือก D.1 — ไม่รับ gif)
- เพิ่ม `CROP_PRESETS`:

```ts
export const CROP_PRESETS = {
  square:    { id: 'square',    width: 1080, height: 1080, label: 'Square',       ratioLabel: '1:1' },
  post:      { id: 'post',      width: 1600, height: 1000, label: 'Post cover',   ratioLabel: '16:10' },
  work:      { id: 'work',      width: 1500, height: 1000, label: 'Work cover',   ratioLabel: '3:2' },
  workHero:  { id: 'workHero',  width: 2000, height: 1000, label: 'Work hero',    ratioLabel: '2:1' },
  free:      { id: 'free',      width: null, height: null, label: 'ไม่ครอป',       ratioLabel: '—' },
} as const;
export type CropPresetId = keyof typeof CROP_PRESETS;
```

**สิ่งที่ไม่ต้องแก้ใน `processing.ts`:**

- pure functions ทั้งหมดรับ `targetWidth/Height` เป็น arg อยู่แล้ว — ใช้ใหม่ได้ตรง
- update default value ของ args (ปัจจุบัน `IMAGE_TARGET_SIZE`) → require explicit argument (force caller ส่ง preset เข้ามา)

### Phase 2 — Port crop dialog (20 นาที, **ลดลง 10 นาที** หลังพบว่า theme tokens ใช้ตรง ๆ ได้)

| ปลายทาง | ต้นทาง |
|---|---|
| `src/components/admin/media/ImageCropDialog.tsx` ⭐ ใหม่ | `tiers-list/src/components/common/image-crop-dialog.tsx` |

**สิ่งที่ต้องปรับ:**

1. **Import paths** — `@/lib/image-upload-config` → `@/lib/imageCrop/config`, `@/lib/image-processing` → `@/lib/imageCrop/processing`
2. **shadcn primitives** — `@/components/ui/button` ใช้ตรง ✓
3. **Theme tokens** — **ใช้เดิมได้หมด** (shadcn init ใส่ `--card`, `--foreground`, `--muted-foreground`, `--background`, `--border`, `--destructive`, `--primary`, `--accent` ครบใน `src/app/globals.css` แล้ว). admin tool ใช้ shadcn neutral palette ปกติ — brand tokens (`bg-bg`/`text-ink`) สงวนไว้สำหรับ public site
4. **เพิ่ม props `preset: CropPresetId`** — แทน `targetWidth/Height` ที่ส่งมาจาก parent. ภายใน dialog resolve `CROP_PRESETS[preset]` → ใส่เข้า pure functions
5. **Cursor + reduced motion + a11y** — ผ่านทั้งหมด, ไม่ต้องแตะ

### Phase 3 — Integrate กับ `MediaUploadDialog` (45 นาที)

แก้ `src/components/admin/media/MediaUploadDialog.tsx`:

**State ใหม่:**

```ts
type Row = {
  key: string;
  file: File;                   // original (ก่อน crop)
  croppedFile: File | null;     // ⭐ หลัง crop (ถ้ามี)
  croppedPreviewUrl: string | null;  // ⭐ blob URL สำหรับ thumbnail (revoke ตอน unmount/replace)
  preset: CropPresetId;         // ⭐ aspect preset (default 'post')
  title: string;
  alt: string;
  status: 'pending' | 'cropping' | 'cropped' | 'uploading' | 'done' | 'error';
  assetId?: number;
  error?: string;
};

const [cropTargetKey, setCropTargetKey] = useState<string | null>(null);
```

**UI changes per row:**

- **mime check ตอน addFiles:** ถ้า `file.type === 'image/gif'` → ใส่ status `error` + `error: 'GIF ไม่รองรับ — ใช้ jpeg/png/webp เท่านั้น'` (เลือก D.1)
- เพิ่ม **preset dropdown** ต่อ row — default `'post'` (ใช้บ่อยสุด)
- เพิ่มปุ่ม **"ครอป"** — disabled ถ้า `preset === 'free'` (แสดง hint: "ใช้รูปเดิม ไม่ครอป")
  - กด → `setCropTargetKey(row.key)` เปิด `<ImageCropDialog>`
- ถ้า `status === 'cropped'`: แสดง thumbnail (จาก `croppedPreviewUrl`) แทน file name
- ปุ่ม "ย้อนกลับใช้ต้นฉบับ" ถ้ามี cropped → revoke blob URL + reset

**Submit flow:**

- `upload(row)` → ส่ง `row.croppedFile ?? row.file` ใน FormData

**Dialog mount:**

```tsx
{cropTargetKey && (() => {
  const target = rows.find(r => r.key === cropTargetKey);
  if (!target) return null;
  return (
    <ImageCropDialog
      open
      file={target.file}
      preset={target.preset}
      onCancel={() => setCropTargetKey(null)}
      onConfirm={(croppedFile) => {
        // revoke previous URL if any
        if (target.croppedPreviewUrl) URL.revokeObjectURL(target.croppedPreviewUrl);
        const url = URL.createObjectURL(croppedFile);
        updateRow(cropTargetKey, {
          croppedFile,
          croppedPreviewUrl: url,
          status: 'cropped',
        });
        setCropTargetKey(null);
      }}
    />
  );
})()}
```

**Cleanup on unmount/remove:**

- ทุกที่ที่ replace `croppedFile` หรือ removeRow → revoke `croppedPreviewUrl` (ดู §5 risks)

### Phase 4 — Skipped (decision C, D ไม่ต้องการ DB change หรือ server allowlist expansion)

- ไม่เพิ่ม `crop_preset` column ตาม decision (file metadata เพียงพอ)
- ไม่ขยาย server allowlist (GIF rejected ใน UI)

### Phase 5 — Test (20 นาที)

`src/lib/imageCrop/processing.test.ts`:

- `getCropBounds(2000, 1500, 1, 1080, 1080)` → cropWidth = cropHeight = 1500 (image-aspect 1.33 > target 1, ใช้ height)
- `getCropBounds(2000, 1500, 1, 1600, 1000)` → cropWidth = 2000 × (1000/1600) = ? — verify aspect logic
- `clampCropState` จำกัด offset 0 ≤ x ≤ maxOffsetX
- `getCenteredCropState` คืน offset = maxOffset / 2
- `nextCropStateForZoom` zoom in ที่ center → offset ลดลงตาม cropWidth ใหม่

ใช้ `vitest` + jsdom environment ที่มีอยู่. `loadImageMetrics`/`createCroppedImageFile` ต้องใช้ Image API จริง — skip ใน unit, ทดสอบใน E2E (Phase 9)

E2E (Phase 9 — Playwright):

- เปิด `/admin/media` → upload → preset `post` → ครอป → confirm → verify asset row + 800.webp width ≤ 1600

### Phase 6 — Documentation update

อัปเดต **3 ไฟล์**:

1. **`.claude/rules/content.md`** — เพิ่ม note: "รูปที่ upload เข้า media library สามารถครอปก่อนได้ (1:1 / 16:10 / 3:2 / 2:1) — หรือเลือก `free` upload ดิบ ๆ"
2. **`.claude/skills/image-upload-pipeline/SKILL.md`** — เพิ่ม section "Client-side crop (optional preprocessing)" ก่อนส่ง server
3. **`ARCHITECTURE.md` §13** — เพิ่ม "Image upload pipeline: optional client crop (browser canvas, webp 0.92) → upload → sharp 3 variants (server)"

---

## 5. Risks / pitfalls

- **iOS Safari canvas memory** — รูปต้นฉบับ > 16 MP อาจครอปไม่ขึ้นบน iPhone รุ่นเก่า → cap input ที่ 12 MP หรือ resize in-place ก่อน draw
- **`URL.createObjectURL` leak** — ของ tiers-list revoke ตัว source ใน `finally` แล้ว ✓ แต่เราเพิ่ม `croppedPreviewUrl` ใน Row → ต้อง revoke ตอน:
  - replace cropped (กดครอปใหม่)
  - removeRow
  - unmount MediaUploadDialog
- **Browser quality variance** — `canvas.toBlob('image/webp', 0.92)` คุณภาพต่างกันเล็กน้อยระหว่าง Chrome/Safari/Firefox — ยอมรับได้
- **A11y ของ slider** — `<input type="range">` keyboard arrow ✓ แต่ pointer drag canvas ไม่มี keyboard fallback — เพิ่ม arrow nudge รอบหน้า
- **Jsdom + Image API** — `loadImageMetrics` ใช้ `new Image()` — jsdom ไม่ load จริง. unit test สำหรับ pure functions เท่านั้น, integration ที่ใช้ Image → E2E

---

## 6. Estimated effort

| Phase | เวลา |
|---|---|
| 1. Port utilities + adjust constants (CROP_PRESETS) | 15 min |
| 2. Port dialog (no theme remap) + preset prop | 20 min |
| 3. Integrate กับ MediaUploadDialog (state + dialog mount + blob lifecycle) | 45 min |
| 4. — skipped — | 0 |
| 5. Unit tests for pure functions | 20 min |
| 6. Docs (content rules + skill + ARCHITECTURE) | 15 min |
| **Total** | **~1 ชม. 55 นาที** |

---

## 7. File inventory

### From `E:\tiers-list` (verified 2026-05-11)

```
src/lib/image-upload-config.ts                              (21 lines)
src/lib/image-processing.ts                                 (265 lines)
src/components/common/image-crop-dialog.tsx                 (710 lines)
```

### Existing in `E:\house-peach`

```
src/app/(admin)/admin/media/page.tsx                        (existing — RSC list)
src/components/admin/media/MediaUploadDialog.tsx            (existing — modify in Phase 3)
src/components/admin/media/MediaLibrary.tsx                 (existing — no change)
src/components/admin/media/MediaAssetCard.tsx               (existing — no change)
src/components/admin/media/MediaPairCard.tsx                (existing — no change)
src/app/api/upload/route.ts                                 (existing — no change)
src/lib/services/imageProcess.ts                            (existing — no change)
src/lib/services/media.ts                                   (existing — no change)
src/lib/db/schema/mediaAssets.ts                            (existing — no change, per decision C)
```

### New in house-peach

```
src/lib/imageCrop/config.ts                                 ⭐ NEW (Phase 1)
src/lib/imageCrop/processing.ts                             ⭐ NEW (Phase 1)
src/lib/imageCrop/processing.test.ts                        ⭐ NEW (Phase 5)
src/components/admin/media/ImageCropDialog.tsx              ⭐ NEW (Phase 2)
```

---

## 8. Out of scope (parked)

- **True free crop (resize handle)** — ต้องเพิ่ม resize handles 8 จุด + aspect-null support ใน `getCropBounds`. Estimate +2 ชม. ทำเป็น follow-up ถ้า admin ขอ
- **Keyboard nudge for crop position** — arrow keys เลื่อน crop ทีละ 10px. +30 นาที, add ตอนต้องการ a11y polish
- **Batch crop preset** — ใส่ preset เดียวกับทุกไฟล์ใน queue. +15 นาที
- **Crop history / undo** — เก็บ crop state ของ asset ใน DB ให้ admin re-crop ได้. ต้อง schema change + UX — skip ใน V1
