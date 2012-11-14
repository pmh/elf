var elf = require ( "../runtime/runtime" )
  , AST = require ( "./ast"              )
  ;

var Parser = elf.Object.clone(function () {
  this.keywords.push("symbol_table")
  this.symbol_table = require("./symbol_table.js");

  this.init = function () {
    this.symbol_table = this.symbol_table.clone();
    this.prefix( "(literal)", function (token) { return token; } );
    this.prefix( "(name)"   , function (token) { return token; } );
    this.symbol( "(error)" );
  }

  this.symbol = function (id, bp) {
    return this.symbol_table.set(id, bp);
  };

  this.advance = function (id) {
    if (id && id !== this.token.value) {
      this.token.type = "(error)";
      this.token.message = function () {
        return "Expected: " + id + " but got: " + this.value;
      };
      return this.token;
    }

    return this.token = this.symbol_table.get(this.tokens.next());
  };

  this.expression = function (rbp) {
    if (this.token.value === "(eol)") this.advance("(eol)");
    if (this.token.type  === "(eof)") return;

    rbp = rbp || 0;
    var token = this.token;
    this.advance();
    var left = token.nud.call(this, token);
    while (rbp < this.token.lbp) {
      token = this.token;
      this.advance();
      left = token.led.call(this, token, left);
    }

    if (this.token.value === "(eol)") this.advance("(eol)")

    return left;
  };

  this.block = function (open, close) {
    if (this.token.value === open) this.advance(open);
    var stmts = []
    while (this.token.value !== close && this.token.value !== "(eof)") {
      stmts.push(this.statement());
      this.advance("(eol)");
    }
    this.advance(close);
    return stmts;
  };

  this.statement = function () {
    var token = this.token;
    if (token.std) {
      this.advance();
      return token.std.call(this, token);
    }

    return this.expression();
  };

  this.statements = function () {
    var stmts = [];
    while (this.token.type !== "(eof)") {
      var statement = this.statement()
      if (statement) stmts.push(statement);

      if (this.token.type  === "(eof)") break;
    }

    return stmts;
  }

  this.parse = function (source, lexer) {
    this.tokens = arguments.length === 1 ? source : lexer.lex(source);
    this.advance();
    
    var stmts = this.statements();
    if (this.token.type === "(eof)") this.advance("(eof)");

    return AST.create(stmts);
  };

  this.stmt = function (id, std) {
    this.symbol(id).std = function (token) {
      token.arity = "statement";
      return (std || function (token) {
        token.first = this.expression();
        return token;
      }).call(this, token);
    }
  };

  this.prefix = function (id, nud) {
    this.symbol(id).nud = function (token) {
      token.arity = "unary";
      return (nud || function (token) {
        token.first = this.expression(70);
        return token;
      }).call(this, token);
    };
  };

  this.infix = function (id, bp, led) {
    this.symbol(id, bp).led = function (token, left) {
      token.arity = "binary";
      return (led || function (token, left) {
        token.first  = left;
        token.second = this.expression(bp);
        return token;
      }).call(this, token, left);
    }
  };

  this.infixr = function (id, bp, led) {
    this.symbol(id, bp).led = function (token, left) {
      token.arity = "binary";
      return (led || function (token, left) {
        token.first  = left;
        token.second = this.expression(bp - 1);
        token.arity  = "binary";
        return token;
      }).call(this, token, left);
    };
  }

  this.prefix ("(", function (node) {
    var expr = this.expression();
    this.advance(")");
    return expr;
  });

  this.borrow = function (obj) {
    var symbols = Array.prototype.slice.call(arguments, 1);

    symbols.forEach(function (symbol_name) {
      this.symbol_table.symbols[symbol_name] = obj.symbol_table.symbols[symbol_name]
    }.bind(this));
  };

  this.extended = function (extendee) {
    this.symbol_table.symbols.slots().forEach(function (symbol_name) {
      extendee.symbol_table.symbols[symbol_name] = this.symbol_table.symbols[symbol_name]
    }.bind(this));
  };

  this._type = "Parser";
});

module.exports = Parser;