var elf       = require ( "../runtime/runtime" )
  , ParserDSL = require ( "./dsl"              )
  , ParserAPI = require ( "./api"              )
  , AST       = require ( "./ast"              )
  ;

var Parser = elf.Object.clone(function () {
  this.extend(ParserAPI);
  this.extend(ParserDSL)

  this.keywords.push("symbol_table")
  this.symbol_table = require("./symbol_table.js");

  this.init = function () {
    this.symbol_table = this.symbol_table.clone();
    this.prefix( "(literal)", function (token) { return token; } );
    this.prefix( "(name)"   , function (token) { return token; } );
    this.symbol( "(error)" );
  }

  this.parse = function (source, lexer) {
    this.tokens = arguments.length === 1 ? source : lexer.lex(source);
    this.advance();
    
    var stmts = this.statements();
    if (this.token.type === "(eof)") this.advance("(eof)");

    return AST.create(stmts);
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