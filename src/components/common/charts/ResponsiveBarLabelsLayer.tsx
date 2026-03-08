import type { BarCustomLayerProps, BarDatum, ComputedBarDatum } from "@nivo/bar";

function getResponsiveLabelLayout(bar: ComputedBarDatum<BarDatum>) {
  if (bar.data.value == null || bar.data.value <= 0) {
    return null;
  }

  if (bar.width >= 34 && bar.height >= 22) {
    return { fontSize: 15, rotate: false };
  }

  if (bar.width >= 24 && bar.height >= 20) {
    return { fontSize: 13, rotate: false };
  }

  if (bar.width >= 12 && bar.height >= 34) {
    return { fontSize: 11, rotate: true };
  }

  if (bar.width >= 10 && bar.height >= 26) {
    return { fontSize: 10, rotate: true };
  }

  return null;
}

export function ResponsiveBarLabelsLayer<D extends BarDatum>({ bars }: BarCustomLayerProps<D>) {
  return (
    <g pointerEvents="none">
      {bars.map((bar) => {
        const layout = getResponsiveLabelLayout(bar as ComputedBarDatum<BarDatum>);
        if (!layout) {
          return null;
        }

        const centerX = bar.x + bar.width / 2;
        const centerY = bar.y + bar.height / 2;
        const labelText = bar.data.formattedValue || String(bar.data.value);

        return (
          <text
            key={bar.key}
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={layout.fontSize}
            fontWeight={500}
            fill="rgba(255, 255, 255, 0.96)"
            transform={layout.rotate ? `rotate(-90, ${centerX}, ${centerY})` : undefined}
          >
            {labelText}
          </text>
        );
      })}
    </g>
  );
}
