module.exports = {
  'env': {
    'browser': true,
    'es6': true
  },
  'extends': 'plugin:mocha/recommended',
  'parserOptions': {
    'ecmaVersion': 2022,
    'sourceType': 'module'
  },
  'plugins': [
    'mocha'
  ],
  'ignorePatterns': [
    '**/*.html'
  ],
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
};