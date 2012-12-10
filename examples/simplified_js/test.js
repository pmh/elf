{
  var foo = [1, 2, 3]
    , bar = { x: { y: function () { return 2 + 3; }}, z: "bar"};

  console.log(bar.x.y());
  console.log('---');
  foo.forEach(function (n) { console.log(n); });
  console.log('---');
  for (var i = 0; i < 10; i++) { console.log(i) }
  console.log('---');

  var foo = function bar (x, y) {
    return x * y
  }

  var result = foo(2, 4);
  console.log(result);
}
