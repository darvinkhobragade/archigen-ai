import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, credits")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return (
        data ?? {
          id: user.id,
          email: user.email ?? null,
          full_name: null,
          avatar_url: null,
          credits: 0,
        }
      );
    },
    staleTime: 30_000,
  });
}

export function initials(profile: Profile | null | undefined) {
  const source = profile?.full_name || profile?.email || "";
  const parts = source
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0])
      .join("") || "U"
  ).toUpperCase();
}
