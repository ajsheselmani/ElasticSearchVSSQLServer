import { Card, CardHeader } from '@mui/material';
import { useTheme, alpha as hexAlpha } from '@mui/material/styles';
import { Chart, useChart } from 'src/components/chart';

export function ChartColumnSingle({ data }) {
  const theme = useTheme();

  const chartColors = data.colors ?? [
    hexAlpha(theme.palette.primary.dark, 0.8),
    hexAlpha(theme.palette.warning.main, 0.8),
  ];

  const chartOptions = useChart({
    colors: chartColors,
    stroke: { width: 2, colors:['transparent']},
    xaxis: { categories: data.categories },
    legend: {show:true},
    tooltip: { y: { formatter: (value) => `${value} visits` } },
    ...data.options,
  });

return (
    <Card >
      <CardHeader />
      <Chart
        type="bar"
        series={data.series}
        options={chartOptions}
        slotProps={{ loading: { p: 2.5 } }}
        sx={{
          pl: 1,
          py: 2.5,
          pr: 2.5,
          height: 364,
        }}
      />
    </Card>
  );
}
