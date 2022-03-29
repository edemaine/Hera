// Generated by CoffeeScript 2.6.1
// Compile a rules json to typescript
var compileHandler, compileOp, compileRule, compileRulesObject, compileStructuralHandler, defaultOptions, defineRe, defineTerminal, isSimple, isSimpleCharacterClass, jsMachine, prettyPrint, reDefs, reType, regExpHandlerParams, regularHandlerParams, strDefs, tsMachine;

strDefs = [];

reDefs = [];

defineTerminal = function(lit) {
  var id, index;
  index = strDefs.indexOf(lit);
  if (index >= 0) {
    id = `$L${index}`;
  } else {
    id = `$L${strDefs.length}`;
    strDefs.push(lit);
  }
  return id;
};

defineRe = function(re) {
  var id, index;
  index = reDefs.indexOf(re);
  if (index >= 0) {
    id = `$R${index}`;
  } else {
    id = `$R${reDefs.length}`;
    reDefs.push(re);
  }
  return id;
};

// Pretty print a string or RegExp literal
prettyPrint = function(name, terminal, re) {
  var pv;
  if (re) {
    pv = `/${terminal}/`;
  } else {
    pv = JSON.stringify(terminal);
  }
  return `${name} ${pv}`;
};


/**
 * @param tuple {HeraAST}
 * @param defaultHandler:boolean
 */
compileOp = function(tuple, name, defaultHandler, types) {
  var args, f, op, src;
  // TODO: should nested levels have default handler set to true? (only comes into play on regexps)
  if (Array.isArray(tuple)) {
    [op, args] = tuple;
    switch (op) {
      case "L":
        return `$EXPECT(${defineTerminal(args)}, fail, ${JSON.stringify(prettyPrint(name, args))})`;
      case "R":
        f = `$EXPECT(${defineRe(args)}, fail, ${JSON.stringify(prettyPrint(name, args, true))})`;
        if (defaultHandler) {
          f = `$R$0(${f})${reType(types, args)}`;
        }
        return f;
      case "/":
        src = args.map(function(arg) {
          return compileOp(arg, name, defaultHandler, types);
        }).join(", ");
        return `$C(${src})`;
      case "S":
        src = args.map(function(arg) {
          return compileOp(arg, name, defaultHandler, types);
        }).join(", ");
        return `$S(${src})`;
      case "*":
        return `$Q(${compileOp(args, name, defaultHandler, types)})`;
      case "+":
        return `$P(${compileOp(args, name, defaultHandler, types)})`;
      case "?":
        return `$E(${compileOp(args, name, defaultHandler, types)})`;
      case "$":
        // Inside text can ignore all handlers since they are disregarded anyway
        return `$TEXT(${compileOp(args, name, false, types)})`;
      case "&":
        return `$Y(${compileOp(args, name, defaultHandler, types)})`;
      case "!":
        return `$N(${compileOp(args, name, defaultHandler, types)})`;
      default:
        throw new Error(`Unknown op: ${op} ${JSON.stringify(args)}`);
    }
  } else {
    return tuple;
  }
};

// Only rules have handlers, either one per choice line,
// or one for the whole deal
regExpHandlerParams = ["$loc"].concat([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function(_, i) {
  return `$${i}`;
}));


/**
 * @type ["$loc", "$0", "$1"]
 */
regularHandlerParams = ["$loc", "$0", "$1"];

// Offset is so sequences start at the first item in the array
// and regexps start at the second because the first is the entire match
// TODO: is 0 valid to select the entire sequence result?
// TODO: remove offset and unify handlings
compileStructuralHandler = function(mapping, source, single = false, offset) {
  var o;
  if (offset == null) {
    offset = -1;
  }
  switch (typeof mapping) {
    case "string":
      return JSON.stringify(mapping);
    case "number":
      return mapping;
    case "object":
      if (Array.isArray(mapping)) {
        return `[${mapping.map(function(m) {
          return compileStructuralHandler(m, source, single, offset);
        }).join(', ')}]`;
      } else if (mapping === null) {
        return "null";
      } else if (mapping.v != null) {
        if (single) {
          return source;
        } else {
          return `${source}[${mapping.v + offset}]`;
        }
      } else if (mapping.o) {
        o = mapping.o;
        return "{" + Object.keys(mapping.o).map(function(key) {
          return `${JSON.stringify(key)}: ${compileStructuralHandler(o[key], source, single, offset)}`;
        }).join(", ") + "}";
      } else {
        throw new Error("unknown object mapping");
      }
      break;
    case "undefined":
      return "undefined";
    default:
      throw new Error(`Unknown mapping type: ${mapping}`);
  }
};

