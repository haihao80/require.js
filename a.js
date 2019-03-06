define('a', ['app/c'], function(c) {
  console.log('a');
  console.log(c.sqrt(4));
  return {
    add: function(a, b) {
      return a + b;
    }
  }
});