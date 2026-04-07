import { Chart, useChart } from "src/components/chart";

// ----------------------------------------------------------------------

export function ChartBar({ data }) {
  const chartColors = data?.colors ?? ["#1E88E5", "#9C27B0"];
  const chartOptions = useChart({
    colors: chartColors,
    stroke: { width: 0 },
    xaxis: { categories: data?.categories },
    tooltip: {
      y: { formatter: (value) => ` ${value}`, title: { formatter: () => "" } },
    },
    plotOptions: {
      bar: { horizontal: true, barHeight: "30%", borderRadius: 2 },
    },
  });

  return (
    <Chart
      type="bar"
      series={[{ data: data?.series }]}
      options={chartOptions}
      sx={{ height: 320 }}
    />
  );
}
