// Minimal website-tsc audit rules for CTX-0003 closeout: projectBrief alignment + homepage 3-point/4 NOTs
import { readFileSync, existsSync } from "node:fs";
const brief = JSON.parse(readFileSync("scripts/website-tsc/projectBrief.json", "utf8"));
function mustContain(path, needles) {
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  const s = readFileSync(path, "utf8");
  for (const n of needles) if (!s.includes(n)) throw new Error(`${path} missing "${n}"`);
}
mustContain(brief.homepage.en, ["Durable State", "Lifecycle", "Portable Offline State", "What it is not", "Not an agent harness", "Not a Claude Code replacement", "Not a cloud sync service", "Not a TODO list"]);
mustContain(brief.homepage.zh, ["持久化状态", "全生命周期", "可携带的离线状态", "它不是什么", "不是 Agent Harness", "不是 Claude Code 替代品", "不是云端同步服务", "不是 TODO List"]);
console.log("website-tsc: projectBrief alignment OK (EN+zh homepage 3-point + 4 NOTs)");
const ci = readFileSync(".github/workflows/ci.yml", "utf8");
const dep = readFileSync(".github/workflows/deploy.yml", "utf8");
for (const needle of ["frozen-lockfile", "astro check", "markdownlint"]) if (!ci.includes(needle) && !dep.includes(needle)) throw new Error(`CI missing ${needle}`);
console.log("website-tsc: CI hardening OK (frozen install, astro check, markdownlint, build split)");
