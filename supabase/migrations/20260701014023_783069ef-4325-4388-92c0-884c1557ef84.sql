
CREATE TABLE public.research_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New research',
  mode text NOT NULL DEFAULT 'deep_analysis',
  complexity text NOT NULL DEFAULT 'professional',
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_sessions TO authenticated;
GRANT ALL ON public.research_sessions TO service_role;
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sessions read" ON public.research_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own sessions insert" ON public.research_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own sessions update" ON public.research_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own sessions delete" ON public.research_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER research_sessions_updated BEFORE UPDATE ON public.research_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX research_sessions_user_updated ON public.research_sessions(user_id, updated_at DESC);

CREATE TABLE public.research_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  message jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_messages TO authenticated;
GRANT ALL ON public.research_messages TO service_role;
ALTER TABLE public.research_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own messages read" ON public.research_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own messages insert" ON public.research_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own messages delete" ON public.research_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX research_messages_session ON public.research_messages(session_id, created_at ASC);

CREATE TABLE public.research_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  storage_path text NOT NULL,
  extracted_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_documents TO authenticated;
GRANT ALL ON public.research_documents TO service_role;
ALTER TABLE public.research_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own docs read" ON public.research_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own docs insert" ON public.research_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own docs delete" ON public.research_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX research_documents_session ON public.research_documents(session_id, created_at DESC);
