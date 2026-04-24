CREATE TABLE public.attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  challenge_prompt TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  time_taken_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert attempts"
ON public.attempts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read attempts"
ON public.attempts FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX idx_attempts_score ON public.attempts(score);
CREATE INDEX idx_attempts_session ON public.attempts(session_id);