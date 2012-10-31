(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return window.setImmediate;
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/lib/elf.js",function(require,module,exports,__dirname,__filename,process,global){var runtime     = require( "./runtime/runtime"    )
  , Lexer       = require( "./lexer/lexer"        )
  , Parser      = require( "./parser/parser"      )
  , Language    = require( "./language/language"  )
  , Walker      = require( "./walker/walker"      )
  , ErrorWalker = require( "./utils/error_walker" )
  ;

var elf = runtime.Object.clone(function () {
  this.extend(runtime);

  this.Lexer        = Lexer;
  this.Parser       = Parser;
  this.Language     = Language;
  this.Walker       = Walker;
  this.ErrorWalker  = ErrorWalker;
});

module.exports = elf;
});

require.define("/lib/runtime/runtime.js",function(require,module,exports,__dirname,__filename,process,global){require("./core_ext");

module.exports = {
  Object  : require( "./object"  ),
  Evented : require( "./evented" ),

  helpers : {
    isArray: function (coll) {
      return !!Object.prototype.toString.call(coll).match(/Array/);
    }
  }
}
});

require.define("/lib/runtime/core_ext.js",function(require,module,exports,__dirname,__filename,process,global){RegExp.prototype.valueOf = function () {
  return this.source;
}
});

require.define("/lib/runtime/object.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = {
  clone: function (init) {
    var obj = Object.create(this, { parent: {value: this, enumerable: false} });

    if (this.init) this.init.call(obj);
    if (init) {
      if (typeof init === "function")
        init.call(obj, obj);
      else
        for (var slot in init) if (init.hasOwnProperty(slot)) obj[slot] = init[slot];
    }

    if (this.hasOwnProperty("cloned")) this.cloned(obj);

    return obj;
  },
  
  keywords: ["extended", "init"],

  extend: function () {
    var args = Array.prototype.slice.call(arguments);
    var self = this;

    args.forEach(function (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && self.keywords && self.keywords.indexOf(prop) === -1)
            self[prop] = obj[prop];
      }

      if (obj.extended) obj.extended(self);
    });

    return this;
  },

  slots: function () {
    var slots = [];
    for (var slot in this)
      if (this.hasOwnProperty(slot)) slots.push(slot);

    return slots;
  }
};
});

require.define("/lib/runtime/evented.js",function(require,module,exports,__dirname,__filename,process,global){var _Object = require("./object");

var Evented = _Object.clone(function () {
  this.extended = function (extendee) {
    extendee.handlers = {};
  };

  this.on = function (event, action) {
    if (!this.handlers[event])
      this.handlers[event] = [];

    this.handlers[event].push(action);
  };

  this.trigger = function (event) {
    var args = Array.prototype.slice.call(arguments, 1);
    var self = this;

    if (this.handlers[event])
      this.handlers[event].reverse().forEach(function (action) {
        action.apply(self, args);
      });
  };
});

module.exports = Evented;
});

