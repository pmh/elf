var elf    = require("../../lib/elf")
var should = require("should")

describe ("Parser", function () {
  var parser, lexer;
  beforeEach(function () {
    parser = elf.Parser.clone();
    lexer  = elf.Lexer.clone(function () {
      this.name     ( /[a-z]+/  )
      this.number   ( /\d+/     )
      this.operator ( /\+|\*/   )
      this.operator ( "return"  )
      this.skip     ( /\s+/     )
    });
  });

  describe ("symbol", function () {
    it ("populates the symbol table", function () {
      parser.symbol("+", 10);
      should.exist(parser.symbol_table.symbols["+"])
    });
  });

  describe ("prefix", function () {
    it ("parses operators in prefix position", function () {
      parser.prefix("+")
      elf.sexp(parser.parse("+x", lexer)).should.eql("(+ x)")
    });
  });

  describe ("infix", function () {
    it ("parses operators in infix position", function () {
      parser.infix("+", 10)
      elf.sexp(parser.parse("x+y", lexer)).should.eql("(+ x y)")
    });

    it ("accepts a binding power to control operator precedence", function () {
      parser.infix("+", 10)
      parser.infix("*", 20)
      elf.sexp(parser.parse("x+y*z", lexer)).should.eql("(+ x (* y z))")
    });
  });

  describe ("stmt", function () {
    beforeEach(function () {
      parser.stmt("return", function (parser) {
        this.first = parser.expression(70);
        return this;
      })
    });
    
    it ("parses statements", function () {
      elf.sexp(parser.parse("return x", lexer)).should.eql("(return x)")
    });

    it ("can't be part of an expression", function () {
      parser.infix("+", 10)
      elf.sexp(parser.parse("x + return x", lexer)).should.eql("(+ x (<SyntaxError Unexpected token 'return' line 0, column [4, 9]> x))")
    });
  });


  describe ("parse", function () {

    it ("can parse single expressions", function () {
      parser.infix("+", 10)
      elf.sexp(parser.parse("x", lexer)).should.eql("x");
      elf.sexp(parser.parse("x + y", lexer)).should.eql("(+ x y)");
    });

    it ("can parse multiple expressions", function () {
      parser.infix("+", 10)
      elf.sexp(parser.parse("x + y + z", lexer)).should.eql("(+ (+ x y) z)");
    });

    it ("can parse multiline expressions", function () {
      parser.infix("+", 10)
      lexer.eol(";")
      elf.sexp(parser.parse("x + y ; z + 21", lexer)).should.eql("[(+ x y), (+ z 21)]");
    });

    it ("gracefully recovers from parse errors", function () {
      parser.infix("+", 10)

      elf.sexp(parser.parse("x!y", lexer)).should.
        eql("[x, (<SyntaxError Unknown token '!' line 0, column [2, 2]> y)]");

      elf.sexp(parser.parse("x + y * 20", lexer)).should.
        eql("[(+ x y), (<SyntaxError Unexpected token '*' line 0, column [6, 6]> 20)]");

      elf.sexp(parser.parse("+x", lexer)).should.
        eql("(<SyntaxError Unexpected token '+' line 0, column [0, 0]> x)");
    })
  });


  describe ("borrow", function () {
    it ("copies specific rule from another parser", function () {
      var otherParser = parser.clone(function () { this.infix("+", 10); this.infix("-", 10); this.infix("*", 10) });
      parser.borrow(otherParser, "+", "-")

      should.exist(parser.symbol_table.symbols["+"])
      should.exist(parser.symbol_table.symbols["-"])
      should.not.exist(parser.symbol_table.symbols["*"])
    });
  });

  describe ("extend", function () {
    it ("copies all rules from another parser", function () {
      var otherParser = parser.clone(function () { this.infix("+", 10); this.infix("-", 10); this.infix("*", 10) });
      parser.extend(otherParser)

      should.exist(parser.symbol_table.symbols["+"])
      should.exist(parser.symbol_table.symbols["-"])
      should.exist(parser.symbol_table.symbols["*"])
    });
  });
});