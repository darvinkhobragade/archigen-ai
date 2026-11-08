import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns true when a Supabase session is active.
 * Subscribes to auth state changes so it stays in sync across tabs.
 */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    // Initial check
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));

    // Subscribe to auth state changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setSignedIn(Boolean(session)),
    );

    return () => data.subscription.unsubscribe();
  }, []);

  return signedIn;
}
