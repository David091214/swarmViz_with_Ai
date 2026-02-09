export const TIME_POINT_COLORS: string[] = [
  '#1f77b4', // TP1 - blue
  '#d62728', // TP2 - red
  '#2ca02c', // TP3 - green
  '#8b5cf6', // TP4 - violet
  '#9467bd',
  '#8c564b',
  '#17becf',
  '#bcbd22',
];

export function getTimePointColor(index: number): string {
  if (index < 0) {
    return TIME_POINT_COLORS[0];
  }
  return TIME_POINT_COLORS[index % TIME_POINT_COLORS.length];
}

export function buildTimePointColorMap(count: number): Record<number, string> {
  const map: Record<number, string> = {};
  for (let i = 0; i < count; i += 1) {
    map[i] = getTimePointColor(i);
  }
  return map;
}
