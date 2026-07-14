import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Plus, Ruler } from "lucide-react";
import { EllipsisMenu } from "@/components/ui/EllipsisMenu";
import { ConfirmDestructiveSheet } from "@/components/ActiveSession/ConfirmDestructiveSheet";
import { AddMeasurementSheet } from "@/components/Measurements/AddMeasurementSheet";
import { MeasurementChart } from "@/components/Measurements/MeasurementChart";
import {
  useCreateMeasurement,
  useDeleteMeasurement,
  useMeasurements,
} from "@/hooks/useMeasurements";
import { formatShortDate } from "@/lib/dates";
import { Measurement } from "shared";

export const MeasurementsPage: React.FC = () => {
  const { data: measurements = [], isLoading } = useMeasurements();
  const createMutation = useCreateMeasurement();
  const deleteMutation = useDeleteMeasurement();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Backend already returns entries ordered by date desc, so the first
  // occurrence of each type when grouping is that type's latest entry.
  const byType = useMemo(() => {
    const groups = new Map<string, Measurement[]>();
    for (const entry of measurements) {
      const list = groups.get(entry.type) ?? [];
      list.push(entry);
      groups.set(entry.type, list);
    }
    return groups;
  }, [measurements]);

  const typeList = useMemo(
    () =>
      Array.from(byType.entries()).sort(
        (a, b) =>
          new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime(),
      ),
    [byType],
  );

  const selectedEntries = selectedType ? (byType.get(selectedType) ?? []) : [];
  const latest = selectedEntries[0];
  const chartData = selectedEntries
    .slice()
    .reverse()
    .map((entry) => ({
      formattedDate: formatShortDate(entry.date),
      value: entry.value,
    }));

  return (
    <div className="space-y-6 px-4">
      <div className="sticky top-[env(safe-area-inset-top)] z-10 -mx-4 flex items-center justify-between border-b border-border bg-background px-4 pt-6 pb-4 gap-3">
        <div className="flex items-center gap-3">
          {selectedType && (
            <button
              onClick={() => setSelectedType(null)}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {selectedType ?? "Measurements"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedType
                ? `${selectedEntries.length} logged`
                : "Track body weight and other metrics"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-hover"
          aria-label="Log a measurement"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Loading measurements...
        </div>
      ) : !selectedType ? (
        typeList.length > 0 ? (
          <div className="space-y-2">
            {typeList.map(([type, entries]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className="group flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-border/70 hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <Ruler className="size-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entries[0].value} {entries[0].unit} ·{" "}
                      {formatShortDate(entries[0].date)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Ruler className="mx-auto mb-3 size-8 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              No measurements yet
            </h4>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              Log body weight, waist, or any metric to start tracking trends
              over time.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {latest && (
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Latest
              </p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                {latest.value} {latest.unit}
              </p>
            </div>
          )}

          {chartData.length > 1 && (
            <MeasurementChart data={chartData} unit={latest?.unit ?? ""} />
          )}

          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              History
            </h3>
            <div className="space-y-1">
              {selectedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between border-b border-border/40 py-2 text-sm last:border-0"
                >
                  <span className="text-muted-foreground">
                    {formatShortDate(entry.date)}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-foreground">
                      {entry.value} {entry.unit}
                    </span>
                    <EllipsisMenu
                      ariaLabel="Entry options"
                      items={[
                        {
                          label: "Delete entry",
                          destructive: true,
                          onClick: () => setPendingDeleteId(entry.id),
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AddMeasurementSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        isPending={createMutation.isPending}
        initialType={selectedType ?? undefined}
        onSave={(input) =>
          createMutation.mutate(input, {
            onSuccess: () => setIsAddOpen(false),
          })
        }
      />

      <ConfirmDestructiveSheet
        isOpen={pendingDeleteId !== null}
        title="Delete Entry"
        description="This measurement entry will be permanently removed."
        confirmLabel="Delete"
        confirmPendingLabel="Deleting..."
        cancelLabel="Cancel"
        isPending={deleteMutation.isPending}
        onClose={() => setPendingDeleteId(null)}
        closeAfterConfirm
        onConfirm={() => {
          if (pendingDeleteId) deleteMutation.mutate(pendingDeleteId);
        }}
      />
    </div>
  );
};

export default MeasurementsPage;
