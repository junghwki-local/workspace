import { z } from "zod";

export const consultSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "이름을 2자 이상 입력해 주세요.")
    .max(40, "이름은 40자 이내로 입력해 주세요."),
  phone: z
    .string()
    .trim()
    .min(8, "연락처를 올바르게 입력해 주세요.")
    .max(20, "연락처를 올바르게 입력해 주세요.")
    .regex(/^[0-9+\-\s()]+$/, "숫자와 기호(-, +, (, ), 공백)만 입력할 수 있습니다."),
  email: z
    .string()
    .trim()
    .min(1, "이메일을 입력해 주세요.")
    .email("이메일 형식이 올바르지 않습니다.")
    .max(120, "이메일은 120자 이내로 입력해 주세요."),
  message: z
    .string()
    .trim()
    .min(10, "문의 내용을 10자 이상 입력해 주세요.")
    .max(2000, "문의 내용은 2000자 이내로 입력해 주세요."),
  website: z.string().max(0, "잘못된 요청입니다.").optional().default(""),
});

export type ConsultInput = z.infer<typeof consultSchema>;
