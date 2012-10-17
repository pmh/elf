var Token      = require( "../../../lib/lexer/token/token"       );
var ErrorToken = require( "../../../lib/lexer/token/error_token" );
var should     = require( "should"                               );

describe ("ErrorToken", function () {

  it ("delegates to token", function () {
    ErrorToken.__proto__.should.eql(Token);
  });

  it ("has a _type", function () {
    ErrorToken._type.should.eql("ErrorToken");
  });

  describe ("create", function () {
    it ("sets a default type", function () {
      var errorToken = ErrorToken.create("foo");
      errorToken.type.should.eql("error");
    });

    it ("sets the value to the one passed in", function () {
      var errorToken = ErrorToken.create("foo");
      errorToken.value.should.eql("foo");
    });
  });
});