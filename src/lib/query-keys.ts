/**
 * Centralized Query Key factory for TanStack Query.
 * Using a single source of truth prevents cache-miss bugs from typos.
 *
 * Usage:
 *   useQuery({ queryKey: QK.profile() })
 *   queryClient.invalidateQueries({ queryKey: QK.projects() })
 */
export const QK = {
  /** Current user's profile + credit balance */
  profile: () => ["profile"] as const,

  /** All projects for the current user */
  projects: () => ["projects"] as const,

  /** Generations belonging to a specific project */
  projectGenerations: (projectId?: string | null) =>
    projectId ? ["project-generations", projectId] : ["project-generations"],

  /** All generations across all projects */
  allGenerations: () => ["all-generations"] as const,

  /** Count of all generations for dashboard stat */
  totalGenerationsCount: () => ["total-generations-count"] as const,

  /** Credit transaction history */
  creditHistory: (limit = 50) => ["credit-history", limit] as const,

  /** Floor plan canvases */
  floorPlans: (projectId?: string | null) =>
    projectId ? ["floor-plans", projectId] : ["floor-plans"],
} as const;
