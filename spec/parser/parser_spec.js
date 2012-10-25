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
      parser.parse("+x", lexer).toSexp().should.eql("(+ x)")
    });
  });

  describe ("infix", function () {
    it ("parses operators in infix position", function () {
      parser.infix("+", 10)
      parser.parse("x+y", lexer).toSexp().should.eql("(+ x y)")
    });

    it ("accepts a binding power to control operator precedence", function () {
      parser.infix("+", 10)
      parser.infix("*", 20)
      parser.parse("x+y*z", lexer).toSexp().should.eql("(+ x (* y z))")
    });
  });

  describe ("stmt", function () {
    beforeEach(function () {
      parser.stmt("return", function (token) {
        token.first = this.expression(70);
        return token;
      })
    });
    
    it ("parses statements", function () {
      parser.parse("return x", lexer).toSexp().should.eql("(return x)")
    });

    it ("can't be part of an expression", function () {
      parser.infix("+", 10)
      parser.parse("x + return x", lexer).toSexp().should.eql("(+ x (<SyntaxError: Unexpected prefix: 'return'> x))")
    });
  });


  describe ("parse", function () {

    it ("can parse single expressions", function () {
      parser.infix("+", 10)
      parser.parse("x", lexer).toSexp().should.eql("x");
      parser.parse("x + y", lexer).toSexp().should.eql("(+ x y)");
    });

    it ("can parse complex expressions", function () {
      parser.infix("+", 10)
      parser.parse("x + y + z", lexer).toSexp().should.eql("(+ (+ x y) z)");
    });

    it ("can parse multiple expressions", function () {
      parser.infix("+", 10)
      lexer.eol(";")
      parser.parse("x + y ; z + 21" , lexer).toSexp().should.eql("(+ x y)\n(+ z 21)");
      parser.parse("x + y ; z + 21;", lexer).toSexp().should.eql("(+ x y)\n(+ z 21)");
    });

    it ("gracefully recovers from parse errors", function () {
      parser.infix("+", 10)

      parser.parse("x!y", lexer).toSexp().should.
        eql("x\n(<SyntaxError: Unknown token: '!'> y)");

      parser.parse("x + y * 20", lexer).toSexp().should.
        eql("(+ x y)\n(<SyntaxError: Unexpected prefix: '*'> 20)");

      parser.parse("+x", lexer).toSexp().should.
        eql("(<SyntaxError: Unexpected prefix: '+'> x)");
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