

// Rewuire this fun NPM module.
var fun = require('../lib/funargs'); // NPM: require('funargs')

var puts = console.log;

// A function...
function funnier_args() {
  var fun_arguments = fun(arguments); // Ta-ta!

  puts("================================");
  puts("  THE FUNCTION & THE CALL");
  puts("--------------------------------");
  puts("");
  puts('funnier_args("Why", null, "must", ["arguments", "be"], 1, {hell: "of"}, "a...", function() { return "pain"; });');
  puts("");

  // ='(
  puts("VANILLA: ");
  puts("");
  puts("arguments: ", arguments);
  puts("");

  // =D
  puts("FUN(CTION) ARGS: ");
  puts("");
  puts("fun_arguments: ", fun_arguments);
  puts("");

  // =)
  puts("fun_arguments.strings(): ", fun_arguments.strings());
  puts("fun_arguments.numbers(): ", fun_arguments.numbers());
  puts("fun_arguments.objects(): ", fun_arguments.objects());
  puts("fun_arguments.arrays(): ", fun_arguments.arrays());
  puts("fun_arguments.functions(): ", fun_arguments.functions());
  puts("");

  puts("--------------------------------");
  puts(" THE END");
  puts("--------------------------------");
}

// ...and a call.
funnier_args("Why", null, "must", ["arguments", "be"], 1, {hell: "of"}, "a...", function() { return "pain"; });
