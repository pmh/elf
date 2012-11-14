var Token  = require( "../../../lib/lexer/token/token" );
var should = require( "should"                         );

describe ("Token", function () {

  it ("has a _type", function () {
    Token._type.should.eql("Token");
  });

  describe ("arityMap", function () {
    it ("maps name to (name)", function () {
      Token.arityMap.name.should.eql('(name)');
    });

    it ("maps number to (literal)", function () {
      Token.arityMap.number.should.eql('(literal)');
    });

    it ("maps string to (literal)", function () {
      Token.arityMap.string.should.eql('(literal)');
    });

    it ("maps regexe to (literal)", function () {
      Token.arityMap.regex.should.eql('(literal)');
    });

    it ("maps operator to (operator)", function () {
      Token.arityMap.operator.should.eql('(operator)');
    });

    it ("maps eol to (eol)", function () {
      Token.arityMap.eol.should.eql('(eol)');
    });

    it ("maps skip to (skip)", function () {
      Token.arityMap.skip.should.eql('(skip)');
    });
  });

  describe ("create", function () {

    it ("returns a cloned token instance", function () {
      var token = Token.create("name", "foo");
      token.__proto__.should.eql(Token);
    });

    it ("initializes the new object with the values passed to it", function () {
      var token = Token.create("number", 23);
      token. type.  should. eql ( "number" );
      token. value. should. eql ( 23       );
    });

    it ("accepts an optional arity", function () {
      var token = Token.create("number", 23, '(literal)');
      token. arity.  should. eql ( "(literal)" );
    })

    it ("sets arity if none is provided", function () {
      var t1 = Token.create("name", "foo");
      t1. arity.  should. eql ( "(name)" );
    });
  });

  describe ("pos", function () {
    it ("sets the token position", function () {
      var token = Token.create("number", 23);
      token.pos({start: 0, end: 3, line: 0});

      token. start. should. eql (0);
      token. end.   should. eql (3);
      token. line.  should. eql (0);
    });
  });

  describe ("match", function () {
    it ("returns true if it's value matches the argument", function () {
      var token = Token.create("name", "foo");
      token.match("foo").should.eql(true);
    });

    it ("returns true if it's type matches the argument", function () {
      var token = Token.create("name", "foo");
      token.match("name").should.eql(true);
    });

    it ("returns true if it's arity matches the argument", function () {
      var token = Token.create("name", "foo");
      token.match("(name)").should.eql(true);
    });

    it ("accepts multiple arguments and returns true if at least one of them matches", function () {
      var token = Token.create("name", "foo");
      token.match("bar", "number", "foo").should.eql(true);
    })
  })

  describe ("toString", function () {

    it ("returns a pretty printed representation", function () {
      var token = Token.create("number", 23);
      token.pos({start: 0, end: 1, line: 0});
      token.toString().should.eql("<Token { type: 'number', value: 23, start: 1, end: 2, line: 0 }>")
    })
  });
});