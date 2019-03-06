define('b', ['app/c'], function(c) {
  console.log('b');
  console.log(c.sqrt(9));
  return {
    equal: function(a,b) {
      return a===b;
    }
  }
});