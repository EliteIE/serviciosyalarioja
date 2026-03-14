
-- Portfolio items table
CREATE TABLE public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  before_url text NOT NULL,
  after_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio" ON public.portfolio_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio" ON public.portfolio_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio" ON public.portfolio_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Anyone can view provider portfolios (public)
CREATE POLICY "Anyone can view provider portfolios" ON public.portfolio_items
  FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated can view all portfolios" ON public.portfolio_items
  FOR SELECT TO authenticated USING (true);
