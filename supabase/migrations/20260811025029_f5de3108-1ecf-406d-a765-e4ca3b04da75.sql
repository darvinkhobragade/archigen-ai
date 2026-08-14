CREATE OR REPLACE FUNCTION public.spend_credits(_cost integer, _reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _left integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _cost IS NULL OR _cost < 0 THEN
    RAISE EXCEPTION 'Invalid credit cost';
  END IF;

  UPDATE public.profiles
     SET credits = credits - _cost
   WHERE id = _uid AND credits >= _cost
   RETURNING credits INTO _left;

  IF _left IS NULL THEN
    RAISE EXCEPTION 'Not enough credits';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason)
  VALUES (_uid, -_cost, COALESCE(_reason, 'generation'));

  RETURN _left;
END;
$$;

REVOKE ALL ON FUNCTION public.spend_credits(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_credits(integer, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.refund_credits(_amount integer, _reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _left integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Invalid refund amount';
  END IF;

  UPDATE public.profiles
     SET credits = credits + _amount
   WHERE id = _uid
   RETURNING credits INTO _left;

  INSERT INTO public.credit_transactions (user_id, amount, reason)
  VALUES (_uid, _amount, COALESCE(_reason, 'refund'));

  RETURN _left;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_credits(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_credits(integer, text) TO authenticated, service_role;