require.define("/lib/lexer/lexer.js",function(require,module,exports,__dirname,__filename,process,global){var elf        = require ( "../runtime/runtime"  );
var Rule       = require ( "./rule/rule"         );
var Token      = require ( "./token/token"       );
var ErrorToken = require ( "./token/error_token" );

var Lexer = elf.Object.clone(function () {
  this.extend(require('./dsl'));

  this.rule = function (name, regex, action, arity) {
    var rule = Rule.create(name, regex, action, arity);
    this.rules.push(rule);

    return rule;
  };

  this.error = function (value) {
    var prev  = this.tokens[this.tokens.length - 1];
    if (prev && prev.end >= (this.column - 1) && prev.line === this.line && prev.type === "error") {
      prev.value += value;
      prev.end++;
    } else {
      var token = ErrorToken.create(value).pos({
        start : this.column - 1,
        end   : this.column,
        line  : this.line
      });
      this.tokens.push(token);
    }
  };

  this.advance = function () {
    var self               = this;
    var longestMatchLength = 0;
    var longestMatch       = null;
    var longestMatchRule   = null;

    this.rules.forEach(function (rule) {
      var match = rule.match(self.source);
      if (match.length >= longestMatchLength) {
        longestMatchRule   = rule;
        longestMatchLength = match.length;
        longestMatch       = match;
      }
    });

    this.source = this.source.replace(longestMatch, "");

    if (longestMatch) {
      var token = Token.clone().pos({
        start : self.column,
        end   : self.column + (longestMatch.length - 1),
        line  : self.line
      });

      if (longestMatchRule.arity)
        token.arity = longestMatchRule.arity;

      self.column += longestMatchLength;
      if (longestMatch.match(/\n/)) {
        this.line = this.line + 1;
        this.column = 0;
      }

      if (longestMatchRule.action){
        var result = longestMatchRule.action.call(token, longestMatch);

        if (Object.prototype.toString.call(result).match(/Array|Object/))
          return result;
        else if (result === null)
          return null;
        else
          longestMatch = result;
      }

      return token.create(longestMatchRule.name, longestMatch)
    }

    this.source = this.source.substring(1);
    return undefined;
  }

  this.lex = function (source) {
    this.source = source;
    this.init();

    var error   = "";
    while (this.source) {
      var oldSource = this.source;
      var token     = this.advance();
      if (token) {
        var next = this.tokens.next
        var peek = this.tokens.peek
        this.tokens = this.tokens.concat(token);
        this.tokens.next = next;
        this.tokens.peek = peek;
      }
      if (token === undefined) {
        this.column++;
        this.error(oldSource[0]);
      }
    }

    return this.tokens;
  };

  this.init = function () {
    var self = this;
    this.column = 0;
    this.line   = 0;
    this.rules  = Array.apply(null, this.rules || []);
    this.tokens = [];

    var token_nr = 0;
    this.tokens.next = function () {
      var token = this[token_nr++] || Token.create("(eof)", "(eof)").pos({
        start : self.column,
        end   : self.column + 1,
        line  : self.line
      });
      if (token.type === "error") token.end--;
      return token;
    };
    this.tokens.peek = function (n) {
      return this[token_nr + (n || 0)] || Token.create("(eof)", "(eof)");
    };
  }
});

module.exports = Lexer;

});

require.define("/lib/lexer/rule/rule.js",function(require,module,exports,__dirname,__filename,process,global){var elf = require("../../runtime/runtime"), Rule;

Rule = elf.Object.clone(function () {
  
  this.create = function (name, regex, action, arity) {
    if (typeof action === "string") {
      arity = action;
      action = null;
    }
    return this.clone(function () {
      this.name   = name;
      this.regex  = regex.source ? new RegExp("^(" + (regex.source) + ")") : regex;
      this.action = action;
      this.arity  = arity;
    });
  };

  this.match = function (source) {
    var match;
    if (typeof this.regex === "string") {
     match = true;
     for (var i = 0; i < this.regex.length; i++)
       if (source[i] !== this.regex[i]) match = false;
     return match ? source.substring(0, this.regex.length) : '';
    }

    match = source.match(this.regex)//.shift() : '';
    return match ? match.shift() : '';
  };

  this.toString = function () {
    return "<Rule { name: '" + this.name + "', regex: " + this.regex + " }>"
  };
});

module.exports = Rule;
});

require.define("/lib/lexer/token/token.js",function(require,module,exports,__dirname,__filename,process,global){var elf = require("../../runtime/runtime"), Token;

Token = elf.Object.clone(function () {
  
  this.create = function (type, value) {
    return this.clone(function () {
      this.type  = type;
      this.value = value;
      this.line  = this.line;
      this.start = this.start;
      this.end   = this.end;
    });
  };

  this.error = function (msg) {
    this.type    = "error";
    this.arity   = "(error)";
    this.message = function () { return msg; };
    return this;
  };

  this.pos = function (pos) {
    this.start = pos.start;
    this.end   = pos.end;
    this.line  = pos.line;

    return this;
  };

  this.toString = function () {
    var value = typeof this.value === "string" ? ("'" + this.value + "'") : this.value;
    return "<Token { type: '" + this.type + "', value: " + value + ", start: " + (this.start + 1) + ", end: " + (this.end + 1) + ", line: " + this.line + " }>";
  };

  this.inspect = this.toString;

  this._type = "Token";
});

module.exports = Token;
});

