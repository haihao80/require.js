/**
 * 在module设置一个refs数组，元素为依赖该module的其他module，当该module完成加载时，notify refs中的module
 */
(function(root) {
  let CONFIG = {
    baseUrl: '',
    charset: 'utf-8',
    paths: {}
  }

  let MODULES = {}

  let cache = {
    modules: MODULES,
    config: CONFIG
  }

  function isType(type) {
    return function(obj) {
      return Object.prototype.toString.call(obj) === '[Object ' + type + ']';
    }
  }
  let isFunction = isType('Function');
  let isString = isType('String');
  let isArray = isType('Array')

  function Module(url, deps) {
    this.url = url;
    this.dependencies = [];
    this.deps = deps;
    this.refs = [];
    this.export = {};
    this.status = Module.STATUS.INITIAL;
  }
  let STATUS = Module.STATUS = {
    INITIAL: 0,
    
  }
  Module.prototype = {
    constructor = Module,

  }

  let define = function(id, deps, factory) {
    //define(factory)
    if(isFunction(id)) {
      factory = id;
      deps = [];
      id = undefined;
    }
    //define(deps, factory)
    else if(isArray(id) && isFunction(deps)) {
      factory = deps;
      deps = id;
      id = undefined;
    }
  }
  define.amd = {};

  let require = function(ids, callback) {

  }
  require.config = function(config) {

  }

  root.define = define;
  root.require = require;

})(window)