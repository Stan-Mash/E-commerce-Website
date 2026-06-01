"use client";

interface ChartDatum {
  date: string;
  revenue: number;
}

interface DashboardChartProps {
  data: ChartDatum[];
  maxRevenue: number;
}

function formatKESShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

function formatKESFull(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardChart({ data, maxRevenue }: DashboardChartProps) {
  const svgHeight = 180;
  const paddingTop = 12;
  const paddingBottom = 32; // room for x-axis labels
  const paddingLeft = 52;  // room for y-axis labels
  const paddingRight = 8;

  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // We need a stable width reference — use a viewBox so it scales
  const svgWidth = 400;
  const chartWidth = svgWidth - paddingLeft - paddingRight;

  const barCount = data.length;
  const barGroupWidth = chartWidth / barCount;
  const barWidth = Math.max(barGroupWidth * 0.55, 8);

  // Y-axis: 4 gridlines at 0%, 33%, 67%, 100% of max
  const gridFractions = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      height={svgHeight}
      style={{ display: "block", overflow: "visible" }}
      aria-label="Revenue bar chart — last 7 days"
    >
      {/* Grid lines + Y-axis labels */}
      {gridFractions.map((frac) => {
        const y = paddingTop + chartHeight - frac * chartHeight;
        const label = (maxRevenue > 0 && frac > 0) ? formatKESShort(frac * maxRevenue) : "0";
        return (
          <g key={frac}>
            <line
              x1={paddingLeft}
              x2={svgWidth - paddingRight}
              y1={y}
              y2={y}
              stroke={frac === 0 ? "#c8bfb4" : "#e8e2da"}
              strokeWidth={frac === 0 ? 1.5 : 1}
              strokeDasharray={frac === 0 ? undefined : "3 3"}
            />
            <text
              x={paddingLeft - 6}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={9}
              fill="#9e9186"
              fontFamily="var(--font-inter, Inter, sans-serif)"
              letterSpacing="0.03em"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((datum, i) => {
        const barHeightPx =
          maxRevenue > 0 ? Math.max((datum.revenue / maxRevenue) * chartHeight, datum.revenue > 0 ? 4 : 0) : 0;
        const barX = paddingLeft + i * barGroupWidth + (barGroupWidth - barWidth) / 2;
        const barY = paddingTop + chartHeight - barHeightPx;

        const dayLabel = new Date(datum.date + "T00:00:00").toLocaleDateString("en-KE", {
          weekday: "short",
        });

        return (
          <g key={datum.date}>
            {/* Bar */}
            <rect
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeightPx}
              rx={2}
              ry={2}
              fill={datum.revenue > 0 ? "var(--es-plum, #5b2d6e)" : "#e8e2da"}
              opacity={datum.revenue > 0 ? 1 : 0.6}
            >
              <title>{formatKESFull(datum.revenue)}</title>
            </rect>

            {/* Invisible wider hit area for easier hover */}
            <rect
              x={paddingLeft + i * barGroupWidth}
              y={paddingTop}
              width={barGroupWidth}
              height={chartHeight}
              fill="transparent"
            >
              <title>{`${dayLabel}: ${formatKESFull(datum.revenue)}`}</title>
            </rect>

            {/* X-axis label */}
            <text
              x={paddingLeft + i * barGroupWidth + barGroupWidth / 2}
              y={svgHeight - paddingBottom + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#9e9186"
              style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              {dayLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
