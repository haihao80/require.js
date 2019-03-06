loadjs.config({
  baseUrl: './',
  path: {
    app: './app'
  }
});

loadjs.define('cc',['./a'], function(a) {
  console.log(1);
  console.log(a.add(1,2));
});

loadjs.define('ab', function() {
  console.log('ab');
});

loadjs.define(function() {
  console.log('unknow');
});

loadjs.use(['ab','cc'],function() {
  console.log('main');
});

// loadjs.use(['app/b', './a'], function(b, a) {
//   console.log('main');
//   console.log(b.equal(1, 2));
//   console.log(a.add(1, 2));
// })