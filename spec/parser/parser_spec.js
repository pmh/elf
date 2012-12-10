var elf    = require("../../lib/elf")
var should = require("should")

describe ("Parser", function () {
  var parser, lexer;
  beforeEach(function () {
    parser = elf.Parser.clone();
    lexer  = elf.Lexer.clone(function () {
      this.name     ( /[a-z]+/  )
      this.number   ( /\d+/     )
      this.operator ( /\+|\*|\-/)
      this.operator ( /\{|\}/   )
      this.operator ( /\[|\]/   )
      this.operator ( /\,|\|/   )
      this.operator ( /\=|\+\=/ )
      this.operator ( "print"   )
      this.operator ( "return"  )
      this.eol      ( ";"       )
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

    it ("accepts variadic number of ids", function () {
      parser.prefix("+", "-", 10)
      parser.parse("+x", lexer).toSexp().should.eql("(+ x)")
      parser.parse("-x", lexer).toSexp().should.eql("(- x)")
    })

    it ("set's the arity to unary by default", function () {
      parser.prefix("+", function () {});
      parser.parse("+x", lexer).nodes[0].arity.should.eql("(unary)");
    });
  });

  describe ("infix", function () {
    it ("parses operators in infix position", function () {
      parser.infix("+", 10)
      parser.parse("x+y", lexer).toSexp().should.eql("(+ x y)")
    });

    it ("accepts variadic number of ids", function () {
      parser.infix("+", "-", 10)
      parser.parse("x+y-z", lexer).toSexp().should.eql("(- (+ x y) z)")
    })

    it ("accepts a binding power to control operator precedence", function () {
      parser.infix("+", 10)
      parser.infix("*", 20)
      parser.parse("x+y*z", lexer).toSexp().should.eql("(+ x (* y z))")
    });

    it ("set's the arity to binary by default", function () {
      parser.infix("+", 10);
      parser.parse("x+x", lexer).nodes[0].arity.should.eql("(binary)");
    });
  });

  describe ("infixr", function () {
    it ("parses right associative infix operators", function () {
      parser.infix  ("+", 10)
      parser.infixr ("=", 10)
      parser.parse("foo=x+y", lexer).toSexp().should.eql("(= foo (+ x y))")
    });

    it ("accepts variadic number of ids", function () {
      parser.infixr("=", "+=", 10)
      parser.parse("x=y+=z", lexer).toSexp().should.eql("(= x (+= y z))")
    })

    it ("set's the arity to binary by default", function () {
      parser.infix("=", 10);
      parser.parse("x=y", lexer).nodes[0].arity.should.eql("(binary)");
    });
  });

  describe ("stmt", function () {
    beforeEach(function () {
      parser.stmt("return", "print", function (token) {
        token.first = this.expression(70);
        return token;
      })
    });
    
    it ("parses statements", function () {
      parser.parse("return x", lexer).toSexp().should.eql("(return x)")
    });

    it ("accepts variadic number of ids", function () {
      parser.parse("return x", lexer).toSexp().should.eql("(return x)")
      parser.parse("print x" , lexer).toSexp().should.eql("(print x)" )
    })

    it ("can't be part of an expression", function () {
      parser.infix("+", 10)
      parser.parse("x + return x", lexer).toSexp().should.eql("(+ x (<SyntaxError: Unexpected prefix: 'return'> x))")
    });

    it ("set's the arity to statement by default", function () {
      parser.parse("return x", lexer).nodes[0].arity.should.eql("(statement)");
    });
  });

  describe ("parse", function () {
    it ("accepts a list of tokens", function () {
      parser.infix("+", 10);

      parser.parse(lexer.lex('1 + 2')).toSexp().should.eql("(+ 1 2)")
    });

    it ("accepts an input string and a lexer", function () {
      parser.infix("+", 10);

      parser.parse('1 + 2', lexer).toSexp().should.eql("(+ 1 2)")
    });

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

  describe ("parseUntil", function () {
    it ("accepts a token value and keeps parsing until it finds it", function () {
      parser.infix("+", 10)
      parser.prefix("{", function (node) {
        node.value  = "block"
        node.first  = this.parseUntil("}");
        return node;
      });
      parser.parse('{ 1 + 2; 3 + 4 }', lexer).toSexp().should.eql('(block [(+ 1 2), (+ 3 4)])');
    });

    it ("it stops parsing immediately when it finds the token", function () {
      parser.infix("+", 10)
      parser.prefix("{", function (node) {
        node.value  = "block"
        node.first  = this.parseUntil("}");
        return node;
      });
      parser.parse('{}', lexer).toSexp().should.eql('(block [])');
    });

    it ("stops parsing and produces an error node if it encounters eof", function () {
      parser.infix("+", 10)
      parser.prefix("{", function (node) {
        node.value  = "block"
        node.first = this.parseUntil("}");
        return node;
      });
      parser.parse('{ 1 + 2; 3 + 4', lexer).toSexp().should.
        eql('(block [(+ 1 2), (+ 3 4)])\n<SyntaxError: Expected: } but got: (eof)>');
    });

    it ("accepts a map of node metadata", function () {
      parser.infix("+", 10)
      parser.prefix("[", function (node) {
        node.value  = "array"
        node.first = this.parseUntil("]", { step: ",", meta: { arrayprop: "yes" } });
        return node;
      });
      parser.parse('[1 + 2, 3 + 4]', lexer).nodes[0].first.map(function (node) {
        return node.arrayprop;
      }).should.eql(["yes", "yes"]);
    })

    it ("accepts an optional step", function () {
      parser.infix("+", 10)
      parser.prefix("[", function (node) {
        node.value  = "array"
        node.first  = this.parseUntil("]", { step: "," });
        return node;
      });
      parser.parse('[1 + 2, 3 + 4]', lexer).toSexp().should.
        eql('(array [(+ 1 2), (+ 3 4)])');
    });

    it ("can conditionally parse", function () {
      parser.infix("+", 10)
      parser.prefix("{", function (node) {
        node.value  = "block"
        node.first  = this.parseUntil("|", { optional: true, step: "," });
        node.second = this.parseUntil("}");
        return node;
      });

      parser.parse('{}', lexer).toSexp().should.
        eql('(block [] [])');

      parser.parse('{x}', lexer).toSexp().should.
        eql('(block [] [x])');

      parser.parse('{x|}', lexer).toSexp().should.
        eql('(block [x] [])');

      parser.parse('{x|y}', lexer).toSexp().should.
        eql('(block [x] [y])');

      parser.parse('{x|x+2}', lexer).toSexp().should.
        eql('(block [x] [(+ x 2)])');
    });
  });

  describe ("clone", function () {
    it ("sets up a prototypal inheritance", function () {
      var P1 = parser.clone(function () { this.infix('+', 10) });
      var P2 = P1.clone(function () { this.infix('*', 20); });
      
      P2.parse('1 + 2 * 3', lexer).toSexp().should.eql("(+ 1 (* 2 3))");
    });

    it ("supports overriding of rules", function () {
      var P1 = parser.clone(function () { this.infix('+', 10); this.infix('*', 20); });
      var P2 = P1.clone(function () { this.infix('+', 20) });
      
      P2.parse('1 + 2 * 3', lexer).toSexp().should.eql("(* (+ 1 2) 3)");
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