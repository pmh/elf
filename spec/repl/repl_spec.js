var elf     = require( "../../lib/elf" )
  , should  = require( "should"        )
  , stream  = require( "stream"        )
  , events  = require( "events"        )
  ;

describe ('REPL', function () {
  var repl;
  beforeEach(function () {
    repl = elf.REPL.clone();
  });

  describe ('defaults', function () {
    describe ('reader', function () {
      it ('defaults to readline', function () {
        repl.reader.should.eql(require('readline'));
      });
    });

    describe ('in', function () {
      it ('defaults to process.stdin', function () {
        repl.in.should.eql(process.stdin);
      });
    });

    describe ('out', function () {
      it ('defaults to process.stdout', function () {
        repl.out.should.eql(process.stdout);
      });
    });

    describe ('colorize', function () {
      it ('defaults to sys.inspect', function () {
        repl.colorize.toString().should.match(/return sys\.inspect\(expr\, false\, null\, true\)/)
      })
    });

    describe ('eval', function () {
      it ('defaults to a wrapper for the regular js eval', function () {
        repl.eval('23').should.eql(23);
      });
    })

    describe ('prompt', function () {
      it ('defaults to > ', function () {
        repl.prompt.should.eql("> ");
      });
    });

    describe ("completer", function () {
      it ("should return an empty array of matches if no completions are found", function () {
        repl.completer("f")[0].should.eql([]);
      });

      it ("should return an array of matches based on the current env", function () {
        repl.env[ "split"  ] = "foo";
        repl.env[ "splice" ] = "foo";
        repl.env[ "foo"    ] = "foo";

        repl.completer("spl")[0].should.eql(["split", "splice"]);
        repl.completer("f")[0].should.eql(["foo"]);
      });

      it ("completes based on the last word of the input", function () {
        repl.env["bar"] = "foo";

        repl.completer("foo b")[0].should.eql(["bar"]);
      })

      it ("should return the substring that was used for matching", function () {
        repl.completer("spl")[1].should.eql("spl");
      });
    });
  });
});