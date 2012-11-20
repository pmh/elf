var elf    = require( "../lib/elf" );
var should = require( "should"     );

describe ("elf", function () {
  
  it ("exposes Object", function () {
    should.exist(elf.Object);
  });

  it ("exposes Token", function () {
    should.exist(elf.Token);
  });

  it ("exposes ErrorToken", function () {
    should.exist(elf.ErrorToken);
  });

  it ("exposes Lexer", function () {
    should.exist(elf.Lexer);
  });

  it ("exposes Parser", function () {
    should.exist(elf.Parser);
  });

  it ("exposes Language", function () {
    should.exist(elf.Language);
  });

  it ("exposes REPL", function () {
    should.exist(elf.REPL);
  });

  it ("exposes Walker", function () {
    should.exist(elf.Walker);
  });

  it ("exposes ErrorWalker", function () {
    should.exist(elf.ErrorWalker);
  });


  describe("Object", function () {

    describe (".clone", function () {
      it ("returns an object whose prototype link points to elf.Object", function () {
        var obj = elf.Object.clone();
        obj.__proto__.should.eql(elf.Object);
      });

      it ("accepts a function containing initialization logic", function () {
        var obj = elf.Object.clone(function () { this.foo = "bar"; });
        should.not.exist(elf.Object.foo)
        obj.foo.should.eql("bar");
      });

      it ("accepts an initialization object", function () {
        var obj = elf.Object.clone({foo: "bar"});
        should.not.exist(elf.Object.foo)
        obj.foo.should.eql("bar");
      })

      it ("should be initialized with it's prototypes init method", function () {
        var obj = elf.Object.clone(function () {}), sub;
        obj.init = function () { this.foo = "bar"; }
        sub = obj.clone();

        should.not.exist(obj.foo);
        sub.foo.should.eql("bar");
      });
    });

    describe ("extend", function () {
      it ("copies over all properties from a single object to the receiver", function () {
        var obj1 = elf.Object.clone();
        var obj2 = elf.Object.clone(function () { this.bar = "baz" });

        obj1.extend(obj2);

        obj1.bar.should.eql("baz");
      });

      it ("copies over all properties from multiple objects to the receiver", function () {
        var obj1 = elf.Object.clone();
        var obj2 = elf.Object.clone(function () { this.bar = "baz";  });
        var obj3 = elf.Object.clone(function () { this.baz = "quux"; });

        obj1.extend(obj2, obj3);

        obj1.bar.should.eql("baz");
        obj1.baz.should.eql("quux");
      });

      it ("calls the extended function of the extended object", function () {
        var obj1 = elf.Object.clone();
        var obj2 = { extended: function (extendee) { extendee.foo = "bar"; } };

        obj1.extend(obj2);

        obj1.foo.should.eql("bar");
      });
    });

    describe ("wrap", function () {
      it ("wraps an existing method in a new one", function () {
        var obj = elf.Object.clone({foo: function () { return 'foo'; }})
        obj.wrap("foo", function (original) { return function () { return original() + "!!!"; } });
        obj.foo().should.eql("foo!!!")
      });
    })
  });

  describe ("Evented", function () {
    var obj;
    beforeEach(function () {
      obj = elf.Object.clone();
      obj.extend(elf.Evented);
    });

    it ("adds an handlers map to the object that extends it", function () {
      obj.handlers.should.be.a('object');
    });

    describe ("on", function () {

      it ("can register an event handler", function () {
        var action = function () { console.log("Hello, foo!"); };
        obj.on("foo", action);

        obj.handlers.foo[0].should.eql(action);
      });

      it ("can register multiple event handlers under the same event type", function () {
        var action1 = function () { console.log("Hello from a1!"); };
        var action2 = function () { console.log("Hello from a2!"); };
        obj.on("foo", action1);
        obj.on("foo", action2);

        obj.handlers.foo[0].should.eql(action1);
        obj.handlers.foo[1].should.eql(action2);
      });

      it ("can register multiple event handlers under different event types", function () {
        var action1 = function () { console.log("Hello from a1!"); };
        var action2 = function () { console.log("Hello from a2!"); };
        obj.on("foo", action1);
        obj.on("bar", action2);

        obj.handlers.foo[0].should.eql(action1);
        obj.handlers.bar[0].should.eql(action2);
      });
    });

    describe ("trigger", function () {
      it ("invokes every handler for the specified event type in reverse order", function () {
        var calledActions = [];
        obj.on("foo", function () { calledActions.push("action1"); });
        obj.on("foo", function () { calledActions.push("action2"); });
        obj.trigger("foo");
        calledActions.should.eql(["action2", "action1"]);
      });

      it ("can pass along a message to the handler", function () {
        var message;
        obj.on("foo", function (msg) { message = msg; });
        obj.trigger("foo", "bar");

        message.should.eql("bar");
      });

      it ("can pass along multiple messages to the handler", function () {
        var message;
        obj.on("foo", function (msg1, msg2) { message = msg1 + msg2; });
        obj.trigger("foo", "bar", "baz");

        message.should.eql("barbaz");
      });

      it ("fails silently when no handler exists", function () {
        (function(){
          obj.trigger("foo");
        }).should.not.throw();
      });
    });
  });
})