import ms from "ms";
import dayjs from "dayjs";

export function getTimeframe(from: string, to: string): { from: number; to: number } {
  const now = dayjs();
  const f = now.subtract(ms(from), "milliseconds");
  const t = to === "now" ? now : now.subtract(ms(to), "milliseconds");

  return {
    from: f.valueOf(),
    to: t.valueOf(),
  };
}

export function getGranularity(granularity: string): number {
  return ms(granularity);
}
