"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PolarArea } from "react-chartjs-2";
import { useMemo } from "react";
import type { AnalyticsFunnelStage } from "@/types/admin-analytics-api";
import {
  formatAnalyticsNumber,
  formatAnalyticsPercent,
  funnelPolarDisplayValue,
  funnelStageShare,
} from "@/lib/analytics-utils";
import { ANALYTICS_CHART_TEXT } from "@/components/admin/analytics/charts/analytics-chart-theme";
import "@/components/admin/analytics/charts/analytics-chart-registry";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  applied: "rgb(255, 99, 132)",
  interviewing: "rgb(255, 205, 86)",
  offer: "rgb(75, 192, 192)",
  failed: "rgb(153, 102, 255)",
};

const FALLBACK_COLORS = [
  "rgb(255, 99, 132)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(153, 102, 255)",
];

type AnalyticsFunnelChartProps = {
  stages: AnalyticsFunnelStage[];
  total: number;
  className?: string;
  pipelineHref?: string;
  /** `wide` = chart + table side-by-side; `compact` = stacked. */
  layout?: "compact" | "wide";
};

function stageColor(status: string, index: number): string {
  return STAGE_COLORS[status] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? "rgb(255, 99, 132)";
}

function transparentize(color: string, alpha: number): string {
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return color;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function stageRate(stage: AnalyticsFunnelStage, total: number): string {
  const share = stage.conversion_rate ?? funnelStageShare(stage.count, total);
  if (share == null) return "—";
  return formatAnalyticsPercent(share, true);
}

function FunnelPolarChart({
  stages,
  total,
}: {
  stages: AnalyticsFunnelStage[];
  total: number;
}) {
  const chartKey = useMemo(
    () => stages.map((stage) => `${stage.status}:${stage.count}`).join("|"),
    [stages],
  );

  const data = useMemo(
    () => ({
      labels: stages.map((stage) => stage.label),
      datasets: [
        {
          label: "Applications",
          data: stages.map((stage) => funnelPolarDisplayValue(stage.count)),
          backgroundColor: stages.map((stage, index) =>
            transparentize(stageColor(stage.status, index), 0.5),
          ),
          borderColor: stages.map((stage, index) => stageColor(stage.status, index)),
          borderWidth: 1,
        },
      ],
    }),
    [stages],
  );

  if (stages.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 text-center text-sm text-muted-foreground">
        No application volume in funnel stages for this range.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[320px]">
      <PolarArea
        key={chartKey}
        data={data}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: ANALYTICS_CHART_TEXT,
                boxWidth: 12,
                boxHeight: 12,
                padding: 12,
                font: { size: 11 },
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const stage = stages[ctx.dataIndex];
                  if (!stage) return "";
                  const share = funnelStageShare(stage.count, total);
                  const shareLabel =
                    share != null ? formatAnalyticsPercent(share, true) : "—";
                  return `${stage.label}: ${formatAnalyticsNumber(stage.count)} (${shareLabel})`;
                },
              },
            },
          },
          scales: {
            r: {
              beginAtZero: true,
              grid: { color: "rgba(148, 163, 184, 0.25)" },
              angleLines: { color: "rgba(148, 163, 184, 0.2)" },
              pointLabels: {
                display: true,
                color: ANALYTICS_CHART_TEXT,
                font: { size: 11, weight: "bold" },
              },
              ticks: {
                display: false,
                backdropColor: "transparent",
              },
            },
          },
        }}
      />
    </div>
  );
}

function FunnelTable({ stages, total }: { stages: AnalyticsFunnelStage[]; total: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[14rem] text-left text-sm">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <th className="pb-2.5 pr-3 font-semibold">Stage</th>
            <th className="pb-2.5 pr-3 text-right font-semibold">Count</th>
            <th className="pb-2.5 text-right font-semibold">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((stage, index) => {
            const color = stageColor(stage.status, index);
            const rate = stageRate(stage, total);
            return (
              <tr
                key={`row-${stage.status}`}
                className="border-t border-border/40 transition-colors hover:bg-muted/25"
              >
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold text-foreground">{stage.label}</span>
                  </span>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums font-semibold text-foreground">
                  {formatAnalyticsNumber(stage.count)}
                </td>
                <td className="py-2 text-right tabular-nums font-medium text-muted-foreground">
                  {rate}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsFunnelChart({
  stages,
  total,
  className,
  pipelineHref = "/jobs",
  layout = "compact",
}: AnalyticsFunnelChartProps) {
  if (stages.length === 0) {
    return <p className="text-sm text-muted-foreground">No funnel data for this range.</p>;
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {layout === "wide" ? (
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
          <FunnelPolarChart stages={stages} total={total} />
          <FunnelTable stages={stages} total={total} />
        </div>
      ) : (
        <div className="space-y-5">
          <FunnelPolarChart stages={stages} total={total} />
          <FunnelTable stages={stages} total={total} />
        </div>
      )}

      <div className="mt-4 flex justify-end border-t border-border/50 pt-3">
        <Link
          href={pipelineHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          View full pipeline
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
