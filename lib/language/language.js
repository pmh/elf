var elf    = require ( "../runtime/runtime" )
  , Parser = require ( "../parser/parser"   )
  , Lexer  = require ( "../lexer/lexer"     )
  , Language
  ;

Language = elf.Object.clone(function () {

  this.init = function () {
    this.parser = Parser.clone();
    this.lexer  = Lexer.clone();
  };

  this.rule = function (name, regex, action, arity) {
    this.lexer.rule(name, regex, action, arity)
  };

  this.name = function (regex, helper) {
    this.lexer.name(regex, helper);
  }

  this.number = function (regex, helper) {
    this.lexer.number(regex, helper);
  }

  this.string = function (regex, helper) {
    this.lexer.string(regex, helper);
  }

  this.regex = function (regex, helper) {
    this.lexer.regex(regex, helper);
  }

  this.operator = function (regex, helper) {
    this.lexer.operator(regex, helper);
  }

  this.eol = function (regex, helper) {
    this.lexer.eol(regex, helper);
  }

  this.skip = function (regex, helper) {
    this.lexer.skip(regex, helper);
  }

  this.prefix = function (id, led) {
    this.lexer.operator(id);
    this.parser.prefix(id, led)
  };

  this.infix = function (id, bp, led) {
    this.lexer.operator(id);
    this.parser.infix(id, bp, led)
  };

  this.infixr = function (id, bp, led) {
    this.lexer.operator(id);
    this.parser.infix(id, bp, led)
  };

  this.stmt = function (id, led) {
    this.lexer.operator(id);
    this.parser.stmt(id, led)
  };

  this.borrow = function (obj) {
    var symbols = Array.prototype.slice.call(arguments, 1), self = this;

    symbols.forEach(function (sym) { self.lexer.operator(sym); })
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