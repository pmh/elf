var Lexer  = require( "../../lib/lexer/lexer" );
var dsl    = require( "../../lib/lexer/dsl" );
var should = require( "should"              );

describe ("Lexer DSL", function () {
  var lexer;
  beforeEach(function () {
    lexer = Lexer.clone();
  });

  describe ("name", function () {
    it ("returns a rule with name 'name'", function () {
      lexer.name(/abc/).name.should.eql("name");
    })

    it ("returns a rule with the passed in regex", function () {
      lexer.regex(/abc/).regex.should.eql("^(abc)");
    })
  });

  describe ("number", function () {
    it ("returns a rule with name 'number'", function () {
      lexer.number(/abc/).name.should.eql("number");
    })

    it ("returns a rule with the passed in regex", function () {
      lexer.regex(/abc/).regex.should.eql("^(abc)");
    })
  });

  describe ("string", function () {
    it ("returns a rule with name 'string'", function () {
      lexer.string(/abc/).name.should.eql("string");
    })

    it ("returns a rule with the passed in regex", function () {
      lexer.regex(/abc/).regex.should.eql("^(abc)");
    })
  });

  describe ("regex", function () {
    it ("returns a rule with name 'regex'", function () {
      lexer.regex(/abc/).name.should.eql("regex");
    })

    it ("returns a rule with the passed in regex", function () {
      lexer.regex(/abc/).regex.should.eql("^(abc)");
    })
  });

  describe ("operator", function () {
    it ("returns a rule with name 'operator'", function () {
      lexer.operator(/abc/).name.should.eql("operator");
    })

    it ("returns a rule with the passed in regex", function () {
      lexer.regex(/abc/).regex.should.eql("^(abc)");
    })
  });

  describe ("eol", function () {
    it ("returns a rule with name 'operator'", function () {
      lexer.eol(/abc/).name.should.eql("eol");
    })

    it ("returns a rule with the passed in regex", function () {
      lexer.regex(/abc/).regex.should.eql("^(abc)");
    })
  });

  describe ("skip", function () {
    it ("returns a rule with name '(skip)'", function () {
      lexer.skip(/abc/).name.should.eql("(skip)");
    })
  });


  describe ("helpers", function () {
    describe ("number", function () {
      it ("can parse integers", function () {
        dsl.helpers.number("10").should.eql(10);
      });

      it ("can parse floats", function () {
        dsl.helpers.number("10.34").should.eql(10.34);
      });

      it ("uses base 10 to parse the value", function () {
        dsl.helpers.number("08").should.eql(8);
      });
    });

    describe ("skip", function () {
      it ("returns null", function () {
        should.strictEqual(dsl.helpers.skip(), null)
      });
    });

    describe ("value", function () {
      it ("returns a closure with the value", function () {
        dsl.helpers.value("foo")().should.eql("foo");
      });
    });
  })
});