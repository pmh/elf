var Lexer  = require( "../../lib/lexer/lexer" );
var should = require( "should"                );

describe ("Lexer", function () {
  var lexer;
  beforeEach(function () {
    lexer = Lexer.clone();
    lexer.rules  = [];
    lexer.column = 0;
    lexer.line   = 0;
  });

  describe (".rule", function () {
    it ("creates a new token", function () {
      var action = function () {};
      var rule = lexer.rule("number", /\d+/, action);
      rule. name.   should. eql ("number");
      rule. regex.  should. eql ("^(\\d+)");
      rule. action. should. eql (action);
    });

    it ("stores the token in the rules list", function () {
      lexer.rule("number", /foo/);
      lexer.rules.length.should.eql(1);
      lexer.rules[0].name.should.eql("number");
    });
  });

  describe ("advance", function () {

    it ("returns a token object when a match is found", function () {
      lexer.rule("number", /\d+/);
      lexer.source = "123"
      var token = lexer.advance();

      token. type.  should. eql ( "number" );
      token. value. should. eql ( "123"    );
    });

    it ("updates the column count after a match", function () {
      lexer.source = "123";
      lexer.rule("number", /\d+/);
      lexer.advance();

      lexer.column.should.eql(3);
    });

    it("should choose the longest match when there are multiple choices", function () {
      lexer.source = "||";
      lexer.rule("operator", /\|/);
      lexer.rule("operator", /\|\|/);
      var token = lexer.advance();

      token.type.should.eql("operator");
    });

    it ("should run the value through the action if one is provided", function () {
      lexer.source = "23";
      lexer.rule("number", /\d+/, function (num) { return parseInt(num, 10); });
      
      lexer.advance().value.should.eql(23);
    });

    it ("should return the value instead of a token if the action returns an array", function () {
      lexer.source = "23";
      lexer.rule("number", /\d+/, function (num) { return [this.create("num", parseInt(num, 10))]; });
      
      lexer.advance()[0].value.should.eql(23);
    });

    it ("should return the value if the action returns a token", function () {
      lexer.source = "23";
      lexer.rule("number", /\d+/, function (num) { return this.create("num", parseInt(num)); });
      
      lexer.advance().type.should.eql("num");
    });

    it ("should keep track of token position", function () {
      lexer.rule("name", /[a-zA-Z]+/);
      lexer.rule("(nl)", /\n/, function () { return "(nl)"; });

      lexer.source = "foo\n";
      var foo = lexer.advance();
      var nl  = lexer.advance();

      foo.start.should.eql(0)
      foo.end.should.eql(2);
      foo.line.should.eql(0);

      nl.start.should.eql(3);
      nl.end.should.eql(3);
      nl.line.should.eql(0);
    });

    it ("should keep track of the token line", function () {
      lexer.rule("name", /[a-zA-Z]+/);
      lexer.rule("(nl)", /\n/, function () { return "(nl)"; });

      lexer.source = "foo\nbar";
      var foo = lexer.advance();
      var nl  = lexer.advance();
      var bar = lexer.advance();

      bar.start.should.eql(0)
      bar.end.should.eql(2);
      bar.line.should.eql(1);
    });
  });

  describe (".lex", function () {
    it ("should should return an empty array token if called without any input", function () {
      lexer.lex().length.should.eql(0);
    });

    it ("should should return an empty array if called with an empty string", function () {
      lexer.lex("").length.should.eql(0);
    });

    it ("should return an array of tokens if called with a valid string", function () {
      lexer.rule ( "id"  , /[a-zA-Z]+/           );
      lexer.rule ( "num" , /[0-9]+/   , parseInt );
      lexer.rule ( "op"  , /\+/                  );

      lexer.lex("foo+23").
        map(function (tok) { return [tok.type, tok.value] }).
        should.eql([["id", "foo"], ["op", "+"], ["num", 23]])
    });

    it ("should append each individual token if advance returns an array", function () {
      lexer.advance = function () { 
        this.source = "";
        this.tokens = [1];
        return [2, 3];
      };
      lexer.lex("foo").join(", ").should.eql("1, 2, 3");
    });

    it ("should create an error token if advance returns undefined", function () {
      var err = "";
      lexer.advance = function () { 
        return undefined;
      };
      lexer.error = function (char) { this.source = ""; err = char; };
      lexer.lex("foo")
      err.should.eql("f");
    });
  });

  describe ("Error Handling", function () {
    

    describe ("error", function () {

      it ("appends an error token to the tokens collection", function () {
        lexer.error("e");
        lexer.tokens[0]._type.should.eql("ErrorToken");
        lexer.tokens[0].value.should.eql("e");
        lexer.tokens[0].start.should.eql(0);
        lexer.tokens[0].end.should.eql(1);
        lexer.tokens[0].line.should.eql(0);
      });

      it ("appends to the previous token in tokens if they are positioned together", function () {
        lexer.error("f");
        lexer.error("o");
        lexer.error("o");

        lexer.tokens.length.should.eql(1);
        lexer.tokens[0].value.should.eql("foo");
      });

      it ("appends a new error token to tokens if they are positioned apart", function () {
        lexer.error("f");
        lexer.column += 11;
        lexer.error("o");

        lexer.tokens.length.should.eql(2);
        lexer.tokens[0].value.should.eql("f");
        lexer.tokens[1].value.should.eql("o");
      });

      it ("appends a new error token to tokens if they are on separate lines", function () {
        lexer.error("f");
        lexer.line  += 1;
        lexer.column = 0;
        lexer.error("o");

        lexer.tokens.length.should.eql(2);
        lexer.tokens[0].value.should.eql("f");
        lexer.tokens[1].value.should.eql("o");
      });
    });
  });

  describe ("init", function () {

    it ("sets column to 0", function () {
      lexer.column.should.eql(0);
    });

    it ("sets line to 0", function () {
      lexer.line.should.eql(0);
    });
  });
});