require.define("/lib/lexer/token/error_token.js",function(require,module,exports,__dirname,__filename,process,global){var Token = require("./token"), ErrorToken;

ErrorToken = Token.clone(function () {

  this.create = function (value) {
    return this.clone(function () {
      this.type    = "error";
      this.arity   = "(error)";
      this.value   = value;
      this.message = this.message
      this.lbp     = 100;
    });
  };

  this.message = function () {
    return "Unknown token: '" + this.value + "'";
  };

  this._type = "ErrorToken";
});

module.exports = ErrorToken
});

require.define("/lib/lexer/dsl.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = {
  literal  : function (type, regex, helper) {
    return this.rule(type, regex, helper, "(literal)");
  },

  name     : function (regex, helper) {
    return this.literal("name", regex, helper);
  },

  number   : function (regex, helper) {
    return this.literal("number", regex, helper || this.helpers.literal)
  },

  string   : function (regex, helper) {
    return this.literal("string", regex, helper || this.helpers.literal)
  },

  regex    : function (regex, helper) {
    return this.literal("regex", regex, helper || this.helpers.literal);
  },

  operator : function (regex, helper) {
    return this.rule("operator", regex, helper, "(operator)");
  },

  eol      : function (regex, helper) {
    return this.operator(regex, helper || this.helpers.value("(eol)"), "(eol)");
  },

  skip     : function (regex) {
    return this.rule("(skip)", regex, this.helpers.skip, "(skip)")
  },

  helpers: {
    number  : function (str) { return parseFloat(str, 10);              },
    literal : function (str) { return parseFloat(str, 10) ? parseFloat(str, 10) : str.substring(1, str.length - 1); },
    skip    : function (   ) { return null;                             },
    value   : function (val) { return function () { return val; }       },
    trim    : function (str) { return str.trim();                       }
  }
};
});

require.define("/lib/parser/parser.js",function(require,module,exports,__dirname,__filename,process,global){var elf = require ( "../runtime/runtime" )
  , AST = require ( "./ast"              )
  ;

var Parser = elf.Object.clone(function () {
  this.keywords.push("symbol_table")
  this.symbol_table = require("./symbol_table.js");

  this.init = function () {
    this.symbol_table = this.symbol_table.clone();
    this.prefix( "(literal)", function (token) { return token; } );
    this.symbol( "(error)" );
  }

  this.symbol = function (id, bp) {
    return this.symbol_table.set(id, bp);
  };

  this.advance = function (id) {
    if (id && id !== this.token.value) {
      this.token.type = "(error)";
      this.token.message = function () {
        return "Expected: " + id + " but got: " + this.value;
      };
      return this.token;
    }

    return this.token = this.symbol_table.get(this.tokens.next());
  };

  this.expression = function (rbp) {
    if (this.token.value === "(eol)") this.advance("(eol)");
    if (this.token.type  === "(eof)") return;

    rbp = rbp || 0;
    var left, token = this.token;
    this.advance();
    left = token.nud.call(this, token);
    if (this.token.id === "(literal)") {
      token = this.token;
      this.advance();
      return token.led.call(this, token, left);
    }
    while (rbp < this.token.lbp) {
      token = this.token;
      this.advance();
      left = token.led.call(this, token, left);
    }

    if (this.token.value === "(eol)") this.advance("(eol)");
    return left;
  };

  this.block = function (open, close) {
    if (this.token.value === open) this.advance(open);
    var stmts = []
    while (this.token.value !== close && this.token.value !== "(eof)") {
      stmts.push(this.statement());
      this.advance("(eol)");
    }
    this.advance(close);
    return stmts;
  };

  this.statement = function () {
    var token = this.token;
    if (token.std) {
      this.advance();
      return token.std.call(this, token);
    }

    return this.expression();
  };

  this.statements = function () {
    var stmts = [];
    while (this.token.type !== "(eof)") {
      var statement = this.statement()
      if (statement)
        stmts.push(statement);

      if (this.token.type  === "(eof)") break;
    }

    return stmts;
  }

  this.parse = function (source, lexer) {
    this.tokens = arguments.length === 1 ? source : lexer.lex(source);
    this.advance();
    
    var stmts = this.statements();
    if (this.token.type === "(eof)") this.advance("(eof)");

    return AST.create(stmts);
  };

  this.stmt = function (id, std) {
    this.symbol(id).std = std;
  };

  this.prefix = function (id, nud) {
    this.symbol(id).nud = nud || function (token) {
      token.first  = this.expression(70);
      token.arity  = "unary";
      return token;
    };
  };

  this.infix = function (id, bp, led) {
    this.symbol(id, bp).led = led || function (token, left) {
      token.first  = left;
      token.second = this.expression(bp);
      token.arity  = "binary";
      return token;
    };
  };

  this.infixr = function (id, bp, led) {
    this.symbol(id, bp).led = led || function (token, left) {
      token.first  = left;
      token.second = this.expression(bp - 1);
      token.arity  = "binary";
      return token;
    };
  }

  this.prefix ("(", function (node) {
    var expr = this.expression();
    this.advance(")");
    return expr;
  });

  this.borrow = function (obj) {
    var symbols = Array.prototype.slice.call(arguments, 1);

    symbols.forEach(function (symbol_name) {
      this.symbol_table.symbols[symbol_name] = obj.symbol_table.symbols[symbol_name]
    }.bind(this));
  };

  this.extended = function (extendee) {
    this.symbol_table.symbols.slots().forEach(function (symbol_name) {
      extendee.symbol_table.symbols[symbol_name] = this.symbol_table.symbols[symbol_name]
    }.bind(this));
  };

  this._type = "Parser";
});

module.exports = Parser;
});

