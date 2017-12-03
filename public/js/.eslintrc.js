module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-unexpected-multiline": 2,
        "guard-for-in": 2,
        "no-caller": 2,
        "no-with": 2,
        "array-bracket-newline": ["error", "consistent"],
        "array-bracket-spacing": [2, 'never'],
        "indent": ["error", 2,
            { "SwitchCase": 1 }
        ],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "space-before-function-paren": ["error", {
            "anonymous": "always",
            "named": "always",
            "asyncArrow": "always"
        }],
        "space-before-blocks": ["error", {
            "functions": "always",
            "keywords": "always",
            "classes": "always"
        }],
    }
};