compileHandler = function(options, arg, name) {
  var args, h, op, parameters, parser;
  if (typeof arg === "string") {
    return arg; // reference to other named parser function
  }
  if (!Array.isArray(arg)) {
    return;
  }
  [op, args, h] = arg;
  if ((h != null ? h.f : void 0) != null) {
    parser = compileOp(arg, name, false, options.types);
    if (op === "S") {
      parameters = ["$loc", "$0"].concat(args.map(function(_, i) {
        return `$${i + 1}`;
      }));
      return `$TS(${parser}, function(${parameters.join(", ")}) {${h.f}})`;
    } else if (op === "R") {
      return `$TR(${parser}, function(${regExpHandlerParams.join(", ")}) {${h.f}})`;
    } else {
      return `$TV(${parser}, function(${regularHandlerParams.join(", ")}) {${h.f}})`;
    }
  } else if (h != null) {
    parser = compileOp(arg, name, false, options.types);
    if (op === "S") {
      return `$T(${parser}, function(value) { return ${compileStructuralHandler(h, "value")} })`;
    } else if (op === "R") {
      return `$T(${parser}, function(value) { return ${compileStructuralHandler(h, "value", false, 0)} })`;
    } else {
      return `$T(${parser}, function(value) { return ${compileStructuralHandler(h, "value", true)} })`;
    }
  } else {
    return compileOp(arg, name, true, options.types); // structural mapping
// function mapping
  }
};

compileRule = function(options, name, rule) {
  var args, fns, h, op, stateType;
  [op, args, h] = rule;
  if (options.types) {
    stateType = ": ParseState";
  } else {
    stateType = "";
  }
  // first level choice may have nested handlings
  if (op === "/" && !h) {
    fns = args.map(function(arg, i) {
      return `const ${name}$${i} = ${compileHandler(options, arg, name)};`;
    });
    options = args.map(function(_, i) {
      return `${name}$${i}(state)`;
    }).join(" || ");
    return `${fns.join("\n")}
function ${name}(state${stateType}) {
  return ${options}
}`;
  } else {
    return `const ${name}$0 = ${compileHandler(options, rule, name)};
function ${name}(state${stateType}) {
  return ${name}$0(state);
}`;
  }
};

compileRulesObject = function(ruleNames) {
  var meat;
  meat = ruleNames.map(function(name) {
    return `${name}: ${name}`;
  }).join(",\n");
  return `{
  ${meat}
}`;
};

// TODO: bundling for esbuild
tsMachine = require('fs').readFileSync(__dirname + "/machine.ts", "utf8");

jsMachine = require('fs').readFileSync(__dirname + "/machine.js", "utf8");

defaultOptions = {
  types: false
};

module.exports = {
  
  /**
   * @param rules {[k: string]: HeraAST}
   */
  compile: function(rules, options = defaultOptions) {
    var body, header, ruleNames, types;
    ({types} = options);
    ruleNames = Object.keys(rules);
    body = ruleNames.map(function(name) {
      return compileRule(options, name, rules[name]);
    }).join("\n\n");
    if (types) {
      header = tsMachine;
    } else {
      header = jsMachine;
    }
    return `${header}

const { parse } = parserState(${compileRulesObject(ruleNames)})

${strDefs.map(function(str, i) {
      return `const $L${i} = $L("${str}");`;
    }).join("\n")}

${reDefs.map(function(r, i) {
      return `const $R${i} = $R(new RegExp(${JSON.stringify(r)}, 'suy'));`;
    }).join("\n")}

${body}

module.exports = {
  parse: parse
}`;
  }
};

isSimple = /^[^.*+?{}()\[\]^\\]*$/;

isSimpleCharacterClass = /^\[[^-^\\]*\]$/;

reType = function(types, str) {
  var specifics;
  if (types) {
    specifics = str.match(isSimple) ? str.split("|").map(function(s) {
      return JSON.stringify(s);
    }) : str.match(isSimpleCharacterClass) ? str.substring(1, str.length - 1).split("").map(function(s) {
      return JSON.stringify(s);
    }) : void 0;
    if (specifics) {
      return `as Parser<${specifics.join("|")}>`;
    } else {
      return "";
    }
  } else {
    return "";
  }
};