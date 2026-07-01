import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const uuid = z.string().uuid();

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("research_sessions")
      .select("id, title, mode, complexity, is_favorite, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ sessionId: uuid }).parse(i))
  .handler(async ({ data, context }) => {
    const [{ data: session }, { data: messages }, { data: documents }] = await Promise.all([
      context.supabase.from("research_sessions").select("*").eq("id", data.sessionId).maybeSingle(),
      context.supabase
        .from("research_messages")
        .select("id, message, created_at")
        .eq("session_id", data.sessionId)
        .order("created_at", { ascending: true }),
      context.supabase
        .from("research_documents")
        .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
        .eq("session_id", data.sessionId)
        .order("created_at", { ascending: true }),
    ]);
    if (!session) throw new Error("Session not found");
    return { session, messages: messages ?? [], documents: documents ?? [] };
  });

export const createSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200).optional(),
        mode: z.string().optional(),
        complexity: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("research_sessions")
      .insert({
        user_id: context.userId,
        title: data.title ?? "New research",
        mode: data.mode ?? "deep_analysis",
        complexity: data.complexity ?? "professional",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        sessionId: uuid,
        title: z.string().min(1).max(200).optional(),
        mode: z.string().optional(),
        complexity: z.string().optional(),
        is_favorite: z.boolean().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { sessionId, ...patch } = data;
    const { error } = await context.supabase.from("research_sessions").update(patch).eq("id", sessionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ sessionId: uuid }).parse(i))
  .handler(async ({ data, context }) => {
    // Best-effort: delete storage objects for this session
    const { data: docs } = await context.supabase
      .from("research_documents")
      .select("storage_path")
      .eq("session_id", data.sessionId);
    const paths = (docs ?? []).map((d) => d.storage_path).filter(Boolean);
    if (paths.length) {
      await context.supabase.storage.from("research-uploads").remove(paths);
    }
    const { error } = await context.supabase.from("research_sessions").delete().eq("id", data.sessionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        sessionId: uuid,
        fileName: z.string().min(1).max(500),
        mimeType: z.string().min(1).max(200),
        sizeBytes: z.number().int().nonnegative(),
        storagePath: z.string().min(1),
        extractedText: z.string().max(400_000).nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("research_documents")
      .insert({
        session_id: data.sessionId,
        user_id: context.userId,
        file_name: data.fileName,
        mime_type: data.mimeType,
        size_bytes: data.sizeBytes,
        storage_path: data.storagePath,
        extracted_text: data.extractedText ?? null,
      })
      .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase
      .from("research_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.sessionId);
    return row;
  });

export const removeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ documentId: uuid }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("research_documents")
      .select("storage_path")
      .eq("id", data.documentId)
      .maybeSingle();
    if (doc?.storage_path) {
      await context.supabase.storage.from("research-uploads").remove([doc.storage_path]);
    }
    const { error } = await context.supabase.from("research_documents").delete().eq("id", data.documentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
