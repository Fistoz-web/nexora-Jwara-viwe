import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const uuid = z.string().uuid();

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_conversations")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ conversationId: uuid }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, message, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { messages: messages ?? [] };
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ title: z.string().min(1).max(200).optional() }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("chat_conversations")
      .insert({ user_id: context.userId, title: data.title ?? "New conversation" })
      .select("id, title, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const renameConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ conversationId: uuid, title: z.string().min(1).max(200) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_conversations")
      .update({ title: data.title })
      .eq("id", data.conversationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ conversationId: uuid }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_conversations")
      .delete()
      .eq("id", data.conversationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
