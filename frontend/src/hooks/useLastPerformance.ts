import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { LastPerformanceResponse, Unit } from "shared";

export function useLastPerformance(
  exerciseDefinitionId: string | undefined,
  unit: Unit,
) {
  return useQuery<LastPerformanceResponse>({
    queryKey: ["exercise-last-performance", exerciseDefinitionId, unit] as const,
    queryFn: () =>
      apiFetch(`/exercises/${exerciseDefinitionId}/last-performance?unit=${unit}`),
    enabled: !!exerciseDefinitionId,
  });
}
