/* eslint-disable no-undef */
module.exports = {
	"env": {
		"browser": true,
		//"es2020": true
	},
	"extends": "eslint:recommended",
	"parserOptions": {
		// User scripts/Gadgets: ES6+
		"ecmaVersion": 6
	},
	"rules": {
		"no-prototype-builtins": "off",
		"indent": ["error", "tab"],
		"array-bracket-newline": ["error", { "multiline": true, "minItems": 3 }],
		//"array-element-newline": ["error", { "multiline": true }]
		"array-element-newline": ["error", "consistent"]
	},
	"overrides": [
		{
			"files": ["**/*.mjs"],
			"env": {
				"node": true,
			},
			"parserOptions": {
				"ecmaVersion": 11,
				"sourceType": "module"
			},
		}
	],
};
