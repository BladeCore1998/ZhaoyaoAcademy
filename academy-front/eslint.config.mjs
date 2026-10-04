import nextConfig from "eslint-config-next";
import prettierConfig from "eslint-config-prettier";

export default [
  ...nextConfig,
  prettierConfig,
  {
    rules: {
      // Existing data-loading effects are reported while they are migrated,
      // but should not block the formatting and lint gate.
      "react-hooks/set-state-in-effect": "warn",
    },
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
    ],
  },
];