require.define("/lib/parser/ast.js",function(require,module,exports,__dirname,__filename,process,global){var elf         = require ( "../runtime/runtime" );

var AST = elf.Object.clone(function () {
  this.ErrorWalker = require ( "../utils/error_walker" );
  this.SexpWalker  = require ( "../utils/sexp_walker" );

  this.create = function (nodes) {
    return this.clone({ nodes: nodes })
  };

  this.toSexp = function () {
    var sexp = this.SexpWalker.walk(this);
    return sexp.join('\n');
  };
});

module.exports = AST;
});

require.define("/lib/utils/error_walker.js",function(require,module,exports,__dirname,__filename,process,global){var Walker = require("../walker/walker"), ErrorWalker, _;

ErrorWalker = Walker.clone(function () {
  var errors = {};

  this.match('error', function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;
    this.addError(node);

    childNodes.map(function (child) { return self.walk(child); });

    return this;
  })

  this.match(_, function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;
    childNodes.map(function (child) { return self.walk(child); });

    return this;
  });

  this.addError = function (errorNode) {
    if (!errors[errorNode.line]) errors[errorNode.line] = [];
    if (errors[errorNode.line].some(function (err) { return err.message === errorNode.message() && err.start === errorNode.start && err.end === errorNode.end }))
      errors[errorNode.line] = [];
    errors[errorNode.line].push({message: errorNode.message(), start: errorNode.start, end: errorNode.end});
  }

  this.report = function (source) {
    var report = ""
      , lines  = (source || '').split(/\n+/);

    for (var line in errors) {
      line = parseInt(line, 10);

      report += "\n\nLine: " + (line + 1);
      errors[line].forEach(function (err) {
        report += "\n * " + err.message + " [" + err.start + ", " + err.end + "]";
      });
      if (source) {
        var lines      = source.split(/\n+/);
        var paddLine   = function (line) { return (line + 1) < 10 ? ('0' + (line + 1)) : (line + 1) };
        var lineNum    = function (line) { return paddLine(line) + ":  "; }
        var current    = lineNum(line) + lines[line];

        report += "\n"
        if (lines[line - 1]) report += '\n' + lineNum(line - 1) + lines[line - 1]
        report += "\n" + current + "\n";

        for (var i = 0; i < ((errors[line][0].start) + (lineNum(line).length)); i++) report += ' ';
        errors[line].forEach(function (err, idx) {
          var prevLen = idx ? errors[line][idx - 1].end : err.end;

          for (var i = prevLen  ; i < err.start - 1; i++) report += " ";
          for (var i = err.start; i <= err.end     ; i++) report += "^";
        });
        if (lines[line + 1]) report += '\n' + lineNum(line - 1) + lines[line + 1]
      }
    }
    if (report) {
      report = ('\n------------- Errors -------------\n' + report + '\n\n----------------------------------\n').replace(/ /g, '&nbsp;').replace(/\n/g, '<br />');
    }

    return report;
  }

  this.walk = function (nodeList, source) {
    var walk = this.parent.walk.call(this, nodeList);
    return this.report(source);;
  };
})

