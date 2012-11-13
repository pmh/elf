var elf    = require("../../lib/elf")
var should = require("should")

describe ("Walker", function () {
  var walker;
  beforeEach(function () {
    walker = elf.Walker.clone()
  });

  describe("process", function () {

    describe ("given a node and an array of patterns", function () {
      it ("returns true if all the patterns match the relative child nodes's value, type, arity or undefined", function () {
        var node = {first: {value: "*"}, second: {type: "number"}, third: {value: 2}, forth: {arity: '(name)'}, fifth: { foo: "bar" }};
        walker.childNames = ["first", "second", "third", "forth", "fifth"]
        walker.process(node, ["*", "number", 2, "(name)", undefined]).should.eql(true);
      });

      it ("recursively resolves embedded patterns", function () {
        var node = {first: {value: "*"}, second: {type: "*", first: { value: "2" }, second: {value: "3"}}};
        walker.process(node, ["*", ["*", "2", "3"]]).should.eql(true);
      });

      it ("treats undefined as a catch-all clause", function () {
        var node = {first: {value: "+"}, second: {type: "number"}, third: {value: 2}};
        walker.process(node, ["+", undefined, 2]).should.eql(true);
      });

      it ("returns false if some value fails to match the relative child nodes's value", function () {
        var node = {first: {value: "operator"}, second: {value: "1"}, third: {value: "4"}};
        walker.process(node, ["plus", "2", "4"]).should.eql(false);
      });
    });
  });

  describe ("patternLength", function () {
    it ("return the length of a pattern", function () {
      walker.patternLength([1, 2, 3]).should.eql(3);
    });

    it ("takes the length of embedded patterns into account", function () {
      walker.patternLength([1, 2, [3, 4, [5]]]).should.eql(5);
    });
  });

  describe ("match", function () {
    it ("adds a specific rule when a pattern is provided", function () {
      var handler = function () { return "+ handlers"; };
      walker.match("+", ["2", "2"], handler);
      walker.matchers["+"].specific[0].should.eql({pattern: ["2", "2"], handler: handler});
    });

    it ("uses a default handler if none is provided", function () {
      var handler = function () { return "+ handlers"; };
      walker.match("+");
      walker.matchers["+"].default.handler.should.eql(walker.default);
    });

    it ("does not add a default rule when a pattern is provided", function () {
      var handler = function () { return "+ handlers"; };
      walker.match("+", ["2", "2"], handler);
      walker.matchers["+"].default.handler.should.eql(walker.error)
    });

    it ("does not add a specific rule when no pattern is provided", function () {
      var handler = function () { return "+ handlers"; };
      walker.match("+", handler);
      walker.matchers["+"].specific.length.should.eql(0);
    });    

    it ("adds a default rule when no pattern is provided", function () {
      var handler = function () { return "+ handlers"; };
      walker.match("+", handler);
      walker.matchers["+"].default.should.eql({handler: handler});
    });
  });

  describe ("walk", function () {

    it ("tries specific rules first", function () {
      walker.match("+", [2, 2], function () { return "specific"; })
      walker.match("+",         function () { return "default";  })

      walker.walk({value: "+", first: {value: 2}, second: {value: 2}}).should.eql("specific");
    });

    it ("selects the longest match", function () {
      walker.match("+", [2, 2],    function () { return "specific";      })
      walker.match("+", [2, 2, 2], function () { return "long-specific"; })
      walker.match("+",            function () { return "default";       })

      walker.walk({value: "+", first: {value: 2}, second: {value: 2}, third: {value: 2}}).should.eql("long-specific");
    });

    it ("treats undefined patterns as catch-all", function () {
      walker.match("*", [undefined, 2], function () { return 'match!'; });

      walker.walk({value: "*", first: {value: 2}, second: {value: 2}})
    })

    it ("selects the last match if multiple exist", function () {
      walker.match("+", [2, 2], function () { return "specific";      })
      walker.match("+", [2, 2], function () { return "last-specific"; })
      walker.match("+",         function () { return "default";       })

      walker.walk({value: "+", first: {value: 2}, second: {value: 2}}).should.eql("last-specific");
    });

    it ("falls back on the default rule if no specific one matches", function () {
      walker.match("+", [2, 2], function () { return "specific"; })
      walker.match("+",         function () { return "default";  })

      walker.walk({value: "+", first: {value: 12}, second: {value: 1}}).should.eql("default");
    });

    it ("falls back on the default rule if there are no specific ones", function () {
      walker.match("+", function () { return "default";  })

      walker.walk({value: "+", first: {value: 12}, second: {value: 1}}).should.eql("default");
    });

    it ("executes the handler functions with the walker object as the context", function () {
      walker.match("+", [2, 2], function () { return this; })
      walker.match("+",         function () { return this; })

      walker.walk({value: "+", first: {value: 2 }, second: {value: 2}}).should.eql(walker);
      walker.walk({value: "+", first: {value: 12}, second: {value: 1}}).should.eql(walker);
    });

    it ("passes in the node and each child as arguments to handlers", function () {
      walker.match("+", [2, 2], function (node, first, second) { return [node, first, second]; })
      walker.match("+",         function (node, first, second) { return [node, first, second]; })

      var spec = walker.walk({value: "+", first: {value: 2 }, second: {value: 2}});
      var def  = walker.walk({value: "+", first: {value: 12}, second: {value: 1}});

      spec.map(function (el) { return el.value }).should.eql(["+", 2 , 2]);
      def .map(function (el) { return el.value }).should.eql(["+", 12, 1]);
    })
  });

});