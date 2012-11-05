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
  });
});