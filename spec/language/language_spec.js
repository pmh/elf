var Language = require ( "../../lib/language/language" )
  , Parser   = require ( "../../lib/parser/parser"     )
  , Lexer    = require ( "../../lib/lexer/lexer"       )
  , should   = require ( "should"                      )
  ;

describe ("Language", function () {
  var language, helper;
  beforeEach(function () {
    language = Language.clone();
    helper = function () { return "helper"; };
  });

  describe ("init", function () {
    it ("assigns a parser instance", function () {
      language.parser.parent.should.eql(Parser);
    });

    it ("assigns a lexer instance", function () {
      language.lexer.parent.should.eql(Lexer);
    });
  });

  describe('rule', function () {
    it("delegates to the lexer", function () {
      language.rule("operator", /[a-zA-Z]+/, helper, "(operator)");
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString(), r.action] })[0].
        should.eql(['operator', "/^([a-zA-Z]+)/", helper]);
    });
  });

  describe('name', function () {
    it("delegates to the lexer", function () {
      language.name(/[a-zA-Z]+/, helper);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString(), r.action] })[0].
        should.eql(['(name)', "/^([a-zA-Z]+)/", helper]);
    });
  });

  describe('number', function () {
    it("delegates to the lexer", function () {
      language.number(/[0-9]+/, helper);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString(), r.action] })[0].
        should.eql(['(number)', "/^([0-9]+)/", helper]);
    });
  });

  describe('string', function () {
    it("delegates to the lexer", function () {
      language.string(/\".+\"/, helper);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString(), r.action] })[0].
        should.eql(['(string)', '/^(\\".+\\")/', helper]);
    });
  });

  describe('regex', function () {
    it("delegates to the lexer", function () {
      language.regex(/\/.+\//, helper);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString(), r.action] })[0].
        should.eql(['(regex)', "/^(\\/.+\\/)/", helper]);
    });
  });

  describe('operator', function () {
    it("delegates to the lexer", function () {
      language.operator(/\+/, helper);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString(), r.action] })[0].
        should.eql(['(operator)', '/^(\\+)/', helper]);
    });
  });

  describe('eol', function () {
    it("delegates to the lexer", function () {
      language.eol(/\;/, helper);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString(), r.action] })[0].
        should.eql(['(eol)', '/^(\\;)/', helper]);
    });
  });

  describe('skip', function () {
    it("delegates to the lexer", function () {
      language.skip(/\s+/);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString(), r.action] })[0].
        should.eql(['(skip)', '/^(\\s+)/', language.lexer.helpers.skip]);
    });
  });

  describe ("prefix", function () {
    it ("delegates to the lexer", function () {
      language.prefix("+");
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] })[0].
        should.eql(['(operator)', '+']);
    });

    it ("accepts variadic number of ids", function () {
      language.prefix("+", "-")
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] }).
        should.eql([['(operator)', '+'], ['(operator)', '-']]);
      language.parser.symbol_table.symbols["+"].id.should.eql("+");
      language.parser.symbol_table.symbols["-"].id.should.eql("-");
    })

    it ("delegates to the parser", function () {
      language.prefix("+", helper);

      language.parser.symbol_table.symbols["+"].id.should.eql("+");
      language.parser.symbol_table.symbols["+"].nud({}).should.eql("helper");
    });
  });

  describe ("infix", function () {
    it ("delegates to the lexer", function () {
      language.infix("+", 10);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] })[0].
        should.eql(['(operator)', '+']);
    });

    it ("accepts variadic number of ids", function () {
      language.infix("+", "-", 10)
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] }).
        should.eql([['(operator)', '+'], ['(operator)', '-']]);
      language.parser.symbol_table.symbols["+"].id.should.eql("+");
      language.parser.symbol_table.symbols["-"].id.should.eql("-");
    });

    it ("delegates to the parser", function () {
      language.infix("+", 10, helper);

      language.parser.symbol_table.symbols["+"].id.should.eql("+");
      language.parser.symbol_table.symbols["+"].lbp.should.eql(10);
      language.parser.symbol_table.symbols["+"].led({}).should.eql("helper");
    });
  });

  describe ("infixr", function () {
    it ("delegates to the lexer", function () {
      language.infixr("=", 10);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] })[0].
        should.eql(['(operator)', '=']);
    });

    it ("accepts variadic number of ids", function () {
      language.infixr("+", "-", 10)
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] }).
        should.eql([['(operator)', '+'], ['(operator)', '-']]);
      language.parser.symbol_table.symbols["+"].id.should.eql("+");
      language.parser.symbol_table.symbols["-"].id.should.eql("-");
    });

    it ("delegates to the parser", function () {
      language.infixr("=", 10, helper);

      language.parser.symbol_table.symbols["="].id.should.eql("=");
      language.parser.symbol_table.symbols["="].lbp.should.eql(10);
      language.parser.symbol_table.symbols["="].led({}).should.eql("helper");
    });
  });

  describe ("stmt", function () {
    it ("delegates to the lexer", function () {
      language.stmt("if", helper);
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] })[0].
        should.eql(['(operator)', 'if']);
    });

    it ("accepts variadic number of ids", function () {
      language.stmt("print", "return")
      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] }).
        should.eql([['(operator)', 'print'], ['(operator)', 'return']]);
      language.parser.symbol_table.symbols["print"].id.should.eql("print");
      language.parser.symbol_table.symbols["return"].id.should.eql("return");
    })

    it ("delegates to the parser", function () {
      language.stmt("if", helper);

      language.parser.symbol_table.symbols["if"].id.should.eql("if");
      language.parser.symbol_table.symbols["if"].lbp.should.eql(0);
      language.parser.symbol_table.symbols["if"].std({}).should.eql("helper");
    });
  });

  describe ("borrow", function () {
    it ("copies specific parser rules from another language", function () {
      var otherLang = Language.clone(function () { this.infix("+", 10); this.infix("-", 10); this.infix("*", 10) });
      language.borrow(otherLang, "+", "-")

      should.exist(language.parser.symbol_table.symbols["+"])
      should.exist(language.parser.symbol_table.symbols["-"])
      should.not.exist(language.parser.symbol_table.symbols["*"])
    });

    it ("copies specific lexer rules from another language", function () {
      var otherLang = Language.clone(function () { this.infix("+", 10); this.infix("-", 10); this.infix("*", 10) });
      language.borrow(otherLang, "+", "-")

      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] }).
        should.eql([["(operator)", "+"], ["(operator)", "-"]]);
    });
  });

  describe ("extend", function () {
    it ("copies all parser rules from another language", function () {
      var otherLang = Language.clone(function () { this.infix("+", 10); this.infix("-", 10); this.infix("*", 10) });
      language.extend(otherLang);

      should.exist(language.parser.symbol_table.symbols["+"]);
      should.exist(language.parser.symbol_table.symbols["-"]);
      should.exist(language.parser.symbol_table.symbols["*"]);
    });

    it ("copies all parser rules from multiple languages", function () {
      var otherLang1 = Language.clone(function () { this.infix("+", 10); this.infix("-", 10); });
      var otherLang2 = Language.clone(function () { this.infix("*", 10)                       });
      language.extend(otherLang1);
      language.extend(otherLang2);

      should.exist(language.parser.symbol_table.symbols["+"]);
      should.exist(language.parser.symbol_table.symbols["-"]);
      should.exist(language.parser.symbol_table.symbols["*"]);
    });


    it ("copies all lexer rules from another language", function () {
      var otherLang = Language.clone(function () { this.infix("+", 10); this.infix("-", 10); this.infix("*", 10) });
      language.extend(otherLang);

      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] }).
        should.eql([["(operator)", "+"], ["(operator)", "-"], ["(operator)", "*"]]);
    });

    it ("copies all lexer rules from multiple languages", function () {
      var otherLang1 = Language.clone(function () { this.infix("+", 10); this.infix("-", 10); });
      var otherLang2 = Language.clone(function () { this.infix("*", 10);                      });
      language.extend(otherLang1);
      language.extend(otherLang2);

      language.lexer.rules.map(function (r) { return [r.name, r.regex.toString()] }).
        should.eql([["(operator)", "+"], ["(operator)", "-"], ["(operator)", "*"]]);
    });
  });

  describe("advance", function () {
    beforeEach(function () {
      language.parser.token  = {match : function () { return true; }}
      language.parser.tokens = {next  : function () { return { extend: function () {}, value: "+"};  }}
    })
    describe("with id", function () {
      it ("should add a lexer rule", function () {
        language.parser.advance("+")
        language.lexer.rules[0].name.should.eql("(operator)");
        language.lexer.rules[0].regex.should.eql("+")
      });
    });

    describe("without id", function () {
      it ("should not add a lexer rule", function () {
        language.parser.advance()
        language.lexer.rules.should.eql([])
      });
    });
  });

  describe("parseUntil", function () {

    it ("should add a lexer rule for the value", function () {
      var lang = Language.clone()
      lang.name(/[a-z]+/)
      lang.infix("(", 80, function (node, left) {
        node.first  = left;
        node.second = this.parseUntil(")");
        return node;
      });

      lang.parse("foo(abc)");
      var rule = lang.lexer.rules[2];
      rule.name.should.eql("(operator)");
      rule.regex.should.eql(")");
    });

    it ("should add lexer rule for the step argument", function () {
      var lang = Language.clone(function () {
        this.name(/[a-zA-Z]+/)
        this.infix("(", 80, function (node, left) {
          node.first  = left;
          node.second = this.parseUntil(")", {step: ","});
          return node;
        });
      })

      lang.parse("foo(abc,efg)");
      var rule = lang.lexer.rules[3];
      rule.name.should.eql("(operator)");
      rule.regex.should.eql(",");
    })
  })

  describe ("parse", function () {
    it ("accepts a program string as input and produces an ast as output", function () {
      language.lexer.number(/[0-9]+/);
      language.lexer.operator("+");
      language.lexer.skip(/\s+/);
      language.parser.infix("+", 10);

      language.parse("1 + 1").toSexp().should.eql("(+ 1 1)");
    });
  });
})
