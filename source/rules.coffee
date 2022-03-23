module.exports = {
  "Grammar": [
    "S",
    [
      [
        "*",
        "EOS"
      ],
      [
        "+",
        "Rule"
      ]
    ],
    {
      "f": "return Object.fromEntries($2)"
    }
  ],
  "Rule": [
    "S",
    [
      "Name",
      "EOS",
      "RuleBody"
    ],
    [
      {
        "v": 1
      },
      {
        "v": 3
      }
    ]
  ],
  "RuleBody": [
    "+",
    [
      "S",
      [
        "Indent",
        "Choice"
      ]
    ],
    {
      "f": "var r = $1.map((a) => a[1])\nif (r.length === 1) return r[0];\nreturn [\"/\", r]"
    }
  ],
  "Choice": [
    "S",
    [
      "Sequence",
      "Handling"
    ],
    {
      "f": "if ($2 !== undefined) {\n  if (!$1.push)\n    $1 = [\"S\", [$1], $2]\n  else\n    $1.push($2)\n}\nreturn $1"
    }
  ],
  "Sequence": [
    "/",
    [
      [
        "S",
        [
          "Expression",
          [
            "+",
            "SequenceExpression"
          ]
        ],
        {
          "f": "$2.unshift($1)\nreturn [\"S\", $2]"
        }
      ],
      [
        "S",
        [
          "Expression",
          [
            "+",
            "ChoiceExpression"
          ]
        ],
        {
          "f": "$2.unshift($1)\nreturn [\"/\", $2]"
        }
      ],
      "Expression"
    ]
  ],
  "SequenceExpression": [
    "S",
    [
      "_",
      "Expression"
    ],
    {
      "v": 2
    }
  ],
  "ChoiceExpression": [
    "S",
    [
      "_",
      [
        "L",
        "/"
      ],
      "_",
      "Expression"
    ],
    {
      "v": 4
    }
  ],
  "Expression": [
    "/",
    [
      "Suffix",
      [
        "S",
        [
          "PrefixOperator",
          "Suffix"
        ],
        [
          {
            "v": 1
          },
          {
            "v": 2
          }
        ]
      ]
    ]
  ],
  "PrefixOperator": [
    "R",
    "[$&!]"
  ],
  "Suffix": [
    "/",
    [
      [
        "S",
        [
          "Primary",
          "SuffixOperator"
        ],
        [
          {
            "v": 2
          },
          {
            "v": 1
          }
        ]
      ],
      "Primary"
    ]
  ],
  "SuffixOperator": [
    "R",
    "[+?*]"
  ],
  "Primary": [
    "/",
    [
      "Name",
      "Literal",
      [
        "S",
        [
          "OpenParenthesis",
          "Sequence",
          "CloseParenthesis"
        ],
        {
          "v": 2
        }
      ]
    ]
  ],
  "Literal": [
    "/",
    [
      "StringLiteral",
      "RegExpLiteral"
    ]
  ],
  "Handling": [
    "/",
    [
      [
        "S",
        [
          "EOS"
        ],
        {
          "f": "return undefined"
        }
      ],
      [
        "S",
        [
          [
            "*",
            "_"
          ],
          "Arrow",
          "HandlingExpression"
        ],
        {
          "v": 3
        }
      ]
    ]
  ],
  "HandlingExpression": [
    "/",
    [
      [
        "S",
        [
          "EOS",
          "HandlingExpressionBody"
        ],
        {
          "v": 2
        }
      ],
      [
        "S",
        [
          "StructuralMapping",
          "EOS"
        ],
        {
          "v": 1
        }
      ]
    ]
  ],
  "HandlingExpressionBody": [
    "+",
    "HandlingExpressionLine",
    {
      "f": "return {\n  f: $1.join(\"\\n\")\n}"
    }
  ],
  "HandlingExpressionLine": [
    "S",
    [
      "Indent",
      "Indent",
      [
        "R",
        "[^\\n\\r]*"
      ],
      "EOS"
    ],
    {
      "v": 3
    }
  ],
  "StructuralMapping": [
    "/",
    [
      "StringValue",
      "NumberValue",
      "Variable",
      [
        "S",
        [
          "OpenBracket",
          "StructuralMapping",
          [
            "*",
            "CommaThenValue"
          ],
          "CloseBracket"
        ],
        {
          "f": "$3.unshift($2); return $3"
        }
      ]
    ]
  ],
  "CommaThenValue": [
    "S",
    [
      [
        "*",
        "_"
      ],
      [
        "L",
        ","
      ],
      [
        "*",
        "_"
      ],
      "StructuralMapping",
      [
        "*",
        "_"
      ]
    ],
    {
      "v": 4
    }
  ],
  "Variable": [
    "R",
    "\\$(\\d)",
    {
      "f": "return {v: parseInt($1, 10)}"
    }
  ],
  "NumberValue": [
    "R",
    "\\d+",
    {
      "f": "return parseInt($0, 10)"
    }
  ],
  "StringValue": [
    "S",
    [
      [
        "L",
        "\\\""
      ],
      [
        "$",
        [
          "*",
          "DoubleStringCharacter"
        ]
      ],
      [
        "L",
        "\\\""
      ]
    ],
    {
      "v": 2
    }
  ],
  "DoubleStringCharacter": [
    "/",
    [
      [
        "R",
        "[^\"\\\\]+"
      ],
      "EscapeSequence"
    ]
  ],
  "EscapeSequence": [
    "$",
    [
      "S",
      [
        "Backslash",
        [
          "R",
          "."
        ]
      ]
    ]
  ],
  "StringLiteral": [
    "S",
    [
      "StringValue"
    ],
    [
      "L",
      {
        "v": 1
      }
    ]
  ],
  "RegExpLiteral": [
    "/",
    [
      [
        "S",
        [
          [
            "L",
            "/"
          ],
          [
            "!",
            "_"
          ],
          [
            "$",
            [
              "*",
              "RegExpCharacter"
            ]
          ],
          [
            "L",
            "/"
          ]
        ],
        [
          "R",
          {
            "v": 3
          }
        ]
      ],
      [
        "$",
        "CharacterClassExpression",
        [
          "R",
          {
            "v": 1
          }
        ]
      ],
      [
        "L",
        ".",
        [
          "R",
          {
            "v": 1
          }
        ]
      ]
    ]
  ],
  "CharacterClassExpression": [
    "+",
    "CharacterClass"
  ],
  "RegExpCharacter": [
    "/",
    [
      [
        "R",
        "[^\\/\\\\]+"
      ],
      "EscapeSequence"
    ]
  ],
  "CharacterClass": [
    "S",
    [
      [
        "L",
        "["
      ],
      [
        "*",
        "CharacterClassCharacter"
      ],
      [
        "L",
        "]"
      ],
      [
        "?",
        "Quantifier"
      ]
    ]
  ],
  "CharacterClassCharacter": [
    "/",
    [
      [
        "R",
        "[^\\]\\\\]+"
      ],
      "EscapeSequence"
    ]
  ],
  "Quantifier": [
    "R",
    "[?+*]|\\{\\d+(,\\d+)?\\}"
  ],
  "Name": [
    "R",
    "[_a-zA-Z][_a-zA-Z0-9]*"
  ],
  "Arrow": [
    "S",
    [
      [
        "L",
        "->"
      ],
      [
        "*",
        "_"
      ]
    ]
  ],
  "Backslash": [
    "L",
    "\\\\"
  ],
  "OpenBracket": [
    "R",
    "\\[[ \\t]*"
  ],
  "CloseBracket": [
    "R",
    "\\][ \\t]*"
  ],
  "OpenParenthesis": [
    "R",
    "\\([ \\t]*"
  ],
  "CloseParenthesis": [
    "R",
    "[ \\t]*\\)"
  ],
  "Indent": [
    "L",
    "  "
  ],
  "_": [
    "R",
    "[ \\t]+"
  ],
  "EOS": [
    "R",
    "([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+"
  ]
}