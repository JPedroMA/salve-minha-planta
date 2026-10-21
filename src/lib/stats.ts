import { promises as fs } from "fs";
import path from "path";

const STATS_FILE = path.join(process.cwd(), "data", "stats.json");

export interface Stats {
  analyses: number;
  issuesFound: number;
}

async function read(): Promise<Stats> {
  try {
    const raw = await fs.readFile(STATS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      analyses: Number(parsed.analyses) || 0,
      issuesFound: Number(parsed.issuesFound) || 0,
    };
  } catch {
    return { analyses: 0, issuesFound: 0 };
  }
}

export async function recordDiagnosis(issuesFound: number): Promise<void> {
  const stats = await read();
  stats.analyses += 1;
  stats.issuesFound += issuesFound;
  await fs.mkdir(path.dirname(STATS_FILE), { recursive: true });
  await fs.writeFile(STATS_FILE, JSON.stringify(stats));
}

export async function getStats(): Promise<Stats> {
  return read();
}
