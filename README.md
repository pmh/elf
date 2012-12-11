# ELF - Extensible Language Framework

## Introduction

ELF is an experimental compiler framework which let's you create reusable and extensible programming language implementations in JavaScript. It implements abstractions for creating languages with automatic error-recovery, easy handling of operator precedence, AST walkers with (basic) pattern-matching support and REPL's.

It takes advantage of JavaScript's prototypical nature so the way you create languages is by 'cloning' existing ones which in turn can be cloned by more specific ones. This, combined with the ability to mixin and borrow rules, makes it very easy to extend and compose existing languages.


## Installation

	> mkdir my-lang
	> cd my-lang
	> npm install elf.js

## Calculator Example

```js
var elf = require("../index"), sys = require("sys"), _;

var Calculator = elf.Language.clone(function () {
  this.number   ( /\d+/        )
  this.name     ( /[a-zA-Z]+/  )

  this.prefix   ( "+", "-"     )

  this.infixr   ( "=", 10      )

  this.infix    ( "+", "-", 10 )
  this.infix    ( "*", "/", 20 )

  // Match functions in the form { x, y | x + y } or { 2 + 2 }
  this.prefix   ("{", function (node) {
    node.value  = "(function)";
    node.first  = this.parseUntil("|", { step: ",", abort_if: "}", meta: { type: "parameter" } })
    node.second = this.parseUntil("}");

    return node;
  })

  // Match function invocations in the form foo(2, 3)
  this.infix  ("(", 80, function (node, first) {
    node.value  = "(call)";
    node.first  = first;
    node.second = this.parseUntil(")", { step: "," })

    return node;
  });

  this.stmt ("print")

  this.skip ( /\s+/ )
  this.eol  ( /\;/  )
});

Evaluator = elf.Walker.clone(function () {

  // Match unary -
  this.match ("-", [ _ ], function (env, node, left) {
    return -this.walk(left, env);
  })

  // Match binary -
  this.match ("-", [ _ , _ ], function (env, node, left, right) {
    return this.walk(left, env) - this.walk(right, env);
  })

  // Match unary +
  this.match ("+", [ _ ], function (env, node, left) {
    return +this.walk(left, env);
  })

  // Match binary +
  this.match ("+", [ _ , _ ], function (env, node, left, right) {
    return this.walk(left, env) + this.walk(right, env);
  })

  // Match binary *
  this.match ("*", function (env, node, left, right) {
    return this.walk(left, env) * this.walk(right, env);
  });

  // Match and "optimize" binary * when the right node is 2 by turning it into a left shift
  this.match ("*", [ _ , 2 ], function (env, node, left) {
    return this.walk(left, env) << 1;
  });

  // Match binary =
  this.match ("=", [ "(name)", _ ], function (env, node, left, right) {
    return env[left.value] = this.walk(right, env);
  });

  // Match binary /
  this.match ("/", function (env, node, left, right) {
    return this.walk(left, env) / this.walk(right, env);
  })

  // Match print statements
  this.match ("print", function (env, node, right) { 
    return sys.puts(this.walk(right, env));
  })

  // Match function statements
  this.match("(function)", function (env, node, params, body) {
    var self = this;
    return function () {
      var args = arguments;
      env = env.clone();
      params.forEach(function (param, idx) { env[self.walk(param, env)] = args[idx]; }, self);
      return self.walk(body, env).pop();
    };
  });

  // Match function calls
  this.match ("(call)", function (env, node, left, right) {
    var res = this.walk(left, env).apply(null, this.walk(right, env));
    return res;
  });

  // Match identifiers
  this.match ("(name)", function (env, node) {
    return env[node.value];
  });

  // Match anything else and return it's value
  this.match (_, function (env, node) {
    return node.value;
  })
});

var ast = Calculator.parse('print 1 + 2 * 3; print { x, y | x - y }(4, 2);');

Evaluator.walk(ast);
```

## API

### elf.Object

**Provides an abstraction over JavaScript's implementation of protoypal inheritence**

```js
var Person = elf.Object.clone(function () {
  this.greet = function (person, message) { console.log(this.name + " says: " + message + ' ' + person.name + '!'); }

  this.init  = function () { this.name = "Anonymous" }
});

var patrik = Person.clone({name: "Patrik"});
var anon   = Person.clone();

patrik.greet(anon, "Hello");

patrik.extend({age: 27}, {occupation: "Hacker"});
patrik.describe = function () {
  console.log("name:", this.name + ", age:", this.age + ", occupation:", this.occupation);
};

patrik.describe();

console.log('slots:', patrik.slots());
```

 - `.clone(initializer<function|object>)`
 
  	*Returns a new object whose prototype link points to the object being cloned. It accepts either a function or an object with initialization logic which will be applied to the new object.*
 
 - `.extend(…mixins)`
 	
 	*Copies all properties from each of the mixin objects over to itself.*
 
 - `.slots()`
 	
 	*Returns an array of all it's properties.*

