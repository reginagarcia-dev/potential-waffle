import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Measurement, MeasurementInput } from "shared";

const MEASUREMENTS_KEY = ["measurements"] as const;

export function useMeasurements() {
  return useQuery<Measurement[]>({
    queryKey: MEASUREMENTS_KEY,
    queryFn: () => apiFetch("/measurements"),
  });
}

export function useCreateMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MeasurementInput) =>
      apiFetch("/measurements", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEASUREMENTS_KEY });
    },
  });
}

export function useDeleteMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/measurements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEASUREMENTS_KEY });
    },
  });
}