module.exports = ErrorWalker;
});

require.define("/lib/walker/walker.js",function(require,module,exports,__dirname,__filename,process,global){var elf = require ( "../runtime/runtime" );

var Walker = elf.Object.clone(function () {
  this.matchers   = elf.Object.clone();
  this.childNames = ["first", "second", "third"];

  this.init = function () {
    this.matchers            = this.matchers.clone();
    this.matchers[undefined] = {specific: [], default: { handler: this.default }}
    this.childNames          = Object.create(this.childNames);
  }

  this.default = function (node) {
    this.ast.ErrorWalker.addError(node.clone({
      message: function () {
        return "No rule found for the " + (node.type === "error" ? 'token' : node.type) + " '" + node.value + "'."
      }
    }));
  };

  this.match = function (type) {
    if (!this.matchers[type]) this.matchers[type] = {specific: [], default: { handler: this.default }}

    if (arguments.length === 3) {
      this.matchers[type].specific.push({
        pattern : arguments[1],
        handler : arguments[2]
      })
    } else {
      this.matchers[type].default = { handler: arguments[1] }
    }
  }

  this.patternLength = function (pattern) {
    var self = this;
    return pattern.reduce(function (acc, el) {
      if (elf.helpers.isArray(el)) return acc + self.patternLength(el);
      return acc + 1
    }, 0);
  }

  this.validate = function (node, pattern) {
    return node && (typeof pattern === "undefined" || (pattern === node.value || pattern === node.type));
  }

  this.process = function (node, patterns) {
    var self = this;

    var matches = patterns.filter(function (pattern, idx) {
      var child = node[self.childNames[idx]];
      if (elf.helpers.isArray(pattern))
        return self.validate(child, pattern[0]) && self.process(child, pattern.slice(1))
      else
        return self.validate(child, pattern);
    });

    return matches.length === patterns.length;
  };

  this.visit = function (node) {
    if (!node) return;

    var matcher    = this.matchers[node.value] || this.matchers[node.type] || this.matchers[undefined]
      , childNames = this.childNames.filter(function (name) { return node[name]; })
      , self       = this;

    var match = matcher.specific.reduce(function (acc, el) {
      var patternLen = self.patternLength(el.pattern);
      return (self.process(node, el.pattern) && (patternLen >= childNames.length)) ? el.handler : acc;
    }, null);

    var args = childNames.map(function (name) { return node[name]; });
    return (match || matcher.default.handler).apply(this, [node].concat(args));
  };

  this.walk = function (nodeList) {
    if (!nodeList) return;

    if (elf.helpers.isArray(nodeList.nodes)) {
      this.ast = nodeList;
      return nodeList.nodes.map(this.visit, this);
    } else if (elf.helpers.isArray(nodeList)) {
      return '[' + nodeList.map(this.visit, this).join(', ') + ']'
    } else {
      return this.visit(nodeList);
    }
  };

});

module.exports = Walker;
});

require.define("/lib/utils/sexp_walker.js",function(require,module,exports,__dirname,__filename,process,global){var Walker = require("../walker/walker"), SexpWalker, _;

SexpWalker = Walker.clone(function () {
  this.match('error', function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;

    if (childNodes.length)
      return '(<SyntaxError: ' + node.message() + '>' + childNodes.map(function (child) { return ' ' + self.walk(child); }).join('') + ')';
    else
      return '<SyntaxError: ' + node.message() + '>'
  })

  this.match(_, function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;
    if (childNodes.length)
      return '(' + node.value + childNodes.map(function (child) { return ' ' + self.walk(child); }).join('') + ')';
    else
      return node.value
  });
});

module.exports = SexpWalker;
});

