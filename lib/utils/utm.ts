import { ReadonlyURLSearchParams } from "next/navigation";

export function getUtmParams(searchParams: ReadonlyURLSearchParams): Record<string, string> {
  const utm: Record<string, string> = {};
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  keys.forEach(key => {
    const val = searchParams.get(key);
    if (val) utm[key] = val;
  });

  return utm;
}
