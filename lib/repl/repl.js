var elf         = require('../runtime/runtime')
  , ErrorWalker = require('../utils/error_walker')
  , repl        = require('repl');

var REPL = elf.Object.clone(function () {
  var self = this;

  this.ErrorWalker = ErrorWalker;

  this.start = function (options) {
    var self      = this;
    repl.start(this.extend({
      eval: function (cmd, context, filename, cb) {
        cmd = cmd.slice(1, -1).trim();
        var evaled = self.evaluate(cmd, context, filename);

        if (evaled[0] && evaled[0].nodes) {
          var ast    = evaled[0]
            , result = evaled[1]
            , errors = self.ErrorWalker.report(ast, cmd)
            ;

          if (errors)
            console.log('\n' + message.split(/\n/).slice(4, -3).join('\n'));
          cb(null, result.map ? result[0] : result);
        } else {
          cb(null, evaled.map ? result[0] : result);
        }
      }
    }));
  };
});

module.exports = REPL;