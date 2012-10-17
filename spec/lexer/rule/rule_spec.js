var Rule   = require( "../../../lib/lexer/rule/rule" );
var should = require( "should"                       );

describe ("Rule", function () {

  describe ("create", function () {

    it ("returns a cloned rule instance", function () {
      var rule = Rule.create("name", /[a-zA-Z]+/);
      rule.__proto__.should.eql(Rule);
    });

    it ("initializes the new object with the values passed to it", function () {
      var action = function () {};
      var rule  = Rule.create ("name", /[a-zA-Z]+/, action);
      rule.name.should.eql("name");
      rule.regex.toString().should.eql(/^([a-zA-Z]+)/.toString());
      rule.action.should.eql(action);
    });
  });

  describe ("match", function () {
    var rule;
    beforeEach(function () {
      rule = Rule.create("name", /[a-zA-Z]+/);
    });

    it ("returns the matched string if a match is found", function () {
      rule.match("foo bar 23").should.eql("foo");
    });

    it ("returns the empty string if no match is found", function () {
      rule.match("23 foo bar").should.eql("");
    });
  });

  describe ("toString", function () {

    it ("returns a pretty printed representation", function () {
      var rule = Rule.create("number", /\d+/);
      rule.toString().should.eql("<Rule { name: 'number', regex: ^(\\d+) }>")
    })
  });
});