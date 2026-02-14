module.exports = {
  root: true,
  extends: ["expo"],
  ignorePatterns: [
    "dist/**",
    ".tmp/**",
    "node_modules/**",
    "src/data/mock/generated/*.json",
    "scripts/__pycache__/**",
  ],
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx"],
      env: {
        jest: true,
      },
    },
  ],
};
