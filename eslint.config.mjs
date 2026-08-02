import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  {
    ignores: [".next/**", ".claude/**"],
  },
  {
    extends: [...nextCoreWebVitals, ...nextTypescript],
  },
]);
