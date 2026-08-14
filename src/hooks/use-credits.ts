import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { createPaymentOrder, verifyPaymentSignature } from "@/lib/archigen.functions";

export type CreditTransaction = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};

export function useCreditHistory(limit = 50) {
  return useQuery({
    queryKey: ["credit-history", limit],
    queryFn: async (): Promise<CreditTransaction[]> => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("id, amount, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });
}

export function useCreatePaymentOrder() {
  const run = useServerFn(createPaymentOrder);
  return useMutation({
    mutationFn: (input: { amountInRupees: number; credits: number; packTitle: string }) =>
      run({ data: input }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  const run = useServerFn(verifyPaymentSignature);
  return useMutation({
    mutationFn: (input: {
      orderId: string;
      paymentId: string;
      signature: string;
      credits: number;
      packTitle: string;
    }) => run({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["credit-history"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function summarize(history: CreditTransaction[] | undefined) {
  const rows = history ?? [];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonth = rows.filter((r) => new Date(r.created_at) >= startOfMonth);
  const spentThisMonth = thisMonth.reduce((sum, r) => sum + (r.amount < 0 ? -r.amount : 0), 0);
  const earnedThisMonth = thisMonth.reduce((sum, r) => sum + (r.amount > 0 ? r.amount : 0), 0);
  const spentAllTime = rows.reduce((sum, r) => sum + (r.amount < 0 ? -r.amount : 0), 0);

  return {
    spentThisMonth,
    earnedThisMonth,
    spentAllTime,
    generations: rows.filter((r) => r.amount < 0).length,
  };
}

export const LOW_CREDIT_THRESHOLD = 6;

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
