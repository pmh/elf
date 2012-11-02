var Token  = require( "../../../lib/lexer/token/token" );
var should = require( "should"                         );

describe ("Token", function () {

  it ("has a _type", function () {
    Token._type.should.eql("Token");
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
      should.not.exist(token.arity);
    });

    it ("accepts an optional arity", function () {
      var token = Token.create("number", 23, '(literal)');
      token. arity.  should. eql ( "(literal)" );
    })
  });

  describe ("pos", function () {
    it ("sets the token position", function () {
      var token = Token.create("number", 23, {start: 0, end: 3, line: 0});
      token.pos({start: 0, end: 3, line: 0});

      token. start. should. eql (0);
      token. end.   should. eql (3);
      token. line.  should. eql (0);
    });
  });

  describe ("toString", function () {

    it ("returns a pretty printed representation", function () {
      var token = Token.create("number", 23);
      token.pos({start: 0, end: 1, line: 0});
      token.toString().should.eql("<Token { type: 'number', value: 23, start: 1, end: 2, line: 0 }>")
    })
  });
});