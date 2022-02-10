module.exports = {
  semi: false,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 200,
  tabWidth: 2,
  endOfLine: 'auto',
  overrides: [
    {
      files: '*.scss',
      options: {
        parser: 'scss',
      },
    },
  ],
};
