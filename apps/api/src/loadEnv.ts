import { existsSync } from "fs";
import path from "path";
import dotenv from "dotenv";

function findMonorepoEnv(): string {
  let dir = process.cwd();

  while (true) {
    const envPath = path.join(dir, ".env");
    const workspaceMarker = path.join(dir, "pnpm-workspace.yaml");

    if (existsSync(workspaceMarker) && existsSync(envPath)) {
      return envPath;
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return path.resolve(process.cwd(), ".env");
}

const envPath = findMonorepoEnv();
const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== "production") {
  console.warn(`[env] Could not load ${envPath}`);
}
