-- =====================================================================
-- Contact form persistence.
--
-- Persists submissions from /contacto so we have a paper trail for
-- support requests. Inserts come from the `submit-contact` edge
-- function (anon JWT + IP-based rate limit), so the table itself
-- exposes no INSERT policy to clients — the edge function uses the
-- service role.
--
-- Reads: admins only.
-- =====================================================================

CREATE TYPE public.contact_subject AS ENUM (
  'consulta_general',
  'problema_tecnico',
  'reclamo',
  'sugerencia'
);

CREATE TYPE public.contact_status AS ENUM (
  'new',
  'in_progress',
  'closed'
);

CREATE TABLE public.contact_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  email         text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject       public.contact_subject NOT NULL,
  message       text NOT NULL CHECK (length(message) BETWEEN 10 AND 4000),
  status        public.contact_status NOT NULL DEFAULT 'new',
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  handled_at    timestamptz,
  handled_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_contact_messages_status_created
  ON public.contact_messages (status, created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Admins can read all messages
CREATE POLICY "Admins can read contact messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update status / handled_by
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- No INSERT or DELETE policy — only the edge function (service role)
-- can write, and rows are kept forever for audit purposes.

COMMENT ON TABLE public.contact_messages IS
  'Public contact form submissions. Writes via service role only (submit-contact edge function with IP rate limit). Reads via admin role.';
