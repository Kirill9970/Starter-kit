module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin", "simple-import-sort"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js"],
  rules: {
    // Limits function length to 60 lines (excluding blanks and comments)
    // Helps maintain readable, focused functions
    "max-lines-per-function": [
      "error",
      {
        max: 90, // Maximum allowed lines per function
        skipBlankLines: true, // Ignore empty lines in count
        skipComments: true, // Ignore comment lines in count
      },
    ],

    // Enforces consistent naming conventions
    "@typescript-eslint/naming-convention": [
      "warn", // Warning level (won't fail CI)
      // Classes must use PascalCase (MyClass)
      { selector: "class", format: ["PascalCase"] },
      // Enums must use UPPER_CASE (MY_ENUM)
      { selector: "enum", format: ["UPPER_CASE"] },
      // Variables must use camelCase with max 4 words (myVariableName)
      {
        selector: "variable",
        format: ["camelCase"],
        custom: {
          regex: "^[a-z]+([A-Z][a-z]+){0,3}$", // Allows max 3 capital letters (4 words)
          match: true,
          message:
            "Variable names should contain no more than 4 words in camelCase",
        },
      },
      // Functions must use camelCase with max 4 words (doSomethingImportant)
      {
        selector: "function",
        format: ["camelCase"],
        custom: {
          regex: "^[a-z]+([A-Z][a-z]+){0,3}$",
          match: true,
        },
      },
      // Properties can be snake_case or camelCase (my_property or myProperty)
      {
        selector: "property",
        format: ["snake_case", "camelCase"],
        custom: {
          regex: "^[a-z]+([A-Z][a-z]+){0,3}$",
          match: true,
        },
      },
      // Methods must use camelCase with max 4 words (calculateTotalPrice)
      {
        selector: "method",
        format: ["camelCase"],
        custom: {
          regex: "^[a-z]+([A-Z][a-z]+){0,3}$",
          match: true,
        },
      },
    ],

    // Disables requiring 'I' prefix for interfaces (allows User instead of IUser)
    "@typescript-eslint/interface-name-prefix": "off",

    // Warns when function return types aren't explicitly declared
    "@typescript-eslint/explicit-function-return-type": "warn",

    // Warns when module boundaries (exports) lack type annotations
    "@typescript-eslint/explicit-module-boundary-types": "warn",

    // Allows usage of 'any' type (disabled for strict typing)
    "@typescript-eslint/no-explicit-any": "off",

    // Warns when type can be easily inferred (let x: number = 5)
    "@typescript-eslint/no-inferrable-types": "warn",

    // Encourages using readonly for properties that don't change
    "@typescript-eslint/prefer-readonly": "warn",

    // Enforces single quotes with template literals allowed
    "@typescript-eslint/quotes": [
      "warn",
      "single", // Prefer single quotes
      {
        allowTemplateLiterals: true, // Allow `template ${strings}`
      },
    ],

    // Disables import resolution checking (handled by TypeScript)
    "import/no-unresolved": "off",

    // Encourages const over let when possible
    "prefer-const": "warn",

    // Controls blank lines between statements for better readability
    "padding-line-between-statements": [
      "warn",
      // Always blank line before return
      { blankLine: "always", prev: "*", next: "return" },
      // Always blank line before if
      { blankLine: "always", prev: "*", next: "if" },
      // Always blank line after if
      { blankLine: "always", prev: "if", next: "*" },
      // Always blank line before throw
      { blankLine: "always", prev: "*", next: "throw" },
      // Always blank line after variable declarations
      { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
      // No enforced blank lines between consecutive variable declarations
      {
        blankLine: "any",
        prev: ["const", "let", "var"],
        next: ["const", "let", "var"],
      },
    ],

    // Auto-sorts exports alphabetically
    "simple-import-sort/exports": "error",

    // Auto-sorts imports in specific groups
    "simple-import-sort/imports": [
      "error",
      {
        groups: [
          // Absolute imports and side effects (like CSS imports)
          ["^\\u0000"],
          // External packages (node_modules)
          ["^@nestjs", "^@?\\w"], // @nestjs first, then other scoped packages
          // Internal absolute imports (@/ or app/)
          ["^(@|app)(/.*|$)"],
          // Parent imports (../)
          ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
          // Relative imports (./)
          ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
        ],
      },
    ],
  },
};
