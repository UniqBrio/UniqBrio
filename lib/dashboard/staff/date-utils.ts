// Flexible date parsing helpers used by attendance analytics/summary

// Convert a Date to local yyyy-mm-dd
export function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parse many possible incoming date string formats into yyyy-mm-dd (local)
export function parseToYMDFlexible(input: unknown): string | null {
  if (!input) return null;
  if (input instanceof Date) return toYMDLocal(input);
  const s = String(input).trim();

  // Already ISO date yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // dd-MMM-yyyy (e.g., 23-Oct-2025)
  {
    const m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const monStr = m[2].toLowerCase();
      const year = parseInt(m[3], 10);
      const months: Record<string, number> = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
      const mon = months[monStr];
      if (mon) return `${year}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    }
  }

  // dd-mm-yyyy or dd/mm/yyyy
  {
    const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) {
      let d = parseInt(m[1], 10);
      let mo = parseInt(m[2], 10);
      const y = parseInt(m[3], 10);
      // Heuristic: if first part > 12 it's day-first; if second part > 12 it's month-first
      // Prefer day-first for our usage/context when ambiguous (<=12)
      if (m[0].includes('/')) {
        // if pattern might be mm/dd/yyyy with '/', detect based on values
        if (parseInt(m[2], 10) > 12 && parseInt(m[1], 10) <= 12) {
          // Looks like dd/mm/yyyy already -> nothing to change
        } else if (parseInt(m[1], 10) > 12 && parseInt(m[2], 10) <= 12) {
          // Looks like day>12 so it's clearly dd/mm -> nothing
        } else if (parseInt(m[1], 10) <= 12 && parseInt(m[2], 10) <= 12) {
          // Ambiguous; assume dd/mm
        }
      }
      // Clamp basic ranges (best-effort)
      if (mo < 1 || mo > 12 || d < 1 || d > 31) {
        // fall through to native Date parsing
      } else {
        return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      }
    }
  }

  // Try native Date parsing for ISO strings with time or other reasonable inputs
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return toYMDLocal(d);
  } catch {}

  return null;
}
