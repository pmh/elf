var elf       = require ( "../runtime/runtime" )
  , Parser    = require ( "../parser/parser"   )
  , ParserDSL = require ( "../parser/dsl"      )
  , Lexer     = require ( "../lexer/lexer"     )
  , LexerDSL  = require ( "../lexer/dsl"       )
  , fun       = require ( "funargs"            )
  , Language
  ;

Language = elf.Object.clone(function () {

  this.init = function () {
    this.parser = Parser.clone();
    this.lexer  = Lexer.clone();
  };

  LexerDSL.slots().forEach(function (slot) {
    this[slot] = function () {
      this.lexer[slot].apply(this.lexer, arguments);
    }
  }, this)

  ParserDSL.slots().forEach(function (slot) {
    this[slot] = function () {
      var args = fun(arguments);
      var ids  = args.strings();

      ids.forEach(function (id) {
        this.lexer.operator(id);
      }, this)

      this.parser[slot].apply(this.parser, arguments);
    }
  }, this);

  this.borrow = function (obj) {
    var symbols = Array.prototype.slice.call(arguments, 1);

    symbols.forEach(function (sym) { this.lexer.operator(sym); }, this)
    this.parser.borrow.apply(this.parser, [obj.parser].concat(symbols));
  }

  this.extend = function () {
    var languages = Array.prototype.slice.call(arguments)
      , self      = this
      ;

    languages.forEach(function (language) {
      language.parser.symbol_table.symbols.slots().forEach(function (symbol_name) {
        self.parser.symbol_table.symbols[symbol_name] = language.parser.symbol_table.symbols[symbol_name]
      }.bind(this));

      language.lexer.rules.forEach(function (rule) {

        self.lexer.rules.push(rule);
      });

      if (language.extended) language.extended(self);
    });

    return this;
  }

  this.parse = function (input) {
    return this.parser.parse(this.lexer.lex(input))
  }
});

module.exports = Language;