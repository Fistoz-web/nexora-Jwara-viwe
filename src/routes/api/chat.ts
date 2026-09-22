import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import {
  createLovableResponsesProvider,
  NEXORA_CHAT_MODEL,
  NEXORA_RESPONSES_PROVIDER_OPTIONS,
} from "@/lib/ai-gateway.server";
import { NEXORA_SYSTEM_PROMPT } from "@/lib/nexora-system-prompt";

type Body = { conversationId?: string; messages?: UIMessage[] };

function textOf(message: UIMessage): string {
  return (message.parts ?? [])
    .map((p) => (p.type === "text" ? (p as { text: string }).text : ""))
    .join(" ")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) {
          return new Response("Nexora AI is not configured", { status: 500 });
        }

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });
        const { data: userData, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !userData?.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as Body;
        if (!body.conversationId || !Array.isArray(body.messages) || body.messages.length === 0) {
          return new Response("Invalid request", { status: 400 });
        }

        const { data: conversation } = await supabase
          .from("chat_conversations")
          .select("id, user_id, title")
          .eq("id", body.conversationId)
          .maybeSingle();
        if (!conversation || conversation.user_id !== userId) {
          return new Response("Forbidden", { status: 403 });
        }

        const lastMsg = body.messages[body.messages.length - 1];
        if (lastMsg?.role === "user") {
          await supabase.from("chat_messages").insert({
            conversation_id: body.conversationId,
            user_id: userId,
            role: "user",
            message: JSON.parse(JSON.stringify(lastMsg)),
          });
          const { count } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", body.conversationId);
          if ((count ?? 0) <= 1) {
            const title = textOf(lastMsg).slice(0, 70);
            if (title) {
              await supabase
                .from("chat_conversations")
                .update({ title })
                .eq("id", body.conversationId);
            }
          }
        }

        const lovable = createLovableResponsesProvider(LOVABLE_API_KEY);

        const result = streamText({
          model: lovable.responses(NEXORA_CHAT_MODEL),
          system: NEXORA_SYSTEM_PROMPT,
          messages: await convertToModelMessages(body.messages),
          providerOptions: NEXORA_RESPONSES_PROVIDER_OPTIONS as unknown as Record<
            string,
            Record<string, never>
          >,
          abortSignal: request.signal,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          sendReasoning: false,
          onFinish: async ({ responseMessage }) => {
            await supabase.from("chat_messages").insert({
              conversation_id: body.conversationId!,
              user_id: userId,
              role: "assistant",
              message: JSON.parse(JSON.stringify(responseMessage)),
            });
            await supabase
              .from("chat_conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", body.conversationId!);
          },
        });
      },
    },
  },
});
