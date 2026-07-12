import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { Sparkles, X, Send, Loader2, RefreshCw } from "lucide-react";
import { askAssistant } from "@/lib/hn-pay/ai-assistant.functions";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "اشرح لي كيف أُنشئ منتجًا جديدًا في الكتالوج.",
  "ما الفرق بين الخطة الشهرية والسنوية؟",
  "اكتب لي نصًّا إرشاديًا لصفحة مفاتيح API.",
  "كيف أُصدر استرجاعًا جزئيًا لعميل؟",
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ask = useServerFn(askAssistant);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { messages: next, context: `المسار الحالي: ${pathname}` } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="مساعد HN-PAY"
        className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/50 bg-gradient-to-br from-amber-500/90 to-amber-600/90 text-black shadow-[0_0_30px_rgba(251,191,36,0.45)] transition hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          dir="rtl"
          className="fixed bottom-24 left-5 z-40 flex h-[600px] max-h-[calc(100vh-8rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0a0b14]/95 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/15 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/50 bg-amber-500/15">
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">مساعد HN-PAY</div>
                <div className="text-[10px] uppercase tracking-widest text-amber-300/70">AI Assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setMessages([]); setError(null); }}
                title="محادثة جديدة"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !loading && (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-neutral-400">
                  مرحبًا! أنا مساعد HN-PAY. اسألني عن أي ميزة داخل لوحة التحكم، أو اطلب مني توليد نصوص إرشادية لصفحاتك.
                </p>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right text-xs text-neutral-300 transition hover:border-amber-400/40 hover:bg-amber-500/5 hover:text-white"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "border border-amber-400/30 bg-amber-500/10 text-amber-100"
                      : "border border-white/10 bg-white/[0.04] text-neutral-100"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-neutral-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> يفكّر…
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
                {error}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="border-t border-amber-500/15 bg-black/40 p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="اكتب سؤالك…"
                className="max-h-32 flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-amber-400/50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/20 text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-1.5 text-[9px] text-neutral-600">Enter للإرسال · Shift+Enter لسطر جديد</div>
          </form>
        </div>
      )}
    </>
  );
}
