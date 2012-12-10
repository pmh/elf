var elf = require("../../index"), _;

var JS = elf.Language.clone(function () {
  this.number    (/[0-9]+(\.[0-9]+((e|E)(\+|\-)?[0-9]+)?)?/);
  this.name      (/[a-zA-Z\_\$][a-zA-Z0-9\_\$]*/);
  this.string    (/"([^"\\]|\\.)*"/);
  this.string    (/'([^'\\]|\\.)*'/);
  this.regex     (/\/(([^\/\\]|\\.)*\/[gim]{0,3})/);
  this.operator  (/\}|\)|\,|\]/);
  this.eol       (";");

  this.constant  ("true" , true);
  this.constant  ("false", false);
  this.constant  ("true" , true);
  this.constant  ("null" , null);

  this.stmt("{", function (node) {
    node.value = "(block)";
    node.first = this.parseUntil("}");
    return node;
  });

  this.stmt("var", function (node) {
    node.first = this.parseUntil(";", {
      step      : ",",
      parser    : "expression",
      validator : function (node) {
        return node.match("(name)", "=") ? node : node.error("Expected name or assignment but got " + node.value);
      }
    });

    return node;
  });

  this.parser.from = function (from) {
    var self = this;
    return {
      to: function (to, opts) {
        self.advance(from);
        return self.parseUntil(to, opts);
      }
    }
  };

  this.stmt("while", function (node) {
    node.first  = this.from("(").to(")")[0];
    node.second = this.from("{").to("}");
    return node;
  });

  this.stmt("for", function (node) {
    node.first  = this.from("(").to(")");
    node.second = this.from("{").to("}");

    return node;
  })

  this.stmt("if", function (node) {
    node.first = this.from("(").to(")")[0];

    if (this.token.match("{")) {
      node.second = this.from("{").to("}");
    } else {
      node.second = [this.expression()];
    }

    if (this.token.match("else")) {
      this.advance("else");
      if (this.token.match("if")) {
        node.third = this.statement();
      } else {
        node.third = this.token.match("{") ? this.from("{").to("}") : this.expression();
      }
    }

    return node;
  });

  this.stmt("break", function (node) {
    this.advance(";");
    if (!this.token.match("}")) this.statement().error("Unreachable statement");

    return node;
  });

  this.stmt("return", function (node) {
    if (!this.token.match(";"))
      node.first = this.expression();

    this.advance(";");

    if (!this.token.match("}")) this.statement().error("Unreachable statement");

    return node;
  });

  this.prefix("+", "-", "!", "typeof");

  this.prefix("this", function (node) {
    node.arity = "this";
    return node;
  });

  this.prefix("(", function () {
    var expr = this.expression();
    this.advance(")");
    return expr;
  });

  this.prefix("[", function (node) {
    node.value = "(array)";
    node.first = this.parseUntil("]", { step: ",", parser: "expression" });

    return node;
  });

  this.prefix("{", function (node) {
    node.value = "(object)";
    node.first = this.parseUntil("}", { step: ",", parser: "expression" });

    return node;
  });

  this.prefix("function", function (node) {
    if (this.token.match("(name)")) {
      node.name = this.token.value;
      this.advance("(name)");
    }

    this.advance("(");
    node.first = this.parseUntil(")", {
      step      : ",",
      validator : function (node) {
        return node.match("(name)") ? node : node.error("Expected a parameter name");
      }
    });

    this.advance("{");
    node.second = this.parseUntil("}");

    return node;
  });

  this.infix(":", 10, function (node, left) {
    if (!left.match("(name)", "(string)"))
      left.error("Bad key")

    node.first  = left;
    node.second = this.expression();

    return node;
  });

  this.infixr("=", "+=", "-=", 10, function (node, left) {
    if (!left.match(".", "[", "(name)")) left.error("Bad lvalue");
    node.first  = left;
    node.second = this.expression(9);
    return node;
  });

  // Match ternary operators
  this.infix("?", 20, function (node, left) {
    node.first  = left;
    node.second = this.expression();
    this.advance(":");
    node.third  = this.expression();
    node.arity  = "ternary";

    return node;
  });

  this.prefix("++", function (node) {
    node.value = "(inc)";
    node.first = this.advance();

    return node;
  });

  this.prefix("(name)", function (node) {
    if (this.token.match("++")) {
      var token   = this.token;
      token.value = "(inc)";
      token.first = node;
      token.arity = "postfix";
      this.advance();
      return token;
    }
    return node;
  });

  this.infixr   ("&&", "||", 30);
  this.infix    ("===", "!==", "<", ">", ">=", "<=", 40);
  this.infix    ("+", "-", 50);
  this.infix    ("*", "/", 60);

  // Parse dot access like foo.bar
  this.infix(".", 80, function (node, left) {
    if (!this.token.match("(name)"))
      this.token.error("Expected a property name.");

    this.token.arity = "literal";

    node.first  = left;
    node.second = this.token;

    this.advance();

    return node;
  });

  this.infix("(", 80, function (node, left) {
    node.value  = "(call)";

    var body = this.parseUntil(")", { step: "," })

    if (left.match(".", "[")) {
      node.arity  = "ternary";
      node.first  = left.first;
      node.second = left.second;
      node.third  = body;

      if (left.match("[")) node.computed = true;
    } else {
      node.first  = left;
      node.second = body;

      if (!left.match("unary")  || !left.match("function") &&
          !left.match("(name)") && !left.match("this") && !left.match("(")  &&
          !left.match("&&")     && !left.match("||") &&
          !left.match("?")) {
        node.error("Expected a variable name");
      }
    }

    return node;
  });

  // Parse computed accessors like foo["bar"]
  this.infix("[", 80, function (node, left) {
    node.first  = left;
    node.second = this.expression();

    if (this.token.match(","))
      node.error("Expected property access but got array");

    this.advance("]");

    return node;
  });

  // Skip whitespace
  this.skip   (/\s+/);

  // Skip multi- and single line comments
  this.skip   (/(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/);
});

