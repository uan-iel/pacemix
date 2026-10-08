import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [
  spawn(process.execPath, ["server/deepseek-nlu-proxy.mjs"], { stdio: "inherit" }),
  spawn(npm, ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4173", "--strictPort"], { stdio: "inherit" }),
];

let closing = false;
function stop(signal = "SIGTERM", exitCode = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  windowlessExit(exitCode);
}

function windowlessExit(code) {
  setTimeout(() => process.exit(code), 150).unref();
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!closing) stop(signal || "SIGTERM", code ?? 1);
  });
}

process.on("SIGINT", () => stop("SIGINT", 0));
process.on("SIGTERM", () => stop("SIGTERM", 0));
