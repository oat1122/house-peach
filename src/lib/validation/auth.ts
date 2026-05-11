import { z } from 'zod';

export const SignInInput = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});
export type SignInInput = z.infer<typeof SignInInput>;