require.define("/lib/parser/symbol_table.js",function(require,module,exports,__dirname,__filename,process,global){var elf = require ( "../runtime/runtime" );

var SymbolTable = elf.Object.clone(function () {
  this.symbols = elf.Object.clone();

  this.init = function () {
    this.symbols = this.symbols.clone();
  };

  this.get = function (token) {
    var sym = this.symbols[token.arity] || this.symbols[token.value] || this.symbols["(error)"];
    return token.extend(sym);
  };

  this.set = function (id, bp) {
    bp = bp || 0;
    var sym = this.symbols[id];
    if (sym) {
      if (bp >= sym.lbp) sym.lbp = bp;
      return sym;
    }

    return this.symbols[id] = elf.Object.clone(function () {
      this.id  = id;
      this.lbp = bp;
      this.nud = function (token) {
        token.id      = "(error)";
        token.type    = "error";
        token.first   = this.expression();
        token.message = token.message || function () { return "Unexpected prefix: '" + this.value + "'"; };
        token.arity   = "unary";
        return token;
      };

      this.led = function (token, left) {
        token.id      = "(error)";
        token.type    = "error";
        token.first   = left;
        token.second  = this.expression();
        token.message = token.message || function () { return "Unexpected infix:  '" + this.value + "'"; };
        token.arity   = "binary";
        return token;
      };
    });
  };

  this.cloned = function (clonee) {
    if (this.symbols)
      clonee.symbols.extend(this.symbols)
  }
});

module.exports = SymbolTable;
});

require.define("/lib/language/language.js",function(require,module,exports,__dirname,__filename,process,global){var elf    = require ( "../runtime/runtime" )
  , Parser = require ( "../parser/parser"   )
  , Lexer  = require ( "../lexer/lexer"     )
  , Language
  ;

Language = elf.Object.clone(function () {

  this.init = function () {
    this.parser = Parser.clone();
    this.lexer  = Lexer.clone();
  };

  this.rule = function (name, regex, action, arity) {
    this.lexer.rule(name, regex, action, arity)
  };

  this.name = function (regex, helper) {
    this.lexer.name(regex, helper);
  }

  this.number = function (regex, helper) {
    this.lexer.number(regex, helper);
  }

  this.string = function (regex, helper) {
    this.lexer.string(regex, helper);
  }

  this.regex = function (regex, helper) {
    this.lexer.regex(regex, helper);
  }

  this.operator = function (regex, helper) {
    this.lexer.operator(regex, helper);
  }

  this.eol = function (regex, helper) {
    this.lexer.eol(regex, helper);
  }

  this.skip = function (regex, helper) {
    this.lexer.skip(regex, helper);
  }

  this.prefix = function (id, led) {
    this.lexer.operator(id);
    this.parser.prefix(id, led)
  };

  this.infix = function (id, bp, led) {
    this.lexer.operator(id);
    this.parser.infix(id, bp, led)
  };

  this.infixr = function (id, bp, led) {
    this.lexer.operator(id);
    this.parser.infix(id, bp, led)
  };

  this.stmt = function (id, std) {
    this.lexer.operator(id);
    this.parser.stmt(id, std)
  };

  this.borrow = function (obj) {
    var symbols = Array.prototype.slice.call(arguments, 1), self = this;

    symbols.forEach(function (sym) { self.lexer.operator(sym); })
    this.parser.borrow.apply(this.parser, [obj.parser].concat(symbols));
  }

  this.extend = function () {
    var languages = Array.prototype.slice.call(arguments)
      , self      = this
      ;

    languages.forEach(function (language) {
      language.parser.symbol_table.symbols.slots().forEach(function (symbol_name) {
        self.parser.symbol_table.symbols[symbol_name] = language.parser.symbol_table.symbols[symbol_name]
      }.bind(this));

      language.lexer.rules.forEach(function (rule) {

        self.lexer.rules.push(rule);
      });

      if (language.extended) language.extended(self);
    });

    return this;
  }

  this.parse = function (input) {
    return this.parser.parse(this.lexer.lex(input))
  }
});

module.exports = Language;
});

require.define("/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("./lib/elf");

});
window.elf = require("/index.js");
})();

