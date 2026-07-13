import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { toDayKey } from "@/lib/calendar";
import {
  FinishSessionResponse,
  SessionMutationInput,
  UpdateSetCommand,
  WorkoutSessionResponse,
} from "shared";

/**
 * All server mutations for the active-session page, plus the optimistic
 * cache updates that go with them. Pulled out of ActiveSessionPage so the
 * page component only has to wire handlers to JSX, not also carry ~160
 * lines of mutation/cache-update logic.
 */
export function useSessionMutations(sessionId: string | undefined) {
  const sessionQueryKey = ["session", sessionId] as const;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Consolidated mutation endpoint — every session-mutation command
  // (rename, add/delete exercise, add/delete/update set, settings, notes)
  // goes through this one PATCH.
  const mutation = useMutation({
    mutationFn: (payload: SessionMutationInput) =>
      apiFetch(`/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(sessionQueryKey, updatedSession);
      queryClient.setQueryData(["activeSession"], updatedSession);
      queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });

  // Optimistic toggle mutation — applies status change immediately to the cache
  const toggleMutation = useMutation({
    mutationFn: (
      payload: Required<Pick<UpdateSetCommand, "setId" | "status">>,
    ) =>
      apiFetch(`/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ type: "update_set", ...payload }),
      }),
    onMutate: async ({ setId, status }) => {
      await queryClient.cancelQueries({ queryKey: sessionQueryKey });
      const previous =
        queryClient.getQueryData<WorkoutSessionResponse>(sessionQueryKey);
      queryClient.setQueryData<WorkoutSessionResponse>(
        sessionQueryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            exercises: old.exercises.map((ex) => ({
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId
                  ? {
                      ...s,
                      status,
                      completedAt:
                        status === "completed"
                          ? new Date().toISOString()
                          : null,
                    }
                  : s,
              ),
            })),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(sessionQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });

  const finishSessionMutation = useMutation({
    // Sent as the calendar day this device considers "today" — the backend
    // uses it (not a server-timezone truncation of the completion instant)
    // for day-based milestones, so they agree with what the History page's
    // calendar shows for this same user.
    mutationFn: (notes?: string) =>
      apiFetch(`/sessions/${sessionId}/finish`, {
        method: "POST",
        body: JSON.stringify({
          ...(notes === undefined ? {} : { notes }),
          localDate: toDayKey(new Date()),
        }),
      }),
    onSuccess: (data: FinishSessionResponse) => {
      queryClient.removeQueries({ queryKey: sessionQueryKey });
      queryClient.setQueryData(["activeSession"], null);
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["recentSessions"] });
      navigate(`/session/${sessionId}/summary`, {
        state: { milestones: data.milestones },
      });
    },
  });

  const abandonSessionMutation = useMutation({
    mutationFn: () => apiFetch(`/sessions/${sessionId}/abandon`, { method: "POST" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: sessionQueryKey });
      queryClient.setQueryData(["activeSession"], null);
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      navigate("/");
    },
  });

  return {
    sessionQueryKey,
    mutation,
    toggleMutation,
    finishSessionMutation,
    abandonSessionMutation,
  };
}
