import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
  context: z.string().max(2000).optional(),
});

const SYSTEM_PROMPT = `أنت "مساعد HN-PAY"، مساعد ذكاء اصطناعي داخل لوحة تحكم منصة HN-PAY المالية لمجموعة HN.
- أجب بالعربية الفصحى المبسّطة افتراضيًا، وبنفس لغة المستخدم إن كتب بلغة أخرى.
- ساعد المشرفين وأصحاب المواقع في: إدارة المنتجات والخدمات، المدفوعات، الاشتراكات، الاسترجاعات، مفاتيح API، Webhooks، الفواتير، والتقارير.
- عند طلب "نص إرشادي" أو "شرح ميزة"، اكتب فقرات قصيرة واضحة بصيغة تعليمات عملية.
- لا تخترع بيانات مالية أو أرقام حقيقية. إن نقص السياق اطلب توضيحًا موجزًا.
- استخدم Markdown خفيف (عناوين قصيرة، قوائم، **تمييز**) عند الحاجة.`;

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY غير مُعرَّف في أسرار المشروع.");
    }

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT + (data.context ? `\n\nسياق الصفحة: ${data.context}` : "") },
      ...data.messages,
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`فشل الاتصال بمزوّد الذكاء الاصطناعي (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };
    const reply = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) throw new Error("لم يتم استلام ردّ من المساعد.");

    return { reply, tokens: json.usage?.total_tokens ?? 0 };
  });
