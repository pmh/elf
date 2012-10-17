# ELF - ECMAScript Language Framework

## Introduction

elf let's you create reusable and extensible programming language implementations in JavaScript.
It currently implements abstractions for creating parsers and lexers with automatic error-recovery and easy handling of operator precedence.

elf takes advantage of JavaScript's prototypical nature so the way you create Lexers and Parsers is by 'cloning' the ones elf provides which can in turn be cloned by more specific ones. This makes it very easy to extend existing languages.

elf also recognizes that you sometimes want to use rules from many different objects and it provides two ways of doing just that. The first is `extend` and the second is `borrow`.

`extend` copies all the properties from one or more objects to the receiver (works with both parsers and lexers)

	myParser.extend(mySecondParser, myThirdParser);

`borrow` let's you reuse specific rules from another parser (only works with parsers for now)

	myParser.borrow(myOtherParser, "+", "-");

## Installation

There isn't an npm module yet so if you want to try it out you should follow these steps:

	> git clone https://github.com/pmh/elf.git
	> mkdir my-lang
	> cd my-lang
	> npm link ../elf

This will create a 'node_modules' folder inside 'my-lang' containing the elf module.

## Calculator
To help you understand the basics of elf let's use it to implement a simple calculator language so create a file called `calculator.js`.
The first thing you should do is to require elf, so enter this into `calculator.js`:
	
	var elf = require("elf")

The next thing we will need to do is a lexer that can recognize numbers, operators (such as +, -, *, /), here's how that could be implemented:
	
	var CalcLexer = elf.Lexer.clone(function () {
		this.number(/\d+/)
		this.operator(/\+|\-|\*|\//)
	})

`number` and `operator` are convenience methods implemented on top of the lower-level rule method so we could have implemented this more verbosely with `this.rule("number", /\d+/, this.helpers.number, "literal")`. Besides `number` and `operator` you can also use `name`, `string`, `regex`, `eol` and `skip`.

So now that we have our lexer, let's try it out but first add the following line just under the lexer:

	console.log(CalcLexer.lex("1+2*-3")) //=> […tokens…]

Now from a command line execute `node calculator.js` and you should se a list of tokens.
Our lexer has one glaring issue though, try adding spaces in the input string (eg. "1 + 2 * 3") and run it again. You will know see the same token list as before but with the addition of 'error' tokens everywhere a space was found. Lets fix that, add the following line to the lexer:

	var CalcLexer = elf.Lexer.clone(function () {
		…
		this.skip(/\s+/)
	})

Now that we have a lexer that we're happy with, let's turn our attention to writing a parser for it.
The parser abstraction in elf is based on Vaughan Pratt's Top Down Operator Precedence algorithm, for more information about it read his [paper](http://hall.org.ua/halls/wizzard/pdf/Vaughan.Pratt.TDOP.pdf), there's also a couple of blog posts about it [here](http://javascript.crockford.com/tdop/tdop.html), [here](http://effbot.org/zone/simple-top-down-parsing.htm), [here](http://eli.thegreenplace.net/2010/01/02/top-down-operator-precedence-parsing/) and [here](http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/).

So let's implement the parser, there are a few issues we have to deal with, first the '-' operator should be able to be used both in infix and prefix position and the '*' and '/' operators should have a higher precedence than '+' and '-'. Fortunately both of these features are elegantly handled by the "Top Down Operator  Precedence" algorithm:

	var CalcParser = elf.Parser.clone(function () {
		this.prefix("-")
		
		this.infix("+", 10)
		this.infix("-", 10)
		this.infix("*", 20)
		this.infix("/", 20)
	});
	
	
	var ast  = CalcParser.parse("1 + 2 * -3", CalcLexer);
	var sexp = elf.sexp(ast);
	console.log(sexp); //=> (+ 1 (* 2 (- 3)))

Here we specify that '-' can appear in both prefix and infix locations we also specify that '+', '/' and '\*' can appear in infix locations. The number we pass as the second argument to infix is it's precedence level so we assign '/' and '\*' a higher precedence than '+' and '-'.
To use the parser we invoke it's `parse` method passing in the source and lexer, this gives us an AST which we then pass to `elf.sexp`, this gives us a nicer representation for printing to the screen.

However, since this is such a simple language it would be nice to just get the result of evaluating the input rather than an AST so let's do it:

	var CalcEvaluator = elf.Parser.clone(function () {
	  this.prefix("(literal)", function () { return this.value; })
	
	  this.prefix("-", function (parser) { return -parser.expression(70) })
	
	  this.infix("+", 10, function (parser, left) { return left + parser.expression(); })
	  this.infix("-", 10, function (parser, left) { return left - parser.expression(); })
	  this.infix("*", 20, function (parser, left) { return left * parser.expression(); })
	  this.infix("/", 20, function (parser, left) { return left / parser.expression(); })
	});
	
	console.log(CalcEvaluator.parse("1 + 2 * -3", CalcLexer)) //=> -5

There are two things to note here, the first is that we now add a prefix for the special '(literal)' symbol and specify that it should return it's value (in this case a number) rather than an AST node.
The second is that we pass in functions to the `prefix` and `infix` methods, this can be used by regular parsers too in order to add more information to the node, and indeed for more complex syntactic forms they are necessary.