### elf.Token

**Represents a lexical token**

```js
var token = elf.Token.create('string', 'foo');
token.pos({start: 0, end:3, line: 0});
```

  - `.create(type, value [, arity])`
  	
  	*Creates and returns a new token object from the current one with type, value and an optional arity set*
  
  - `.arityMap`

    * A list of token type to arity mappings.

  - `.error(message<string>)`
  
  	*Turns the token into an error token. Returns the current token instance.*
  
  - `.pos(pos<object>)`
  	
  	*Updates the token position. Returns the current token instance.*

### elf.Lexer
 	
**Provides a lexer abstraction on top of which you can base your own more specific lexers.
It resolves ambiguity by always selecting the longest match and in cases where there are 
multiple equally long matches it chooses the last one.**

```js
var MyLexer = elf.Lexer.clone(function () {
  
  this.name(/[a-zA-Z]+/)

  this.operator("+")

  // This is the equivalent of this.number(/\d+/)
  this.rule("number", /\d+/, function (num) { return parseFloat(num, 10); }, "(literal)")

  // this is the equivalent as this.skip(/\s+/)
  this.rule('ws', /\s+/, function () { return null; });
});

var tokens = MyLexer.lex('foo + 3');
console.log(tokens);
```

 - `.name(match<regexp|string> [, action<function>])`
 	
 	*Creates a rule for matching identifiers based on the provided match object.*

 - `.number(match<regexp|string> [, action<function>])`
 	
 	*Creates a rule for matching number literals based on the provided match object.*
 
 - `.string(match<regexp|string> [, action<function>])`
 	
 	*Creates a rule for matching strings literals based on the provided match object.*

 - `.regex(match<regexp|string> [, action<function>])`
 	
 	*Creates a rule for matching regex literals based on the provided match object.*

 - `.operator(match<regexp|string> [, action<function>])`
 	
 	*Creates a rule for matching operators based on the provided match object.*
 
 - `.eol(match<regexp|string> [, action<function>])`

	*Creates a rule for matching end-of-line operators based on the provided match object.*

 - `.skip(match<regexp|string>)`

	*Tells the lexer to skip anything matching the provided match object.*

 - `.rule(name, regex, action [, arity])`
 	
 	*A lower-level matcher that all of the previous rules are based upon.*
 
 	*All of the above methods accepts an optional action function that will be invoked when the rule matches. The context inside the action is the matched string. It can return one of three things: a value (which will be set as the value on the current token), an array of tokens or null (in which case the lexer will ignore the match).*
 
 
### elf.Parser

