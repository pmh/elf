var elf = require("../index"), sys = require("sys"), _;

var Calculator = elf.Language.clone(function () {
  this.number   ( /\d+/        )
  this.name     ( /[a-zA-Z]+/  )
  this.operator ( /\||\}|\)/)

  this.prefix   ( "+", "-"     )

  this.infixr   ( "=", 10      )

  this.infix    ( "+", "-", 10 )
  this.infix    ( "*", "/", 20 )

  this.prefix   ("{", function (node) {
    node.value  = "function";
    node.first  = this.parseUntil("|", { step: ",", meta: { type: "parameter" }, optional: true });
    node.second = this.parseUntil("}");

    return node;
  })

  this.infix  ("(", 80, function (node, first) {
    node.value  = "call";
    node.first  = first;
    node.second = this.parseUntil(")", { step: "," })

    return node;
  });

  this.stmt ("print")

  this.skip ( /\s+/ )
  this.eol  ( /\;/  )
});

Evaluator = elf.Walker.clone(function () {

  // Match unary -
  this.match ("-", [ _ ], function (env, node, left) {
    return -this.walk(left, env);
  })

  // Match binary -
  this.match ("-", [ _ , _ ], function (env, node, left, right) {
    return this.walk(left, env) - this.walk(right, env);
  })

  // Match unary +
  this.match ("+", [ _ ], function (env, node, left) {
    return +this.walk(left, env);
  })

  // Match binary +
  this.match ("+", [ _ , _ ], function (env, node, left, right) {
    return this.walk(left, env) + this.walk(right, env);
  })

  // Match binary *
  this.match ("*", function (env, node, left, right) {
    return this.walk(left, env) * this.walk(right, env);
  });

  // Match and "optimize" binary * when the right node is 2 by turning it into a left shift
  this.match ("*", [ _ , 2 ], function (env, node, left) {
    return this.walk(left, env) << 1;
  });

  // Match binary =
  this.match ("=", [ "name", _ ], function (env, node, left, right) {
    return env[left.value] = this.walk(right, env);
  });

  // Match binary /
  this.match ("/", function (env, node, left, right) {
    return this.walk(left, env) / this.walk(right, env);
  })

  // Match print statements
  this.match ("print", function (env, node, right) { 
    return sys.puts(this.walk(right, env));
  })

  // Match function statements
  this.match("function", function (env, node, params, body) {
    var self = this;
    return function () {
      var args = arguments;
      env = env.clone();
      params.forEach(function (param, idx) { env[self.walk(param, env)] = args[idx]; }, self);
      return self.walk(body, env).pop();
    };
  });

  // Match function calls
  this.match ("call", function (env, node, left, right) {
    var res = this.walk(left, env).apply(this, this.walk(right, env));
    return res;
  });

  // Match identifiers
  this.match ("name", function (env, node) {
    return env[node.value];
  });

  // Match anything else and return it's value
  this.match (_, function (env, node) {
    return node.value;
  })
});

var REPL = elf.REPL.clone({
  eval: function (cmd, env) {
    var ast    = Calculator.parse(cmd);
    var errors = elf.ErrorWalker.report(ast, cmd);
    if (errors) console.log(errors);
    var res    = Evaluator.walk(ast, env);
    return res.pop()
  }
});

REPL.start();

// var source = require("fs").readFileSync(__dirname + "/test.calc", 'utf8');
// var ast    = Calculator.parse(source);

// Evaluator.walk(ast);

// console.log("\n\nAST:\n")
// console.log('  ' + ast.toSexp().replace(/\n/g, '\n  '));

// console.log("\n\nErrors:")
// console.log(elf.ErrorWalker.report(ast, source) || '-');
