
import fs from "node:fs/promises";

export const DATA_FILE = "app-data.json";
export const CONFIG_FILE = "standings-config.json";
export const clean = (s="") => String(s).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
export const uniq = (arr,key) => [...new Map(arr.filter(Boolean).map(x=>[key(x),x])).values()];
export async function readJson(path, fallback={}) {
  try { return JSON.parse(await fs.readFile(path,"utf8")); } catch { return fallback; }
}
export async function writeJson(path, value) {
  await fs.writeFile(path, JSON.stringify(value, null, 2));
}
export function safeDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}
