import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@readbuddy/shared-types", "@readbuddy/prompts"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
