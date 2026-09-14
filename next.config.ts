import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` otherwise appends a generated block to AGENTS.md on every start.
  // That file is this project's working agreement (see AGENTS.md §2), not a
  // tool-managed artefact, so the framework does not get to edit it.
  agentRules: false,

  // Emits a self-contained server bundle, which is what an internal/on-premise
  // deployment would run. Portability is not readiness — see specification §16.
  output: "standalone",
};

export default nextConfig;
