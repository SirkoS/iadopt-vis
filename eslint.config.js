import mocha from 'eslint-plugin-mocha';
import globals from 'globals';

export default [
  mocha.configs.flat.recommended,

  {
    'languageOptions': {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    'ignores': [ '**/*.html' ],
    'rules': {
      'indent': [
        'warn',
        2,
        {
          'VariableDeclarator': { 'var': 2, 'let': 2, 'const': 3 },
          'SwitchCase': 1,
          'MemberExpression': 1,
          'CallExpression': { 'arguments': 'first' },
          'ArrayExpression': 'first',
          'ObjectExpression': 'first',
          'ignoredNodes': ['ConditionalExpression']
        },
      ],
      'quotes': [
        'warn',
        'single'
      ],
      'semi': [
        'warn',
        'always'
      ],
      'no-console': [
        'warn',
        { allow: ['warn', 'error'] }
      ],
      'no-trailing-spaces': [
        'warn'
      ]
    }
  }];
