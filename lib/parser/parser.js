var elf         = require ( "../runtime/runtime" );
var SymbolTable = require ( "./symbol_table.js"  );

var Parser = elf.Object.clone(function () {
  this.keywords.push("symbol_table")
  this.symbol_table = SymbolTable;

  this.init = function () {
    this.symbol_table = this.symbol_table.clone();
    this.prefix( "(literal)", function (token) { return token; } );
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
    var left, token = this.token;
    this.advance();
    left = token.nud.call(this, token);
    if (this.token.id === "(literal)") {
      token = this.token;
      this.advance();
      return token.led.call(this, token, left);
    }
    while (rbp < this.token.lbp) {
      token = this.token;
      this.advance();
      left = token.led.call(this, token, left);
    }

    return left;
  };

  this.block = function (open, close) {
    var stmts = []
    this.advance(open);
    while (this.token.value !== close && this.token.type !== "(eof)")
      stmts.push(this.statement());

    this.advance(close)
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
      if (statement)
        stmts.push(statement);
    }

    return stmts.length === 1 ? stmts[0] : stmts;
  }

  this.parse = function (source, lexer) {
    this.tokens = lexer.lex(source);
    this.advance();
    
    var stmts = this.statements();
    if (this.token.type === "(eof)") this.advance("(eof)");

    return stmts;
  };

  this.stmt = function (id, std) {
    this.symbol(id).std = std;
  };

  this.prefix = function (id, nud) {
    this.symbol(id).nud = nud || function (token) {
      token.first  = this.expression(70);
      token.arity  = "unary";
      return token;
    };
  };

  this.infix = function (id, bp, led) {
    this.symbol(id, bp).led = led || function (token, left) {
      token.first  = left;
      token.second = this.expression(bp);
      token.arity  = "binary";
      return token;
    };
  };

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