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

require.define("/lib/elf.js",function(require,module,exports,__dirname,__filename,process,global){var runtime     = require( "./runtime/runtime"         )
  , Token       = require( "./lexer/token/token"       )
  , ErrorToken  = require( "./lexer/token/error_token" )
  , Lexer       = require( "./lexer/lexer"             )
  , Parser      = require( "./parser/parser"           )
  , Language    = require( "./language/language"       )
  , REPL        = require( "./repl/repl"               )
  , Walker      = require( "./walker/walker"           )
  , ErrorWalker = require( "./utils/error_walker"      )
  ;

var elf = runtime.Object.clone(function () {
  this.extend(runtime);

  this.Token        = Token;
  this.ErrorToken   = ErrorToken;
  this.Lexer        = Lexer;
  this.Parser       = Parser;
  this.Language     = Language;
  this.REPL         = REPL;
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

require.define("/lib/lexer/token/token.js",function(require,module,exports,__dirname,__filename,process,global){var elf = require("../../runtime/runtime"), Token;

Token = elf.Object.clone(function () {
  this.arityMap = elf.Object.clone({
    name     : "(name)",
    number   : "(literal)",
    string   : "(literal)",
    regex    : "(literal)",
    operator : "(operator)",
    eol      : "(eol)",
    skip     : "(skip)"
  })

  this.create = function (type, value, arity) {
    return this.clone(function () {
      this.type  = type;
      this.value = value;
      this.line  = this.line;
      this.start = this.start;
      this.end   = this.end;
      this.arity = arity ? arity : this.arityMap[type];
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

  this.recalculatePosition = function (tokens) {
    return tokens.map(function (token, idx) {
      this.column += (token.value || "").length - 1;
      if (idx === 0) {
        token.end   = token.start + (token.value || "").toString().length - 1;
      } else {
        token.start = tokens[idx - 1].end + 1;
        token.end   = token.start + (token.value || "").toString().length - 1;
      }
      return token;
    }, this);
  };

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
        this.tokens = this.tokens.
          concat(token.map ? this.recalculatePosition(token) : token);
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

require.define("/lib/lexer/dsl.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = {
  name     : function (regex, helper) {
    return this.rule('name', regex, helper);
  },

  number   : function (regex, helper) {
    return this.rule("number", regex, helper || this.helpers.literal)
  },

  string   : function (regex, helper) {
    return this.rule("string", regex, helper || this.helpers.literal)
  },

  regex    : function (regex, helper) {
    return this.rule("regex", regex, helper || this.helpers.literal);
  },

  operator : function (regex, helper) {
    return this.rule("operator", regex, helper);
  },

  eol      : function (regex, helper) {
    return this.rule("eol", regex, helper || this.helpers.value("(eol)"));
  },

  skip     : function (regex) {
    return this.rule("(skip)", regex, this.helpers.skip)
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
    this.prefix( "(name)"   , function (token) { return token; } );
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
    if (this.token.type  === "(eof)") return;

    rbp = rbp || 0;
    var token = this.token;
    this.advance();
    var left = token.nud.call(this, token);
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
    this.symbol(id).std = std || function (node) {
      node.first = this.expression();
      node.arity = "statement";
      return node;
    };
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
  var errors;

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
    errors[errorNode.line].push({message: errorNode.message(), start: errorNode.start, end: errorNode.end});
  }

  this.report = function (nodeList, source) {
    var report = ""
      , lines  = (source || '').split(/\n+/);

    errors = {};

    this.walk(nodeList);

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
      report = '\n------------- Errors -------------\n' + report + '\n\n----------------------------------\n';
    }

    return report;
  }
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
    return node.error("No rule found for the " + (node.type === "error" ? 'token' : node.type) + " '" + node.value + "'.");
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

require.define("/lib/repl/repl.js",function(require,module,exports,__dirname,__filename,process,global){var elf         = require('../runtime/runtime')
  , sys         = require('sys')
  ;

var REPL = elf.Object.clone(function () {
  this.extend(elf.Evented);

  this.reader   = {};
  this.in       = process.stdin;
  this.out      = process.stdout;
  this.colorize = function (expr  ) { return sys.inspect(expr, false, null, true); }
  this.eval     = function (source) { return eval(source);                         }
  this.prompt   = "> ";

  this.start = function () {
    var rl = this.reader.createInterface(this.in, this.out);
    rl.on('line', function (line) {
      try {
        this.trigger('line', line)
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
    console.log('=>', this.colorize(this.eval(line)));
  });

  this.on('error', function (error) {
    console.log('SyntaxError:', error.message + '.');
  })
});

module.exports = REPL;
});

require.define("sys",function(require,module,exports,__dirname,__filename,process,global){module.exports = require('util');

});

require.define("util",function(require,module,exports,__dirname,__filename,process,global){var events = require('events');

exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

});

require.define("events",function(require,module,exports,__dirname,__filename,process,global){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});

require.define("/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("./lib/elf");
});
window.elf = require("/index.js");
})();