var JSTranslator = elf.Walker.clone(function () {

  this.match("(name)", function (env, node) {
    return node.value;
  });

  this.match("(number)", function (env, node) {
    return node.value;
  });

  this.match("(string)", function (env, node) {
    return '"' + node.value + '"';
  });

  this.match("(regex)", function (env, node) {
    return '/' + node.value + '/' + node.modifiers;
  });

  this.match("(constant)", function (env, node) {
    return node.value;
  });

  this.match("(block)", function (env, node, statements) {
    return "{" + this.walk(statements).join(";") + "}";
  });

  this.match("var", function (env, node, assignments) {
    return "var " + this.walk(assignments).join(",");
  });

  this.match("while", function (env, node, test, body) {
    return "while(" + this.walk(test) + "){" + this.walk(body).join(';') + ";}";
  });

  this.match("for", function (env, node, test, body) {
    return "for(" + this.walk(test).join(";") + "){" + this.walk(body).join(";") + "}";
  });

  this.match("return", function (env, node, expr) {
    return "return" + (expr ? " " + this.walk(expr) : "");
  });

  this.match("(array)", function (env, node, items) {
    return "[" + this.walk(items).join(",") + "]";
  });

  this.match("(object)", function (env, node, pairs) {
    return "{" + pairs.map(function (pair) {
      return this.walk(pair.first) + ":" + this.walk(pair.second);
    }, this).join(",") + "}";
  });

  this.match("function", function (env, node, args, body) {
    var declaration  = "function" + (node.name ? " " + node.name : "")
      , formalParams = "(" + this.walk(args).join(",") + ")"
      , funcBody     = (body.length ? ("{" + this.walk(body).join(';') + "}") : "{}")
      ;

    return declaration + formalParams + funcBody;
  });

  this.match("(call)", [_, _, _], function (env, node, chain, name, args) {
    var recv     = this.walk(chain)
      , name     = this.walk(name)
      , fullName = (node.computed ? (recv + "[" + name + "]") : (recv + "." + name))
      , args     = this.walk(args)
      ;

    return fullName + "(" + args.join(",") + ")";
  });

  this.match("(call)", function (env, node, name, args) {
    return this.walk(name) + "(" + this.walk(args).join(",") + ")";
  });

  this.match(".", function (env, node, lhs, rhs) {
    return this.walk(lhs) + "." + this.walk(rhs);
  });

  this.match("+", function (env, node, lhs, rhs) {
    return this.walk(lhs) + "+" + this.walk(rhs);
  });

  this.match("-", function (env, node, lhs, rhs) {
    return this.walk(lhs) + "-" + this.walk(rhs);
  });

  this.match("*", function (env, node, lhs, rhs) {
    return this.walk(lhs) + "*" + this.walk(rhs);
  });

  this.match("/", function (env, node, lhs, rhs) {
    return this.walk(lhs) + "/" + this.walk(rhs);
  });

  this.match("<", function (env, node, lhs, rhs) {
    return this.walk(lhs) + "<" + this.walk(rhs);
  });

  this.match("=", function (env, node, lhs, rhs) {
    return this.walk(lhs) + "=" + this.walk(rhs);
  });

  this.match("this", function () { return "this"; });

  this.match("(inc)", function (env, node, name) {
    return node.match("postfix") ? (name.value + "++") : ("++" + name.value);
  })

  this.translate = function (ast) {
    var translated = this.walk(ast)
      , errors     = elf.ErrorWalker.report(translated);
      ;

    if (errors) console.log(errors);

    return translated.join(";") + ";";
  };
});

var REPL = elf.REPL.clone({
  eval: function (cmd) {
    var ast    = JS.parse(cmd)
      , errors = elf.ErrorWalker.report(ast, cmd)
      ;

    if (errors) console.log(errors);
    else return eval(JSTranslator.translate(ast));
  }
});

if (process.argv[2]) {
  var source = require("fs").readFileSync(process.argv[2], "utf8")
    , ast    = JS.parse(source)
    , errors = elf.ErrorWalker.report(ast, source)
    ;

  if (errors) console.log(errors);
  console.log("AST:");
  console.log(ast.toSexp());
  console.log("\nSOURCE:");
  console.log(JSTranslator.translate(ast));
} else {
  REPL.start();
}
