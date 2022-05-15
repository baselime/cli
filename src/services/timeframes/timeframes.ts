import parse from 'parse-duration'
import dayjs from "dayjs";

export function getTimeframe(from: string, to: string): { from: number; to: number } {
  const now = dayjs();
  const f = now.subtract(parse(from), "milliseconds");
  const t = to === "now" ? now : now.subtract(parse(to), "milliseconds");

  return {
    from: f.valueOf(),
    to: t.valueOf(),
  }
}
