var elf         = require('../runtime/runtime')
  , sys         = require('sys')
  ;

var REPL = elf.Object.clone(function () {
  this.extend(elf.Evented);

  this.reader    = require('readline');
  this.in        = process.stdin;
  this.out       = process.stdout;
  this.colorize  = function (expr  ) { return sys.inspect(expr, false, null, true); }
  this.eval      = function (source) { return eval(source);                         }
  this.prompt    = "> ";

  this.completer = function (line) {
    var lastWord = line.split(/\s+/).pop();
    var completions = this.env.slots().filter(function (slot) {
      return slot.indexOf(lastWord) === 0 && this.keywords.indexOf(slot) === -1;
    }, this);

    return [completions, lastWord];
  };

  this.start = function () {
    var rl = this.reader.createInterface({
      input     : this.in,
      output    : this.out,
      completer : this.completer.bind(this)
    });
    rl.on('line', function (line) {
      try {
        this.trigger('line', line);
      } catch (error) {
        this.trigger('error', error);
      }
      rl.prompt();
    }.bind(this));

    rl.on('close',function() {
      this.trigger('close');
    }.bind(this))

    rl.prompt();
  };

  this.on('line', function (line) {
    console.log('=>', this.colorize(this.eval(line, this.env)));
  });

  this.on('error', function (error) {
    console.log('SyntaxError:', error.message + '.');
  })

  this.init = function () {
    this.env = elf.Object.clone();
  }
});

module.exports = REPL;