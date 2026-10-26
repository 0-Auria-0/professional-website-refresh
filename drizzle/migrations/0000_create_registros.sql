CREATE TABLE public.registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  tipo text NOT NULL,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros TO authenticated;
GRANT ALL ON public.registros TO service_role;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.registros FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.registros FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.registros FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.registros FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX registros_user_idx ON public.registros(user_id, tipo);