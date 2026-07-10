// ESLint flat config (ESLint 9 / Next 16). The old `.eslintrc.json` +
// `next lint` combo no longer works: Next 16 removed the `next lint` command,
// and ESLint 9 defaults to flat config. `eslint-config-next` v16 ships its
// config as a native flat array, so we spread it directly - no FlatCompat.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
    {
        // Generated output and dependencies - never lint these.
        ignores: [".next/**", "node_modules/**", "coverage/**", "next-env.d.ts"],
    },
    ...nextCoreWebVitals,
];
