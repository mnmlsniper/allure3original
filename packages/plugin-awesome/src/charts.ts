import type { Statistic, TestStatus } from "@allure/core-api";
import { statusesList } from "@allure/core-api";
import { PieArcDatum, arc, pie } from "d3-shape";

export type TestResultSlice = {
  status: TestStatus;
  count: number;
};

export type TestResultChartData = {
  percentage: number;
  slices: TestResultSlice[];
};

export const d3Arc = arc<PieArcDatum<TestResultSlice>>().innerRadius(40).outerRadius(50).cornerRadius(2).padAngle(0.03);

export const d3Pie = pie<TestResultSlice>()
  .value((d) => d.count)
  .padAngle(0.03)
  .sortValues((a, b) => a - b);

export function getPercentage(value: number, total: number) {
  return Math.floor((value / total) * 10000) / 100;
}

export const getChartData = (stats: Statistic): TestResultChartData => {
  const convertedStatuses = statusesList
    .filter((status) => !!stats?.[status])
    .map((status) => ({
      status,
      count: stats[status]!,
    }));
  const arcsData = d3Pie(convertedStatuses);
  const slices = arcsData.map((arc) => ({
    d: d3Arc(arc),
    ...arc.data,
  }));
  const percentage = getPercentage(stats.passed ?? 0, stats.total);

  return {
    slices,
    percentage,
  };
};
