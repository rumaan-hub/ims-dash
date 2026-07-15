import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // The codebase was cleared of all warnings under these rules — promote
  // them back to errors so future regressions are caught at PR / Vercel build
  // time rather than silently piling up. Where individual call-sites legitimately
  // need to break a rule (auth guards, SSR-aware setState, runtime callbacks
  // that read Date.now), an inline `// eslint-disable-next-line <rule>` with
  // a justification comment is used.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/static-components": "error",
      "react-hooks/immutability": "error",
      "react-hooks/purity": "error",
      "react/no-unescaped-entities": "error",
    },
  },
]);

export default eslintConfig;
