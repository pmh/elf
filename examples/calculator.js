var elf = require("../index"), sys = require("sys"), _;

var CalcLexer = elf.Lexer.clone(function () {
  this.number     ( /\d+/               )
  this.name       ( /[a-zA-Z]+/         )
  this.operator   ( /\+|\-|\*|\/|\=/    )
  this.operator   ( /\(|\)|\{|\}|\,|\|/ )
  this.operator   ( "print"             )
  this.skip       ( /\s+/               )
  this.eol        ( /\;/                )
})

var CalcParser = elf.Parser.clone(function () {
  this.prefix ( "-"     )

  this.infixr ( "=", 10 )
  this.infix  ( "+", 10 )
  this.infix  ( "-", 10 )
  this.infix  ( "*", 20 )
  this.infix  ( "/", 20 )

  this.prefix  ("{", function (node, left) {
    node.value  = "block";
    node.first  = [];

    if (this.token.value === "|") this.advance("|");

    if (this.tokens.peek().value === "," || this.tokens.peek().value === "|") {
      while (true) {
        if (this.token.value === "|") break;

        var arg = this.expression();
        arg.type = "parameter";
        node.first.push(arg);
        
        this.advance(",")
      }
      this.advance("|");
    }
    
    node.second = this.block("{", "}");
    node.arity  = "binary";

    return node;
  })

  this.infix  ("(", 80, function (node, first) {
    node.value  = "call";
    node.first  = first;
    node.second = [];
    node.arity  = "binary";

    while (this.token.value !== ")" && this.token.value !== "(eof)") {
      node.second.push(this.expression());
      this.advance(",")
    }

    this.advance(")");

    return node;
  });

  this.stmt ("print", function (node) {
    node.first = this.expression();
    node.arity = "statement";
    return node;
  });
});

CalcWalker = elf.Walker.clone(function () {
  var env = elf.Object.clone({ sqrt: function (num) { return Math.sqrt(num); } });

  // Match unary -
  this.match ("-", [ _ ], function (node, left) {
    return -this.walk(left);
  })

  // Match binary -
  this.match ("-", [ _ , _ ], function (node, left, right) {
    return this.walk(left) - this.walk(right);
  })

  // Match binary +
  this.match ("+", function (node, left, right) {
    return this.walk(left) + this.walk(right);
  })

  // Match binary *
  this.match ("*", function (node, left, right) {
    return this.walk(left) * this.walk(right);
  });

  // Match and "optimize" binary * when the right node is 2 by turning it into a left shift
  this.match ("*", [ _ , 2 ], function (node, left) {
    return this.walk(left) << 1;
  });

  // Match binary =
  this.match ("=", [ "name", _ ], function (node, left, right) {
    return env[left.value] = this.walk(right);
  });

  // Match binary /
  this.match ("/", function (node, left, right) {
    return this.walk(left) / this.walk(right);
  })

  // Match block statements
  this.match ("print", function (node, right) { 
    return sys.puts(this.walk(right));
  })

  // Match block statements
  this.match("block", function (node, params, body) {
    var self = this;
    return function () {
      var args = arguments;
      env      = env.clone();
      params.forEach(function (param, idx) { env[self.walk(param)] = args[idx]; });
      body.map(self.walk, self);
      env = env.parent;
    }
  });

  this.match ("call", [ "name" , _ ], function (node, left, right) {
    return env[left.value].apply(null, right.map(this.walk, this));
  });

  this.match ("call", [ "block" , _ ], function (node, left, right) {
    return this.walk(left).apply(null, right.map(this.walk, this));
  });

  // Match identifiers
  this.match ("name", function (node) {
    return env[node.value];
  });

  // Match anything else and return it's value
  this.match (_, function (node) {
    return node.value;
  })
});

// var source = "print 1 3 * -3 + * 4;\nprint 3 ?? 4;";
var source = require("fs").readFileSync(__dirname + "/test.calc", 'utf8');
var ast    = CalcParser.parse(source, CalcLexer);

CalcWalker.walk(ast);

console.log("\n\nAST:\n")
console.log('  ' + ast.toSexp().replace(/\n/g, '\n  '));

console.log("\n\nErrors:")
console.log(ast.errors(source) || '-');

// console.log(JSON.stringify(ast.nodes, null, '  '))