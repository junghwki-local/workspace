"use server";

import { consultSchema } from "@/lib/schemas";

export type ConsultState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export async function submitConsult(
  _prev: ConsultState,
  formData: FormData,
): Promise<ConsultState> {
  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  };

  const parsed = consultSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "입력값을 확인해 주세요.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Honeypot tripped: pretend success to avoid signaling the bot.
  if (parsed.data.website) {
    return { status: "success", message: "문의가 정상적으로 접수되었습니다." };
  }

  // TODO(phase-4): persist to WordPress / send email via Resend.
  // Rate limiting and IP-based throttling will be added alongside the backend.

  return { status: "success", message: "문의가 정상적으로 접수되었습니다." };
}