**Provides a parser abstraction on top of which you can base your own more specific parsers.
It's based on Vaughan R. Pratt's "Top Down Operator Precedence" algorithm which you can read more about [here](http://hall.org.ua/halls/wizzard/pdf/Vaughan.Pratt.TDOP.pdf), [here](http://javascript.crockford.com/tdop/tdop.html), [here](http://effbot.org/zone/simple-top-down-parsing.htm), [here](http://eli.thegreenplace.net/2010/01/02/top-down-operator-precedence-parsing/) and [here](http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/).**

```js
var MyParser = elf.Parser.clone(function () {
  this.infix("+", 10)
  this.infix("*", 20)
});

var tokens = MyLexer.lex('2 + 4 * 4');
var ast    = MyParser.parse(tokens);
console.log(ast.toSexp());
```

 - `.advance([id])`
 
 	*Advances to the next token, if an id is provided an error node will be created if it doesn't match the id of that token.*
 
 - `.expression([rbp])`
 
   *Parses a single expression, if an rbp (right binding power) is provided then it will only parse as long as the next token has the same binding power or higher.*
 
 - `.statement()`
 	
 	*Parses a single statement.*
 
 - `.parseUntil(closeTag [, opts{step<string>, meta<object>, abort_if<string>}])`
 
 	*Keeps parsing statements until it encounters the closeTag or aborts if it encounters the value of the optional abort_if option.*
 	
 - `.stmt(id, std<function(node)>)`
 
 	*Creates a rule for matching a statement. A statement can only appear at the beginning of an expression.*
 
 - `.prefix(id [, nud<function(node)>])`
 
 	*Creates a rule for matching prefix tokens, similar to stmt exept that it can appear multiple times in an expression.*
 
 - `.infix(id, bp [, led<function(node, left)>])`
 	
 	*Creates a rule for matching tokens in infix position. Can appear multiple times in an expression.*
 	
 - `.infixr(id, bp [, led<function(node, left)>])`
 
 	*Like infix except that it associates to the right.*
 
 - `.borrow(parser, ...rules)`
 
 	*Let's you borrow a set of rules from another parser.*
 
 - `.token`
 
 	*Always points to the current token.*
 
 - `.tokens`
 	
 	*A collection of all the remaining tokens. It has a `.peek([n])` method that let's you look at the next token without consuming it.*
 
 - `.parse(tokens<Array>)`
 
 	*Accepts a collection of tokens and returns an AST.*

### elf.Language

**Provides a unified abstraction for lexers and parsers.**

```js
var MyLanguage = elf.Language.clone(function () {
  this.number(/\d+/);

  this.infix("+", 10)
  this.infix("*", 20)

  this.skip(/\s+/)
});

var ast = MyLanguage.parse('2 + 4 * 4');
console.log(ast.toSexp());
```

 - `.name(regex<regexp|string> [, action<function(token)>])`
 
 	*Creates a rule for matching identifiers based on the provided match object.*
 
 - `.number(regex<regexp|string> [, action<function(token)>])`
 
 	*Creates a rule for matching numbers based on the provided match object.*
 
 - `.string(regex<regexp|string> [,action<function(token)>])`

	*Creates a rule for matching strings based on the provided match object.*

 - `.regex(regex<regexp|string> [, action<function(token)>])`
 
 	*Creates a rule for matching regular expressions based on the provided match object.*
 
 - `.eol(regex<regexp|string> [, action<function(token)>])`
 	
 	*Creates a rule for matching end-of-line operators based on the provided match object.*
 
 - `.skip(regex<regexp|string> [, action<function(token)>])`
 
 	*Tells the language to skip anything matching the provided match object.*
 
 - `.stmt(id<string>, std<function(node)>);`
 
 	*Creates a rule for matching a statement. A statement can only appear at the beginning of an expression.*
 
 - `.prefix(id<string> [, nud<function(node)>])`
 
 	*Creates a rule for matching prefix tokens, similar to stmt exept that it can appear multiple times in an expression.*
 	
 - `.infix(id<string>, bp<integer> [, led<function(node, left)>])`
 	
 	*Creates a rule for matching tokens in infix position. Can appear multiple times in an expression.*
 
 - `.infixr(id<string>, bp<integer> [, led<function(node, left)>])`
 
 	*Like infix except that it associates to the right.*
 
 - `.borrow(language, ...rules)`
 
 	*Let's you borrow a set of rules from another parser.*
 
 - `.parse(input<string>)`
 
 	*Accepts a program string and returns an AST.*

### elf.Walker

**Recursively walks the AST and applies your matchers**

```js
var MyWalker = elf.Walker.clone(function () {
  this.match("+", function (node, left, right) {
    return this.walk(left) + this.walk(right);
  })

  this.match("*", function (node, left, right) {
    return this.walk(left) * this.walk(right);
  })

  this.match("print", function (node, right) {
    console.log(this.walk(right));
  })

  this.match(_, function (node) {
    return node.value;
  })
});

var ast = MyLanguage.parse('print 2 + 4 * 4');
MyWalker.walk(ast);
```

 - `.match(match<string|number> [, pattern<array>], action<function(node, child1, child2, …, childN)>)`
 
 	*Executes the action if the type or value of the current node matches the match argument and if the provided (optional) pattern matches.*
 
 - `.walk(ast<ast|node|array>)`
 
 	*Walks the ast and returns whatever your actions return.*
 	
### elf.ErrorWalker

**Recursively walks the AST collecting error nodes.**

```js
var source   = 'print !!? + 4 ** 4';
var ast      = MyLanguage.parse(source);
var errorMsg = elf.ErrorWalker.report(ast, source);

console.log(errorMsg);
```

 - `.report(ast<ast|node|array>, source<string>)`
 
  *Walks the ast and generates an error report.*

### REPL

**Creates a REPL for your language with basic history and autocompletion support**

```js
var REPL = elf.REPL.clone({
  eval: function (cmd) {
    var ast = Calculator.parse(cmd);
    return Evaluator.walk(ast)[0];
  }
});

REPL.on('exit', function () {
  console.log('Goodbye!');
});

REPL.start();
```

  - `.reader`
    
    *Defaults to readline.*

  - `.in`
    
    *Defaults to process.stdin*

  - `.out`
    
    *Defaults to process.stdout*

  - `.colorize`
    
    *A function that colorizes the output. Defaults to sys.inspect.*

  - `.completer`

    *A function that returns an array containing an array of possible completions and the partial command. Defaults to looking for matches in the current environment.*

  - `.eval`
    
    *A function that evaluates the input, you should override this. Defaults to regular eval.*

  - `.start()`
    
    *Kicks off the read-eval-print-loop.*
  
--  ***Events***

  - `line`

    *Triggered on every read.*

  - `close`
  
    *Triggered as the session ends.*
