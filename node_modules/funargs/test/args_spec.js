var chai = require('chai'),
    assert = chai.assert;

chai.Assertion.includeStack = true;

var funargs = require('../lib/funargs');


var Spec = {

  'No argument(s)': {
    'function() arguments should be and Array: []': function() {
      var f = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [] );
      }
    }
  },

  'One argument': {
    'function(undefined) arguments should be an Array: [undefined]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [undefined] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun (undefined);
    },

    'function(null) arguments should be an Array: [null]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [null] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun (null);
    },

    'function("fun") arguments should be an Array: ["fun"]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, ["fun"] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), ["fun"] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun ("fun");
    },

    'function(1337) arguments should be an Array: [1337]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [1337] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [1337] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun (1337);
    },

    'function({fun: "args"}) arguments should be an Array: [{fun: "args"}]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [{fun: "args"}] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [{fun: "args"}] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun({fun: "args"});
    },

    'function(["fun"]) arguments should be an Array: ["fun"]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [["fun"]] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [["fun"]] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun(["fun"]);
    },

    'function(function a() {}) arguments should be an Array: [function a() {}]': function() {
      var a = function() { return "a"; };

      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [a] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [a] );
      }

      fun (a);
    }
  },

  'Multiple arguments - of same kind': {
    'function(undefined, undefined) arguments should be an Array: [undefined, undefined]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [undefined, undefined] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun (undefined, undefined);
    },

    'function(null, null) arguments should be an Array: [null, null]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [null, null] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun (null, null);
    },

    'function("fun", "args") arguments should be an Array: ["fun", "args"]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, ["fun", "args"] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), ["fun", "args"] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun ("fun", "args");
    },

    'function(13, 37) arguments should be an Array: [13, 37]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [13, 37] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [13, 37] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun (13, 37);
    },

    'function({fun: "args"}, {args: "fun"}) arguments should be an Array: [{fun: "args"}, {args: "fun"}]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [{fun: "args"}, {args: "fun"}] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [{fun: "args"}, {args: "fun"}] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun ({fun: "args"}, {args: "fun"});
    },

    'function(["fun", "args"], ["args", "fun"]) arguments should be an Array: [["fun", "args"], ["args", "fun"]]': function() {
      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [["fun", "args"], ["args", "fun"]] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [["fun", "args"], ["args", "fun"]] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [] );
      }

      fun (["fun", "args"], ["args", "fun"]);
    },

    'function(function a() {}, function b() {}) arguments should be an Array: [function a() {}, function b() {}]': function() {
      var a = function() { return "a"; },
          b = function() { return "b"; };

      var fun = function() {
        var args = funargs(arguments);

        assert.typeOf ( args, 'array' );
        assert.deepEqual ( args, [a, b] );

        assert.typeOf ( args.strings, 'function' );
        assert.deepEqual ( args.strings(), [] );

        assert.typeOf ( args.numbers, 'function' );
        assert.deepEqual ( args.numbers(), [] );

        assert.typeOf ( args.objects, 'function' );
        assert.deepEqual ( args.objects(), [] );

        assert.typeOf ( args.arrays, 'function' );
        assert.deepEqual ( args.arrays(), [] );

        assert.typeOf ( args.functions, 'function' );
        assert.deepEqual ( args.functions(), [a, b] );
      }

      fun (a, b);
    }
  },

  'Multiple arguments - of different kind': {

    // TODO: Beef up!

  }


};

module.exports = Spec;
