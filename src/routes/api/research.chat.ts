import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  buildSystemPrompt,
  RESEARCH_MODES,
  COMPLEXITY_LEVELS,
  type ResearchMode,
  type Complexity,
} from "@/lib/research-prompts";

type Body = {
  sessionId?: string;
  messages?: UIMessage[];
  mode?: ResearchMode;
  complexity?: Complexity;
};

export const Route = createFileRoute("/api/research/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });
        const { data: userData, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !userData?.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as Body;
        if (!body.sessionId || !Array.isArray(body.messages)) {
          return new Response("Invalid request", { status: 400 });
        }
        const mode: ResearchMode = (body.mode && body.mode in RESEARCH_MODES ? body.mode : "deep_analysis") as ResearchMode;
        const complexity: Complexity = (body.complexity && body.complexity in COMPLEXITY_LEVELS
          ? body.complexity
          : "professional") as Complexity;

        // Verify session ownership + load documents
        const { data: session } = await supabase
          .from("research_sessions")
          .select("id, user_id")
          .eq("id", body.sessionId)
          .maybeSingle();
        if (!session || session.user_id !== userId) return new Response("Forbidden", { status: 403 });

        const { data: docs } = await supabase
          .from("research_documents")
          .select("id, file_name, mime_type, extracted_text, storage_path")
          .eq("session_id", body.sessionId);

        // Build context block from documents. For PDFs we could send multimodal parts, but to keep
        // this reliable across models we inline extracted text (extractor runs client-side before upload).
        let docContext = "";
        if (docs && docs.length) {
          const parts = docs.slice(0, 8).map((d, i) => {
            const text = (d.extracted_text ?? "").slice(0, 60_000);
            return `\n\n--- Document ${i + 1}: ${d.file_name} (${d.mime_type}) ---\n${text || "[no extractable text — refer to file name only]"}`;
          });
          docContext = `\n\nATTACHED DOCUMENTS (${docs.length}):${parts.join("")}\n\n--- End of documents ---`;
        }

        const system = buildSystemPrompt(mode, complexity, (docs?.length ?? 0) > 0) + docContext;

        const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
        const model = gateway("google/gemini-3-flash-preview");

        // Persist the latest user message before streaming
        const lastMsg = body.messages[body.messages.length - 1];
        if (lastMsg && lastMsg.role === "user") {
          await supabase.from("research_messages").insert({
            session_id: body.sessionId,
            user_id: userId,
            role: "user",
            message: lastMsg as unknown as object,
          });
          // Auto-title on first message
          const { count } = await supabase
            .from("research_messages")
            .select("id", { count: "exact", head: true })
            .eq("session_id", body.sessionId);
          if ((count ?? 0) <= 1) {
            const firstText = (lastMsg.parts ?? [])
              .map((p) => (p.type === "text" ? (p as { text: string }).text : ""))
              .join(" ")
              .slice(0, 80);
            if (firstText) {
              await supabase
                .from("research_sessions")
                .update({ title: firstText })
                .eq("id", body.sessionId);
            }
          }
        }

        const result = streamText({
          model,
          system,
          messages: convertToModelMessages(body.messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          onFinish: async ({ responseMessage }) => {
            await supabase.from("research_messages").insert({
              session_id: body.sessionId!,
              user_id: userId,
              role: "assistant",
              message: responseMessage as unknown as object,
            });
            await supabase
              .from("research_sessions")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", body.sessionId!);
          },
        });
      },
    },
  },
});
