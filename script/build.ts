import { execSync } from "child_process";
import { existsSync } from "fs";

execSync("vite build", { stdio: "inherit" });
execSync("esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js --external:express --external:drizzle-orm --external:pg --external:@neondatabase/serverless --external:ws --packages=external", { stdio: "inherit" });

if (!existsSync("dist/public") || !existsSync("dist/index.js")) {
  console.error("Build failed: missing output files");
  process.exit(1);
}

console.log("Build successful");
