/**
 * 模块名与模块所在文件的名字必须相同
 * 初次加载使用onload，所以回调函数调用时间不确定，会出现模块的依赖未加载完成的情况
 * 为避免多个模块依赖于同一个模块，在module中加入exports变量，第二次加载直接返回该变量即可。
 */
(function(root) {
  //存储模块对象的各种属性
  let modules = {};
  //模块name到依赖中的相对路径的映射
  let modPath = {};
  //配置对象
  let cfg = {
    baseUrl: location.href.replace(/(\/)[^\/]+$/g, (s, s1) => (s1)),
    path: {}
  }

  function isType(type) {
    return function(obj) {
      return Object.prototype.toString.call(obj) === '[object ' + type + ']';
    }
  }
  let isFunction = isType('Function');
  let isString = isType('String');
  let isArray = isType('Array')

  //配置方法
  function config(obj) {
    if(obj) {
      if(obj.baseUrl) {
        obj.baseUrl = outputPath(cfg.baseUrl, obj.baseUrl);
      }
      if(obj.path) {
        let baseUrl = obj.baseUrl || cfg.baseUrl;
        for(let key in obj.path) {
          obj.path[key] = outputPath(baseUrl, obj.path[key]);
        }
      }
      merge(cfg, obj);
    }
  }
  //对象合成方法
  function merge(obj1, obj2) {
    if(obj1 && obj2) {
      for(let key in obj2) {
        obj1[key] = obj2[key];
      }
    }
  }

  //各种可能出现的路径写法
  let fullPathRegExp = /^[(https?\:\/\/) | (ftp\:\/\/)]/;
  let absolutePathRegExp = /^\//;
  let relativePathRegExp = /^\.\//;
  let relativeBackPathRegExp = /^\.\.\//;

  //将各种路径替换为绝对路径
  function outputPath(baseUrl, path) {
    if(relativePathRegExp.test(path)) {
      if(/\.\.\//.test(path)) {
        let pathArr = baseUrl.split('/');
        let back = path.match(/\.\.\//g);
        let nums = pathArr.length - back.length;
        return pathArr.slice(0, nums).join('/').replace(/\/$/, '')
           + '/' + path.replace(/[(^\.\/) | (\.\.\/)+]/g, '');
      }
      else {
        return baseUrl.replace(/\/$/, '') + '/' + path.replace(/^\.\//, '');
      } 
    }
    else if(relativeBackPathRegExp.test(path)) {
      let pathArr = baseUrl.split('/');
      let back = path.match(/\.\.\//g);
      let nums = pathArr.length - back.length;
      return pathArr.slice(0, nums).join('/').replace(/\/$/, '')
         + '/' + path.replace(/^\.\.\//g, '');
    }
    else if(fullPathRegExp.test(path)) {
      return path;
    }
    else if(absolutePathRegExp.test(path)) {
      return baseUrl.replace(/\/$/, '') + path;
    }
    else {
      return baseUrl.replace(/\/$/, '') + '/' + path;
    }
  }

  //将以cfg.path中定义的prefix开头的模块定义替换为绝对路径
  //替换路径的方法，outputpath的封装
  function replaceName(name) {
    if(fullPathRegExp.test(name) || absolutePathRegExp.test(name)
       || relativeBackPathRegExp.test(name) || relativePathRegExp.test(name))
    {
      return outputPath(cfg.baseUrl, name);
    }
    else {
      let nameArr = name.split('/')
      let prefix = nameArr[0];
      if(cfg.path[prefix]) {
        if(nameArr.length === 1) {
          return outputPath(cfg.baseUrl, prefix);
        }
        else {
          let endPath = nameArr.slice(1).join('/');
          return outputPath(cfg.path[prefix], endPath);
        }
      }
      else {
        return name;
      }
    }
  }

  //找到模块在文件系统中的名字
  function findName(name) {
    if(name == null) {
      return ''; 
    }
    let nameArr = name.split('/');
    return nameArr[nameArr.length - 1];
  }

  function use(deps, callback) {
    //该回调为加载模块完成后执行的函数，参数为模块暴露的对象等
    if(deps.length == 0) {
      callback();
      return;
    }
    let depsLength = deps.length;
    let params = [];
    for(let i=0; i<deps.length; i++) {
      deps[i] = replaceName(deps[i]);
      modPath[findName(deps[i])] = deps[i];
      //absolute path.
      (function(j) {
        loadMod(deps[j], function(param) {
          params.push(param);
          depsLength--;
          if(depsLength == 0) { 
            //use函数的回调
            callback.apply(null, params);
          }
        }); 
      })(i);
    }
  }

  //该callback为use函数callback封装，功能为notify
  function loadMod(name, callback) {
    //初次加载该模块，创建node节点
    if(!modules[name]) {
      modules[name] =  {
        status: 'loading',
        oncomplete: []
      }
      console.log('initloading', name);
      loadScript(name, function() {
        use(modules[name].deps, function() {
          execMod(name, callback, Array.prototype.slice.call(arguments, 0));
        });
      })
    } 
    //还未创建node节点
    //init后，还未执行define需等下一次事件循环，再次遇到该模块
    else if(modules[name].status === 'loading') {
      modules[name].oncomplete.push(callback);
    } 
    //模块已define，其依赖还未执行完，所以无exports
    else if(!modules[name].exports) {
      use(modules[name].deps, function() {
        execMod(name, callback, Array.prototype.slice.call(arguments, 0));
      });
    } 
    //loaded，已有exports
    else {
      callback(modules[name].exports);
    }
  }

  //表示其依赖已全部执行完
  function execMod(name, callback, params) {
    let exp = modules[name].callback.apply(null, params);
    modules[name].exports = exp;
    callback(exp);
    execComplete(name);
  }

  function execComplete(name) {
    for(let i=0; i<modules[name].oncomplete.length; i++) {
      modules[name].oncomplete[i](modules[name].exports);
    }
  }

  function loadScript(name, callback) {
    let doc = document;
    let node = doc.createElement('script');
    node.charset = 'utf-8';
    node.src = name + '.js';
    node.id = 'loadjs-js' + (Math.random()*100).toFixed(3);
    doc.body.appendChild(node);
    node.onload = function() {
      //加载模块之后返回的模块内容
      callback();
    }
  }

  function define(name, deps, callback) {
     //there will be a callback at least
     //define(callback)
    if(isFunction(name)) {
      callback = name;
      deps = [];
      name = '';
    }
    //define(deps, callback)
    else if(isArray(name) && isFunction(deps)) {
      callback = deps;
      deps = name;
      name = '';
    }
    //define(name, callback)
    else if(isString(name) && isFunction(deps)) {
      callback = deps;
      deps = [];
    }


    if(modPath[name]) {
      name = modPath[name];
    }
    deps = deps.map(ele => replaceName(ele));
    modules[name] = modules[name] || {};
    modules[name].deps = deps;
    modules[name].callback = callback;
    modules[name].status = 'loaded';
    modules[name].oncomplete = modules[name].oncomplete || [];
  }

  let loadjs = {
    define: define,
    use: use,
    config: config
  }

  //绑定到window对象上的方法和变量
  root.define = define;
  root.loadjs = loadjs;
  root.modules = modules;

})(window)