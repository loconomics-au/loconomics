require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Array Remove - By John Resig (MIT Licensed)
/*Array.prototype.remove = function (from, to) {
IagoSRL: it seems incompatible with Modernizr loader feature loading Zendesk script,
moved from prototype to a class-static method */
function arrayRemove(anArray, from, to) {
    var rest = anArray.slice((to || from) + 1 || anArray.length);
    anArray.length = from < 0 ? anArray.length + from : from;
    return anArray.push.apply(anArray, rest);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = arrayRemove;
} else {
    Array.remove = arrayRemove;
}
},{}],2:[function(require,module,exports){
/**
  Bindable UI Component.
  It relies on Component but adds DataSource capabilities
**/
var DataSource = require('./DataSource');
var Component = require('./Component');
var extend = require('./extend').extend;

/**
Reusing the original fetchData method but adding classes to our
component element for any visual notification of the data loading.
Method get extended with isPrefetching method for different
classes/notifications dependant on that flag, by default false:
**/
var componentFetchData = function bindableComponentFetchData(queryData, mode, isPrefetching) {
  var cl = isPrefetching ? this.classes.prefetching : this.classes.fetching;
  this.$el.addClass(cl);
  var that = this;

  var req = DataSource.prototype.fetchData.call(this, queryData, mode)
  .done(function () {
    that.$el.removeClass(cl || '_')
    // Remove error class too (to fill the case of a previous error)
    .removeClass(that.classes.hasDataError || '_');
  });

  return req;
};
/**
Replacing, but reusing internals, the default onerror callback for the
fetchData function to add notification classes to our component model
**/
componentFetchData.onerror = function bindableComponentFechDataOnerror(x, s, e) {
  DataSource.prototype.fetchData.onerror.call(this, x, s, e);
  // Add error class:
  this.$el
  .addClass(this.classes.hasDataError)
  .removeClass(this.classes.fetching || '_')
  .removeClass(this.classes.prefetching || '_');
};

/**
  BindableComponent class
**/
var BindableComponent = Component.extend(
  DataSource.prototype,
  // Prototype
  {
    classes: {
      fetching: 'is-loading',
      prefetching: 'is-preloading',
      disabled: 'is-disabled',
      hasDataError: 'has-dataError'
    },
    fetchData: componentFetchData,
    // What attribute name use to mark elements inside the component
    // with the property from the source to bind.
    // The prefix 'data-' in custom attributes is required by html5,
    // just specify the second part, being 'bind' the attribute
    // name to use is 'data-bind'
    dataBindAttribute: 'bind',
    // Default bindData implementation, can be replace on extended components
    // to something more complex (list/collections, sub-objects, custom structures
    // and visualization --keep as possible the use of dataBindAttribute for reusable code).
    // This implementation works fine for data as plain object with 
    // simple types as properties (not objects or arrays inside them).
    bindData: function bindData() {
      if (!this.data) return;
      // Check every element in the component with a bind
      // property and update it with the value of that property
      // from the data source
      var att = this.dataBindAttribute;
      var attrSelector = '[data-' + att + ']';
      var that = this;
      this.$el.find(attrSelector).each(function () {
        var $t = $(this),
          prop = $t.data(att),
          bindedValue = that.data[prop];

        if ($t.is(':input'))
          $t.val(bindedValue);
        else
          $t.text(bindedValue);
      });
    }
  },
  // Constructor
  function BindableComponent(element, options) {
    Component.call(this, element, options);

    this.data = this.$el.data('source') || this.data || {};
    if (typeof (this.data) == 'string')
      this.data = JSON.parse(this.data);

    // On html source url configuration:
    this.url = this.$el.data('source-url') || this.url;

    // TODO: 'change' event handlers on forms with data-bind to update its value at this.data
    // TODO: auto 'bindData' on fetchData ends? configurable, bindDataMode{ inmediate, notify }
  }
);

// Public module:
module.exports = BindableComponent;
},{"./Component":3,"./DataSource":4,"./extend":6}],3:[function(require,module,exports){
/** Component class: wrapper for
  the logic and behavior around
  a DOM element
**/
var extend = require('./extend');

function Component(element, options) {
  this.el = element;
  this.$el = $(element);
  extend(this, options);
  // Use the jQuery 'data' storage to preserve a reference
  // to this instance (useful to retrieve it from document)
  this.$el.data('component', this);
}

extend.plugIn(Component);
extend.plugIn(Component.prototype);

module.exports = Component;
},{"./extend":6}],4:[function(require,module,exports){
/**
  DataSource class to simplify fetching data as JSON
  to fill a local cache.
**/
var $ = require('jquery');
var fetchJSON = $.getJSON,
    extend = function () { return $.extend.apply(this, [true].concat(Array.prototype.slice.call(arguments, 0))); };

// TODO: replace each property of functions by instance properties, since that properties become
// shared between instances and is not wanted

var reqModes = DataSource.requestModes = {
  // Parallel request, no matter of others
  multiple: 0,
  // Will avoid a request if there is one running
  single: 1,
  // Latest requet will replace any previous one (previous will abort)
  replace: 2
};

var updModes = DataSource.updateModes = {
  // Every new data update, new content is added incrementally
  // (overwrite coincident content, append new content, old content
  // get in place)
  incremental: 0,
  // On new data update, new data totally replace the previous one
  replacement: 1
};

/**
Update the data store or cache with the given one.
There are different modes, this manages that logic and
its own configuration.
Is decoupled from the prototype but
it works only as part of a DataSource instance.
**/
function updateData(data, mode) {
  switch (mode || this.updateData.defaultUpdateMode) {

    case updModes.replacement:
      this.data = data;
      break;

    //case updModes.incremental:  
    default:
      // In case initial data is null, assign the result to itself:
      this.data = extend(this.data, data);
      break;
  }
}

/** Default value for the configurable update mode:
**/
updateData.defaultUpdateMode = updModes.incremental;

/**
Fetch the data from the server.
Here is decoupled from the rest of the prototype for
commodity, but it can works only as part of a DataSource instance.
**/
function fetchData(query, mode) {
  query = extend({}, this.query, query);
  switch (mode || this.fetchData.defaultRequestMode) {

    case reqModes.single:
      if (this.fetchData.requests.length) return null;
      break;

    case reqModes.replace:
      for (var i = 0; i < this.fetchData.requests.length; i++) {
        try {
          this.fetchData.requests[i].abort();
        } catch (ex) { }
        this.fetchData.requests = [];
      }
      break;

    // Just do nothing for multiple or default     
    //case reqModes.multiple:  
    //default: 
  }

  var that = this;
  var req = this.fetchData.proxy(
    this.url,
    query,
    function (data, t, xhr) {
      var ret = that.updateData(data);
      that.fetchData.requests.splice(that.fetchData.requests.indexOf(req), 1);
      //delete fetchData.requests[fetchData.requests.indexOf(req)];

      if (ret && ret.name) {
        // Update data emits error, the Ajax still resolves as 'success' because of the request, but
        // we need to execute the error, but we pipe it to ensure is done after other 'done' callbacks
        req.always(function () {
          that.fetchData.onerror.call(that, null, ret.name, ret);
        });
      }

    }
  )
  .fail($.proxy(this.fetchData.onerror, this));
  this.fetchData.requests.push(req);

  return req;
}

// Defaults fetchData properties, they are decoupled to allow
// replacement, and inside the fetchData function to don't
// contaminate the object namespace.

/* Collection of active (fetching) requests to the server
*/
fetchData.requests = [];

/* Decoupled functionality to perform the Ajax operation,
this allows overwrite this behavior to implement another
ways, like a non-jQuery implementation, a proxy to fake server
for testing or proxy to local storage if online, etc.
It must returns the used request object.
*/
fetchData.proxy = fetchJSON;

/* By default, fetchData allows multiple simultaneos connection,
since the storage by default allows incremental updates rather
than replacements.
*/
fetchData.defaultRequestMode = reqModes.multiple;

/* Default notification of error on fetching, just logging,
can be replaced.
It receives the request object, status and error.
*/
fetchData.onerror = function error(x, s, e) {
  if (console && console.error) console.error('Fetch data error %o', e);
};

/**
  DataSource class
**/
// Constructor: everything is in the prototype.
function DataSource() { }
DataSource.prototype = {
  data: null,
  url: '/',
  // query: object with default extra information to append to the url
  // when fetching data, extended with the explicit query specified
  // executing fetchData(query)
  query: {},
  updateData: updateData,
  fetchData: fetchData
  // TODO  pushData: function(){ post/put this.data to url  }
};

// Class as public module:
module.exports = DataSource;
},{}],5:[function(require,module,exports){
/**
  Loconomics specific Widget based on BindableComponent.
  Just decoupling specific behaviors from something more general
  to easily track that details, and maybe future migrations to
  other front-end frameworks.
**/
var DataSource = require('./DataSource');
var BindableComponent = require('./BindableComponent');

var LcWidget = BindableComponent.extend(
  // Prototype
  {
    // Replacing updateData to implement the particular
    // JSON scheme of Loconomics, but reusing original
    // logic inherit from DataSource
    updateData: function (data, mode) {
      if (data && data.Code === 0) {
        DataSource.prototype.updateData.call(this, data.Result, mode);
      } else {
        // Error message in the JSON
        return { name: 'data-format', message: data.ErrorMessage };
      }
    }
  },
  // Constructor
  function LcWidget(element, options) {
    BindableComponent.call(this, element, options);
  }
);

module.exports = LcWidget;
},{"./BindableComponent":2,"./DataSource":4}],6:[function(require,module,exports){
/**
  Deep Extend object utility, is recursive to get all the depth
  but only for the properties owned by the object,
  if you need the non-owned properties to in the object,
  consider extend from the source prototype too (and maybe to
  the destination prototype instead of the instance, but up to too).
**/

/* jquery implementation:
var $ = require('jquery');
extend = function () {
return $.extend.apply(this, [true].concat(Array.prototype.slice.call(arguments, 0))); 
};*/

var extend = function extend(destination, source) {
  for (var property in source) {
    if (!source.hasOwnProperty(property))
      continue;

    // Allow properties removal, if source contains value 'undefined'.
    // There are no special considerations on Arrays, to don't get undesired
    // results just the wanted is to replace specific positions, normally.
    if (source[property] === undefined) {
      delete destination[property];
      continue;
    }

    if (['object', 'function'].indexOf(typeof destination[property]) != -1 &&
            typeof source[property] == 'object')
      extend(destination[property], source[property]);
    else if (typeof destination[property] == 'function' &&
                 typeof source[property] == 'function') {
      var orig = destination[property];
      // Clone function
      var sour = cloneFunction(source[property]);
      destination[property] = sour;
      // Any previous attached property
      extend(destination[property], orig);
      // Any source attached property
      extend(destination[property], source[property]);
    }
    else
      destination[property] = source[property];
  }

  // So much 'source' arguments as wanted. In ES6 will be 'source..'
  if (arguments.length > 2) {
    var nexts = Array.prototype.slice.call(arguments, 0);
    nexts.splice(1, 1);
    extend.apply(this, nexts);
  }

  return destination;
};

extend.plugIn = function plugIn(obj) {
  obj = obj || Object.prototype;
  obj.extendMe = function extendMe() {
    extend.apply(this, [this].concat(Array.prototype.slice.call(arguments)));
  };
  obj.extend = function extendInstance() {
    var args = Array.prototype.slice.call(arguments),
      // If the object used to extend from is a function, is considered
      // a constructor, then we extend from its prototype, otherwise itself.
      constructorA = typeof this == 'function' ? this : null,
      baseA = constructorA ? this.prototype : this,
      // If last argument is a function, is considered a constructor
      // of the new class/object then we extend its prototype.
      // We use an empty object otherwise.
      constructorB = typeof args[args.length - 1] == 'function' ?
        args.splice(args.length - 1)[0] :
        null,
      baseB = constructorB ? constructorB.prototype : {};

    var extendedResult = extend.apply(this, [baseB, baseA].concat(args));
    // If both are constructors, we want the static methods to be copied too:
    if (constructorA && constructorB)
      extend(constructorB, constructorA);

    // If we are extending a constructor, we return that, otherwise the result
    return constructorB || extendedResult;
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = extend;
} else {
  // global scope
  extend.plugIn();
}

/*-------------------------
  Clone Utils
*/
function cloneObject(obj) {
  return extend({}, obj);
}

// Testing if a string seems a function source code:
// We test agains a simplisic regular expresion that match
// a common start of function declaration.
// Other ways to do this is at inverser, by checking
// that the function toString is not a knowed text
// as '[object Function]' or '[native code]', but
// since tha can changes between browsers, is more conservative
// check against a common construct an fallback on the
// common solution if not matches.
var testFunction = /^\s*function[^\(]\(/;

function cloneFunction(fn) {
  var temp;
  var contents = fn.toString();
  // Copy to a new instance of the same prototype, for the not 'owned' properties.
  // Assinged at the end
  var tempProto = Object.create(fn.prototype);

  // DISABLED the contents-copy part because it fails with closures
  // generated by the original function, using the sub-call way ever
  if (true || !testFunction.test(contents)) {
    // Check if is already a cloned copy, to
    // reuse the original code and avoid more than
    // one depth in stack calls (great!)
    if (typeof fn.prototype.___cloned_of == 'function')
      fn = fn.prototype.___cloned_of;

    temp = function () { return fn.apply(this, Array.prototype.slice.call(arguments)); };

    // Save mark as cloned. Done in its prototype
    // to not appear in the list of 'owned' properties.
    tempProto.___cloned_of = fn;
    // Replace toString to return the original source:
    tempProto.toString = function () {
      return fn.toString();
    };
    // The name cannot be set, will just be anonymous
    //temp.name = that.name;
  } else {
    // This way on capable browsers preserve the original name,
    // do a real independent copy and avoid function subcalls that
    // can degrate performance after lot of 'clonning'.
    var f = Function;
    temp = (new f('return ' + contents))();
  }

  temp.prototype = tempProto;
  // Copy any properties it owns
  extend(temp, fn);

  return temp;
}

function clonePlugIn() {
  if (typeof Function.prototype.clone !== 'function') {
    Function.prototype.clone = function clone() { return cloneFunction(this); };
  }
  if (typeof Object.prototype.clone !== 'function') {
    Ojbect.prototype.clone = function clone() { return cloneObject(this); };
  }
}

extend.cloneObject = cloneObject;
extend.cloneFunction = cloneFunction;
extend.clonePlugIn = clonePlugIn;

},{}],7:[function(require,module,exports){
/**
* Cookies management.
* Most code from http://stackoverflow.com/a/4825695/1622346
*/
var Cookie = {};

Cookie.set = function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
};
Cookie.get = function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
};

if (typeof module !== 'undefined' && module.exports)
    module.exports = Cookie;
},{}],"LC/FacebookConnect":[function(require,module,exports){
module.exports=require('cwp+TC');
},{}],"cwp+TC":[function(require,module,exports){
/** Connect account with Facebook
**/
var
  $ = require('jquery'),
  loader = require('./loader'),
  blockPresets = require('./blockPresets'),
  LcUrl = require('./LcUrl'),
  popup = require('./popup'),
  redirectTo = require('./redirectTo');
require('jquery.blockUI');

function FacebookConnect(options) {
  $.extend(this, options);
  if (!$('#fb-root').length)
    $('<div id="fb-root" style="display: none"></div>').appendTo('body');
}

FacebookConnect.prototype = {
  appId: null,
  lang: 'en_US',
  resultType: 'json', // 'redirect'
  fbUrlBase: '//connect.facebook.net/@(lang)/all.js',
  serverUrlBase: LcUrl.LangPath + 'Account/Facebook/@(urlSection)/?Redirect=@(redirectUrl)&profile=@(profileUrl)',
  redirectUrl: '',
  profileUrl: '',
  urlSection: '',
  loadingText: 'Verifing',
  permissions: '',
  libLoadedEvent: 'FacebookConnectLibLoaded',
  connectedEvent: 'FacebookConnectConnected'
};

FacebookConnect.prototype.getFbUrl = function() {
  return this.fbUrlBase.replace(/@\(lang\)/g, this.lang);
};

FacebookConnect.prototype.getServerUrl = function() {
  return this.serverUrlBase
  .replace(/@\(redirectUrl\)/g, this.redirectUrl)
  .replace(/@\(profileUrl\)/g, this.profileUrl)
  .replace(/@\(urlSection\)/g, this.urlSection);
};

FacebookConnect.prototype.loadLib = function () {
  // Only if is not loaded still
  // (Facebook script attach itself as the global variable 'FB')
  if (!window.FB && !this._loadingLib) {
    this._loadingLib = true;
    var that = this;
    loader.load({
      scripts: [this.getFbUrl()],
      complete: function () {
        FB.init({ appId: that.appId, status: true, cookie: true, xfbml: true });
        that.loadingLib = false;
        $(document).trigger(that.libLoadedEvent);
      },
      completeVerification: function () {
        return !!window.FB;
      }
    });
  }
};

FacebookConnect.prototype.processResponse = function (response) {
  if (response.authResponse) {
    //console.log('FacebookConnect: Welcome!');
    var url = this.getServerUrl();
    if (this.resultType == "redirect") {
      redirectTo(url);
    } else if (this.resultType == "json") {
      popup(url, 'small', null, this.loadingText);
      $(document).trigger(this.connectedEvent);
    }

    /*FB.api('/me', function (response) {
    console.log('FacebookConnect: Good to see you, ' + response.name + '.');
    });*/
  } else {
    //console.log('FacebookConnect: User cancelled login or did not fully authorize.');
  }
};

FacebookConnect.prototype.onLibReady = function (callback) {
  if (window.FB)
    callback();
  else {
    this.loadLib();
    $(document).on(this.libLoadedEvent, callback);
  }
};

FacebookConnect.prototype.connect = function () {
  var that = this;
  this.onLibReady(function () {
    FB.login($.proxy(that.processResponse, that), { scope: that.permissions });
  });
};

FacebookConnect.prototype.autoConnectOn = function (selector) {
  jQuery(document).on('click', selector || 'a.facebook-connect', $.proxy(this.connect, this));
};

module.exports = FacebookConnect;
},{"./LcUrl":10,"./blockPresets":43,"./loader":70,"./popup":76,"./redirectTo":78}],10:[function(require,module,exports){
/** Implements a similar LcUrl object like the server-side one, basing
    in the information attached to the document at 'html' tag in the 
    'data-base-url' attribute (thats value is the equivalent for AppPath),
    and the lang information at 'data-culture'.
    The rest of URLs are built following the window.location and same rules
    than in the server-side object.
**/

var base = document.documentElement.getAttribute('data-base-url'),
    lang = document.documentElement.getAttribute('data-culture'),
    l = window.location,
    url = l.protocol + '//' + l.host;
// location.host includes port, if is not the default, vs location.hostname

base = base || '/';

var LcUrl = {
    SiteUrl: url,
    AppPath: base,
    AppUrl: url + base,
    LangId: lang,
    LangPath: base + lang + '/',
    LangUrl: url + base + lang
};
LcUrl.LangUrl = url + LcUrl.LangPath;
LcUrl.JsonPath = LcUrl.LangPath + 'JSON/';
LcUrl.JsonUrl = url + LcUrl.JsonPath;

module.exports = LcUrl;
},{}],11:[function(require,module,exports){
/* Loconomics specific Price, fees and hour-price calculation
    using some static methods and the Price class.
*/
var mu = require('./mathUtils');

/* Class Price to calculate a total price based on fees information (fixed and rate)
    and desired decimals for approximations.
*/
function Price(basePrice, fee, roundedDecimals) {
    // fee parameter can be a float number with the feeRate or an object
    // that includes both a feeRate and a fixedFeeAmount
    // Extracting fee values into local vars:
    var feeRate = 0, fixedFeeAmount = 0;
    if (fee.fixedFeeAmount || fee.feeRate) {
        fixedFeeAmount = fee.fixedFeeAmount || 0;
        feeRate = fee.feeRate || 0;
    } else
        feeRate = fee;

    // Calculating:
    // The roundTo with a big fixed decimals is to avoid the
    // decimal error of floating point numbers
    var totalPrice = mu.ceilTo(mu.roundTo(basePrice * (1 + feeRate) + fixedFeeAmount, 12), roundedDecimals);
    // final fee price is calculated as a substraction, but because javascript handles
    // float numbers only, a round operation is required to avoid an irrational number
    var feePrice = mu.roundTo(totalPrice - basePrice, 2);

    // Creating object with full details:
    this.basePrice = basePrice;
    this.feeRate = feeRate;
    this.fixedFeeAmount = fixedFeeAmount;
    this.roundedDecimals = roundedDecimals;
    this.totalPrice = totalPrice;
    this.feePrice = feePrice;
}

/** Calculate and returns the price and relevant data as an object for
time, hourlyRate (with fees) and the hourlyFee.
The time (@duration) is used 'as is', without transformation, maybe you can require
use LC.roundTimeToQuarterHour before pass the duration to this function.
It receives the parameters @hourlyPrice and @surchargePrice as LC.Price objects.
@surchargePrice is optional.
**/
function calculateHourlyPrice(duration, hourlyPrice, surchargePrice) {
    // If there is no surcharge, get zeros
    surchargePrice = surchargePrice || { totalPrice: 0, feePrice: 0, basePrice: 0 };
    // Get hours from rounded duration:
    var hours = mu.roundTo(duration.totalHours(), 2);
    // Calculate final prices
    return {
        totalPrice:     mu.roundTo(hourlyPrice.totalPrice * hours + surchargePrice.totalPrice * hours, 2),
        feePrice:       mu.roundTo(hourlyPrice.feePrice * hours + surchargePrice.feePrice * hours, 2),
        subtotalPrice:  mu.roundTo(hourlyPrice.basePrice * hours + surchargePrice.basePrice * hours, 2),
        durationHours:  hours
    };
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        Price: Price,
        calculateHourlyPrice: calculateHourlyPrice
    };
},{"./mathUtils":71}],12:[function(require,module,exports){
// http://stackoverflow.com/questions/2593637/how-to-escape-regular-expression-in-javascript
RegExp.quote = function (str) {
  return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

},{}],"aFoCK0":[function(require,module,exports){
/**
  A very simple slider implementation initially created
  for the provider-welcome landing page and
  other similar uses.
**/
var $ = require('jquery');
require('./RegExp.quote');

var SimpleSlider = module.exports = function SimpleSlider(opts) {
  $.extend(true, this, opts);

  this.element = $(this.element);
  this.currentIndex = 0;

  /**
  Actions handler to move slides
  **/
  var checkHref = new RegExp('^#' + RegExp.quote(this.hrefPrefix) + '(.*)'),
    that = this;
  this.element.on('click', 'a', function () {
    var href = this.getAttribute('href');
    var res = checkHref.exec(href);

    if (res && res.length > 1) {
      var index = res[1];
      if (index == 'previous') {
        that.goSlide(that.currentIndex - 1);
      }
      else if (index == 'next') {
        that.goSlide(that.currentIndex + 1);
      }
      else if (/\d+/.test(index)) {
        that.goSlide(parseInt(index));
      }

      return false;
    }
  });

  /**
  Method: Do all the setup on slider and slides
  to ensure the movement will work fine.
  Its done automatic on
  initializing, is just a public method for 
  convenience (maybe to be call if slides are
  added/removed after init).
  **/
  this.redraw = function slidesReposition() {
    var slides = this.getSlides(),
      c = this.getSlidesContainer();
    // Look for the container size, from the 
    // bigger slide:
    var 
      w = 0,
      h = 0;
    slides.each(function () {
      var 
        t = $(this),
        tw = t.outerWidth(),
        th = t.outerHeight();
      if (tw > w)
        w = tw;
      if (th > h)
        h = th;
    });

    // CSS setup, 
    // all slides in the same line,
    // all with same size (extra spacing can
    // be given with CSS)
    c.css({
      width: w - (c.outerWidth() - c.width()),
      //height: h - (c.outerHeight() - c.height()),
      position: 'relative',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    });

    slides.css({
      whiteSpace: 'normal',
      display: 'inline-block'
    }).each(function () {
      var t = $(this);
      t.css({
        width: w - (t.outerWidth() - t.width())
        //,height: h - (t.outerHeight() - t.height())
      });
    });

    // Repositionate at the beggining:
    c[0].scrollLeft = 0;

  };

  /**
  Method: Go to a slide by index
  **/
  this.goSlide = function goSlide(index) {
    var prev = this.currentIndex;
    if (prev == index)
      return;

    // Check bounds
    if (index < 1)
      return false;
    var slides = this.getSlides();
    if (index > slides.length)
      return false;

    // Good index, set as current
    this.currentIndex = index;
    // Set links to this as current, removing any previous:
    this.element.find('[href=#' + this.hrefPrefix + index + ']')
    .addClass(this.currentSlideClass)
    .parent('li').addClass(this.currentSlideClass);
    this.element.find('[href=#' + this.hrefPrefix + prev + ']')
    .removeClass(this.currentSlideClass)
    .parent('li').removeClass(this.currentSlideClass);

    var 
      slide = $(slides.get(index - 1)),
      c = this.getSlidesContainer(),
      left = c.scrollLeft() + slide.position().left;

    c.stop().animate({ scrollLeft: left }, this.duration);

  };

  /**
  Method: Get the jQuery collection of slides
  **/
  this.getSlides = function getSlides() {
    return this.element
    .find(this.selectors.slides)
    .find(this.selectors.slide);
  };

  /**
  Method: Get the jQuery element for the container of slides
  **/
  this.getSlidesContainer = function getSlidesContainer() {
    return this.element
    .find(this.selectors.slides);
  };

  /** Last init steps
  **/
  this.redraw();
};

SimpleSlider.prototype = {
  element: null,
  selectors: {
    slides: '.slides',
    slide: 'li.slide'
  },
  currentSlideClass: 'js-isCurrent',
  hrefPrefix: 'goSlide_',
  // Duration of each slide in milliseconds
  duration: 1000
};
},{"./RegExp.quote":12}],"LC/SimpleSlider":[function(require,module,exports){
module.exports=require('aFoCK0');
},{}],15:[function(require,module,exports){
/** Polyfill for string.contains
**/
if (!('contains' in String.prototype))
    String.prototype.contains = function (str, startIndex) { return -1 !== this.indexOf(str, startIndex); };
},{}],"StringFormat":[function(require,module,exports){
module.exports=require('KqXDvj');
},{}],"KqXDvj":[function(require,module,exports){
/** ======================
 * A simple String Format
 * function for javascript
 * Author: Iago Lorenzo Salgueiro
 * Module: CommonJS
 */
module.exports = function stringFormat() {
  var args = arguments;
	var formatted = args[0];
	for (var i = 0; i < args.length; i++) {
		var regexp = new RegExp('\\{'+i+'\\}', 'gi');
		formatted = formatted.replace(regexp, args[i+1]);
	}
	return formatted;
};
},{}],18:[function(require,module,exports){
/**
    General auto-load support for tabs: 
    If there is no content when focused, they use the 'reload' jquery plugin
    to load its content -tabs need to be configured with data-source-url attribute
    in order to know where to fetch the content-.
**/
var $ = require('jquery');
require('./jquery.reload');

// Dependency TabbedUX from DI
exports.init = function (TabbedUX) {
    // TabbedUX.setup.tabBodySelector || '.tab-body'
    $('.tab-body').on('tabFocused', function () {
        var $t = $(this);
        if ($t.children().length === 0)
            $t.reload();
    });
};
},{"./jquery.reload":66}],19:[function(require,module,exports){
/**
    This adds notifications to tabs from the TabbedUX system using
    the changesNotification utility that detects not saved changes on forms,
    showing warning messages to the
    user and marking tabs (and sub-tabs / parent-tabs properly) to
    don't lost changes made.
    A bit of CSS for the assigned classes will allow for visual marks.

    AKA: Don't lost data! warning message ;-)
**/
var $ = require('jquery'),
    smoothBoxBlock = require('./smoothBoxBlock'),
    changesNotification = require('./changesNotification');

// TabbedUX dependency as DI
exports.init = function (TabbedUX, targetSelector) {
    var target = $(targetSelector || '.changes-notification-enabled');
    changesNotification.init({ target: target });

    // Adding change notification to tab-body divs
    // (outside the LC.ChangesNotification class to leave it as generic and simple as possible)
    $(target).on('lcChangesNotificationChangeRegistered', 'form', function () {
        $(this).parents('.tab-body').addClass('has-changes')
            .each(function () {
                // Adding class to the menu item (tab title)
                TabbedUX.getTabContext(this).menuitem.addClass('has-changes')
                .attr('title', $('#lcres-changes-not-saved').text());
            });
    })
    .on('lcChangesNotificationSaveRegistered', 'form', function (e, f, els, full) {
        if (full)
            $(this).parents('.tab-body:not(:has(form.has-changes))').removeClass('has-changes')
            .each(function () {
                // Removing class from the menu item (tab title)
                TabbedUX.getTabContext(this).menuitem.removeClass('has-changes')
                    .attr('title', null);
            });
    })
    // To avoid user be notified of changes all time with tab marks, we added a 'notify' class
    // on tabs when a change of tab happens
    .find('.tab-body').on('tabUnfocused', function (event, focusedCtx) {
        var mi = TabbedUX.getTabContext(this).menuitem;
        if (mi.is('.has-changes')) {
            mi.addClass('notify-changes'); //has-tooltip
            // Show notification popup
            var d = $('<div class="warning">@0</div><div class="actions"><input type="button" class="action continue" value="@2"/><input type="button" class="action stop" value="@1"/></div>'
                .replace(/@0/g, LC.getText('changes-not-saved'))
                .replace(/@1/g, LC.getText('tab-has-changes-stay-on'))
                .replace(/@2/g, LC.getText('tab-has-changes-continue-without-change')));
            d.on('click', '.stop', function () {
                smoothBoxBlock.close(window);
            })
            .on('click', '.continue', function () {
                smoothBoxBlock.close(window);
                // Remove 'has-changes' to avoid future blocks (until new changes happens of course ;-)
                mi.removeClass('has-changes');
                TabbedUX.focusTab(focusedCtx.tab.get(0));
            });
            smoothBoxBlock.open(d, window, 'not-saved-popup', { closable: false, center: true });

            // Ever return false to stop current tab focus
            return false;
        }
    })
    .on('tabFocused', function () {
        TabbedUX.getTabContext(this).menuitem.removeClass('notify-changes'); //has-tooltip
    });
};

},{"./changesNotification":"f5kckb","./smoothBoxBlock":"KQGzNM"}],20:[function(require,module,exports){
/** TabbedUX: Tabbed interface logic; with minimal HTML using class 'tabbed' for the
container, the object provides the full API to manipulate tabs and its setup
listeners to perform logic on user interaction.
**/
var $ = jQuery || require('jquery');
require('./jquery.hasScrollBar');

var TabbedUX = {
    init: function () {
        $('body').delegate('.tabbed > .tabs > li:not(.tabs-slider) > a', 'click', function (e) {
            var $t = $(this);
            if (TabbedUX.focusTab($t.attr('href'))) {
                var st = $(document).scrollTop();
                location.hash = $t.attr('href');
                $('html,body').scrollTop(st);
            }
            e.preventDefault();
        })
        .delegate('.tabbed > .tabs-slider > a', 'mousedown', TabbedUX.startMoveTabsSlider)
        .delegate('.tabbed > .tabs-slider > a', 'mouseup mouseleave', TabbedUX.endMoveTabsSlider)
        // the click return false is to disable standar url behavior
        .delegate('.tabbed > .tabs-slider > a', 'click', function () { return false; })
        .delegate('.tabbed > .tabs-slider-limit', 'mouseenter', TabbedUX.startMoveTabsSlider)
        .delegate('.tabbed > .tabs-slider-limit', 'mouseleave', TabbedUX.endMoveTabsSlider)
        .delegate('.tabbed > .tabs > li.removable', 'click', function (e) {
            // Only on direct clicks to the tab, to avoid
            // clicks to the tab-link (that select/focus the tab):
            if (e.target == e.currentTarget)
                TabbedUX.removeTab(null, this);
        });

        // Init page loaded tabbed containers:
        $('.tabbed').each(function () {
            var $t = $(this);
            // Consistence check: this must be a valid container, this is, must have .tabs
            if ($t.children('.tabs').length === 0)
                return;
            // Init slider
            TabbedUX.setupSlider($t);
            // Clean white spaces (they create excesive separation between some tabs)
            $('.tabs', this).contents().each(function () {
                // if this is a text node, remove it:
                if (this.nodeType == 3)
                    $(this).remove();
            });
        });
    },
    moveTabsSlider: function () {
        $t = $(this);
        var dir = $t.hasClass('tabs-slider-right') ? 1 : -1;
        var tabsSlider = $t.parent();
        var tabs = tabsSlider.siblings('.tabs:eq(0)');
        tabs[0].scrollLeft += 20 * dir;
        TabbedUX.checkTabSliderLimits(tabsSlider.parent(), tabs);
        return false;
    },
    startMoveTabsSlider: function () {
        var t = $(this);
        var tabs = t.closest('.tabbed').children('.tabs:eq(0)');
        // Stop previous animations:
        tabs.stop(true);
        var speed = 0.3; /* speed unit: pixels/miliseconds */
        var fxa = function () { TabbedUX.checkTabSliderLimits(tabs.parent(), tabs); };
        var time;
        if (t.hasClass('right')) {
            // Calculate time based on speed we want and how many distance there is:
            time = (tabs[0].scrollWidth - tabs[0].scrollLeft - tabs.width()) * 1 / speed;
            tabs.animate({ scrollLeft: tabs[0].scrollWidth - tabs.width() },
            { duration: time, step: fxa, complete: fxa, easing: 'swing' });
        } else {
            // Calculate time based on speed we want and how many distance there is:
            time = tabs[0].scrollLeft * 1 / speed;
            tabs.animate({ scrollLeft: 0 },
            { duration: time, step: fxa, complete: fxa, easing: 'swing' });
        }
        return false;
    },
    endMoveTabsSlider: function () {
        var tabContainer = $(this).closest('.tabbed');
        tabContainer.children('.tabs:eq(0)').stop(true);
        TabbedUX.checkTabSliderLimits(tabContainer);
        return false;
    },
    checkTabSliderLimits: function (tabContainer, tabs) {
        tabs = tabs || tabContainer.children('.tabs:eq(0)');
        // Set visibility of visual limiters:
        tabContainer.children('.tabs-slider-limit-left').toggle(tabs[0].scrollLeft > 0);
        tabContainer.children('.tabs-slider-limit-right').toggle(
            (tabs[0].scrollLeft + tabs.width()) < tabs[0].scrollWidth);
    },
    setupSlider: function (tabContainer) {
        var ts = tabContainer.children('.tabs-slider');
        if (tabContainer.children('.tabs').hasScrollBar({ x: -2 }).horizontal) {
            tabContainer.addClass('has-tabs-slider');
            if (ts.length === 0) {
                ts = document.createElement('div');
                ts.className = 'tabs-slider';
                $(ts)
                // Arrows:
                    .append('<a class="tabs-slider-left left" href="#">&lt;&lt;</a>')
                    .append('<a class="tabs-slider-right right" href="#">&gt;&gt;</a>');
                tabContainer.append(ts);
                tabContainer
                // Desing details:
                    .append('<div class="tabs-slider-limit tabs-slider-limit-left left" href="#"></div>')
                    .append('<div class="tabs-slider-limit tabs-slider-limit-right right" href="#"></div>');
            } else {
                ts.show();
            }
        } else {
            tabContainer.removeClass('has-tabs-slider');
            ts.hide();
        }
        TabbedUX.checkTabSliderLimits(tabContainer);
    },
    getTabContextByArgs: function (args) {
        if (args.length == 1 && typeof (args[0]) == 'string')
            return this.getTabContext(args[0], null);
        if (args.length == 1 && args[0].tab)
            return args[0];
        else
            return this.getTabContext(
                args.length > 0 ? args[0] : null,
                args.length > 1 ? args[1] : null,
                args.length > 2 ? args[2] : null
            );
    },
    getTabContext: function (tabOrSelector, menuitemOrSelector) {
        var mi, ma, tab, tabContainer;
        if (tabOrSelector) {
            tab = $(tabOrSelector);
            if (tab.length == 1) {
                tabContainer = tab.parents('.tabbed:eq(0)');
                ma = tabContainer.find('> .tabs > li > a[href=#' + tab.get(0).id + ']');
                mi = ma.parent();
            }
        } else if (menuitemOrSelector) {
            ma = $(menuitemOrSelector);
            if (ma.is('li')) {
                mi = ma;
                ma = mi.children('a:eq(0)');
            } else
                mi = ma.parent();
            tabContainer = mi.closest('.tabbed');
            tab = tabContainer.find('>.tab-body@0, >.tab-body-list>.tab-body@0'.replace(/@0/g, ma.attr('href')));
        }
        return { tab: tab, menuanchor: ma, menuitem: mi, tabContainer: tabContainer };
    },
    checkTabContext: function (ctx, functionname, args, isTest) {
        if (!ctx.tab || ctx.tab.length != 1 ||
            !ctx.menuitem || ctx.menuitem.length != 1 ||
            !ctx.tabContainer || ctx.tabContainer.length != 1 || 
            !ctx.menuanchor || ctx.menuanchor.length != 1) {
            if (!isTest && console && console.error)
                console.error('TabbedUX.' + functionname + ', bad arguments: ' + Array.join(args, ', '));
            return false;
        }
        return true;
    },
    getTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'focusTab', arguments, true)) return null;
        return ctx.tab.get(0);
    },
    focusTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'focusTab', arguments)) return;

        // Get previous focused tab, trigger 'tabUnfocused' handler that can
        // stop this focus (returning explicity 'false')
        var prevTab = ctx.tab.siblings('.current');
        if (prevTab.triggerHandler('tabUnfocused', [ctx]) === false)
            return;

        // Check (first!) if there is a parent tab and focus it too (will be recursive calling this same function)
        var parTab = ctx.tab.parents('.tab-body:eq(0)');
        if (parTab.length == 1) this.focusTab(parTab);

        if (ctx.menuitem.hasClass('current') ||
            ctx.menuitem.hasClass('disabled'))
            return false;

        // Unset current menu element
        ctx.menuitem.siblings('.current').removeClass('current')
            .find('>a').removeClass('current');
        // Set current menu element
        ctx.menuitem.addClass('current');
        ctx.menuanchor.addClass('current');

        // Hide current tab-body
        prevTab.removeClass('current');
        // Show current tab-body and trigger event
        ctx.tab.addClass('current')
            .triggerHandler('tabFocused');

        return true;
    },
    focusTabIndex: function (tabContainer, tabIndex) {
        if (tabContainer)
            return this.focusTab(this.getTabContext(tabContainer.find('>.tab-body:eq(' + tabIndex + ')')));
        return false;
    },
    /* Enable a tab, disabling all others tabs -usefull in wizard style pages- */
    enableTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'enableTab', arguments)) return;
        var rtn = false;
        if (ctx.menuitem.is('.disabled')) {
            // Remove disabled class from focused tab and menu item
            ctx.tab.removeClass('disabled')
            .triggerHandler('tabEnabled');
            ctx.menuitem.removeClass('disabled');
            rtn = true;
        }
        // Focus tab:
        this.focusTab(ctx);
        // Disabled tabs and menu items:
        ctx.tab.siblings(':not(.disabled)')
            .addClass('disabled')
            .triggerHandler('tabDisabled');
        ctx.menuitem.siblings(':not(.disabled)')
            .addClass('disabled');
        return rtn;
    },
    showhideDuration: 0,
    showhideEasing: null,
    showTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'showTab', arguments)) return;
        // Show tab and menu item
        ctx.tab.show(this.showhideDuration);
        ctx.menuitem.show(this.showhideEasing);
    },
    hideTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'hideTab', arguments)) return;
        // Show tab and menu item
        ctx.tab.hide(this.showhideDuration);
        ctx.menuitem.hide(this.showhideEasing);
    },
    tabBodyClassExceptions: { 'tab-body': 0, 'tabbed': 0, 'current': 0, 'disabled': 0 },
    createTab: function (tabContainer, idName, label) {
        tabContainer = $(tabContainer);
        // tabContainer must be only one and valid container
        // and idName must not exists
        if (tabContainer.length == 1 && tabContainer.is('.tabbed') &&
            document.getElementById(idName) === null) {
            // Create tab div:
            var tab = document.createElement('div');
            tab.id = idName;
            // Required classes
            tab.className = "tab-body";
            var $tab = $(tab);
            // Get an existing sibling and copy (with some exceptions) their css classes
            $.each(tabContainer.children('.tab-body:eq(0)').attr('class').split(/\s+/), function (i, v) {
                if (!(v in TabbedUX.tabBodyClassExceptions))
                    $tab.addClass(v);
            });
            // Add to container
            tabContainer.append(tab);

            // Create menu entry
            var menuitem = document.createElement('li');
            // Because is a dynamically created tab, is a dynamically removable tab:
            menuitem.className = "removable";
            var menuanchor = document.createElement('a');
            menuanchor.setAttribute('href', '#' + idName);
            // label cannot be null or empty
            $(menuanchor).text(isEmptyString(label) ? "Tab" : label);
            $(menuitem).append(menuanchor);
            // Add to tabs list container
            tabContainer.children('.tabs:eq(0)').append(menuitem);

            // Trigger event, on tabContainer, with the new tab as data
            tabContainer.triggerHandler('tabCreated', [tab]);

            this.setupSlider(tabContainer);

            return tab;
        }
        return false;
    },
    removeTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'removeTab', arguments)) return;

        // Only remove if is a 'removable' tab
        if (!ctx.menuitem.hasClass('removable') && !ctx.menuitem.hasClass('volatile'))
            return false;
        // If tab is currently focused tab, change to first tab
        if (ctx.menuitem.hasClass('current'))
            this.focusTabIndex(ctx.tabContainer, 0);
        ctx.menuitem.remove();
        var tabid = ctx.tab.get(0).id;
        ctx.tab.remove();

        this.setupSlider(ctx.tabContainer);

        // Trigger event, on tabContainer, with the removed tab id as data
        ctx.tabContainer.triggerHandler('tabRemoved', [tabid]);
        return true;
    },
    setTabTitle: function (tabOrSelector, newTitle) {
        var ctx = TabbedUX.getTabContext(tabOrSelector);
        if (!this.checkTabContext(ctx, 'setTabTitle', arguments)) return;
        // Set an empty string is not allowed, preserve previously:
        if (!isEmptyString(newTitle))
            ctx.menuanchor.text(newTitle);
    }
};

/* More static utilities */

/** Look up the current window location address and try to focus a tab with that
    name, if there is one.
**/
TabbedUX.focusCurrentLocation = function () {
    // If the current location have a hash value but is not a HashBang
    if (/^#[^!]/.test(window.location.hash)) {
        // Try focus a tab with that name
        var tab = TabbedUX.getTab(window.location.hash);
        if (tab)
            TabbedUX.focusTab(tab);
    }
};

/** Look for volatile tabs on the page, if they are
    empty or requesting being 'volatized', remove it.
**/
TabbedUX.checkVolatileTabs = function () {
    $('.tabbed > .tabs > .volatile').each(function () {
        var tab = TabbedUX.getTab(null, this);
        if (tab && ($(tab).children().length === 0 || $(tab).find(':not(.tabbed) .volatize-my-tab').length)) {
            TabbedUX.removeTab(tab);
        }
    });
};

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = TabbedUX;
},{"./jquery.hasScrollBar":63}],21:[function(require,module,exports){
/* slider-tabs logic.
* Execute init after TabbedUX.init to avoid launch animation on page load.
* It requires TabbedUX throught DI on 'init'.
*/
var $ = require('jquery');
exports.init = function initSliderTabs(TabbedUX) {
    $('.tabbed.slider-tabs').each(function () {
        var $t = $(this);
        var $tabs = $t.children('.tab-body');
        var c = $tabs
            .wrapAll('<div class="tab-body-list"/>')
            .end().children('.tab-body-list');
        $tabs.on('tabFocused', function () {
            c.stop(true, false).animate({ scrollLeft: c.scrollLeft() + $(this).position().left }, 1400);
        });
        // Set horizontal scroll to the position of current showed tab, without animation (for page-init):
        var currentTab = $($t.find('>.tabs>li.current>a').attr('href'));
        c.scrollLeft(c.scrollLeft() + currentTab.position().left);
    });
};
},{}],22:[function(require,module,exports){
/**
    Wizard Tabbed Forms.
    It use tabs to manage the different forms-steps in the wizard,
    loaded by AJAX and following to the next tab/step on success.

    Require TabbedUX via DI on 'init'
 **/
var $ = require('jquery'),
    validation = require('./validationHelper'),
    changesNotification = require('./changesNotification'),
    redirectTo = require('./redirectTo'),
    popup = require('./popup'),
    ajaxCallbacks = require('./ajaxCallbacks'),
    blockPresets = require('./blockPresets');
require('jquery.blockUI');

exports.init = function initTabbedWizard(TabbedUX, options) {
    options = $.extend(true, {
        loadingDelay: 0
    }, options);

    $("body").delegate(".tabbed.wizard .next", "click", function () {
        // getting the form
        var form = $(this).closest('form');
        // getting the current wizard step-tab
        var currentStep = form.closest('.tab-body');
        // getting the wizard container
        var wizard = form.closest('.tabbed.wizard');
        // getting the wizard-next-step
        var nextStep = $(this).data('wizard-next-step');

        var ctx = {
            box: currentStep,
            form: form
        };

        // First at all, if unobtrusive validation is enabled, validate
        var valobject = form.data('unobtrusiveValidation');
        if (valobject && valobject.validate() === false) {
            validation.goToSummaryErrors(form);
            // Validation is actived, was executed and the result is 'false': bad data, stop Post:
            return false;
        }

        // If custom validation is enabled, validate
        var cusval = form.data('customValidation');
        if (cusval && cusval.validate && cusval.validate() === false) {
            validation.goToSummaryErrors(form);
            // custom validation not passed, out!
            return false;
        }

        // Raise event
        currentStep.trigger('beginSubmitWizardStep');

        // Loading, with retard
        ctx.loadingtimer = setTimeout(function () {
            currentStep.block(blockPresets.loading);
        }, options.loadingDelay);
        
        ctx.autoUnblockLoading = true;

        var ok = false;

        // Mark as saved:
        ctx.changedElements = changesNotification.registerSave(form.get(0));

        // Do the Ajax post
        $.ajax({
            url: (form.attr('action') || ''),
            type: 'POST',
            context: ctx,
            data: form.serialize(),
            success: function (data, text, jx) {

                // If success, go next step, using custom JSON Action event:
                ctx.form.on('ajaxSuccessPost', function () {
                    // If there is next-step
                    if (nextStep) {
                        // If next step is internal url (a next wizard tab)
                        if (/^#/.test(nextStep)) {
                            $(nextStep).trigger('beginLoadWizardStep');

                            TabbedUX.enableTab(nextStep);

                            ok = true;
                            $(nextStep).trigger('endLoadWizardStep');
                        } else {
                            // If there is a next-step URI that is not internal link, we load it
                            redirectTo(nextStep);
                        }
                    }
                });

                // Do JSON action but if is not JSON or valid, manage as HTML:
                if (!ajaxCallbacks.doJSONAction(data, text, jx, ctx)) {
                    // Post 'maybe' was wrong, html was returned to replace current 
                    // form container: the ajax-box.

                    // create jQuery object with the HTML
                    var newhtml = new jQuery();
                    // Try-catch to avoid errors when an empty document or malformed is returned:
                    try {
                        // parseHTML since jquery-1.8 is more secure:
                        if (typeof ($.parseHTML) === 'function')
                            newhtml = $($.parseHTML(data));
                        else
                            newhtml = $(data);
                    } catch (ex) {
                        if (console && console.error)
                            console.error(ex);
                    }

                    // Showing new html:
                    currentStep.html(newhtml);
                    var newForm = currentStep;
                    if (!currentStep.is('form'))
                        newForm = currentStep.find('form:eq(0)');

                    // Changesnotification after append element to document, if not will not work:
                    // Data not saved (if was saved but server decide returns html instead a JSON code, page script must do 'registerSave' to avoid false positive):
                    changesNotification.registerChange(
                        newForm.get(0),
                        ctx.changedElements
                    );

                    currentStep.trigger('reloadedHtmlWizardStep');
                }
            },
            error: ajaxCallbacks.error,
            complete: ajaxCallbacks.complete
        }).complete(function () {
            currentStep.trigger('endSubmitWizardStep', ok);
        });
        return false;
    });
};
},{"./ajaxCallbacks":28,"./blockPresets":43,"./changesNotification":"f5kckb","./popup":76,"./redirectTo":78,"./validationHelper":"kqf9lt"}],"LC/TimeSpan":[function(require,module,exports){
module.exports=require('rqZkA9');
},{}],"rqZkA9":[function(require,module,exports){
/** timeSpan class to manage times, parse, format, compute.
Its not so complete as the C# ones but is usefull still.
**/
var TimeSpan = function (days, hours, minutes, seconds, milliseconds) {
    this.days = Math.floor(parseFloat(days)) || 0;
    this.hours = Math.floor(parseFloat(hours)) || 0;
    this.minutes = Math.floor(parseFloat(minutes)) || 0;
    this.seconds = Math.floor(parseFloat(seconds)) || 0;
    this.milliseconds = Math.floor(parseFloat(milliseconds)) || 0;

    // internal utility function 'to string with two digits almost'
    function t(n) {
        return Math.floor(n / 10) + '' + n % 10;
    }
    /** Show only hours and minutes as a string with the format HH:mm
    **/
    this.toShortString = function timeSpan_proto_toShortString() {
        var h = t(this.hours),
            m = t(this.minutes);
        return (h + TimeSpan.unitsDelimiter + m);
    };
    /** Show the full time as a string, days can appear before hours if there are 24 hours or more
    **/
    this.toString = function timeSpan_proto_toString() {
        var h = t(this.hours),
            d = (this.days > 0 ? this.days.toString() + TimeSpan.decimalsDelimiter : ''),
            m = t(this.minutes),
            s = t(this.seconds + this.milliseconds / 1000);
        return (
            d +
            h + TimeSpan.unitsDelimiter +
            m + TimeSpan.unitsDelimiter +
            s);
    };
    this.valueOf = function timeSpan_proto_valueOf() {
        // Return the total milliseconds contained by the time
        return (
            this.days * (24 * 3600000) +
            this.hours * 3600000 +
            this.minutes * 60000 +
            this.seconds * 1000 +
            this.milliseconds
        );
    };
};
/** It creates a timeSpan object based on a milliseconds
**/
TimeSpan.fromMilliseconds = function timeSpan_proto_fromMilliseconds(milliseconds) {
    var ms = milliseconds % 1000,
        s = Math.floor(milliseconds / 1000) % 60,
        m = Math.floor(milliseconds / 60000) % 60,
        h = Math.floor(milliseconds / 3600000) % 24,
        d = Math.floor(milliseconds / (3600000 * 24));
    return new TimeSpan(d, h, m, s, ms);
};
/** It creates a timeSpan object based on a decimal seconds
**/
TimeSpan.fromSeconds = function timeSpan_proto_fromSeconds(seconds) {
    return this.fromMilliseconds(seconds * 1000);
};
/** It creates a timeSpan object based on a decimal minutes
**/
TimeSpan.fromMinutes = function timeSpan_proto_fromMinutes(minutes) {
    return this.fromSeconds(minutes * 60);
};
/** It creates a timeSpan object based on a decimal hours
**/
TimeSpan.fromHours = function timeSpan_proto_fromHours(hours) {
    return this.fromMinutes(hours * 60);
};
/** It creates a timeSpan object based on a decimal days
**/
TimeSpan.fromDays = function timeSpan_proto_fromDays(days) {
    return this.fromHours(days * 24);
};

// For spanish and english works good ':' as unitsDelimiter and '.' as decimalDelimiter
// TODO: this must be set from a global LC.i18n var localized for current user
TimeSpan.unitsDelimiter = ':';
TimeSpan.decimalsDelimiter = '.';
TimeSpan.parse = function (strtime) {
    strtime = (strtime || '').split(this.unitsDelimiter);
    // Bad string, returns null
    if (strtime.length < 2)
        return null;

    // Decoupled units:
    var d, h, m, s, ms;
    h = strtime[0];
    m = strtime[1];
    s = strtime.length > 2 ? strtime[2] : 0;
    // Substracting days from the hours part (format: 'days.hours' where '.' is decimalsDelimiter)
    if (h.contains(this.decimalsDelimiter)) {
        var dhsplit = h.split(this.decimalsDelimiter);
        d = dhsplit[0];
        h = dhsplit[1];
    }
    // Milliseconds are extracted from the seconds (are represented as decimal numbers on the seconds part: 'seconds.milliseconds' where '.' is decimalsDelimiter)
    ms = Math.round(parseFloat(s.replace(this.decimalsDelimiter, '.')) * 1000 % 1000);
    // Return the new time instance
    return new TimeSpan(d, h, m, s, ms);
};
TimeSpan.zero = new TimeSpan(0, 0, 0, 0, 0);
TimeSpan.prototype.isZero = function timeSpan_proto_isZero() {
    return (
        this.days === 0 &&
        this.hours === 0 &&
        this.minutes === 0 &&
        this.seconds === 0 &&
        this.milliseconds === 0
    );
};
TimeSpan.prototype.totalMilliseconds = function timeSpan_proto_totalMilliseconds() {
    return this.valueOf();
};
TimeSpan.prototype.totalSeconds = function timeSpan_proto_totalSeconds() {
    return (this.totalMilliseconds() / 1000);
};
TimeSpan.prototype.totalMinutes = function timeSpan_proto_totalMinutes() {
    return (this.totalSeconds() / 60);
};
TimeSpan.prototype.totalHours = function timeSpan_proto_totalHours() {
    return (this.totalMinutes() / 60);
};
TimeSpan.prototype.totalDays = function timeSpan_proto_totalDays() {
    return (this.totalHours() / 24);
};

if (typeof module !== 'undefined' && module.exports)
    module.exports = TimeSpan;
},{}],"LC/TimeSpanExtra":[function(require,module,exports){
module.exports=require('5OLBBz');
},{}],"5OLBBz":[function(require,module,exports){
/* Extra utilities and methods 
 */
var TimeSpan = require('./TimeSpan');
var mu = require('./mathUtils');

/** Shows time as a large string with units names for values different than zero.
 **/
function smartTime(time) {
    var r = [];
    if (time.days > 1)
        r.push(time.days + ' days');
    else if (time.days == 1)
        r.push('1 day');
    if (time.hours > 1)
        r.push(time.hours + ' hours');
    else if (time.hours == 1)
        r.push('1 hour');
    if (time.minutes > 1)
        r.push(time.minutes + ' minutes');
    else if (time.minutes == 1)
        r.push('1 minute');
    if (time.seconds > 1)
        r.push(time.seconds + ' seconds');
    else if (time.seconds == 1)
        r.push('1 second');
    if (time.milliseconds > 1)
        r.push(time.milliseconds + ' milliseconds');
    else if (time.milliseconds == 1)
        r.push('1 millisecond');
    return r.join(', ');
}

/** Rounds a time to the nearest 15 minutes fragment.
@roundTo specify the LC.roundingTypeEnum about how to round the time (down, nearest or up)
**/
function roundTimeToQuarterHour(/* TimeSpan */time, /* mathUtils.roundingTypeEnum */roundTo) {
    var restFromQuarter = time.totalHours() % 0.25;
    var hours = time.totalHours();
    if (restFromQuarter > 0.0) {
        switch (roundTo) {
            case mu.roundingTypeEnum.Down:
                hours -= restFromQuarter;
                break;
            default:
            case mu.roundingTypeEnum.Nearest:
                var limit = 0.25 / 2;
                if (restFromQuarter >= limit) {
                    hours += (0.25 - restFromQuarter);
                } else {
                    hours -= restFromQuarter;
                }
                break;
            case mu.roundingTypeEnum.Up:
                hours += (0.25 - restFromQuarter);
                break;
        }
    }
    return TimeSpan.fromHours(hours);
}

// Extend a given TimeSpan object with the Extra methods
function plugIn(TimeSpan) {
    TimeSpan.prototype.toSmartString = function timeSpan_proto_toSmartString() { return smartTime(this); };
    TimeSpan.prototype.roundToQuarterHour = function timeSpan_proto_roundToQuarterHour() { return roundTimeToQuarterHour.call(this, parameters); };
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        smartTime: smartTime,
        roundToQuarterHour: roundTimeToQuarterHour,
        plugIn: plugIn
    };

},{"./TimeSpan":"rqZkA9","./mathUtils":71}],27:[function(require,module,exports){
/**
   API for automatic creation of labels for UI Sliders (jquery-ui)
**/
var $ = require('jquery'),
    tooltips = require('./tooltips'),
    mu = require('./mathUtils'),
    TimeSpan = require('./TimeSpan');
require('jquery-ui');

/** Create labels for a jquery-ui-slider.
**/
function create(slider) {
    // remove old ones:
    var old = slider.siblings('.ui-slider-labels').filter(function () {
        return ($(this).data('ui-slider').get(0) == slider.get(0));
    }).remove();
    // Create labels container
    var labels = $('<div class="ui-slider-labels"/>');
    labels.data('ui-slider', slider);

    // Setup of useful vars for label creation
    var max = slider.slider('option', 'max'),
        min = slider.slider('option', 'min'),
        step = slider.slider('option', 'step'),
        steps = Math.floor((max - min) / step);

    // Creating and positioning labels
    for (var i = 0; i <= steps; i++) {
        // Create label
        var lbl = $('<div class="ui-slider-label"><span class="ui-slider-label-text"/></div>');
        // Setup label with its value
        var labelValue = min + i * step;
        lbl.children('.ui-slider-label-text').text(labelValue);
        lbl.data('ui-slider-value', labelValue);
        // Positionate
        positionate(lbl, i, steps);
        // Add to container
        labels.append(lbl);
    }

    // Handler for labels click to select its position value
    labels.on('click', '.ui-slider-label', function () {
        var val = $(this).data('ui-slider-value'),
            slider = $(this).parent().data('ui-slider');
        slider.slider('value', val);
    });

    // Insert labels as a sibling of the slider (cannot be inserted inside)
    slider.after(labels);
}

/** Positionate to the correct position and width an UI label at @lbl
for the required percentage-width @sw
**/
function positionate(lbl, i, steps) {
    var sw = 100 / steps;
    var left = i * sw - sw * 0.5,
        right = 100 - left - sw,
        align = 'center';
    if (i === 0) {
        align = 'left';
        left = 0;
    } else if (i == steps) {
        align = 'right';
        right = 0;
    }
    lbl.css({
        'text-align': align,
        left: left + '%',
        right: right + '%'
    });
}

/** Update the visibility of labels of a jquery-ui-slider depending if they fit in the available space.
Slider needs to be visible.
**/
function update(slider) {
    // Get labels for slider
    var labels_c = slider.siblings('.ui-slider-labels').filter(function () {
        return ($(this).data('ui-slider').get(0) == slider.get(0));
    });
    var labels = labels_c.find('.ui-slider-label-text');

    // Apply autosize
    if ((slider.data('slider-autosize') || false).toString() == 'true')
        autosize(slider, labels);

    // Get and apply layout
    var layout_name = slider.data('slider-labels-layout') || 'standard',
        layout = layout_name in layouts ? layouts[layout_name] : layouts.standard;
    labels_c.addClass('layout-' + layout_name);
    layout(slider, labels_c, labels);

    // Update tooltips
    tooltips.createTooltip(labels_c.children(), {
        title: function () { return $(this).text(); }
        , persistent: true
    });
}

function autosize(slider, labels) {
    var total_width = 0;
    labels.each(function () {
        total_width += $(this).outerWidth(true);
    });
    var c = slider.closest('.ui-slider-container'),
        max = parseFloat(c.css('max-width')),
        min = parseFloat(c.css('min-width'));
    if (max != Number.NaN && total_width > max)
        total_width = max;
    if (min != Number.NaN && total_width < min)
        total_width = min;
    c.width(total_width);
}

/** Set of different layouts for labels, allowing different kinds of 
placement and visualization using the slider data option 'labels-layout'.
Used by 'update', almost the 'standard' must exist and can be increased
externally
**/
var layouts = {};
/** Show the maximum number of labels in equally sized gaps but
the last label that is ensured to be showed even if it creates
a higher gap with the previous one.
**/
layouts.standard = function standard_layout(slider, labels_c, labels) {
    // Check if there are more labels than available space
    // Get maximum label width
    var item_width = 0;
    labels.each(function () {
        var tw = $(this).outerWidth(true);
        if (tw >= item_width)
            item_width = tw;
    });
    // If there is width, if not, element is not visible cannot be computed
    if (item_width > 0) {
        // Get the required stepping of labels
        var labels_step = Math.ceil(item_width / (slider.width() / labels.length)),
        labels_steps = labels.length / labels_step;
        if (labels_step > 1) {
            // Hide the labels on positions out of the step
            var newi = 0,
                limit = labels.length - 1 - labels_step;
            for (var i = 0; i < labels.length; i++) {
                var lbl = $(labels[i]);
                if ((i + 1) < labels.length && (
                    i % labels_step ||
                    i > limit))
                    lbl.hide().parent().removeClass('visible');
                else {
                    // Show
                    var parent = lbl.show().parent().addClass('visible');
                    // repositionate parent
                    // positionate(parent, newi, labels_steps);
                    newi++;
                }
            }
        }
    }
};
/** Show labels number values formatted as hours, with only
integer hours being showed, the maximum number of it.
**/
layouts.hours = function hours_layout(slider, labels_c, labels, show_all) {
    var intLabels = slider.find('.integer-hour');
    if (!intLabels.length) {
        labels.each(function () {
            var $t = $(this);
            if (!$t.data('hour-processed')) {
                var v = parseFloat($t.text());
                if (v != Number.NaN) {
                    v = mu.roundTo(v, 2);
                    if (v % 1 > 0) {
                        $t.addClass('decimal-hour').hide().parent().removeClass('visible');
                        if (v % 0.5 === 0)
                            $t.parent().addClass('strong');
                        $t.text(TimeSpan.fromHours(v).toShortString());
                    } else {
                        $t.addClass('integer-hour').show().parent().addClass('visible');
                        intLabels = intLabels.add($t);
                    }
                }
                $t.data('hour-processed', true);
            }
        });
    }
    if (show_all !== true)
        layouts.standard(slider, intLabels.parent(), intLabels);
};
layouts['all-values'] = function all_layout(slider, labels_c, labels) {
    // Showing all labels
    labels_c.show().addClass('visible').children().show();
};
layouts['all-hours'] = function all_hours_layout() {
    // Just use hours layout but showing all integer hours
    Array.prototype.push.call(arguments, true);
    layouts.hours.apply(this, arguments);
};

module.exports = {
    create: create,
    update: update,
    layouts: layouts
};

},{"./TimeSpan":"rqZkA9","./mathUtils":71,"./tooltips":"UTsC2v"}],28:[function(require,module,exports){
/* Set of common LC callbacks for most Ajax operations
 */
var $ = require('jquery');
require('jquery.blockUI');
var popup = require('./popup'),
    validation = require('./validationHelper'),
    changesNotification = require('./changesNotification'),
    createIframe = require('./createIframe'),
    redirectTo = require('./redirectTo'),
    moveFocusTo = require('./moveFocusTo'),
    smoothBoxBlock = require('./smoothBoxBlock');

// AKA: ajaxErrorPopupHandler
function lcOnError(jx, message, ex) {
    // If is a connection aborted, no show message.
    // readyState different to 'done:4' means aborted too, 
    // because window being closed/location changed
    if (message == 'abort' || jx.readyState != 4)
        return;

    var m = message;
    var iframe = null;
    size = popup.size('large');
    size.height -= 34;
    if (m == 'error') {
        iframe = createIframe(jx.responseText, size);
        iframe.attr('id', 'blockUIIframe');
        m = null;
    }  else
        m = m + "; " + ex;

    // Block all window, not only current element
    $.blockUI(errorBlock(m, null, popup.style(size)));
    if (iframe)
        $('.blockMsg').append(iframe);
    $('.blockUI .close-popup').click(function () { $.unblockUI(); return false; });
}

// AKA: ajaxFormsCompleteHandler
function lcOnComplete() {
    // Disable loading
    clearTimeout(this.loadingtimer || this.loadingTimer);
    // Unblock
    if (this.autoUnblockLoading) {
        // Double un-lock, because any of the two systems can being used:
        smoothBoxBlock.close(this.box);
        this.box.unblock();
    }
}

// AKA: ajaxFormsSuccessHandler
function lcOnSuccess(data, text, jx) {
    var ctx = this;
    // Supported the generic ctx.element from jquery.reload
    if (ctx.element) ctx.form = ctx.element;
    // Specific stuff of ajaxForms
    if (!ctx.form) ctx.form = $(this);
    if (!ctx.box) ctx.box = ctx.form;
    ctx.autoUnblockLoading = true;

    // Do JSON action but if is not JSON or valid, manage as HTML:
    if (!doJSONAction(data, text, jx, ctx)) {
        // Post 'maybe' was wrong, html was returned to replace current 
        // form container: the ajax-box.

        // create jQuery object with the HTML
        var newhtml = new jQuery();
        // Avoid empty documents being parsed (raise error)
        if ($.trim(data)) {
            // Try-catch to avoid errors when a malformed document is returned:
            try {
                // parseHTML since jquery-1.8 is more secure:
                if (typeof ($.parseHTML) === 'function')
                    newhtml = $($.parseHTML(data));
                else
                    newhtml = $(data);
            } catch (ex) {
                if (console && console.error)
                    console.error(ex);
                return;
            }
        }

        // For 'reload' support, check too the context.mode, and both reload or ajaxForms check data attribute too
        ctx.boxIsContainer = ctx.boxIsContainer;
        var replaceBoxContent =
          (ctx.options && ctx.options.mode === 'replace-content') ||
          ctx.box.data('reload-mode') === 'replace-content';

        // Support for reload, avoiding important bugs with reloading boxes that contains forms:
        // If operation is a reload, don't check the ajax-box
        var jb = newhtml;
        if (!ctx.isReload) {
          // Check if the returned element is the ajax-box, if not, find
          // the element in the newhtml:
          jb = newhtml.filter('.ajax-box');
          if (jb.length === 0)
            jb = newhtml;
          if (!ctx.boxIsContainer && !jb.is('.ajax-box'))
            jb = newhtml.find('.ajax-box:eq(0)');
          if (!jb || jb.length === 0) {
            // There is no ajax-box, use all element returned:
            jb = newhtml;
          }

          if (replaceBoxContent)
            // Replace the box content with the content of the returned box
            // or all if there is no ajax-box in the result.
            jb = jb.is('.ajax-box') ? jb.contents() : jb;
        }

        if (replaceBoxContent) {
          ctx.box.empty().append(jb);
        } else if (ctx.boxIsContainer) {
            // jb is content of the box container:
            ctx.box.html(jb);
        } else {
            // box is content that must be replaced by the new content:
            ctx.box.replaceWith(jb);
            // and refresh the reference to box with the new element
            ctx.box = jb;
        }

        // It supports normal ajax forms and subforms through fieldset.ajax
        if (ctx.box.is('form.ajax') || ctx.box.is('fieldset.ajax'))
          ctx.form = ctx.box;
        else {
          ctx.form = ctx.box.find('form.ajax:eq(0)');
          if (ctx.form.length === 0)
            ctx.form = ctx.box.find('fieldset.ajax:eq(0)');
        }

        // Changesnotification after append element to document, if not will not work:
        // Data not saved (if was saved but server decide returns html instead a JSON code, page script must do 'registerSave' to avoid false positive):
        if (ctx.changedElements)
            changesNotification.registerChange(
                ctx.form.get(0),
                ctx.changedElements
            );

        // Move focus to the errors appeared on the page (if there are):
        var validationSummary = jb.find('.validation-summary-errors');
        if (validationSummary.length)
          moveFocusTo(validationSummary);
        // TODO: It seems that it returns a document-fragment instead of a element already in document
        // for ctx.form (maybe jb too?) when using * ctx.box.data('reload-mode') === 'replace-content' * 
        // (maybe on other cases too?).
        ctx.form.trigger('ajaxFormReturnedHtml', [jb, ctx.form, jx]);
    }
}

/* Utility for JSON actions
 */
function showSuccessMessage(ctx, message, data) {
    // Unblock loading:
    ctx.box.unblock();
    // Block with message:
    message = message || ctx.form.data('success-post-message') || 'Done!';
    ctx.box.block(infoBlock(message, {
        css: popup.style(popup.size('small'))
    }))
    .on('click', '.close-popup', function () {
        ctx.box.unblock();
        ctx.box.trigger('ajaxSuccessPostMessageClosed', [data]);
        return false; 
    });
    // Do not unblock in complete function!
    ctx.autoUnblockLoading = false;
}

/* Utility for JSON actions
*/
function showOkGoPopup(ctx, data) {
    // Unblock loading:
    ctx.box.unblock();

    var content = $('<div class="ok-go-box"/>');
    content.append($('<span class="success-message"/>').append(data.SuccessMessage));
    if (data.AdditionalMessage)
        content.append($('<div class="additional-message"/>').append(data.AdditionalMessage));

    var okBtn = $('<a class="action ok-action close-action" href="#ok"/>').append(data.OkLabel);
    var goBtn = '';
    if (data.GoURL && data.GoLabel) {
        goBtn = $('<a class="action go-action"/>').attr('href', data.GoURL).append(data.GoLabel);
        // Forcing the 'close-action' in such a way that for internal links the popup gets closed in a safe way:
        goBtn.click(function () { okBtn.click(); ctx.box.trigger('ajaxSuccessPostMessageClosed', [data]); });
    }

    content.append($('<div class="actions clearfix"/>').append(okBtn).append(goBtn));

    smoothBoxBlock.open(content, ctx.box, null, {
        closeOptions: {
            complete: function () {
                ctx.box.trigger('ajaxSuccessPostMessageClosed', [data]);
            }
        }
    });

    // Do not unblock in complete function!
    ctx.autoUnblockLoading = false;
}

function doJSONAction(data, text, jx, ctx) {
    // If is a JSON result:
    if (typeof (data) === 'object') {
        if (ctx.box)
            // Clean previous validation errors
            validation.setValidationSummaryAsValid(ctx.box);

        if (data.Code === 0) {
            // Special Code 0: general success code, show message saying that 'all was fine'
            showSuccessMessage(ctx, data.Result, data);
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
            // Special Code 1: do a redirect
        } else if (data.Code == 1) {
            redirectTo(data.Result);
        } else if (data.Code == 2) {
            // Special Code 2: show login popup (with the given url at data.Result)
            ctx.box.unblock();
            popup(data.Result, { width: 410, height: 320 });
        } else if (data.Code == 3) {
            // Special Code 3: reload current page content to the given url at data.Result)
            // Note: to reload same url page content, is better return the html directly from
            // this ajax server request.
            //container.unblock(); is blocked and unblocked again by the reload method:
            ctx.autoUnblockLoading = false;
            ctx.box.reload(data.Result);
        } else if (data.Code == 4) {
            // Show SuccessMessage, attaching and event handler to go to RedirectURL
            ctx.box.on('ajaxSuccessPostMessageClosed', function () {
                redirectTo(data.Result.RedirectURL);
            });
            showSuccessMessage(ctx, data.Result.SuccessMessage, data);
        } else if (data.Code == 5) {
            // Change main-action button message:
            var btn = ctx.form.find('.main-action');
            var dmsg = btn.data('default-text');
            if (!dmsg)
                btn.data('default-text', btn.text());
            var msg = data.Result || btn.data('success-post-text') || 'Done!';
            btn.text(msg);
            // Adding support to reset button text to default one
            // when the First next changes happens on the form:
            $(ctx.form).one('lcChangesNotificationChangeRegistered', function () {
                btn.text(btn.data('default-text'));
            });
            // Trigger event for custom handlers
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
        } else if (data.Code == 6) {
            // Ok-Go actions popup with 'success' and 'additional' messages.
            showOkGoPopup(ctx, data.Result);
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
        } else if (data.Code == 7) {
            // Special Code 7: show message saying contained at data.Result.Message.
            // This code allow attach additional information in data.Result to distinguish
            // different results all showing a message but maybe not being a success at all
            // and maybe doing something more in the triggered event with the data object.
            showSuccessMessage(ctx, data.Result.Message, data);
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
        } else if (data.Code > 100) {
            // User Code: trigger custom event to manage results:
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx, ctx]);
        } else { // data.Code < 0
            // There is an error code.

            // Data not saved:
            if (ctx.changedElements)
                changesNotification.registerChange(ctx.form.get(0), ctx.changedElements);

            // Unblock loading:
            ctx.box.unblock();
            // Block with message:
            var message = "Error: " + data.Code + ": " + JSON.stringify(data.Result ? (data.Result.ErrorMessage ? data.Result.ErrorMessage : data.Result) : '');
            smoothBoxBlock.open($('<div/>').append(message), ctx.box, null, { closable: true });

            // Do not unblock in complete function!
            ctx.autoUnblockLoading = false;
        }
        return true;
    } else {
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        error: lcOnError,
        success: lcOnSuccess,
        complete: lcOnComplete,
        doJSONAction: doJSONAction
    };
}
},{"./changesNotification":"f5kckb","./createIframe":46,"./moveFocusTo":"9RKOGW","./popup":76,"./redirectTo":78,"./smoothBoxBlock":"KQGzNM","./validationHelper":"kqf9lt"}],29:[function(require,module,exports){
/* Forms submitted via AJAX */
var $ = jQuery || require('jquery'),
    callbacks = require('./ajaxCallbacks'),
    changesNotification = require('./changesNotification'),
    blockPresets = require('./blockPresets'),
    validationHelper = require('./validationHelper');

// Global settings, will be updated on init but is accessed
// through closure from all functions.
// NOTE: is static, doesn't allows multiple configuration, one init call replace previous
// Defaults:
var settings = {
    loadingDelay: 0,
    element: document
};

// Adapted callbacks
function ajaxFormsCompleteHandler() {
    callbacks.complete.apply(this, arguments);
}

function ajaxErrorPopupHandler(jx, message, ex) {
    var ctx = this;
    if (!ctx.form) ctx.form = $(this);
    if (!ctx.box) ctx.box = ctx.form;
    // Data not saved:
    if (ctx.changedElements)
        changesNotification.registerChange(ctx.form, ctx.changedElements);

    ctx.autoUnblockLoading = true;

    // Common logic
    callbacks.error.apply(ctx, arguments);
}

function ajaxFormsSuccessHandler() {
  callbacks.success.apply(this, arguments);
}

/**
  Performs the validation on the form or subform as determine
  the values in the context (@ctx), returning true for success
  and false for some error (elements get marked with the error,
  just the caller must stop any task on false).
**/
function validateForm(ctx) {
  // Validations
  var validationPassed = true;
  // To support sub-forms throuh fieldset.ajax, we must execute validations and verification
  // in two steps and using the real form to let validation mechanism work
  var isSubform = ctx.form.is('fieldset.ajax');
  var actualForm = isSubform ? ctx.form.closest('form') : ctx.form,
      disabledSummaries = new jQuery(),
      disabledFields = new jQuery();

  // On subform validation, we don't want the outside subform elements and validation-summary controls to be affected
  // by this validation (to avoid to show errors there that doesn't interest to the rest of the form)
  // To fullfill this requisit, we need to hide it for the validator for a while and let only affect
  // any local summary (inside the subform).
  // The same for form elements outside the subform, we don't want its errors for now.
  if (isSubform) {
    var outsideElements = (function(f) {
      return function () {
        // Only those that are outside the subform
        return !$.contains(f, this);
      };
    })(ctx.form.get(0));

    disabledSummaries = actualForm
    .find('[data-valmsg-summary=true]')
    .filter(outsideElements)
    // We must use 'attr' instead of 'data' because is what we and unobtrusiveValidation checks
    // (in other words, using 'data' will not work)
    .attr('data-valmsg-summary', 'false');

    disabledFields = actualForm
    .find('[data-val=true]')
    .filter(outsideElements)
    .attr('data-val', 'false');
  }

  // First at all, if unobtrusive validation is enabled, validate
  var valobject = actualForm.data('unobtrusiveValidation');
  if (valobject && valobject.validate() === false) {
    validationHelper.goToSummaryErrors(ctx.form);
    validationPassed = false;
  }

  // If custom validation is enabled, validate.
  // Custom validation can be attached to forms or fieldset, but
  // to support subforms, only execute in the ctx.form element (can be 
  // a fielset subform) and any children fieldset.
  ctx.form.add(ctx.form.find('fieldset')).each(function () {
    var cusval = $(this).data('customValidation');
    if (cusval && cusval.validate && cusval.validate() === false) {
      validationHelper.goToSummaryErrors(ctx.form);
      validationPassed = false;
    }
  });

  // To support sub-forms, we must check that validations errors happened inside the
  // subform and not in other elements, to don't stop submit on not related errors.
  // (we avoid execute validation on that elements but could happen a previous validation)
  // Just look for marked elements:
  if (isSubform && ctx.form.find('.input-validation-error').length)
    validationPassed = false;

  // Re-enable again that summaries previously disabled
  if (isSubform) {
    // We must use 'attr' instead of 'data' because is what we and unobtrusiveValidation checks
    // (in other words, using 'data' will not work)
    disabledSummaries.attr('data-valmsg-summary', 'true');
    disabledFields.attr('data-val', 'true');
  }

  return validationPassed;
}

/*******************************
* Ajax Forms generic function.
* Result expected is:
* - html, for validation errors from server, replacing current .ajax-box content
* - json, with structure: { Code: integer-number, Result: string-or-object }
*   Code numbers:
*    - Negative: errors, with a Result object { ErrorMessage: string }
*    - Zero: success result, it shows a message with content: Result string, else form data attribute 'success-post-message', else a generic message
*    - 1: success result, Result contains a URL, the page will be redirected to that.
*    - Major 1: success result, with custom handler throught the form event 'success-post-message'.
*/
function ajaxFormsSubmitHandler(event) {
    // Context var, used as ajax context:
    var ctx = {};
    // Default data for required params:
    ctx.form = (event.data ? event.data.form : null) || $(this);
    ctx.box = (event.data ? event.data.box : null) || ctx.form.closest(".ajax-box");
    var action = (event.data ? event.data.action : null) || ctx.form.attr('action') || '';

    // Check validation
    if (validateForm(ctx) === false) {
      // Validation failed, submit cannot continue, out!
      return false;
    }

    // Data saved:
    ctx.changedElements = (event.data ? event.data.changedElements : null) || changesNotification.registerSave(ctx.form.get(0));

    // Notification event to allow scripts to hook additional tasks before send data
    ctx.form.trigger('presubmit', [ctx]);

    // Loading, with retard
    ctx.loadingtimer = setTimeout(function () {
        ctx.box.block(blockPresets.loading);
    }, settings.loadingDelay);
    ctx.autoUnblockLoading = true;

    var data = ctx.form.find(':input').serialize();

    // Do the Ajax post
    $.ajax({
        url: (action),
        type: 'POST',
        data: data,
        context: ctx,
        success: ajaxFormsSuccessHandler,
        error: ajaxErrorPopupHandler,
        complete: ajaxFormsCompleteHandler
    });

    // Stop normal POST:
    return false;
}

// Public initialization
function initAjaxForms(options) {
    $.extend(true, settings, options);

    /* Attach a delegated handler to manage ajax forms */
    $(settings.element).on('submit', 'form.ajax', ajaxFormsSubmitHandler);
    /* Attach a delegated handler for a special ajax form case: subforms, using fieldsets. */
    $(settings.element).on('click', 'fieldset.ajax .ajax-fieldset-submit',
        function (event) {
          var form = $(this).closest('fieldset.ajax');

          event.data = {
            form: form,
            box: form.closest('.ajax-box'),
            action: form.data('ajax-fieldset-action'),
            // Data saved:
            changedElements: changesNotification.registerSave(form.get(0), form.find(':input[name]'))
          };
          return ajaxFormsSubmitHandler(event);
        }
    );
}
/* UNUSED?
function ajaxFormMessageOnHtmlReturnedWithoutValidationErrors(form, message) {
    var $t = $(form);
    // If there is no form errors, show a successful message
    if ($t.find('.validation-summary-errors').length == 0) {
        $t.block(infoBlock(message, {
            css: popupStyle(popupSize('small'))
        }))
        .on('click', '.close-popup', function () { $t.unblock(); return false; });
    }
}
*/

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        init: initAjaxForms,
        onSuccess: ajaxFormsSuccessHandler,
        onError: ajaxErrorPopupHandler,
        onComplete: ajaxFormsCompleteHandler
    };
},{"./ajaxCallbacks":28,"./blockPresets":43,"./changesNotification":"f5kckb","./validationHelper":"kqf9lt"}],30:[function(require,module,exports){
/* Auto calculate summary on DOM tagging with classes the elements involved.
 */
var nu = require('./numberUtils');

function setupCalculateTableItemsTotals() {
    $('table.calculate-items-totals').each(function () {
        if ($(this).data('calculate-items-totals-initializated'))
            return;
        function calculateRow() {
            var $t = $(this);
            var tr = $t.closest('tr');
            var ip = tr.find('.calculate-item-price');
            var iq = tr.find('.calculate-item-quantity');
            var it = tr.find('.calculate-item-total');
            nu.setMoneyNumber(nu.getMoneyNumber(ip) * nu.getMoneyNumber(iq, 1), it);
            tr.trigger('lcCalculatedItemTotal', tr);
        }
        $(this).find('.calculate-item-price, .calculate-item-quantity').on('change', calculateRow);
        $(this).find('tr').each(calculateRow);
        $(this).data('calculate-items-totals-initializated', true);
    });
}

function setupCalculateSummary(force) {
    $('.calculate-summary').each(function () {
        var c = $(this);
        if (!force && c.data('calculate-summary-initializated'))
            return;
        var s = c.find('.calculation-summary');
        var d = c.find('table.calculate-summary-group');
        function calc() {
            var total = 0, fee = 0, duration = 0;
            var groups = {};
            d.each(function () {
                var groupTotal = 0;
                var allChecked = $(this).is('.calculate-all-items');
                $(this).find('tr').each(function () {
                    var item = $(this);
                    if (allChecked || item.find('.calculate-item-checked').is(':checked')) {
                        groupTotal += nu.getMoneyNumber(item.find('.calculate-item-total:eq(0)'));
                        var q = nu.getMoneyNumber(item.find('.calculate-item-quantity:eq(0)'), 1);
                        fee += nu.getMoneyNumber(item.find('.calculate-item-fee:eq(0)')) * q;
                        duration += nu.getMoneyNumber(item.find('.calculate-item-duration:eq(0)')) * q;
                    }
                });
                total += groupTotal;
                groups[$(this).data('calculation-summary-group')] = groupTotal;
                nu.setMoneyNumber(groupTotal, $(this).closest('fieldset').find('.group-total-price'));
                nu.setMoneyNumber(duration, $(this).closest('fieldset').find('.group-total-duration'));
            });

            // Set summary total value
            nu.setMoneyNumber(total, s.find('.calculation-summary-total'));
            nu.setMoneyNumber(fee, s.find('.calculation-summary-fee'));
            // And every group total value
            for (var g in groups) {
                nu.setMoneyNumber(groups[g], s.find('.calculation-summary-group-' + g));
            }
        }
        d.find('.calculate-item-checked').change(calc);
        d.on('lcCalculatedItemTotal', calc);
        calc();
        c.data('calculate-summary-initializated', true);
    });
}

/** Update the detail of a pricing summary, one detail line per selected item
**/
function updateDetailedPricingSummary() {
    $('.pricing-summary.detailed').each(function () {
        var $s = $(this),
            $d = $s.find('tbody.detail'),
            $t = $s.find('tbody.detail-tpl').children('tr:eq(0)'),
            $c = $s.closest('form'),
            $items = $c.find('.pricing-summary-item');

        // Do it!
        // Remove old lines
        $d.children().remove();
        // Create new ones
        $items.each(function () {
            // Get values
            var $i = $(this),
                checked = $i.find('.pricing-summary-item-checked').prop('checked');
            if (checked) {
                var concept = $i.find('.pricing-summary-item-concept').text(),
                    price = nu.getMoneyNumber($i.find('.pricing-summary-item-price:eq(0)'));
                // Create row and set values
                var $row = $t.clone()
                .removeClass('detail-tpl')
                .addClass('detail');
                $row.find('.pricing-summary-item-concept').text(concept);
                nu.setMoneyNumber(price, $row.find('.pricing-summary-item-price'));
                // Add to the table
                $d.append($row);
            }
        });
    });
}
function setupUpdateDetailedPricingSummary() {
    var $c = $('.pricing-summary.detailed').closest('form');
    // Initial calculation
    updateDetailedPricingSummary();
    // Calculate on relevant form changes
    $c.find('.pricing-summary-item-checked').change(updateDetailedPricingSummary);
    // Support for lcSetupCalculateTableItemsTotals event
    $c.on('lcCalculatedItemTotal', updateDetailedPricingSummary);
}


if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        onTableItems: setupCalculateTableItemsTotals,
        onSummary: setupCalculateSummary,
        updateDetailedPricingSummary: updateDetailedPricingSummary,
        onDetailedPricingSummary: setupUpdateDetailedPricingSummary
    };
},{"./numberUtils":74}],31:[function(require,module,exports){
/* Focus the first element in the document (or in @container)
with the html5 attribute 'autofocus' (or alternative @cssSelector).
It's fine as a polyfill and for ajax loaded content that will not
get the browser support of the attribute.
*/
var $ = require('jquery');

function autoFocus(container, cssSelector) {
    container = $(container || document);
    container.find(cssSelector || '[autofocus]').focus();
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = autoFocus;
},{}],32:[function(require,module,exports){
/** Auto-fill menu sub-items using tabbed pages -only works for current page items- **/
var $ = require('jquery');

module.exports = function autofillSubmenu() {
    $('.autofill-submenu .current').each(function () {
        var parentmenu = $(this);
        // getting the submenu elements from tabs marked with class 'autofill-submenu-items'
        var items = $('.autofill-submenu-items li:not(.removable)');
        // if there is items, create the submenu cloning it!
        if (items.length > 0) {
            var submenu = document.createElement("ul");
            parentmenu.append(submenu);
            // Cloning without events:
            var newitems = items.clone(false, false);
            $(submenu).append(newitems);

            // We need attach events to maintain the tabbed interface working
            // New Items (cloned) must change tabs:
            newitems.find("a").click(function () {
                // Trigger event in the original item
                $("a[href='" + this.getAttribute("href") + "']", items).click();
                // Change menu:
                $(this).parent().parent().find("a").removeClass('current');
                $(this).addClass('current');
                // Stop event:
                return false;
            });
            // Original items must change menu:
            items.find("a").click(function () {
                newitems.parent().find("a").removeClass('current').
                filter("*[href='" + this.getAttribute("href") + "']").addClass('current');
            });
        }
    });
};
},{}],33:[function(require,module,exports){
/**
  Monthly calendar class
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  LcWidget = require('../CX/LcWidget'),
  extend = require('../CX/extend');
var utils = require('./utils');

/**
  Private utils
**/

/**
  Prefetch next month (based on the given dates)
  Note: this code is very similar to utils.weeklyCheckAndPrefetch
**/
function monthlyCheckAndPrefetch(monthly, currentDatesRange) {
  // We get the next month dates-range, but
  // using as base-date a date inside current displayed month, that most times is
  // not the month of the start date in current date, then just forward 7 days that
  // to ensure we pick the correct month:
  var nextDatesRange = utils.date.nextMonthWeeks(utils.date.addDays(currentDatesRange.start, 7), 1, monthly.showSixWeeks);

  if (!utils.monthlyIsDataInCache(monthly, nextDatesRange)) {
    // Prefetching next week in advance
    var prefetchQuery = utils.datesToQuery(nextDatesRange);
    monthly.fetchData(prefetchQuery, null, true);
  }
}

/**
Move the binded dates the amount of @months specified.
Note: most of this code is adapted from utils.moveBindRangeInDays,
the complexity comes from the prefetch feature, maybe can be that logic
isolated and shared?
**/
function moveBindMonth(monthly, months) {
  // We get the next 'months' (negative for previous) dates-range, but
  // using as base-date a date inside current displayed month, that most times is
  // not the month of the start date in current date, then just forward 7 days that
  // to ensure we pick the correct month:
  var datesRange = utils.date.nextMonthWeeks(utils.date.addDays(monthly.datesRange.start, 7), months, monthly.showSixWeeks);

  // Check cache before try to fetch
  var inCache = utils.monthlyIsDataInCache(monthly, datesRange);

  if (inCache) {
    // Just show the data
    monthly.bindData(datesRange);
    // Prefetch except if there is other request in course (can be the same prefetch,
    // but still don't overload the server)
    if (monthly.fetchData.requests.length === 0)
      monthlyCheckAndPrefetch(monthly, datesRange);
  } else {

    // Support for prefetching:
    // Its avoided if there are requests in course, since
    // that will be a prefetch for the same data.
    if (monthly.fetchData.requests.length) {
      // The last request in the pool *must* be the last in finish
      // (must be only one if all goes fine):
      var request = monthly.fetchData.requests[monthly.fetchData.requests.length - 1];

      // Wait for the fetch to perform and sets loading to notify user
      monthly.$el.addClass(monthly.classes.fetching);
      request.done(function () {
        moveBindMonth(monthly, months);
        monthly.$el.removeClass(monthly.classes.fetching || '_');
      });
      return;
    }

    // Fetch (download) the data and show on ready:
    monthly
    .fetchData(utils.datesToQuery(datesRange))
    .done(function () {
      monthly.bindData(datesRange);
      // Prefetch
      monthlyCheckAndPrefetch(monthly, datesRange);
    });
  }
}

/**
Mark calendar as current-month and disable prev button,
or remove the mark and enable it if is not.

Updates the month label too and today button
**/
function checkCurrentMonth($el, startDate, monthly) {
  // Ensure the date to be from current month and not one of the latest dates
  // of the previous one (where the range start) adding 7 days for the check:
  var monthDate = utils.date.addDays(startDate, 7);
  var yep = utils.date.isInCurrentMonth(monthDate);
  $el.toggleClass(monthly.classes.currentWeek, yep);
  $el.find('.' + monthly.classes.prevAction).prop('disabled', yep);

  // Month - Year
  var mlbl = monthly.texts.months[monthDate.getMonth()] + ' ' + monthDate.getFullYear();
  $el.find('.' + monthly.classes.monthLabel).text(mlbl);
  $el.find('.' + monthly.classes.todayAction).prop('disabled', yep);
}

/**
  Update the calendar dates cells for 'day of the month' values
  and number of weeks/rows.
  @datesRange { start, end }
  @slotsContainer jQuery-DOM for dates-cells tbody
**/
function updateDatesCells(datesRange, slotsContainer, offMonthDateClass, currentDateClass, slotDateLabel) {
  var lastY,
    currentMonth = utils.date.addDays(datesRange.start, 7).getMonth(),
    today = dateISO.dateLocal(new Date());

  iterateDatesCells(datesRange, slotsContainer, function (date, x, y) {
    lastY = y;
    this.find('.' + slotDateLabel).text(date.getDate());

    // Mark days not in this month
    this.toggleClass(offMonthDateClass, date.getMonth() != currentMonth);

    // Mark today
    this.toggleClass(currentDateClass, dateISO.dateLocal(date) == today);
  });

  // Some months are 5 weeks wide and others 6; our layout has permanent 6 rows/weeks
  // and we don't look up the 6th week if is not part of the month then that 6th row
  // must be hidden if there are only 5.
  // If the last row was the 5 (index 4, zero-based), the 6th is hidden:
  slotsContainer.children('tr:eq(5)').xtoggle(lastY != 4, { effect: 'height', duration: 0 });
}

/**
  It executes the given callback (@eachCellCallback) for 
  each cell (this inside the callback) iterated between the @datesRange
  inside the @slotsContainer (a tbody or table with tr-td date cells)
**/
function iterateDatesCells(datesRange, slotsContainer, eachCellCallback) {
  var x, y, dateCell;
  // Iterate dates
  utils.date.eachDateInRange(datesRange.start, datesRange.end, function (date, i) {
    // dates are sorted as 7 per row (each week-day),
    // but remember that day-cell position is offset 1 because
    // each row is 8 cells (first is header and rest 7 are the data-cells for dates)
    // just looking only 'td's we can use the position without offset
    x = (i % 7);
    y = Math.floor(i / 7);
    dateCell = slotsContainer.children('tr:eq(' + y + ')').children('td:eq(' + x + ')');

    eachCellCallback.apply(dateCell, [date, x, y, i]);
  });
}

/**
  Toggle a selected date-cell availability,
  for the 'editable' mode
**/
function toggleDateAvailability(monthly, cell) {
  // If there is no data, just return (data not loaded)
  if (!monthly.data || !monthly.data.slots) return;
  
  // Getting the position of the cell in the matrix for date-slots:
  var tr = cell.closest('tr'),
    x = tr.find('td').index(cell),
    y = tr.closest('tbody').find('tr').index(tr),
    daysOffset = y * 7 + x;

  // Getting the date for the cell based on the showed first date
  var date = monthly.datesRange.start;
  date = utils.date.addDays(date, daysOffset);
  var strDate = dateISO.dateLocal(date, true);

  // Get and update from the underlaying data, 
  // the status for the date, toggling it:
  var status = monthly.data.slots[strDate];
  // If there is no status, just return (data not loaded)
  if (!status) return;
  status = status == 'unavailable' ? 'available' : 'unavailable';
  monthly.data.slots[strDate] = status;

  // Update visualization:
  monthly.bindData();
}

/**
Montly calendar, inherits from LcWidget
**/
var Monthly = LcWidget.extend(
// Prototype
{
classes: extend({}, utils.weeklyClasses, {
  weeklyCalendar: undefined,
  currentWeek: undefined,
  currentMonth: 'is-currentMonth',
  monthlyCalendar: 'AvailabilityCalendar--monthly',
  todayAction: 'Actions-today',
  monthLabel: 'AvailabilityCalendar-monthLabel',
  slotDateLabel: 'AvailabilityCalendar-slotDateLabel',
  offMonthDate: 'AvailabilityCalendar-offMonthDate',
  currentDate: 'AvailabilityCalendar-currentDate',
  editable: 'is-editable'
}),
texts: extend({}, utils.weeklyTexts, {
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
}),
url: '/calendar/get-availability/',
showSixWeeks: true,
editable: false,

// Our 'view' will be a subset of the data,
// delimited by the next property, a dates range:
datesRange: { start: null, end: null },
bindData: function bindDataMonthly(datesRange) {
  if (!this.data || !this.data.slots) return;

  this.datesRange = datesRange = datesRange || this.datesRange;
  var 
      slotsContainer = this.$el.find('.' + this.classes.slots),
      slots = slotsContainer.find('td');

  checkCurrentMonth(this.$el, datesRange.start, this);

  updateDatesCells(this.datesRange, slotsContainer, this.classes.offMonthDate, this.classes.currentDate, this.classes.slotDateLabel);

  // Remove any previous status class from all slots
  for (var s = 0; s < utils.statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + utils.statusTypes[s] || '_');
  }

  var that = this;

  // Set availability of each date slot/cell:
  iterateDatesCells(datesRange, slotsContainer, function (date, x, y, i) {
    var datekey = dateISO.dateLocal(date, true);
    var dateStatus = that.data.slots[datekey];

    if (dateStatus)
      this.addClass(that.classes.slotStatusPrefix + dateStatus);
  });
}
},
// Constructor:
function Monthly(element, options) {
  // Reusing base constructor too for initializing:
  LcWidget.call(this, element, options);
  // To use this in closures:
  var that = this;

  this.user = this.$el.data('calendar-user');
  this.query = {
    user: this.user,
    type: 'monthly'
  };

  // Start fetching current month
  var firstDates = utils.date.currentMonthWeeks(null, this.showSixWeeks);
  this.fetchData(utils.datesToQuery(firstDates)).done(function () {
    that.bindData(firstDates);
    // Prefetching next month in advance
    monthlyCheckAndPrefetch(that, firstDates);
  });

  checkCurrentMonth(this.$el, firstDates.start, this);

  // Set handlers for prev-next actions:
  this.$el.on('click', '.' + this.classes.prevAction, function prev() {
    moveBindMonth(that, -1);
  });
  this.$el.on('click', '.' + this.classes.nextAction, function next() {
    moveBindMonth(that, 1);
  });
  // Handler for today action
  this.$el.on('click', '.' + this.classes.todayAction, function today() {
    that.bindData(utils.date.currentMonthWeeks(null, this.showSixWeeks));
  });

  // Editable mode
  if (this.editable) {
    this.$el.on('click', '.' + this.classes.slots + ' td', function clickToggleAvailability() {
      toggleDateAvailability(that, $(this));
    });
    this.$el.addClass(this.classes.editable);
  }

});

/** Static utility: found all components with the Weekly calendar class
and enable it
**/
Monthly.enableAll = function on(options) {
  var list = [];
  $('.' + Monthly.prototype.classes.monthlyCalendar).each(function () {
    list.push(new Monthly(this, options));
  });
  return list;
};

module.exports = Monthly;

},{"../CX/LcWidget":5,"../CX/extend":6,"./utils":42,"LC/dateISO8601":"0dIKTs"}],34:[function(require,module,exports){
/**
  Weekly calendar class
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  LcWidget = require('../CX/LcWidget'),
  extend = require('../CX/extend');
var utils = require('./utils');

/**
Weekly calendar, inherits from LcWidget
**/
var Weekly = LcWidget.extend(
// Prototype
{
classes: utils.weeklyClasses,
texts: utils.weeklyTexts,
url: '/calendar/get-availability/',

// Our 'view' will be a subset of the data,
// delimited by the next property, a dates range:
datesRange: { start: null, end: null },
bindData: function bindDataWeekly(datesRange) {
  this.datesRange = datesRange = datesRange || this.datesRange;
  var 
      slotsContainer = this.$el.find('.' + this.classes.slots),
      slots = slotsContainer.find('td');

  utils.checkCurrentWeek(this.$el, datesRange.start, this);

  utils.updateLabels(datesRange, this.$el, this);

  // Remove any previous status class from all slots
  for (var s = 0; s < utils.statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + utils.statusTypes[s] || '_');
  }

  if (!this.data || !this.data.defaultStatus)
    return;

  // Set all slots with default status
  slots.addClass(this.classes.slotStatusPrefix + this.data.defaultStatus);

  if (!this.data.slots || !this.data.status)
    return;

  var that = this;

  utils.date.eachDateInRange(datesRange.start, datesRange.end, function (date, i) {
    var datekey = dateISO.dateLocal(date, true);
    var dateSlots = that.data.slots[datekey];
    if (dateSlots) {
      for (s = 0; s < dateSlots.length; s++) {
        var slot = dateSlots[s];
        var slotCell = utils.findCellBySlot(slotsContainer, i, slot);
        // Remove default status
        slotCell.removeClass(that.classes.slotStatusPrefix + that.data.defaultStatus || '_');
        // Adding status class
        slotCell.addClass(that.classes.slotStatusPrefix + that.data.status);
      }
    }
  });
}
},
// Constructor:
function Weekly(element, options) {
  // Reusing base constructor too for initializing:
  LcWidget.call(this, element, options);
  // To use this in closures:
  var that = this;

  this.user = this.$el.data('calendar-user');
  this.query = {
    user: this.user,
    type: 'weekly'
  };

  // Start fetching current week
  var firstDates = utils.date.currentWeek();
  this.fetchData(utils.datesToQuery(firstDates)).done(function () {
    that.bindData(firstDates);
    // Prefetching next week in advance
    utils.weeklyCheckAndPrefetch(that, firstDates);
  });
  utils.checkCurrentWeek(this.$el, firstDates.start, this);

  // Set handlers for prev-next actions:
  this.$el.on('click', '.' + this.classes.prevAction, function prev() {
    utils.moveBindRangeInDays(that, -7);
  });
  this.$el.on('click', '.' + this.classes.nextAction, function next() {
    utils.moveBindRangeInDays(that, 7);
  });

});

/** Static utility: found all components with the Weekly calendar class
and enable it
**/
Weekly.enableAll = function on(options) {
  var list = [];
  $('.' + Weekly.prototype.classes.weeklyCalendar).each(function () {
    list.push(new Weekly(this, options));
  });
  return list;
};

module.exports = Weekly;

},{"../CX/LcWidget":5,"../CX/extend":6,"./utils":42,"LC/dateISO8601":"0dIKTs"}],35:[function(require,module,exports){
/**
  Work Hours calendar class
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  LcWidget = require('../CX/LcWidget'),
  extend = require('../CX/extend'),
  utils = require('./utils'),
  clearCurrentSelection = require('./clearCurrentSelection'),
  makeUnselectable = require('./makeUnselectable');
require('../jquery.bounds');

/**
Work hours private utils
**/
function setupEditWorkHours() {
  var that = this;
  // Set handlers to switch status and update backend data
  // when the user select cells
  var slotsContainer = this.$el.find('.' + this.classes.slots);

  function toggleCell(cell) {
    // Find day and time of the cell:
    var slot = utils.findSlotByCell(slotsContainer, cell);
    // Get week-day slots array:
    var wkslots = that.data.slots[utils.systemWeekDays[slot.day]] = that.data.slots[utils.systemWeekDays[slot.day]] || [];
    // If it has already the data.status, toggle to the defaultStatus
    //  var statusClass = that.classes.slotStatusPrefix + that.data.status,
    //      defaultStatusClass = that.classes.slotStatusPrefix + that.data.defaultStatus;
    //if (cell.hasClass(statusClass
    // Toggle from the array
    var strslot = dateISO.timeLocal(slot.slot, true),
      islot = wkslots.indexOf(strslot);
    if (islot == -1)
      wkslots.push(strslot);
    else
    //delete wkslots[islot];
      wkslots.splice(islot, 1);
  }

  function toggleCellRange(firstCell, lastCell) {
    var 
      x = firstCell.siblings('td').andSelf().index(firstCell),
      y1 = firstCell.closest('tr').index(),
    //x2 = lastCell.siblings('td').andSelf().index(lastCell),
      y2 = lastCell.closest('tr').index();

    if (y1 > y2) {
      var y0 = y1;
      y1 = y2;
      y2 = y0;
    }

    for (var y = y1; y <= y2; y++) {
      var cell = firstCell.closest('tbody').children('tr:eq(' + y + ')').children('td:eq(' + x + ')');
      toggleCell(cell);
    }
  }

  var dragging = {
    first: null,
    last: null,
    selectionLayer: $('<div class="SelectionLayer" />').appendTo(this.$el),
    done: false
  };
  
  function offsetToPosition(el, offset) {
    var pb = $(el.offsetParent).bounds(),
      s = {};

    s.top = offset.top - pb.top;
    s.left = offset.left - pb.left;

    //s.bottom = pb.top - offset.bottom;
    //s.right = offset.left - offset.right;
    s.height = offset.bottom - offset.top;
    s.width = offset.right - offset.left;

    $(el).css(s);
    return s;
  }

  function updateSelection(el) {
    var a = dragging.first.bounds({ includeBorder: true });
    var b = el.bounds({ includeBorder: true });
    var s = dragging.selectionLayer.bounds({ includeBorder: true });

    s.top = a.top < b.top ? a.top : b.top;
    s.bottom = a.bottom > b.bottom ? a.bottom : b.bottom;

    offsetToPosition(dragging.selectionLayer[0], s);
  }

  function finishDrag() {
    if (dragging.first && dragging.last) {
      toggleCellRange(dragging.first, dragging.last);
      that.bindData();

      dragging.done = true;
    }
    dragging.first = dragging.last = null;
    dragging.selectionLayer.hide();
    makeUnselectable.off(that.$el);
    return true;
  }

  this.$el.find(slotsContainer).on('click', 'td', function () {
    // Do except after a dragging done complete
    if (dragging.done) return false;
    toggleCell($(this));
    that.bindData();
    return false;
  });

  this.$el.find(slotsContainer)
  .on('mousedown', 'td', function () {
    dragging.done = false;
    dragging.first = $(this);
    dragging.last = null;
    dragging.selectionLayer.show();

    makeUnselectable(that.$el);
    clearCurrentSelection();

    var s = dragging.first.bounds({ includeBorder: true });
    offsetToPosition(dragging.selectionLayer[0], s);

  })
  .on('mouseenter', 'td', function () {
    if (dragging.first) {
      dragging.last = $(this);

      updateSelection(dragging.last);
    }
  })
  .on('mouseup', finishDrag)
  .find('td')
  .attr('draggable', false);

  // This will not work with pointer-events:none, but on other
  // cases (recentIE)
  dragging.selectionLayer.on('mouseup', finishDrag)
  .attr('draggable', false);

}

/**
Work hours calendar, inherits from LcWidget
**/
var WorkHours = LcWidget.extend(
// Prototype
{
classes: extend({}, utils.weeklyClasses, {
  weeklyCalendar: undefined,
  workHoursCalendar: 'AvailabilityCalendar--workHours'
}),
texts: utils.weeklyTexts,
url: '/calendar/get-availability/',
bindData: function bindDataWorkHours() {
  var 
    slotsContainer = this.$el.find('.' + this.classes.slots),
    slots = slotsContainer.find('td');

  // Remove any previous status class from all slots
  for (var s = 0; s < utils.statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + utils.statusTypes[s] || '_');
  }

  if (!this.data || !this.data.defaultStatus)
    return;

  // Set all slots with default status
  slots.addClass(this.classes.slotStatusPrefix + this.data.defaultStatus);

  if (!this.data.slots || !this.data.status)
    return;

  var that = this;
  for (var wk = 0; wk < utils.systemWeekDays.length; wk++) {
    var dateSlots = that.data.slots[utils.systemWeekDays[wk]];
    if (dateSlots && dateSlots.length) {
      for (s = 0; s < dateSlots.length; s++) {
        var slot = dateSlots[s];
        var slotCell = utils.findCellBySlot(slotsContainer, wk, slot);
        // Remove default status
        slotCell.removeClass(that.classes.slotStatusPrefix + that.data.defaultStatus || '_');
        // Adding status class
        slotCell.addClass(that.classes.slotStatusPrefix + that.data.status);
      }
    }
  }
}
},
// Constructor:
function WorkHours(element, options) {
  LcWidget.call(this, element, options);
  var that = this;

  this.user = this.$el.data('calendar-user');

  this.query = {
    user: this.user,
    type: 'workHours'
  };

  // Fetch the data: there is not a more specific query,
  // it just get the hours for each week-day (data
  // slots are per week-day instead of per date compared
  // to *weekly*)
  this.fetchData().done(function () {
    that.bindData();
  });

  setupEditWorkHours.call(this);

});

/** Static utility: found all components with the Workhours calendar class
and enable it
**/
WorkHours.enableAll = function on(options) {
  var list = [];
  $('.' + WorkHours.prototype.classes.workHoursCalendar).each(function () {
    list.push(new WorkHours(this, options));
  });
  return list;
};

module.exports = WorkHours;
},{"../CX/LcWidget":5,"../CX/extend":6,"../jquery.bounds":62,"./clearCurrentSelection":36,"./makeUnselectable":41,"./utils":42,"LC/dateISO8601":"0dIKTs"}],36:[function(require,module,exports){
/**
Cross browser way to unselect current selection
**/
module.exports = function clearCurrentSelection() {
  if (typeof (window.getSelection) === 'function')
  // Standard
    window.getSelection().removeAllRanges();
  else if (document.selection && typeof (document.selection.empty) === 'function')
  // IE
    document.selection.empty();
};
},{}],37:[function(require,module,exports){
/**
  A collection of useful generic utils managing Dates
**/
var dateISO = require('LC/dateISO8601');

function currentWeek() {
  return {
    start: getFirstWeekDate(new Date()),
    end: getLastWeekDate(new Date())
  };
}
exports.currentWeek = currentWeek;

function nextWeek(start, end) {
  // Unique param with both propierties:
  if (start.end) {
    end = start.end;
    start = start.start;
  }
  // Optional end:
  end = end || addDays(start, 7);
  return {
    start: addDays(start, 7),
    end: addDays(end, 7)
  };
}
exports.nextWeek = nextWeek;

function getFirstWeekDate(date) {
  var d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}
exports.getFirstWeekDate = getFirstWeekDate;

function getLastWeekDate(date) {
  var d = new Date(date);
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d;
}
exports.getLastWeekDate = getLastWeekDate;

function isInCurrentWeek(date) {
  return dateISO.dateLocal(getFirstWeekDate(date)) == dateISO.dateLocal(getFirstWeekDate(new Date()));
}
exports.isInCurrentWeek = isInCurrentWeek;

function addDays(date, days) {
  var d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
exports.addDays = addDays;

function eachDateInRange(start, end, fn) {
  if (!fn.call) throw new Error('fn must be a function or "call"able object');
  var date = new Date(start);
  var i = 0, ret;
  while (date <= end) {
    ret = fn.call(fn, date, i);
    // Allow fn to cancel the loop with strict 'false'
    if (ret === false)
      break;
    date.setDate(date.getDate() + 1);
    i++;
  }
}
exports.eachDateInRange = eachDateInRange;

/** Months **/

function getFirstMonthDate(date) {
  var d = new Date(date);
  d.setDate(1);
  return d;
}
exports.getFirstMonthDate = getFirstMonthDate;

function getLastMonthDate(date) {
  var d = new Date(date);
  d.setMonth(d.getMonth() + 1, 1);
  d = addDays(d, -1);
  return d;
}
exports.getLastMonthDate = getLastMonthDate;

function isInCurrentMonth(date) {
  return dateISO.dateLocal(getFirstMonthDate(date)) == dateISO.dateLocal(getFirstMonthDate(new Date()));
}
exports.isInCurrentMonth = isInCurrentMonth;

/**
  Get a dates range for the current month
  (or the given date as base)
**/
function currentMonth(baseDate) {
  baseDate = baseDate || new Date();
  return {
    start: getFirstMonthDate(baseDate),
    end: getLastMonthDate(baseDate)
  };
}
exports.currentMonth = currentMonth;

function nextMonth(fromDate, amountMonths) {
  amountMonths = amountMonths || 1;
  var d = new Date(fromDate);
  return {
    start: d.setMonth(d.getMonth() + amountMonths, 1),
    end: getLastMonthDate(d)
  };
}
exports.nextMonth = nextMonth;

function previousMonth(fromDate, amountMonths) {
  return nextMonth(fromDate, 0 - amountMonths);
}
exports.previousMonth = previousMonth;

/**
  Get a dates range for the complete weeks
  that are part of the current month
  (or the given date as base).
  That means, that start date will be the first
  week date of the first month week (that can
  be the day 1 of the month or one of the last
  dates from the previous months),
  and similar for the end date being the 
  last week date of the last month week.

  @includeSixWeeks: sometimes is useful get ever a
  six weeks dates range staring by the first week of
  the baseDate month. By default is false.
**/
function currentMonthWeeks(baseDate, includeSixWeeks) {
  var r = currentMonth(baseDate),
    s = getFirstWeekDate(r.start),
    e = includeSixWeeks ? addDays(s, 6*7 - 1) : getLastWeekDate(r.end);
  return {
    start: s,
    end: e
  };
}
exports.currentMonthWeeks = currentMonthWeeks;

function nextMonthWeeks(fromDate, amountMonths, includeSixWeeks) {
  return currentMonthWeeks(nextMonth(fromDate, amountMonths).start, includeSixWeeks);
}
exports.nextMonthWeeks = nextMonthWeeks;

function previousMonthWeeks(fromDate, amountMonths, includeSixWeeks) {
  return currentMonthWeeks(previousMonth(fromDate, amountMonths).start, includeSixWeeks);
}
exports.previousMonthWeeks = previousMonthWeeks;

},{"LC/dateISO8601":"0dIKTs"}],38:[function(require,module,exports){
/** Very simple custom-format function to allow 
l10n of texts.
Cover cases:
- M for month
- D for day
**/
module.exports = function formatDate(date, format) {
  var s = format,
      M = date.getMonth() + 1,
      D = date.getDate();
  s = s.replace(/M/g, M);
  s = s.replace(/D/g, D);
  return s;
};
},{}],"LC/availabilityCalendar":[function(require,module,exports){
module.exports=require('xu1BAO');
},{}],"xu1BAO":[function(require,module,exports){
/**
  Exposing all the public features and components of availabilityCalendar
**/
exports.Weekly = require('./Weekly');
exports.WorkHours = require('./WorkHours');
exports.Monthly = require('./Monthly');
},{"./Monthly":33,"./Weekly":34,"./WorkHours":35}],41:[function(require,module,exports){
/**
  Make an element unselectable, useful to implement some custom
  selection behavior or drag&drop.
  If offers an 'off' method to restore back the element behavior.
**/
var $ = require('jquery');

module.exports = (function () {

  var falsyfn = function () { return false; };
  var nodragStyle = {
    '-webkit-touch-callout': 'none',
    '-khtml-user-drag': 'none',
    '-webkit-user-drag': 'none',
    '-khtml-user-select': 'none',
    '-webkit-user-select': 'none',
    '-moz-user-select': 'none',
    '-ms-user-select': 'none',
    'user-select': 'none'
  };
  var dragdefaultStyle = {
    '-webkit-touch-callout': 'inherit',
    '-khtml-user-drag': 'inherit',
    '-webkit-user-drag': 'inherit',
    '-khtml-user-select': 'inherit',
    '-webkit-user-select': 'inherit',
    '-moz-user-select': 'inherit',
    '-ms-user-select': 'inherit',
    'user-select': 'inherit'
  };

  var on = function makeUnselectable(el) {
    el = $(el);
    el.on('selectstart', falsyfn);
    //$(document).on('selectstart', falsyfn);
    el.css(nodragStyle);
  };

  var off = function offMakeUnselectable(el) {
    el = $(el);
    el.off('selectstart', falsyfn);
    //$(document).off('selectstart', falsyfn);
    el.css(dragdefaultStyle);
  };

  on.off = off;
  return on;

} ());
},{}],42:[function(require,module,exports){
/**
  AvailabilityCalendar shared utils
**/
var 
  $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  dateUtils = require('./dateUtils'),
  formatDate = require('./formatDate');

// Re-exporting:
exports.formatDate = formatDate;
exports.date = dateUtils;

/*------ CONSTANTS ---------*/
var statusTypes = exports.statusTypes = ['unavailable', 'available'];
// Week days names in english for internal system
// use; NOT for localization/translation.
var systemWeekDays = exports.systemWeekDays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

/*--------- CONFIG - INSTANCE ----------*/
var weeklyClasses = exports.weeklyClasses = {
  calendar: 'AvailabilityCalendar',
  weeklyCalendar: 'AvailabilityCalendar--weekly',
  currentWeek: 'is-currentWeek',
  actions: 'AvailabilityCalendar-actions',
  prevAction: 'Actions-prev',
  nextAction: 'Actions-next',
  days: 'AvailabilityCalendar-days',
  slots: 'AvailabilityCalendar-slots',
  slotHour: 'AvailabilityCalendar-hour',
  slotStatusPrefix: 'is-',
  legend: 'AvailabilityCalendar-legend',
  legendAvailable: 'AvailabilityCalendar-legend-available',
  legendUnavailable: 'AvailabilityCalendar-legend-unavailable',
  status: 'AvailabilityCalendar-status'
};

var weeklyTexts = exports.weeklyTexts = {
  abbrWeekDays: [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ],
  today: 'Today',
  // Allowed special values: M:month, D:day
  abbrDateFormat: 'M/D'
};

/*----------- VIEW UTILS ----------------*/

function moveBindRangeInDays(weekly, days) {
  var 
    start = dateUtils.addDays(weekly.datesRange.start, days),
    end = dateUtils.addDays(weekly.datesRange.end, days),
    datesRange = datesToRange(start, end);

  // Check cache before try to fetch
  var inCache = weeklyIsDataInCache(weekly, datesRange);

  if (inCache) {
    // Just show the data
    weekly.bindData(datesRange);
    // Prefetch except if there is other request in course (can be the same prefetch,
    // but still don't overload the server)
    if (weekly.fetchData.requests.length === 0)
      weeklyCheckAndPrefetch(weekly, datesRange);
  } else {

    // Support for prefetching:
    // Its avoided if there are requests in course, since
    // that will be a prefetch for the same data.
    if (weekly.fetchData.requests.length) {
      // The last request in the pool *must* be the last in finish
      // (must be only one if all goes fine):
      var request = weekly.fetchData.requests[weekly.fetchData.requests.length - 1];

      // Wait for the fetch to perform and sets loading to notify user
      weekly.$el.addClass(weekly.classes.fetching);
      request.done(function () {
        moveBindRangeInDays(weekly, days);
        weekly.$el.removeClass(weekly.classes.fetching || '_');
      });
      return;
    }

    // Fetch (download) the data and show on ready:
    weekly
    .fetchData(datesToQuery(datesRange))
    .done(function () {
      weekly.bindData(datesRange);
      // Prefetch
      weeklyCheckAndPrefetch(weekly, datesRange);
    });
  }
}
exports.moveBindRangeInDays = moveBindRangeInDays;

function weeklyIsDataInCache(weekly, datesRange) {
  // Check cache: if there is almost one date in the range
  // without data, we set inCache as false and fetch the data:
  var inCache = true;
  dateUtils.eachDateInRange(datesRange.start, datesRange.end, function (date) {
    var datekey = dateISO.dateLocal(date, true);
    if (!weekly.data.slots[datekey]) {
      inCache = false;
      return false;
    }
  });
  return inCache;
}
exports.weeklyIsDataInCache = weeklyIsDataInCache;

/**
  For now, given the JSON structure used, the logic
  of monthlyIsDataInCache is the same as weeklyIsDataInCache:
**/
var monthlyIsDataInCache = weeklyIsDataInCache;
exports.monthlyIsDataInCache = monthlyIsDataInCache;


function weeklyCheckAndPrefetch(weekly, currentDatesRange) {
  var nextDatesRange = datesToRange(
    dateUtils.addDays(currentDatesRange.start, 7),
    dateUtils.addDays(currentDatesRange.end, 7)
  );

  if (!weeklyIsDataInCache(weekly, nextDatesRange)) {
    // Prefetching next week in advance
    var prefetchQuery = datesToQuery(nextDatesRange);
    weekly.fetchData(prefetchQuery, null, true);
  }
}
exports.weeklyCheckAndPrefetch = weeklyCheckAndPrefetch;

/** Update the view labels for the week-days (table headers)
**/
function updateLabels(datesRange, calendar, options) {
  var start = datesRange.start,
      end = datesRange.end;

  var days = calendar.find('.' + options.classes.days + ' th');
  var today = dateISO.dateLocal(new Date());
  // First cell is empty ('the cross headers cell'), then offset is 1
  var offset = 1;
  dateUtils.eachDateInRange(start, end, function (date, i) {
    var cell = $(days.get(offset + i)),
        sdate = dateISO.dateLocal(date),
        label = sdate;

    if (today == sdate)
      label = options.texts.today;
    else
      label = options.texts.abbrWeekDays[date.getDay()] + ' ' + formatDate(date, options.texts.abbrDateFormat);

    cell.text(label);
  });
}
exports.updateLabels = updateLabels;

function findCellBySlot(slotsContainer, day, slot) {
  slot = dateISO.parse(slot);
  var 
    x = Math.round(slot.getHours()),
  // Time frames (slots) are 15 minutes divisions
    y = Math.round(slot.getMinutes() / 15),
    tr = slotsContainer.children(':eq(' + Math.round(x * 4 + y) + ')');

  // Slot cell for o'clock hours is at 1 position offset
  // because of the row-head cell
  var dayOffset = (y === 0 ? day + 1 : day);
  return tr.children(':eq(' + dayOffset + ')');
}
exports.findCellBySlot = findCellBySlot;

function findSlotByCell(slotsContainer, cell) {
  var 
    x = cell.siblings('td').andSelf().index(cell),
    y = cell.closest('tr').index(),
    fullMinutes = y * 15,
    hours = Math.floor(fullMinutes / 60),
    minutes = fullMinutes - (hours * 60),
    slot = new Date();
  slot.setHours(hours, minutes, 0, 0);

  return {
    day: x,
    slot: slot
  };
}
exports.findSlotByCell = findSlotByCell;

/**
Mark calendar as current-week and disable prev button,
or remove the mark and enable it if is not.
**/
function checkCurrentWeek(calendar, date, options) {
  var yep = dateUtils.isInCurrentWeek(date);
  calendar.toggleClass(options.classes.currentWeek, yep);
  calendar.find('.' + options.classes.prevAction).prop('disabled', yep);
}
exports.checkCurrentWeek = checkCurrentWeek;

/** Get query object with the date range specified:
**/
function datesToQuery(start, end) {
  // Unique param with both propierties:
  if (start.end) {
    end = start.end;
    start = start.start;
  }
  return {
    start: dateISO.dateLocal(start, true),
    end: dateISO.dateLocal(end, true)
  };
}
exports.datesToQuery = datesToQuery;

/** Pack two dates in a simple but useful
structure { start, end }
**/
function datesToRange(start, end) {
  return {
    start: start,
    end: end
  };
}
exports.datesToRange = datesToRange;

},{"./dateUtils":37,"./formatDate":38,"LC/dateISO8601":"0dIKTs"}],43:[function(require,module,exports){
/* Generic blockUI options sets */
var loadingBlock = { message: '<img width="48px" height="48px" class="loading-indicator" src="' + LcUrl.AppPath + 'img/theme/loading.gif"/>' };
var errorBlock = function (error, reload, style) {
    return {
        css: $.extend({ cursor: 'default' }, style || {}),
        message: '<a class="close-popup" href="#close-popup">X</a><div class="info">There was an error' +
            (error ? ': ' + error : '') +
            (reload ? ' <a href="javascript: ' + reload + ';">Click to reload</a>' : '') +
            '</div>'
    };
};
var infoBlock = function (message, options) {
    return $.extend({
        message: '<a class="close-popup" href="#close-popup">X</a><div class="info">' + message + '</div>'
        /*,css: { cursor: 'default' }*/
        , overlayCSS: { cursor: 'default' }
    }, options);
};

// Module:
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loading: loadingBlock,
        error: errorBlock,
        info: infoBlock
    };
}
},{}],"f5kckb":[function(require,module,exports){
/*= ChangesNotification class
* to notify user about changes in forms,
* tabs, that will be lost if go away from
* the page. It knows when a form is submitted
* and saved to disable notification, and gives
* methods for other scripts to notify changes
* or saving.
*/
var $ = require('jquery'),
    getXPath = require('./getXPath'),
    escapeJQuerySelectorValue = require('./jqueryUtils').escapeJQuerySelectorValue;

var changesNotification = {
    changesList: {},
    defaults: {
        target: null,
        genericChangeSupport: true,
        genericSubmitSupport: false,
        changedFormClass: 'has-changes',
        changedElementClass: 'changed',
        notifyClass: 'notify-changes'
    },
    init: function (options) {
        // User notification to prevent lost changes done
        $(window).on('beforeunload', function () {
            return changesNotification.notify();
        });
        options = $.extend(this.defaults, options);
        if (!options.target)
            options.target = document;
        if (options.genericChangeSupport)
            $(options.target).on('change', 'form:not(.changes-notification-disabled) :input[name]', function () {
                changesNotification.registerChange($(this).closest('form').get(0), this);
            });
        if (options.genericSubmitSupport)
            $(options.target).on('submit', 'form:not(.changes-notification-disabled)', function () {
                changesNotification.registerSave(this);
            });
    },
    notify: function () {
        // Add notification class to the document
        $('html').addClass(this.defaults.notifyClass);
        // Check if there is almost one change in the property list returning the message:
        for (var c in this.changesList)
            return this.quitMessage || (this.quitMessage = $('#lcres-quit-without-save').text()) || '';
    },
    registerChange: function (f, e) {
        if (!e) return;
        var fname = getXPath(f);
        var fl = this.changesList[fname] = this.changesList[fname] || [];
        if ($.isArray(e)) {
            for (var i = 0; i < e.length; i++)
                this.registerChange(f, e[i]);
            return;
        }
        var n = e;
        if (typeof (e) !== 'string') {
            n = e.name;
            // Check if really there was a change checking default element value
            if (typeof (e.defaultValue) != 'undefined' &&
                typeof (e.checked) == 'undefined' &&
                typeof (e.selected) == 'undefined' &&
                e.value == e.defaultValue) {
                // There was no change, no continue
                // and maybe is a regression from a change and now the original value again
                // try to remove from changes list doing registerSave
                this.registerSave(f, [n]);
                return;
            }
            $(e).addClass(this.defaults.changedElementClass);
        }
        if (!(n in fl))
            fl.push(n);
        $(f)
        .addClass(this.defaults.changedFormClass)
        // pass data: form, element name changed, form element changed (this can be null)
        .trigger('lcChangesNotificationChangeRegistered', [f, n, e]);
    },
    registerSave: function (f, els) {
        var fname = getXPath(f);
        if (!this.changesList[fname]) return;
        var prevEls = $.extend([], this.changesList[fname]);
        var r = true;
        if (els) {
            this.changesList[fname] = $.grep(this.changesList[fname], function (el) { return ($.inArray(el, els) == -1); });
            // Don't remove 'f' list if is not empty
            r = this.changesList[fname].length === 0;
        }
        if (r) {
            $(f).removeClass(this.defaults.changedFormClass);
            delete this.changesList[fname];
            // link elements from els to clean-up its classes
            els = prevEls;
        }
        // pass data: form, elements registered as save (this can be null), and 'form fully saved' as third param (bool)
        $(f).trigger('lcChangesNotificationSaveRegistered', [f, els, r]);
        var lchn = this;
        if (els) $.each(els, function () { $('[name="' + escapeJQuerySelectorValue(this) + '"]').removeClass(lchn.defaults.changedElementClass); });
        return prevEls;
    }
};

// Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = changesNotification;
}
},{"./getXPath":54,"./jqueryUtils":"7/CV3J"}],"LC/changesNotification":[function(require,module,exports){
module.exports=require('f5kckb');
},{}],46:[function(require,module,exports){
/* Utility to create iframe with injected html/content instead of URL.
*/
var $ = require('jquery');

module.exports = function createIframe(content, size) {
    var $iframe = $('<iframe width="' + size.width + '" height="' + size.height + '" style="border:none;"></iframe>');
    var iframe = $iframe.get(0);
    // When the iframe is ready
    var iframeloaded = false;
    iframe.onload = function () {
        // Using iframeloaded to avoid infinite loops
        if (!iframeloaded) {
            iframeloaded = true;
            injectIframeHtml(iframe, content);
        }
    };
    return $iframe;
};

/* Puts full html inside the iframe element passed in a secure and compliant mode */
function injectIframeHtml(iframe, html) {
    // put ajax data inside iframe replacing all their html in secure 
    // compliant mode ($.html don't works to inject <html><head> content)

    /* document API version (problems with IE, don't execute iframe-html scripts) */
    /*var iframeDoc =
    // W3C compliant: ns, firefox-gecko, chrome/safari-webkit, opera, ie9
    iframe.contentDocument ||
    // old IE (5.5+)
    (iframe.contentWindow ? iframe.contentWindow.document : null) ||
    // fallback (very old IE?)
    document.frames[iframe.id].document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();*/

    /* javascript URI version (works fine everywhere!) */
    iframe.contentWindow.contents = html;
    iframe.src = 'javascript:window["contents"]';

    // About this technique, this http://sparecycles.wordpress.com/2012/03/08/inject-content-into-a-new-iframe/
}


},{}],47:[function(require,module,exports){
/* CRUDL Helper */
var $ = require('jquery');
var smoothBoxBlock = require('./smoothBoxBlock');
var changesNotification = require('./changesNotification');
require('./jquery.xtsh').plugIn($);
var getText = require('./getText');
var moveFocusTo = require('./moveFocusTo');

exports.defaultSettings = {
  effects: {
    'show-viewer': { effect: 'height', duration: 'slow' },
    'hide-viewer': { effect: 'height', duration: 'slow' },
    'show-editor': { effect: 'height', duration: 'slow' }, // the same as jquery-ui { effect: 'slide', duration: 'slow', direction: 'down' }
    'hide-editor': { effect: 'height', duration: 'slow' }
  },
  events: {
    'edit-ends': 'crudl-edit-ends',
    'edit-starts': 'crudl-edit-starts',
    'editor-ready': 'crudl-editor-ready',
    'editor-showed': 'crudl-editor-showed',
    'create': 'crudl-create',
    'update': 'crudl-update',
    'delete': 'crudl-delete'
  },
  data: {
    'focus-closest': {
      name: 'crudl-focus-closest',
      'default': '*'
    },
    'focus-margin': {
      name: 'crudl-focus-margin',
      'default': 0
    },
    'focus-duration': {
      name: 'crudl-focus-duration',
      'default': 200
    }
  }
};

/**
  Utility to get a data value or the default based on the instance
  settings on the given element
**/
function getDataForElementSetting(instance, el, settingName) {
  var
    setting = instance.settings.data[settingName],
    val = el.data(setting.name) || setting['default'];
  return val;
}

exports.setup = function setupCrudl(onSuccess, onError, onComplete) {
  return {
    on: function on(selector, settings) {
      selector = selector || '.crudl';
      var instance = {
        selector: selector,
        elements: $(selector)
      };
      // Extending default settings with provided ones,
      // but some can be tweak outside too.
      instance.settings = $.extend(true, exports.defaultSettings, settings);
      instance.elements.each(function () {
        var crudl = $(this);
        if (crudl.data('__crudl_initialized__') === true) return;
        var dctx = crudl.data('crudl-context') || '';
        var vwr = crudl.find('.crudl-viewer');
        var dtr = crudl.find('.crudl-editor');
        var iidpar = crudl.data('crudl-item-id-parameter') || 'ItemID';
        var formpars = { action: 'create' };
        formpars[iidpar] = 0;
        var editorInitialLoad = true;

        function getExtraQuery(el) {
          // Get extra query of the element, if any:
          var xq = el.data('crudl-extra-query') || '';
          if (xq) xq = '&' + xq;
          // Iterate all parents including the 'crudl' element (parentsUntil excludes the first element given,
          // because of that we get its parent())
          // For any of them with an extra-query, append it:
          el.parentsUntil(crudl.parent(), '[data-crudl-extra-query]').each(function () {
            var x = $(this).data('crudl-extra-query');
            if (x) xq += '&' + x;
          });
          return xq;
        }

        crudl.find('.crudl-create').click(function () {
          formpars[iidpar] = 0;
          formpars.action = 'create';
          var xq = getExtraQuery($(this));
          editorInitialLoad = true;
          dtr.reload({
            url: function (url, defaultUrl) {
              return defaultUrl + '?' + $.param(formpars) + xq;
            },
            success: function () {
              dtr.xshow(instance.settings.effects['show-editor'])
              .queue(function () {
                crudl.trigger(instance.settings.events['editor-showed'], [dtr]);
                dtr.dequeue();
              });
            }
          });
          // Hide viewer when in editor:
          vwr.xhide(instance.settings.effects['hide-viewer']);
          // Custom event
          crudl.trigger(instance.settings.events['edit-starts'])
          .trigger(instance.settings.events.create);

          return false;
        });

        vwr
        .on('click', '.crudl-update', function () {
          var $t = $(this);
          var item = $t.closest('.crudl-item');
          var itemid = item.data('crudl-item-id');
          formpars[iidpar] = itemid;
          formpars.action = 'update';
          var xq = getExtraQuery($(this));
          editorInitialLoad = true;
          dtr.reload({
            url: function (url, defaultUrl) {
              return defaultUrl + '?' + $.param(formpars) + xq;
            },
            success: function () {
              dtr.xshow(instance.settings.effects['show-editor'])
              .queue(function () {
                crudl.trigger(instance.settings.events['editor-showed'], [dtr]);
                dtr.dequeue();
              });
            }
          });
          // Hide viewer when in editor:
          vwr.xhide(instance.settings.effects['hide-viewer']);
          // Custom event
          crudl.trigger(instance.settings.events['edit-starts'])
          .trigger(instance.settings.events.update);

          return false;
        })
        .on('click', '.crudl-delete', function () {
          var $t = $(this);
          var item = $t.closest('.crudl-item');
          var itemid = item.data('crudl-item-id');

          if (confirm(getText('confirm-delete-crudl-item-message:' + dctx))) {
            smoothBoxBlock.open('<div>' + getText('delete-crudl-item-loading-message:' + dctx) + '</div>', item);
            formpars[iidpar] = itemid;
            formpars.action = 'delete';
            var xq = getExtraQuery($(this));
            $.ajax({
              url: dtr.attr('data-source-url') + '?' + $.param(formpars) + xq,
              success: function (data, text, jx) {
                if (data && data.Code === 0) {
                  smoothBoxBlock.open('<div>' + data.Result + '</div>', item, null, {
                    closable: true,
                    closeOptions: {
                      complete: function () {
                        item.fadeOut('slow', function () { item.remove(); });
                      }
                    }
                  });
                } else
                  onSuccess(data, text, jx);
              },
              error: function (jx, message, ex) {
                onError(jx, message, ex);
                smoothBoxBlock.close(item);
              },
              complete: onComplete
            });
          }

          // Custom event
          crudl.trigger(instance.settings.events['delete']);

          return false;
        });

        function finishEdit() {
          function oncomplete(anotherOnComplete) {
            return function () {
              // Show again the Viewer
              //vwr.slideDown('slow');
              if (!vwr.is(':visible'))
                vwr.xshow(instance.settings.effects['show-viewer']);
              // Mark the form as unchanged to avoid persisting warnings
              changesNotification.registerSave(dtr.find('form').get(0));
              // Avoid cached content on the Editor
              dtr.children().remove();

              // Scroll to preserve correct focus (on large pages with shared content user can get
              // lost after an edition)
              // (we queue after vwr.xshow because we need to do it after the xshow finish)
              vwr.queue(function () {
                var focusClosest = getDataForElementSetting(instance, crudl, 'focus-closest');
                var focusElement = crudl.closest(focusClosest);
                // If no closest, get the crudl
                if (focusElement.length === 0)
                  focusElement = crudl;
                var focusMargin = getDataForElementSetting(instance, crudl, 'focus-margin');
                var focusDuration = getDataForElementSetting(instance, crudl, 'focus-duration');

                moveFocusTo(focusElement, { marginTop: focusMargin, duration: focusDuration });

                vwr.dequeue();
              });

              // user callback:
              if (typeof (anotherOnComplete) === 'function')
                anotherOnComplete.apply(this, Array.prototype.slice.call(arguments, 0));
            };
          }
          // We need a custom complete callback, but to not replace the user callback, we
          // clone first the settings and then apply our callback that internally will call
          // the user callback properly (if any)
          var withcallback = $.extend(true, {}, instance.settings.effects['hide-editor']);
          withcallback.complete = oncomplete(withcallback.complete);
          // Hiding editor:
          dtr.xhide(withcallback);

          // Mark form as saved to remove the 'has-changes' mark
          changesNotification.registerSave(dtr.find('form').get(0));

          // Custom event
          crudl.trigger(instance.settings.events['edit-ends']);

          return false;
        }

        dtr
        .on('click', '.crudl-cancel', finishEdit)
        .on('ajaxSuccessPostMessageClosed', '.ajax-box', finishEdit)
        .on('ajaxSuccessPost', 'form, fieldset', function (e, data) {
          if (data.Code === 0 || data.Code == 5 || data.Code == 6) {
            // Show viewer and reload list:
            vwr.find('.crudl-list').reload({ autofocus: false });
          }
          // A small delay to let user to see the new message on button before
          // hide it (because is inside the editor)
          if (data.Code == 5)
            setTimeout(finishEdit, 1000);

        })
        .on('ajaxFormReturnedHtml', 'form,fieldset', function (jb, form, jx) {
          // Emit the 'editor-ready' event on editor Html being replaced
          // (first load or next loads because of server-side validation errors)
          // to allow listeners to do any work over its (new) DOM elements.
          // The second custom parameter passed means is mean to
          // distinguish the first time content load and successive updates (due to validation errors).
          crudl.trigger(instance.settings.events['editor-ready'], [dtr, editorInitialLoad]);

          // Next times:
          editorInitialLoad = false;
        });

        crudl.data('__crudl_initialized__', true);
      });

      return instance;
    }
  };
};

},{"./changesNotification":"f5kckb","./getText":"qf5Iz3","./jquery.xtsh":67,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],"LC/dateISO8601":[function(require,module,exports){
module.exports=require('0dIKTs');
},{}],"0dIKTs":[function(require,module,exports){
/**
  This module has utilities to convert a Date object into
  a string representation following ISO-8601 specification.
  
  INCOMPLETE BUT USEFUL.
  
  Standard refers to format variations:
  - basic: minimum separators
  - extended: all separators, more readable
  By default, all methods prints the basic format,
  excepts the parameter 'extended' is set to true

  TODO:
  - TZ: allow for Time Zone suffixes (parse allow it and 
    detect UTC but do nothing with any time zone offset detected)
  - Fractions of seconds
**/
exports.dateUTC = function dateUTC(date, extended) {
  var m = (date.getUTCMonth() + 1).toString(),
      d = date.getUTCDate().toString(),
      y = date.getUTCFullYear().toString();

  if (m.length == 1)
    m = '0' + m;
  if (d.length == 1)
    d = '0' + d;

  if (extended)
    return y + '-' + m + '-' + d;
  else
    return y + m + d;
};

exports.dateLocal = function dateLocal(date, extended) {
  var m = (date.getMonth() + 1).toString(),
      d = date.getDate().toString(),
      y = date.getFullYear().toString();
  if (m.length == 1)
    m = '0' + m;
  if (d.length == 1)
    d = '0' + d;

  if (extended)
    return y + '-' + m + '-' + d;
  else
    return y + m + d;
};

/**
  Hours, minutes and seconds
**/
exports.timeLocal = function timeLocal(date, extended) {
  var s = date.getSeconds().toString(),
      hm = exports.shortTimeLocal(date, extended);

  if (s.length == 1)
    s = '0' + s;

  if (extended)
    return hm + ':' + s;
  else
    return hm + s;
};

/**
  Hours, minutes and seconds UTC
**/
exports.timeUTC = function timeUTC(date, extended) {
  var s = date.getUTCSeconds().toString(),
      hm = exports.shortTimeUTC(date, extended);

  if (s.length == 1)
    s = '0' + s;

  if (extended)
    return hm + ':' + s;
  else
    return hm + s;
};

/**
  Hours and minutes
**/
exports.shortTimeLocal = function shortTimeLocal(date, extended) {
  var h = date.getHours().toString(),
      m = date.getMinutes().toString();

  if (h.length == 1)
    h = '0' + h;
  if (m.length == 1)
    m = '0' + m;

  if (extended)
    return h + ':' + m;
  else
    return h + m;
};

/**
  Hours and minutes UTC
**/
exports.shortTimeUTC = function shortTimeUTC(date, extended) {
  var h = date.getUTCHours().toString(),
      m = date.getUTCMinutes().toString();

  if (h.length == 1)
    h = '0' + h;
  if (m.length == 1)
    m = '0' + m;

  if (extended)
    return h + ':' + m;
  else
    return h + m;
};

/**
  TODO: Hours, minutes, seconds and fractions of seconds
**/
exports.longTimeLocal = function longTimeLocal(date, extended) {
  //TODO
};

/**
  UTC Date and Time separated by T.
  Standard allows omit the separator as exceptional, both parts agreement, cases;
  can be done passing true as of omitSeparator parameter, by default false.
**/
exports.datetimeLocal = function datetimeLocal(date, extended, omitSeparator) {
  var d = exports.dateLocal(date, extended),
      t = exports.timeLocal(date, extended);

  if (omitSeparator)
    return d + t;
  else
    return d + 'T' + t;
};

/**
  Local Date and Time separated by T.
  Standard allows omit the separator as exceptional, both parts agreement, cases;
  can be done passing true as of omitSeparator parameter, by default false.
**/
exports.datetimeUTC = function datetimeUTC(date, extended, omitSeparator) {
  var d = exports.dateUTC(date, extended),
      t = exports.timeUTC(date, extended);

  if (omitSeparator)
    return d + t;
  else
    return d + 'T' + t;
};

/**
  Parse a string into a Date object if is a valid ISO-8601 format.
  Parse single date, single time or date-time formats.
  IMPORTANT: It does NOT convert between the datestr TimeZone and the
  local TimeZone (either it allows datestr to included TimeZone information)
  TODO: Optional T separator is not allowed.
  TODO: Milliseconds/fractions of seconds not supported
**/
exports.parse = function parse(datestr) {
  var dt = datestr.split('T'),
    date = dt[0],
    time = dt.length == 2 ? dt[1] : null;

  if (dt.length > 2)
    throw new Error("Bad input format");

  // Check if date contains a time;
  // because maybe datestr is only the time part
  if (/:|^\d{4,6}[^\-](\.\d*)?(?:Z|[+\-].*)?$/.test(date)) {
    time = date;
    date = null;
  }

  var y, m, d, h, mm, s, tz, utc;

  if (date) {
    var dparts = /(\d{4})\-?(\d{2})\-?(\d{2})/.exec(date);
    if (!dparts)
      throw new Error("Bad input date format");

    y = dparts[1];
    m = dparts[2];
    d = dparts[3];
  }

  if (time) {
    var tparts = /(\d{2}):?(\d{2})(?::?(\d{2}))?(Z|[+\-].*)?/.exec(time);
    if (!tparts)
      throw new Error("Bad input time format");

    h = tparts[1];
    mm = tparts[2];
    s = tparts.length > 3 ? tparts[3] : null;
    tz = tparts.length > 4 ? tparts[4] : null;
    // Detects if is a time in UTC:
    utc = /^Z$/i.test(tz);
  }

  // Var to hold the parsed value, we start with today,
  // that will fill the missing parts
  var parsedDate = new Date();

  if (date) {
    // Updating the date object with each year, month and date/day detected:
    if (utc)
      parsedDate.setUTCFullYear(y, m, d);
    else
      parsedDate.setFullYear(y, m, d);
  }

  if (time) {
    if (utc)
      parsedDate.setUTCHours(h, mm, s);
    else
      parsedDate.setHours(h, mm, s);
  }

  return parsedDate;
};
},{}],50:[function(require,module,exports){
/* Date picker initialization and use
 */
var $ = require('jquery');
require('jquery-ui');

function setupDatePicker() {
    // Date Picker
    $.datepicker.setDefaults($.datepicker.regional[$('html').attr('lang')]);
    $('.date-pick', document).datepicker({
        showAnim: 'blind'
    });
    applyDatePicker();
}
function applyDatePicker(element) {
    $(".date-pick", element || document)
    //.val(new Date().asString($.datepicker._defaults.dateFormat))
    .datepicker({
        showAnim: "blind"
    });
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        init: setupDatePicker,
        apply: applyDatePicker
    };

},{}],51:[function(require,module,exports){
/* Format a date as YYYY-MM-DD in UTC for save us
    to interchange with other modules or apps.
*/
module.exports = function dateToInterchangeableString(date) {
    var m = (date.getUTCMonth() + 1).toString(),
        d = date.getUTCDate().toString();
    if (m.length == 1)
        m = '0' + m;
    if (d.length == 1)
        d = '0' + d;
    return date.getUTCFullYear().toString() + '-' + m + '-' + d;
};
},{}],"LC/getText":[function(require,module,exports){
module.exports=require('qf5Iz3');
},{}],"qf5Iz3":[function(require,module,exports){
/** An i18n utility, get a translation text by looking for specific elements in the html
with the name given as first paramenter and applying the given values on second and 
other parameters.
    TODO: RE-IMPLEMENT not using jQuery nelse DOM elements, or almost not elements inside body
**/
var $ = require('jquery');
var escapeJQuerySelectorValue = require('./jqueryUtils').escapeJQuerySelectorValue;

function getText() {
    var args = arguments;
    // Get key and translate it
    var formatted = args[0];
    var text = $('#lcres-' + escapeJQuerySelectorValue(formatted)).text();
    if (text)
        formatted = text;
    // Apply format to the text with additional parameters
    for (var i = 0; i < args.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, args[i + 1]);
    }
    return formatted;
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = getText;
},{"./jqueryUtils":"7/CV3J"}],54:[function(require,module,exports){
/** Returns the path to the given element in XPath convention
**/
var $ = require('jquery');

function getXPath(element) {
    if (element && element.id)
        return '//*[@id="' + element.id + '"]';
    var xpath = '';
    for (; element && element.nodeType == 1; element = element.parentNode) {
        var id = $(element.parentNode).children(element.tagName).index(element) + 1;
        id = (id > 1 ? '[' + id + ']' : '');
        xpath = '/' + element.tagName.toLowerCase() + id + xpath;
    }
    return xpath;
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = getXPath;

},{}],"LC/googleMapReady":[function(require,module,exports){
module.exports=require('ygr/Yz');
},{}],"ygr/Yz":[function(require,module,exports){
// It executes the given 'ready' function as parameter when
// map environment is ready (when google maps api and script is
// loaded and ready to use, or inmediately if is already loaded).

var loader = require('./loader');

// Private static collection of callbacks registered
var stack = [];

var googleMapReady = module.exports = function googleMapReady(ready) {
  stack.push(ready);

  if (googleMapReady.isReady)
    ready();
  else if (!googleMapReady.isLoading) {
    googleMapReady.isLoading = true;
    loader.load({
      scripts: ["https://www.google.com/jsapi"],
      completeVerification: function () { return !!window.google; },
      complete: function () {
        google.load("maps", "3.10", { other_params: "sensor=false", "callback": function () {
          googleMapReady.isReady = true;
          googleMapReady.isLoading = false;

          for (var i = 0; i < stack.length; i++)
            try {
              stack[i]();
            } catch (e) { }
        }
        });
      }
    });
  }
};

// Utility to force the refresh of maps that solve the problem with bad-sized map area
googleMapReady.refreshMap = function refreshMaps(map) {
  googleMapReady(function () {
    google.maps.event.trigger(map, "resize");
  });
};

},{"./loader":70}],57:[function(require,module,exports){
/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],58:[function(require,module,exports){
/**
    Generic script for fieldsets with class .has-confirm, allowing show
    the content only if the main confirm fields have 'yes' selected.
**/
var $ = require('jquery');

var defaultSelector = 'fieldset.has-confirm > .confirm input';

function onchange() {
    var t = $(this);
    var fs = t.closest('fieldset');
    if (t.is(':checked'))
        if (t.val() == 'yes' || t.val() == 'True')
            fs.removeClass('confirmed-no').addClass('confirmed-yes');
        else
            fs.removeClass('confirmed-yes').addClass('confirmed-no');
}

exports.on = function (selector) {
    selector = selector || defaultSelector;

    $(document).on('change', selector, onchange);
    // Performs first check:
    $(selector).change();
};

exports.off = function (selector) {
    selector = selector || defaultSelector;

    $(document).off('change', selector);
};
},{}],59:[function(require,module,exports){
/* Internazionalization Utilities
 */
var i18n = {};
i18n.distanceUnits = {
    'ES': 'km',
    'US': 'miles'
};
i18n.numericMilesSeparator = {
    'es-ES': '.',
    'es-US': '.',
    'en-US': ',',
    'en-ES': ','
};
i18n.numericDecimalSeparator = {
    'es-ES': ',',
    'es-US': ',',
    'en-US': '.',
    'en-ES': '.'
};
i18n.moneySymbolPrefix = {
    'ES': '',
    'US': '$'
};
i18n.moneySymbolSufix = {
    'ES': '€',
    'US': ''
};
i18n.getCurrentCulture = function getCurrentCulture() {
    var c = document.documentElement.getAttribute('data-culture');
    var s = c.split('-');
    return {
        culture: c,
        language: s[0],
        country: s[1]
    };
};
i18n.convertMilesKm = function convertMilesKm(q, unit) {
    var MILES_TO_KM = 1.609;
    if (unit == 'miles')
        return MILES_TO_KM * q;
    else if (unit == 'km')
        return q / MILES_TO_KM;
    if (console && console.log) console.log('convertMilesKm: Unrecognized unit ' + unit);
    return 0;
};

if (typeof module !== 'undefined' && module.exports)
    module.exports = i18n;
},{}],60:[function(require,module,exports){
/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],61:[function(require,module,exports){
/** As the 'is' jQuery method, but checking @selector in all elements
* @modifier values:
* - 'all': all elements must match selector to return true
* - 'almost-one': almost one element must match
* - 'percentage': returns percentage number of elements that match selector (0-100)
* - 'summary': returns the object { yes: number, no: number, percentage: number, total: number }
* - {just: a number}: exact number of elements that must match to return true
* - {almost: a number}: minimum number of elements that must match to return true
* - {until: a number}: maximum number of elements that must match to return true
**/
var $ = jQuery || require('jquery');
$.fn.are = function (selector, modifier) {
    modifier = modifier || 'all';
    var count = 0;
    this.each(function () {
        if ($(this).is(selector))
            count++;
    });
    switch (modifier) {
        case 'all':
            return this.length == count;
        case 'almost-one':
            return count > 0;
        case 'percentage':
            return count / this.length;
        case 'summary':
            return {
                yes: count,
                no: this.length - count,
                percentage: count / this.length,
                total: this.length
            };
        default:
            {
                if ('just' in modifier &&
                modifier.just != count)
                    return false;
                if ('almost' in modifier &&
                modifier.almost > count)
                    return false;
                if ('until' in modifier &&
                modifier.until < count)
                    return false;
                return true;
            }
    }
};
},{}],62:[function(require,module,exports){
/** ===================
Extension jquery: 'bounds'
Returns an object with the combined bounds for all 
elements in the collection
*/
(function () {
  jQuery.fn.bounds = function (options) {
    options = $.extend(true, {}, {
      includeBorder: false,
      includeMargin: false
    }, options);
    var bounds = {
      left: Number.POSITIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      width: Number.NaN,
      height: Number.NaN
    };

    var fnWidth = options.includeBorder || options.includeMargin ? 
      function(el){ return $.fn.outerWidth.call(el, options.includeMargin); } :
      function(el){ return $.fn.width.call(el); };
    var fnHeight = options.includeBorder || options.includeMargin ? 
      function(el){ return $.fn.outerHeight.call(el, options.includeMargin); } :
      function(el){ return $.fn.height.call(el); };

    this.each(function (i, el) {
      var elQ = $(el);
      var off = elQ.offset();
      off.right = off.left + fnWidth($(elQ));
      off.bottom = off.top + fnHeight($(elQ));

      if (off.left < bounds.left)
        bounds.left = off.left;

      if (off.top < bounds.top)
        bounds.top = off.top;

      if (off.right > bounds.right)
        bounds.right = off.right;

      if (off.bottom > bounds.bottom)
        bounds.bottom = off.bottom;
    });

    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
    return bounds;
  };
})();
},{}],63:[function(require,module,exports){
/**
* HasScrollBar returns an object with bool properties 'vertical' and 'horizontal'
* saying if the element has need of scrollbars for each dimension or not (element
* can need scrollbars and still not being showed because the css-overlflow property
* being set as 'hidden', but still we know that the element requires it and its
* content is not being fully displayed).
* @extragap, defaults to {x:0,y:0}, lets specify an extra size in pixels for each dimension that alter the real check,
* resulting in a fake result that can be interesting to discard some pixels of excess
* size (negative values) or exagerate the real used size with that extra pixels (positive values).
**/
var $ = jQuery || require('jquery');
$.fn.hasScrollBar = function (extragap) {
    extragap = $.extend({
        x: 0,
        y: 0
    }, extragap);
    if (!this || this.length === 0) return { vertical: false, horizontal: false };
    //note: clientHeight= height of holder
    //scrollHeight= we have content till this height
    var t = this.get(0);
    return {
        vertical: this.outerHeight(false) < (t.scrollHeight + extragap.y),
        horizontal: this.outerWidth(false) < (t.scrollWidth + extragap.x)
    };
};
},{}],64:[function(require,module,exports){
/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],65:[function(require,module,exports){
/**
    Gets the html string of the first element and all its content.
    The 'html' method only retrieves the html string of the content, not the element itself.
**/
var $ = jQuery || require('jquery');
$.fn.outerHtml = function () {
    if (!this || this.length === 0) return '';
    var el = this.get(0);
    var html = '';
    if (el.outerHTML)
        html = el.outerHTML;
    else {
        html = this.wrapAll('<div></div>').parent().html();
        this.unwrap();
    }
    return html;
};
},{}],66:[function(require,module,exports){
/**
    Using the attribute data-source-url on any HTML element,
    this allows reload its content performing an AJAX operation
    on the given URL or the one in the attribute; the end-point
    must return text/html content.
**/
var $ = jQuery || require('jquery');
var smoothBoxBlock = require('./smoothBoxBlock');

// Default success callback and public utility, basic how-to replace element content with fetched html
function updateElement(htmlContent, context) {
    context = $.isPlainObject(context) && context ? context : this;

    // create jQuery object with the HTML
    var newhtml = new jQuery();
    // Avoid empty documents being parsed (raise error)
    htmlContent = $.trim(htmlContent);
    if (htmlContent) {
      // Try-catch to avoid errors when an empty document or malformed is returned:
      try {
        // parseHTML since jquery-1.8 is more secure:
        if (typeof ($.parseHTML) === 'function')
          newhtml = $($.parseHTML(htmlContent));
        else
          newhtml = $(htmlContent);
      } catch (ex) {
        if (console && console.error)
          console.error(ex);
        return;
      }
    }

    var element = context.element;
    if (context.options.mode == 'replace-me')
        element.replaceWith(newhtml);
    else // 'replace-content'
        element.html(newhtml);

    return context;
}

// Default complete callback and public utility
function stopLoadingSpinner() {
    clearTimeout(this.loadingTimer);
    smoothBoxBlock.close(this.element);
}

// Defaults
var defaults = {
    url: null,
    success: [updateElement],
    error: [],
    complete: [stopLoadingSpinner],
    autofocus: true,
    mode: 'replace-content',
    loading: {
        lockElement: true,
        lockOptions: {},
        message: null,
        showLoadingIndicator: true,
        delay: 0
    }
};

/* Reload method */
var reload = $.fn.reload = function () {
    // Options from defaults (internal and public)
    var options = $.extend(true, {}, defaults, reload.defaults);
    // If options object is passed as unique parameter
    if (arguments.length == 1 && $.isPlainObject(arguments[0])) {
        // Merge options:
        $.extend(true, options, arguments[0]);
    } else {
        // Common overload: new-url and complete callback, both optionals
        options.url = arguments.length > 0 ? arguments[0] : null;
        options.complete = arguments.length > 1 ? arguments[1] : null;
    }

    this.each(function () {
        var $t = $(this);

        if (options.url) {
            if ($.isFunction(options.url))
            // Function params: currentReloadUrl, defaultReloadUrl
                $t.data('source-url', $.proxy(options.url, this)($t.data('source-url'), $t.attr('data-source-url')));
            else
                $t.data('source-url', options.url);
        }
        var url = $t.data('source-url');

        // Check if there is already being reloaded, to cancel previous attempt
        var jq = $t.data('isReloading');
        if (jq) {
            if (jq.url == url)
                // Is the same url, do not abort because is the same result being retrieved
                return;
            else
                jq.abort();
        }

        // Optional data parameter 'reload-mode' accepts values: 
        // - 'replace-me': Use html returned to replace current reloaded element (aka: replaceWith())
        // - 'replace-content': (default) Html returned replace current element content (aka: html())
        options.mode = $t.data('reload-mode') || options.mode;

        if (url) {

            // Loading, with delay
            var loadingtimer = options.loading.lockElement ?
                setTimeout(function () {
                    // Creating content using a fake temp parent element to preload image and to get real message width:
                    var loadingcontent = $('<div/>')
                    .append(options.loading.message ? $('<div class="loading-message"/>').append(options.loading.message) : null)
                    .append(options.loading.showLoadingIndicator ? options.loading.message : null);
                    loadingcontent.css({ position: 'absolute', left: -99999 }).appendTo('body');
                    var w = loadingcontent.width();
                    loadingcontent.detach();
                    // Locking:
                    options.loading.lockOptions.autofocus = options.autofocus;
                    options.loading.lockOptions.width = w;
                    smoothBoxBlock.open(loadingcontent.html(), $t, options.loading.message ? 'custom-loading' : 'loading', options.loading.lockOptions);
                }, options.loading.delay)
                : null;

            // Prepare context
            var ctx = {
                element: $t,
                options: options,
                loadingTimer: loadingtimer
            };

            // Do the Ajax post
            jq = $.ajax({
                url: url,
                type: 'GET',
                context: ctx
            });

            // Url is set in the returned ajax object because is not set by all versions of jQuery
            jq.url = url;

            // Mark element as is being reloaded, to avoid multiple attemps at same time, saving
            // current ajax object to allow be cancelled
            $t.data('isReloading', jq);
            jq.always(function () {
                $t.data('isReloading', null);
            });

            // Callbacks: first globals and then from options if they are different
            // success
            jq.done(reload.defaults.success);
            if (options.success != reload.defaults.success)
                jq.done(options.success);
            // error
            jq.fail(reload.defaults.error);
            if (options.error != reload.defaults.error)
                jq.fail(options.error);
            // complete
            jq.always(reload.defaults.complete);
            if (options.complete != reload.defaults.complete)
                jq.done(options.complete);
        }
    });
    return this;
};

// Public defaults
reload.defaults = $.extend(true, {}, defaults);

// Public utilities
reload.updateElement = updateElement;
reload.stopLoadingSpinner = stopLoadingSpinner;

// Module
module.exports = reload;
},{"./smoothBoxBlock":"KQGzNM"}],67:[function(require,module,exports){
/** Extended toggle-show-hide funtions.
    IagoSRL@gmail.com
    Dependencies: jquery
 **/
(function(){

    /** Implementation: require jQuery and returns object with the
        public methods.
     **/
    function xtsh(jQuery) {
        var $ = jQuery;

        /**
         * Hide an element using jQuery, allowing use standard  'hide' and 'fadeOut' effects, extended
         * jquery-ui effects (is loaded) or custom animation through jquery 'animate'.
         * Depending on options.effect:
         * - if not present, jQuery.hide(options)
         * - 'animate': jQuery.animate(options.properties, options)
         * - 'fade': jQuery.fadeOut
         */
        function hideElement(element, options) {
            var $e = $(element);
            switch (options.effect) {
                case 'animate':
                    $e.animate(options.properties, options);
                    break;
                case 'fade':
                    $e.fadeOut(options);
                    break;
                case 'height':
                    $e.slideUp(options);
                    break;
                // 'size' value and jquery-ui effects go to standard 'hide'
                // case 'size':
                default:
                    $e.hide(options);
                    break;
            }
            $e.trigger('xhide', [options]);
        }

        /**
        * Show an element using jQuery, allowing use standard  'show' and 'fadeIn' effects, extended
        * jquery-ui effects (is loaded) or custom animation through jquery 'animate'.
        * Depending on options.effect:
        * - if not present, jQuery.hide(options)
        * - 'animate': jQuery.animate(options.properties, options)
        * - 'fade': jQuery.fadeOut
        */
        function showElement(element, options) {
            var $e = $(element);
            // We performs a fix on standard jQuery effects
            // to avoid an error that prevents from running
            // effects on elements that are already visible,
            // what lets the possibility of get a middle-animated
            // effect.
            // We just change display:none, forcing to 'is-visible' to
            // be false and then running the effect.
            // There is no flickering effect, because jQuery just resets
            // display on effect start.
            switch (options.effect) {
                case 'animate':
                    $e.animate(options.properties, options);
                    break;
                case 'fade':
                    // Fix
                    $e.css('display', 'none')
                    .fadeIn(options);
                    break;
                case 'height':
                    // Fix
                    $e.css('display', 'none')
                    .slideDown(options);
                    break;
                // 'size' value and jquery-ui effects go to standard 'show'
                // case 'size':
                default:
                    // Fix
                    $e.css('display', 'none')
                    .show(options);
                    break;
            }
            $e.trigger('xshow', [options]);
        }

        /** Generic utility for highly configurable jQuery.toggle with support
            to specify the toggle value explicity for any kind of effect: just pass true as second parameter 'toggle' to show
            and false to hide. Toggle must be strictly a Boolean value to avoid auto-detection.
            Toggle parameter can be omitted to auto-detect it, and second parameter can be the animation options.
            All the others behave exactly as hideElement and showElement.
        **/
        function toggleElement(element, toggle, options) {
            // If toggle is not a boolean
            if (toggle !== true && toggle !== false) {
                // If toggle is an object, then is the options as second parameter
                if ($.isPlainObject(toggle))
                    options = toggle;
                // Auto-detect toggle, it can vary on any element in the collection,
                // then detection and action must be done per element:
                $(element).each(function () {
                    // Reusing function, with explicit toggle value
                    toggleElement(this, !$(this).is(':visible'), options);
                });
            }
            if (toggle)
                showElement(element, options);
            else
                hideElement(element, options);
        }
        
        /** Do jQuery integration as xtoggle, xshow, xhide
         **/
        function plugIn(jQuery) {
            /** toggleElement as a jQuery method: xtoggle
             **/
            jQuery.fn.xtoggle = function xtoggle(toggle, options) {
                toggleElement(this, toggle, options);
                return this;
            };

            /** showElement as a jQuery method: xhide
            **/
            jQuery.fn.xshow = function xshow(options) {
                showElement(this, options);
                return this;
            };

            /** hideElement as a jQuery method: xhide
             **/
            jQuery.fn.xhide = function xhide(options) {
                hideElement(this, options);
                return this;
            };
        }

        // Exporting:
        return {
            toggleElement: toggleElement,
            showElement: showElement,
            hideElement: hideElement,
            plugIn: plugIn
        };
    }

    // Module
    if(typeof define === 'function' && define.amd) {
        define(['jquery'], xtsh);
    } else if(typeof module !== 'undefined' && module.exports) {
        var jQuery = require('jquery');
        module.exports = xtsh(jQuery);
    } else {
        // Normal script load, if jQuery is global (at window), its extended automatically        
        if (typeof window.jQuery !== 'undefined')
            xtsh(window.jQuery).plugIn(window.jQuery);
    }

})();
},{}],"LC/jqueryUtils":[function(require,module,exports){
module.exports=require('7/CV3J');
},{}],"7/CV3J":[function(require,module,exports){
/* Some utilities for use with jQuery or its expressions
    that are not plugins.
*/
function escapeJQuerySelectorValue(str) {
    return str.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/])/g, '\\$1');
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        escapeJQuerySelectorValue: escapeJQuerySelectorValue
    };

},{}],70:[function(require,module,exports){
/* Assets loader with loading confirmation (mainly for scripts)
    based on Modernizr/yepnope loader.
*/
var Modernizr = require('modernizr');

exports.load = function (opts) {
    opts = $.extend(true, {
        scripts: [],
        complete: null,
        completeVerification: null,
        loadDelay: 0,
        trialsInterval: 500
    }, opts);
    if (!opts.scripts.length) return;
    function performComplete() {
        if (typeof (opts.completeVerification) !== 'function' || opts.completeVerification())
            opts.complete();
        else {
            setTimeout(performComplete, opts.trialsInterval);
            if (console && console.warn)
                console.warn('LC.load.completeVerification failed for ' + opts.scripts[0] + ' retrying it in ' + opts.trialsInterval + 'ms');
        }
    }
    function load() {
        Modernizr.load({
            load: opts.scripts,
            complete: opts.complete ? performComplete : null
        });
    }
    if (opts.loadDelay)
        setTimeout(load, opts.loadDelay);
    else
        load();
};
},{}],71:[function(require,module,exports){
/*------------
Utilities to manipulate numbers, additionally
to the ones at Math
------------*/

/** Enumeration to be uses by functions that implements 'rounding' operations on different
data types.
It holds the different ways a rounding operation can be apply.
**/
var roundingTypeEnum = {
    Down: -1,
    Nearest: 0,
    Up: 1
};

function roundTo(number, decimals, roundingType) {
    // case Nearest is the default:
    var f = nearestTo;
    switch (roundingType) {
        case roundingTypeEnum.Down:
            f = floorTo;
            break;
        case roundingTypeEnum.Up:
            f = ceilTo;
            break;
    }
    return f(number, decimals);
}

/** Round a number to the specified number of decimals.
It can substract integer decimals by providing a negative
number of decimals.
**/
function nearestTo(number, decimals) {
    var tens = Math.pow(10, decimals);
    return Math.round(number * tens) / tens;
}

/** Round Up a number to the specified number of decimals.
Its similar to roundTo, but the number is ever rounded up,
to the lower integer greater or equals to the number.
**/
function ceilTo(number, decimals) {
    var tens = Math.pow(10, decimals);
    return Math.ceil(number * tens) / tens;
}

/** Round Down a number to the specified number of decimals.
Its similar to roundTo, but the number is ever rounded down,
to the bigger integer lower or equals to the number.
**/
function floorTo(number, decimals) {
    var tens = Math.pow(10, decimals);
    return Math.floor(number * tens) / tens;
}

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        roundingTypeEnum: roundingTypeEnum,
        roundTo: roundTo,
        nearestTo: nearestTo,
        ceilTo: ceilTo,
        floorTo: floorTo
    };
},{}],"LC/moveFocusTo":[function(require,module,exports){
module.exports=require('9RKOGW');
},{}],"9RKOGW":[function(require,module,exports){
function moveFocusTo(el, options) {
    options = $.extend({
        marginTop: 30,
        duration: 500
    }, options);
    $('html,body').stop(true, true).animate({ scrollTop: $(el).offset().top - options.marginTop }, options.duration, null);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = moveFocusTo;
}
},{}],74:[function(require,module,exports){
/* Some utilities to format and extract numbers, from text or DOM.
 */
var jQuery = require('jquery'),
    i18n = require('./i18n'),
    mu = require('./mathUtils');

function getMoneyNumber(v, alt) {
    alt = alt || 0;
    if (v instanceof jQuery)
        v = v.val() || v.text();
    v = parseFloat(v
        .replace(/[$€]/g, '')
        .replace(new RegExp(LC.numericMilesSeparator[i18n.getCurrentCulture().culture], 'g'), '')
    );
    return isNaN(v) ? alt : v;
}
function numberToTwoDecimalsString(v) {
    var culture = i18n.getCurrentCulture().culture;
    // First, round to 2 decimals
    v = mu.roundTo(v, 2);
    // Get the decimal part (rest)
    var rest = Math.round(v * 100 % 100);
    return ('' +
    // Integer part (no decimals)
        Math.floor(v) +
    // Decimal separator depending on locale
        i18n.numericDecimalSeparator[culture] +
    // Decimals, ever two digits
        Math.floor(rest / 10) + rest % 10
    );
}
function numberToMoneyString(v) {
    var country = i18n.getCurrentCulture().country;
    // Two digits in decimals for rounded value with money symbol as for
    // current locale
    return (i18n.moneySymbolPrefix[country] + numberToTwoDecimalsString(v) + i18n.moneySymbolSufix[country]);
}
function setMoneyNumber(v, el) {
    // Get value in money format:
    v = numberToMoneyString(v);
    // Setting value:
    if (el instanceof jQuery)
        if (el.is(':input'))
            el.val(v);
        else
            el.text(v);
    return v;
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        getMoneyNumber: getMoneyNumber,
        numberToTwoDecimalsString: numberToTwoDecimalsString,
        numberToMoneyString: numberToMoneyString,
        setMoneyNumber: setMoneyNumber
    };
},{"./i18n":59,"./mathUtils":71}],75:[function(require,module,exports){
/**
* Placeholder polyfill.
* Adds a new jQuery placeHolder method to setup or reapply placeHolder
* on elements (recommented to be apply only to selector '[placeholder]');
* thats method is fake on browsers that has native support for placeholder
**/
var Modernizr = require('modernizr'),
    $ = require('jquery');

exports.init = function initPlaceHolders() {
    if (Modernizr.input.placeholder)
        $.fn.placeholder = function () { };
    else
        (function () {
            function doPlaceholder() {
                var $t = $(this);
                if (!$t.data('placeholder-supported')) {
                    $t.on('focusin', function () {
                        if (this.value == this.getAttribute('placeholder'))
                            this.value = '';
                    });
                    $t.on('focusout', function () {
                        if (!this.value.length)
                            this.value = this.getAttribute('placeholder');
                    });
                    $t.data('placeholder-supported', true);
                }
                if (!this.value.length)
                    this.value = this.getAttribute('placeholder');
            }
            $.fn.placeholder = function () {
                return this.each(doPlaceholder);
            };
            $('[placeholder]').placeholder();
            $(document).ajaxComplete(function () {
                $('[placeholder]').placeholder();
            });
        })();
};
},{}],76:[function(require,module,exports){
/* Popup functions
 */
var $ = require('jquery'),
    createIframe = require('./createIframe'),
    moveFocusTo = require('./moveFocusTo');
require('jquery.blockUI');
require('./smoothBoxBlock');

/*******************
* Popup related 
* functions
*/
function popupSize(size) {
    var s = (size == 'large' ? 0.8 : (size == 'medium' ? 0.5 : (size == 'small' ? 0.2 : size || 0.5)));
    return {
        width: Math.round($(window).width() * s),
        height: Math.round($(window).height() * s),
        sizeFactor: s
    };
}
function popupStyle(size) {
    return {
        cursor: 'default',
        width: size.width + 'px',
        left: Math.round(($(window).width() - size.width) / 2) - 25 + 'px',
        height: size.height + 'px',
        top: Math.round(($(window).height() - size.height) / 2) - 32 + 'px',
        padding: '34px 25px 30px',
        overflow: 'auto',
        border: 'none',
        '-moz-background-clip': 'padding',
        '-webkit-background-clip': 'padding-box',
        'background-clip': 'padding-box'
    };
}
function popup(url, size, complete, loadingText, options) {
    if (typeof (url) === 'object')
        options = url;

    // Load options overwriting defaults
    options = $.extend(true, {
        url: typeof (url) === 'string' ? url : '',
        size: size || { width: 0, height: 0 },
        complete: complete,
        loadingText: loadingText,
        closable: {
            onLoad: false,
            afterLoad: true,
            onError: true
        },
        autoSize: false,
        containerClass: '',
        autoFocus: true
    }, options);

    // Prepare size and loading
    options.loadingText = options.loadingText || '';
    if (typeof (options.size.width) === 'undefined')
        options.size = popupSize(options.size);

    $.blockUI({
        message: (options.closable.onLoad ? '<a class="close-popup" href="#close-popup">X</a>' : '') +
       '<img src="' + LcUrl.AppPath + 'img/theme/loading.gif"/>' + options.loadingText,
        centerY: false,
        css: popupStyle(options.size),
        overlayCSS: { cursor: 'default' },
        focusInput: true
    });

    // Loading Url with Ajax and place content inside the blocked-box
    $.ajax({
        url: options.url,
        context: {
            options: options,
            container: $('.blockMsg')
        },
        success: function (data) {
            var container = this.container.addClass(options.containerClass);
            // Add close button if requires it or empty message content to append then more
            container.html(options.closable.afterLoad ? '<a class="close-popup" href="#close-popup">X</a>' : '');
            var contentHolder = container.append('<div class="content"/>').children('.content');

            if (typeof (data) === 'object') {
                if (data.Code && data.Code == 2) {
                    $.unblockUI();
                    popup(data.Result, { width: 410, height: 320 });
                } else {
                    // Unexpected code, show result
                    contentHolder.append(data.Result);
                }
            } else {
                // Page content got, paste into the popup if is partial html (url starts with $)
                if (/((^\$)|(\/\$))/.test(options.url)) {
                    contentHolder.append(data);
                    if (options.autoFocus)
                        moveFocusTo(contentHolder);
                    if (options.autoSize) {
                        // Avoid miscalculations
                        var prevWidth = contentHolder[0].style.width;
                        contentHolder.css('width', 'auto');
                        var prevHeight = contentHolder[0].style.height;
                        contentHolder.css('height', 'auto');
                        // Get data
                        var actualWidth = contentHolder[0].scrollWidth,
                            actualHeight = contentHolder[0].scrollHeight,
                            contWidth = container.width(),
                            contHeight = container.height(),
                            extraWidth = container.outerWidth(true) - contWidth,
                            extraHeight = container.outerHeight(true) - contHeight,
                            maxWidth = $(window).width() - extraWidth,
                            maxHeight = $(window).height() - extraHeight;
                        // Calculate and apply
                        var size = {
                            width: actualWidth > maxWidth ? maxWidth : actualWidth,
                            height: actualHeight > maxHeight ? maxHeight : actualHeight
                        };
                        container.animate(size, 300);
                        // Reset miscalculations corrections
                        contentHolder.css('width', prevWidth);
                        contentHolder.css('height', prevHeight);
                    }
                } else {
                    // Else, if url is a full html page (normal page), put content into an iframe
                    var iframe = createIframe(data, this.options.size);
                    iframe.attr('id', 'blockUIIframe');
                    // replace blocking element content (the loading) with the iframe:
                    contentHolder.remove();
                    $('.blockMsg').append(iframe);
                    if (options.autoFocus)
                        moveFocusTo(iframe);
                }
            }
        }, error: function (j, t, ex) {
            $('div.blockMsg').html((options.closable.onError ? '<a class="close-popup" href="#close-popup">X</a>' : '') + '<div class="content">Page not found</div>');
            if (console && console.info) console.info("Popup-ajax error: " + ex);
        }, complete: options.complete
    });

    var returnedBlock = $('.blockUI');

    returnedBlock.on('click', '.close-popup', function () {
      $.unblockUI();
      returnedBlock.trigger('popup-closed');
      return false;
    });
    
    returnedBlock.closePopup = function () {
      $.unblockUI();
    };
    returnedBlock.getBlockElement = function getBlockElement() { return returnedBlock.filter('.blockMsg'); };
    returnedBlock.getContentElement = function getContentElement() { return returnedBlock.find('.content'); };
    returnedBlock.getOverlayElement = function getOverlayElement() { return returnedBlock.filter('.blockOverlay'); };
    return returnedBlock;
}

/* Some popup utilitites/shorthands */
function messagePopup(message, container) {
    container = $(container || 'body');
    var content = $('<div/>').text(message);
    smoothBoxBlock.open(content, container, 'message-popup full-block', { closable: true, center: true, autofocus: false });
}

function connectPopupAction(applyToSelector) {
    applyToSelector = applyToSelector || '.popup-action';
    $(document).on('click', applyToSelector, function () {
        var c = $($(this).attr('href')).clone();
        if (c.length == 1)
            smoothBoxBlock.open(c, document, null, { closable: true, center: true });
        return false;
    });
}

// The popup function contains all the others as methods
popup.size = popupSize;
popup.style = popupStyle;
popup.connectAction = connectPopupAction;
popup.message = messagePopup;

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = popup;
},{"./createIframe":46,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],77:[function(require,module,exports){
/**** Postal Code: on fly, server-side validation *****/
var $ = require('jquery');

exports.init = function (options) {
    options = $.extend({
        baseUrl: '/',
        selector: '[data-val-postalcode]',
        url: 'JSON/ValidatePostalCode/'
    }, options);

    $(document).on('change', options.selector, function () {
        var $t = $(this);
        // If contains a value (this not validate if is required) and 
        // has the error descriptive message, validate through ajax
        var pc = $t.val();
        var msg = $t.data('val-postalcode');
        if (pc && msg) {
            $.ajax({
                url: options.baseUrl + options.url,
                data: { PostalCode: pc },
                cache: true,
                dataType: 'JSON',
                success: function (data) {
                    if (data && data.Code === 0)
                        if (data.Result.IsValid) {
                            $t.removeClass('input-validation-error').addClass('valid');
                            $t.siblings('.field-validation-error')
                                .removeClass('field-validation-error')
                                .addClass('field-validation-valid')
                                .text('').children().remove();
                            // Clean summary errors
                            $t.closest('form').find('.validation-summary-errors')
                                .removeClass('validation-summary-errors')
                                .addClass('validation-summary-valid')
                                .find('> ul > li').each(function () {
                                    if ($(this).text() == msg)
                                        $(this).remove();
                                });
                        } else {
                            $t.addClass('input-validation-error').removeClass('valid');
                            $t.siblings('.field-validation-valid')
                                .addClass('field-validation-error')
                                .removeClass('field-validation-valid')
                                .append('<span for="' + $t.attr('name') + '" generated="true">' + msg + '</span>');
                            // Add summary error (if there is not)
                            $t.closest('form').find('.validation-summary-valid')
                                .addClass('validation-summary-errors')
                                .removeClass('validation-summary-valid')
                                .children('ul')
                                .append('<li>' + msg + '</li>');
                        }
                }
            });
        }
    });
};
},{}],78:[function(require,module,exports){
/** Apply ever a redirect to the given URL, if this is an internal URL or same
page, it forces a page reload for the given URL.
**/
var $ = require('jquery');
require('jquery.blockUI');

module.exports = function redirectTo(url) {
    // Block to avoid more user interactions:
    $.blockUI({ message: '' }); //loadingBlock);
    // Checking if is being redirecting or not
    var redirected = false;
    $(window).on('beforeunload', function checkRedirect() {
        redirected = true;
    });
    // Navigate to new location:
    window.location = url;
    setTimeout(function () {
        // If page not changed (same url or internal link), page continue executing then refresh:
        if (!redirected)
            window.location.reload();
    }, 50);
};

},{}],79:[function(require,module,exports){
/** Sanitize the whitespaces in a text by:
- replacing contiguous whitespaces characteres (any number of repetition 
and any kind of white character) by a normal white-space
- replace encoded non-breaking-spaces by a normal white-space
- remove starting and ending white-spaces
- ever return a string, empty when null
**/
function sanitizeWhitespaces(text) {
    // Ever return a string, empty when null
    text = (text || '')
    // Replace any kind of contiguous whitespaces characters by a single normal white-space
    // (thats include replace enconded non-breaking-spaces,
    // and duplicated-repeated appearances)
    .replace(/\s+/g, ' ');
    // Remove starting and ending whitespaces
    return $.trim(text);
}

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = sanitizeWhitespaces;
},{}],"KQGzNM":[function(require,module,exports){
/** Custom Loconomics 'like blockUI' popups
**/
var $ = require('jquery'),
    escapeJQuerySelectorValue = require('./jqueryUtils').escapeJQuerySelectorValue,
    autoFocus = require('./autoFocus'),
    moveFocusTo = require('./moveFocusTo');
require('./jquery.xtsh').plugIn($);

function smoothBoxBlock(contentBox, blocked, addclass, options) {
    // Load options overwriting defaults
    options = $.extend(true, {
        closable: false,
        center: false,
        /* as a valid options parameter for LC.hideElement function */
        closeOptions: {
            duration: 600,
            effect: 'fade'
        },
        autofocus: true,
        autofocusOptions: { marginTop: 60 },
        width: 'auto'
    }, options);

    contentBox = $(contentBox);
    var full = false;
    if (blocked == document || blocked == window) {
        blocked = $('body');
        full = true;
    } else
        blocked = $(blocked);

    var boxInsideBlocked = !blocked.is('body,tr,thead,tbody,tfoot,table,ul,ol,dl');

    // Getting box element if exists and referencing
    var bID = blocked.data('smooth-box-block-id');
    if (!bID)
        bID = (contentBox.attr('id') || '') + (blocked.attr('id') || '') + '-smoothBoxBlock';
    if (bID == '-smoothBoxBlock') {
        bID = 'id-' + guidGenerator() + '-smoothBoxBlock';
    }
    blocked.data('smooth-box-block-id', bID);
    var box = $('#' + escapeJQuerySelectorValue(bID));
    // Hiding box:
    if (contentBox.length === 0) {
        box.xhide(options.closeOptions);
        return;
    }
    var boxc;
    if (box.length === 0) {
        boxc = $('<div class="smooth-box-block-element"/>');
        box = $('<div class="smooth-box-block-overlay"></div>');
        box.addClass(addclass);
        if (full) box.addClass('full-block');
        box.append(boxc);
        box.attr('id', bID);
        if (boxInsideBlocked)
            blocked.append(box);
        else
            $('body').append(box);
    } else {
        boxc = box.children('.smooth-box-block-element');
    }
    // Hidden for user, but available to compute:
    contentBox.show();
    box.show().css('opacity', 0);
    // Setting up the box and styles.
    boxc.children().remove();
    if (options.closable)
        boxc.append($('<a class="close-popup close-action" href="#close-popup">X</a>'));
    box.data('modal-box-options', options);
    if (!boxc.data('_close-action-added'))
        boxc
        .on('click', '.close-action', function () { smoothBoxBlock(null, blocked, null, box.data('modal-box-options')); return false; })
        .data('_close-action-added', true);
    boxc.append(contentBox);
    boxc.width(options.width);
    box.css('position', 'absolute');
    if (boxInsideBlocked) {
        // Box positioning setup when inside the blocked element:
        box.css('z-index', blocked.css('z-index') + 10);
        if (!blocked.css('position') || blocked.css('position') == 'static')
            blocked.css('position', 'relative');
        //offs = blocked.position();
        box.css('top', 0);
        box.css('left', 0);
    } else {
        // Box positioning setup when outside the blocked element, as a direct child of Body:
        box.css('z-index', Math.floor(Number.MAX_VALUE));
        box.css(blocked.offset());
    }
    // Dimensions must be calculated after being appended and position type being set:
    box.width(blocked.outerWidth());
    box.height(blocked.outerHeight());

    if (options.center) {
        boxc.css('position', 'absolute');
        var cl, ct;
        if (full) {
            ct = screen.height / 2;
            cl = screen.width / 2;
        } else {
            ct = box.outerHeight(true) / 2;
            cl = box.outerWidth(true) / 2;
        }
        boxc.css('top', ct - boxc.outerHeight(true) / 2);
        boxc.css('left', cl - boxc.outerWidth(true) / 2);
    }
    // Last setup
    autoFocus(box);
    // Show block
    box.animate({ opacity: 1 }, 300);
    if (options.autofocus)
        moveFocusTo(contentBox, options.autofocusOptions);
    return box;
}
function smoothBoxBlockCloseAll(container) {
    $(container || document).find('.smooth-box-block-overlay').hide();
}

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        open: smoothBoxBlock,
        close: function(blocked, addclass, options) { smoothBoxBlock(null, blocked, addclass, options); },
        closeAll: smoothBoxBlockCloseAll
    };
},{"./autoFocus":31,"./jquery.xtsh":67,"./jqueryUtils":"7/CV3J","./moveFocusTo":"9RKOGW"}],"LC/smoothBoxBlock":[function(require,module,exports){
module.exports=require('KQGzNM');
},{}],"LC/tooltips":[function(require,module,exports){
module.exports=require('UTsC2v');
},{}],"UTsC2v":[function(require,module,exports){
/**
** Module:: tooltips
** Creates smart tooltips with possibilities for on hover and on click,
** additional description or external tooltip content.
**/
var $ = require('jquery'),
    sanitizeWhitespaces = require('./sanitizeWhitespaces');
require('./jquery.outerHtml');
require('./jquery.isChildOf');

// Main internal properties
var posoffset = { x: 16, y: 8 };
var selector = '[title][data-description], [title].has-tooltip, [title].secure-data, [data-tooltip-url], [title].has-popup-tooltip';

/** Positionate the tooltip depending on the
event or the target element position and an offset
**/
function pos(t, e, l) {
    var x, y;
    if (e.pageX && e.pageY) {
        x = e.pageX;
        y = e.pageY;
    } else if (e.target) {
        var $et = $(e.target);
        x = $et.outerWidth() + $et.offset().left;
        y = $et.outerHeight() + $et.offset().top;
    }
    t.css('left', x + posoffset.x);
    t.css('top', y + posoffset.y);
    // Adjust width to visible viewport
    var tdif = t.outerWidth() - t.width();
    t.css('max-width', $(window).width() - x - posoffset.x - tdif);
    //t.height($(document).height() - y - posoffset.y);
}
/** Get or create, and returns, the tooltip content for the element
**/
function con(l) {
    if (l.length === 0) return null;
    var c = l.data('tooltip-content'),
        persistent = l.data('persistent-tooltip');
    if (!c) {
        var h = sanitizeWhitespaces(l.attr('title'));
        var d = sanitizeWhitespaces(l.data('description'));
        if (d)
            c = '<h4>' + h + '</h4><p>' + d + '</p>';
        else
            c = h;
        // Append data-tooltip-url content if exists
        var urlcontent = $(l.data('tooltip-url'));
        c = (c || '') + urlcontent.outerHtml();
        // Remove original, is no more need and avoid id-conflicts
        urlcontent.remove();
        // Save tooltip content
        l.data('tooltip-content', c);
        // Remove browser tooltip (both when we are using our own tooltip and when no tooltip
        // is need)
        l.attr('title', '');
    }
    // Remove tooltip content (but preserve its cache in the element data)
    // if is the same text as the element content and the element content
    // is fully visible. Thats, for cases with different content, will be showed,
    // and for cases with same content but is not visible because the element
    // or container width, then will be showed.
    // Except if is persistent
    if (persistent !== true &&
        sanitizeWhitespaces(l.text()) == c &&
        l.outerWidth() >= l[0].scrollWidth) {
        c = null;
    }
    // If there is no content:
    if (!c) {
        // Update target removing the class to avoid css marking tooltip when there is not
        l.removeClass('has-tooltip').removeClass('has-popup-tooltip');
    }
    // Return the content as string:
    return c;
}
/** Get or creates the singleton instance for a tooltip of the given type
**/
function getTooltip(type) {
    type = type || 'tooltip';
    var id = 'singleton-' + type;
    var t = document.getElementById(id);
    if (!t) {
        t = $('<div style="position:absolute" class="tooltip"></div>');
        t.attr('id', id);
        t.hide();
        $('body').append(t);
    }
    return $(t);
}
/** Show the tooltip on an event triggered by the element containing
information for a tooltip
**/
function showTooltip(e) {
    var $t = $(this);
    var isPopup = $t.hasClass('has-popup-tooltip');
    // Get or create tooltip layer
    var t = getTooltip(isPopup ? 'popup-tooltip' : 'tooltip');
    // If this is not popup and the event is click, discard without cancel event
    if (!isPopup && e.type == 'click')
        return true;

    // Create content: if there is content, continue
    var content = con($t);
    if (content) {
        // If is a has-popup-tooltip and this is not a click, don't show
        if (isPopup && e.type != 'click')
            return true;
        // The tooltip setup must be queued to avoid content to be showed and placed
        // when still hidden the previous
        t.queue(function () {
            // Set tooltip content
            t.html(content);
            // For popups, setup class and close button
            if (isPopup) {
                t.addClass('popup-tooltip');
                var closeButton = $('<a href="#close-popup" class="close-action">X</a>');
                t.append(closeButton);
            }
            // Positionate
            pos(t, e, $t);
            t.dequeue();
            // Show (animations are stopped only on hide to avoid conflicts)
            t.fadeIn();
        });
    }

    // Stop bubbling and default
    return false;
}
/** Hide all opened tooltips, for any type.
It has some special considerations for popup-tooltips depending
on the event being triggered.
**/
function hideTooltip(e) {
    $('.tooltip:visible').each(function () {
        var t = $(this);
        // If is a popup-tooltip and this is not a click, or the inverse,
        // this is not a popup-tooltip and this is a click, do nothing
        if (t.hasClass('popup-tooltip') && e.type != 'click' ||
            !t.hasClass('popup-tooltip') && e.type == 'click')
            return;
        // Stop animations and hide
        t.stop(true, true).fadeOut();
    });

    return false;
}
/** Initialize tooltips
**/
function init() {
    // Listen for events to show/hide tooltips
    $('body').on('mousemove focusin', selector, showTooltip)
    .on('mouseleave focusout', selector, hideTooltip)
    // Listen event for clickable popup-tooltips
    .on('click', '[title].has-popup-tooltip', showTooltip)
    // Allowing buttons inside the tooltip
    .on('click', '.tooltip-button', function () { return false; })
    // Adding close-tooltip handler for popup-tooltips (click on any element except the tooltip itself)
    .on('click', function (e) {
        var t = $('.popup-tooltip:visible').get(0);
        // If the click is Not on the tooltip or any element contained
        // hide tooltip
        if (e.target != t && !$(e.target).isChildOf(t))
            hideTooltip(e);
    })
    // Avoid close-action click from redirect page, and hide tooltip
    .on('click', '.popup-tooltip .close-action', function (e) {
        e.preventDefault();
        hideTooltip(e);
    });
    update();
}
/** Update elements on the page to reflect changes or need for tooltips
**/
function update(element_selector) {
    // Review every popup tooltip to prepare content and mark/unmark the link or text:
    $(element_selector || selector).each(function () {
        con($(this));
    });
}
/** Create tooltip on element by demand
**/
function create_tooltip(element, options) {
    var settings = $.extend({}, {
      title: ''
      , description: null
      , url: null
      , is_popup: false
      , persistent: false
    }, options);

    $(element)
    .attr('title', settings.title)
    .data('description', settings.description)
    .data('persistent-tooltip', settings.persistent)
    .addClass(settings.is_popup ? 'has-popup-tooltip' : 'has-tooltip');
    update(element);
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        initTooltips: init,
        updateTooltips: update,
        createTooltip: create_tooltip
    };

},{"./jquery.isChildOf":64,"./jquery.outerHtml":65,"./sanitizeWhitespaces":79}],84:[function(require,module,exports){
/* Some tools form URL management
*/
exports.getURLParameter = function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)', 'i').exec(location.search) || [, null])[1]);
};
exports.getHashBangParameters = function getHashBangParameters(hashbangvalue) {
    // Hashbangvalue is something like: Thread-1_Message-2
    // Where '1' is the ThreadID and '2' the optional MessageID, or other parameters
    var pars = hashbangvalue.split('_');
    var urlParameters = {};
    for (var i = 0; i < pars.length; i++) {
        var parsvalues = pars[i].split('-');
        if (parsvalues.length == 2)
            urlParameters[parsvalues[0]] = parsvalues[1];
        else
            urlParameters[parsvalues[0]] = true;
    }
    return urlParameters;
};

},{}],"kqf9lt":[function(require,module,exports){
/** Validation logic with load and setup of validators and 
    validation related utilities
**/
var $ = require('jquery');
var Modernizr = require('modernizr');

// Using on setup asyncronous load instead of this static-linked load
// require('jquery/jquery.validate.min.js');
// require('jquery/jquery.validate.unobtrusive.min.js');

function setupValidation(reapplyOnlyTo) {
    reapplyOnlyTo = reapplyOnlyTo || document;
    if (!window.jqueryValidateUnobtrusiveLoaded) window.jqueryValidateUnobtrusiveLoaded = false;
    if (!jqueryValidateUnobtrusiveLoaded) {
        jqueryValidateUnobtrusiveLoaded = true;
        
        Modernizr.load([
                { load: LcUrl.AppPath + "Scripts/jquery/jquery.validate.min.js" },
                { load: LcUrl.AppPath + "Scripts/jquery/jquery.validate.unobtrusive.min.js" }
            ]);
    } else {
        // Check first if validation is enabled (can happen that twice includes of
        // this code happen at same page, being executed this code after first appearance
        // with the switch jqueryValidateUnobtrusiveLoaded changed
        // but without validation being already loaded and enabled)
        if ($ && $.validator && $.validator.unobtrusive) {
            // Apply the validation rules to the new elements
            $(reapplyOnlyTo).removeData('validator');
            $(reapplyOnlyTo).removeData('unobtrusiveValidation');
            $.validator.unobtrusive.parse(reapplyOnlyTo);
        }
    }
}

/* Utilities */

/* Clean previous validation errors of the validation summary
included in 'container' and set as valid the summary
*/
function setValidationSummaryAsValid(container) {
    container = container || document;
    $('.validation-summary-errors', container)
    .removeClass('validation-summary-errors')
    .addClass('validation-summary-valid')
    .find('>ul>li').remove();

    // Set all fields validation inside this form (affected by the summary too)
    // as valid too
    $('.field-validation-error', container)
    .removeClass('field-validation-error')
    .addClass('field-validation-valid')
    .text('');

    // Re-apply setup validation to ensure is working, because just after a successful
    // validation, asp.net unobtrusive validation stops working on client-side.
    LC.setupValidation();
}

function setValidationSummaryAsError(container) {
  var v = findValidationSummary(container);
  v.addClass('validation-summary-errors').removeClass('validation-summary-valid');
}

function goToSummaryErrors(form) {
    var off = form.find('.validation-summary-errors').offset();
    if (off)
        $('html,body').stop(true, true).animate({ scrollTop: off.top }, 500);
    else
        if (console && console.error) console.error('goToSummaryErrors: no summary to focus');
}

function findValidationSummary(container) {
  container = container || document;
  return $('[data-valmsg-summary=true]');
}

module.exports = {
    setup: setupValidation,
    setValidationSummaryAsValid: setValidationSummaryAsValid,
    setValidationSummaryAsError: setValidationSummaryAsError,
    goToSummaryErrors: goToSummaryErrors,
    findValidationSummary: findValidationSummary
};
},{}],"LC/validationHelper":[function(require,module,exports){
module.exports=require('kqf9lt');
},{}],87:[function(require,module,exports){
/**
    Enable the use of popups to show links to some Account pages (default links behavior is to open in a new tab)
**/
var $ = require('jquery');

exports.enable = function (baseUrl) {
    $(document)
    .on('click', 'a.login', function () {
        var url = baseUrl + 'Account/$Login/?ReturnUrl=' + encodeURIComponent(window.location);
        popup(url, { width: 410, height: 320 });
        return false;
    })
    .on('click', 'a.register', function () {
        var url = this.getAttribute('href').replace('/Account/Register', '/Account/$Register');
        popup(url, { width: 450, height: 500 });
        return false;
    })
    .on('click', 'a.forgot-password', function () {
        var url = this.getAttribute('href').replace('/Account/ForgotPassword', '/Account/$ForgotPassword');
        popup(url, { width: 400, height: 240 });
        return false;
    })
    .on('click', 'a.change-password', function () {
        var url = this.getAttribute('href').replace('/Account/ChangePassword', '/Account/$ChangePassword');
        popup(url, { width: 450, height: 340 });
        return false;
    });
};
},{}],88:[function(require,module,exports){
// OUR namespace (abbreviated Loconomics)
window.LC = window.LC || {};

// TODO Review LcUrl use around all the modules, use DI whenever possible (init/setup method or in use cases)
// but only for the wanted baseUrl on each case and not pass all the LcUrl object.
// LcUrl is server-side generated and wrote in a Layout script-tag.

// Global settings
window.gLoadingRetard = 300;

/***
 ** Loading modules
***/
//TODO: Clean dependencies, remove all that not used directly in this file, any other file
// or page must require its dependencies.

window.LcUrl = require('../LC/LcUrl');

/* jQuery, some vendor plugins (from bundle) and our additions (small plugins), they are automatically plug-ed on require */
var $ = window.$ = window.jQuery = require('jquery');
require('../LC/jquery.hasScrollBar');
require('jquery.ba-hashchange');
require('jquery.blockUI');
require('../LC/jquery.are');
// Masked input, for dates -at my-account-.
require('jquery.formatter');

// General callbacks for AJAX events with common logic
var ajaxCallbacks = require('../LC/ajaxCallbacks');
// Form.ajax logic and more specific callbacks based on ajaxCallbacks
var ajaxForms = require('../LC/ajaxForms');
//{TEMP  old alias
window.ajaxFormsSuccessHandler = ajaxForms.onSuccess;
window.ajaxErrorPopupHandler = ajaxForms.onError;
window.ajaxFormsCompleteHandler = ajaxForms.onComplete;
//}

/* Reload */
require('../LC/jquery.reload');
// Wrapper function around onSuccess to mark operation as part of a 
// reload avoiding some bugs (as replace-content on ajax-box, not wanted for
// reload operations)
function reloadSuccessWrapper() {
  var context = $.isPlainObject(this) ? this : { element: this };
  context.isReload = true;
  ajaxForms.onSuccess.apply(context, Array.prototype.slice.call(arguments));
}
$.fn.reload.defaults = {
  success: [reloadSuccessWrapper],
  error: [ajaxForms.onError],
  delay: gLoadingRetard
};

LC.moveFocusTo = require('../LC/moveFocusTo');
/* Disabled because conflicts with the moveFocusTo of 
  ajaxForm.onsuccess, it happens a block.loading just after
  the success happens.
$.blockUI.defaults.onBlock = function () {
    // Scroll to block-message to don't lost in large pages:
    LC.moveFocusTo(this);
};*/

var loader = require('../LC/loader');
LC.load = loader.load;

var blocks = LC.blockPresets = require('../LC/blockPresets');
//{TEMP
window.loadingBlock = blocks.loading;
window.infoBlock = blocks.info;
window.errorBlock = blocks.error;
//}

Array.remove = require('../LC/Array.remove');
require('../LC/String.prototype.contains');

LC.getText = require('../LC/getText');

var TimeSpan = LC.timeSpan = require('../LC/TimeSpan');
var timeSpanExtra = require('../LC/TimeSpanExtra');
timeSpanExtra.plugIn(TimeSpan);
//{TEMP  old aliases
LC.smartTime = timeSpanExtra.smartTime;
LC.roundTimeToQuarterHour = timeSpanExtra.roundToQuarterHour;
//}

LC.ChangesNotification = require('../LC/changesNotification');
window.TabbedUX = require('../LC/TabbedUX');
var sliderTabs = require('../LC/TabbedUX.sliderTabs');

// Popup APIs
window.smoothBoxBlock = require('../LC/smoothBoxBlock');

var popup = require('../LC/popup');
//{TEMP
var popupStyle = popup.style,
    popupSize = popup.size;
LC.messagePopup = popup.message;
LC.connectPopupAction = popup.connectAction;
window.popup = popup;
//}

LC.sanitizeWhitespaces = require('../LC/sanitizeWhitespaces');
//{TEMP   alias because misspelling
LC.sanitizeWhitepaces = LC.sanitizeWhitespaces;
//}

LC.getXPath = require('../LC/getXPath');

var stringFormat = require('../LC/StringFormat');

// Expanding exported utilites from modules directly as LC members:
$.extend(LC, require('../LC/Price'));
$.extend(LC, require('../LC/mathUtils'));
$.extend(LC, require('../LC/numberUtils'));
$.extend(LC, require('../LC/tooltips'));
var i18n = LC.i18n = require('../LC/i18n');
//{TEMP old alises on LC and global
$.extend(LC, i18n);
$.extend(window, i18n);
//}

// xtsh: pluged into jquery and part of LC
var xtsh = require('../LC/jquery.xtsh');
xtsh.plugIn($);
//{TEMP   remove old LC.* alias
$.extend(LC, xtsh);
delete LC.plugIn;
//}

var autoCalculate = LC.autoCalculate = require('../LC/autoCalculate');
//{TEMP   remove old alias use
var lcSetupCalculateTableItemsTotals = autoCalculate.onTableItems;
LC.setupCalculateSummary = autoCalculate.onSummary;
LC.updateDetailedPricingSummary = autoCalculate.updateDetailedPricingSummary;
LC.setupUpdateDetailedPricingSummary = autoCalculate.onDetailedPricingSummary;
//}

var Cookie = LC.Cookie = require('../LC/Cookie');
//{TEMP    old alias
var getCookie = Cookie.get,
    setCookie = Cookie.set;
//}

LC.datePicker = require('../LC/datePicker');
//{TEMP   old alias
window.setupDatePicker = LC.setupDatePicker = LC.datePicker.init;
window.applyDatePicker = LC.applyDatePicker = LC.datePicker.apply;
//}

LC.autoFocus = require('../LC/autoFocus');

// CRUDL: loading module, setting up common default values and callbacks:
var crudlModule = require('../LC/crudl');
crudlModule.defaultSettings.data['focus-closest']['default'] = '.DashboardSection-page-section';
crudlModule.defaultSettings.data['focus-margin']['default'] = 10;
var crudl = crudlModule.setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
// Previous used alias (deprecated):
LC.initCrudl = crudl.on;

// UI Slider Labels
var sliderLabels = require('../LC/UISliderLabels');
//{TEMP  old alias
LC.createLabelsForUISlider = sliderLabels.create;
LC.updateLabelsForUISlider = sliderLabels.update;
LC.uiSliderLabelsLayouts = sliderLabels.layouts;
//}

var validationHelper = require('../LC/validationHelper');
//{TEMP  old alias
LC.setupValidation = validationHelper.setup;
LC.setValidationSummaryAsValid = validationHelper.setValidationSummaryAsValid;
LC.goToSummaryErrors = validationHelper.goToSummaryErrors;
//}

LC.placeHolder = require('../LC/placeholder-polyfill').init;

LC.mapReady = require('../LC/googleMapReady');

window.isEmptyString = require('../LC/isEmptyString');

window.guidGenerator = require('../LC/guidGenerator');

var urlUtils = require('../LC/urlUtils');
window.getURLParameter = urlUtils.getURLParameter;
window.getHashBangParameters = urlUtils.getHashBangParameters;

var dateToInterchangeableString = require('../LC/dateToInterchangeableString');
//{TEMP
LC.dateToInterchangleString = dateToInterchangeableString;
//}

// Pages in popup
var welcomePopup = require('./welcomePopup');
//var takeATourPopup = require('takeATourPopup');
var faqsPopups = require('./faqsPopups');
var accountPopups = require('./accountPopups');
var legalPopups = require('./legalPopups');

// Old availablity calendar
var availabilityCalendarWidget = require('./availabilityCalendarWidget');
// New availability calendar
var availabilityCalendar = require('../LC/availabilityCalendar');

var autofillSubmenu = require('../LC/autofillSubmenu');

var tabbedWizard = require('../LC/TabbedUX.wizard');

var hasConfirmSupport = require('../LC/hasConfirmSupport');

var postalCodeValidation = require('../LC/postalCodeServerValidation');

var tabbedNotifications = require('../LC/TabbedUX.changesNotification');

var tabsAutoload = require('../LC/TabbedUX.autoload');

var homePage = require('./home');

//{TEMP remove global dependency for this
window.escapeJQuerySelectorValue = require('../LC/jqueryUtils').escapeJQuerySelectorValue;
//}

var providerWelcome = require('./providerWelcome');

/**
 ** Init code
***/
$(window).load(function () {
  // Disable browser behavior to auto-scroll to url fragment/hash element position:
  // EXCEPT in Dashboard:
  // TODO: Review if this is required only for HowItWorks or something more (tabs, profile)
  // and remove if possible or only on the concrete cases.
  if (!/\/dashboard\//i.test(location))
    setTimeout(function () { $('html,body').scrollTop(0); }, 1);
});
$(function () {

  providerWelcome.show();

  // Placeholder polyfill
  LC.placeHolder();

  // Autofocus polyfill
  LC.autoFocus();

  // Generic script for enhanced tooltips and element descriptions
  LC.initTooltips();

  ajaxForms.init();

  //takeATourPopup.show();
  welcomePopup.show();
  // Enable the use of popups for some links that by default open a new tab:
  faqsPopups.enable(LcUrl.LangPath);
  accountPopups.enable(LcUrl.LangPath);
  legalPopups.enable(LcUrl.LangPath);

  // Old availability calendar
  availabilityCalendarWidget.init(LcUrl.LangPath);
  // New availability calendar
  availabilityCalendar.Weekly.enableAll();

  popup.connectAction();

  // Date Picker
  LC.datePicker.init();

  /* Auto calculate table items total (quantity*unitprice=item-total) script */
  autoCalculate.onTableItems();
  autoCalculate.onSummary();

  hasConfirmSupport.on();

  postalCodeValidation.init({ baseUrl: LcUrl.LangPath });

  // Tabbed interface
  tabsAutoload.init(TabbedUX);
  TabbedUX.init();
  TabbedUX.focusCurrentLocation();
  TabbedUX.checkVolatileTabs();
  sliderTabs.init(TabbedUX);

  tabbedWizard.init(TabbedUX, {
    loadingDelay: gLoadingRetard
  });

  tabbedNotifications.init(TabbedUX);

  autofillSubmenu();

  // TODO: 'loadHashBang' custom event in use?
  // If the hash value follow the 'hash bang' convention, let other
  // scripts do their work throught a 'loadHashBang' event handler
  if (/^#!/.test(window.location.hash))
    $(document).trigger('loadHashBang', window.location.hash.substring(1));

  // Reload buttons
  $(document).on('click', '.reload-action', function () {
    // Generic action to call lc.jquery 'reload' function from an element inside itself.
    var $t = $(this);
    $t.closest($t.data('reload-target')).reload();
  });

  /* Enable focus tab on every hash change, now there are two scripts more specific for this:
  * one when page load (where?),
  * and another only for links with 'target-tab' class.
  * Need be study if something of there must be removed or changed.
  * This is needed for other behaviors to work. */
  // On target-tab links
  $(document).on('click', 'a.target-tab', function () {
    var thereIsTab = TabbedUX.getTab($(this).attr('href'));
    if (thereIsTab) {
      TabbedUX.focusTab(thereIsTab);
      return false;
    }
  });
  // On hash change
  if ($.fn.hashchange)
    $(window).hashchange(function () {
      if (!/^#!/.test(location.hash)) {
        var thereIsTab = TabbedUX.getTab(location.hash);
        if (thereIsTab)
          TabbedUX.focusTab(thereIsTab);
      }
    });

  // HOME PAGE / SEARCH STUFF
  homePage.init();

  // Validation auto setup for page ready and after every ajax request
  // if there is almost one form in the page.
  // This avoid the need for every page with form to do the setup itself
  // almost for most of the case.
  function autoSetupValidation() {
    if ($(document).has('form').length)
      validationHelper.setup('form');
  }
  autoSetupValidation();
  $(document).ajaxComplete(autoSetupValidation);

  // TODO: used some time? still required using modules?
  /*
  * Communicate that script.js is ready to be used
  * and the common LC lib too.
  * Both are ensured to be raised ever after page is ready too.
  */
  $(document)
    .trigger('lcScriptReady')
    .trigger('lcLibReady');
});
},{"../LC/Array.remove":1,"../LC/Cookie":7,"../LC/LcUrl":10,"../LC/Price":11,"../LC/String.prototype.contains":15,"../LC/StringFormat":"KqXDvj","../LC/TabbedUX":20,"../LC/TabbedUX.autoload":18,"../LC/TabbedUX.changesNotification":19,"../LC/TabbedUX.sliderTabs":21,"../LC/TabbedUX.wizard":22,"../LC/TimeSpan":"rqZkA9","../LC/TimeSpanExtra":"5OLBBz","../LC/UISliderLabels":27,"../LC/ajaxCallbacks":28,"../LC/ajaxForms":29,"../LC/autoCalculate":30,"../LC/autoFocus":31,"../LC/autofillSubmenu":32,"../LC/availabilityCalendar":"xu1BAO","../LC/blockPresets":43,"../LC/changesNotification":"f5kckb","../LC/crudl":47,"../LC/datePicker":50,"../LC/dateToInterchangeableString":51,"../LC/getText":"qf5Iz3","../LC/getXPath":54,"../LC/googleMapReady":"ygr/Yz","../LC/guidGenerator":57,"../LC/hasConfirmSupport":58,"../LC/i18n":59,"../LC/isEmptyString":60,"../LC/jquery.are":61,"../LC/jquery.hasScrollBar":63,"../LC/jquery.reload":66,"../LC/jquery.xtsh":67,"../LC/jqueryUtils":"7/CV3J","../LC/loader":70,"../LC/mathUtils":71,"../LC/moveFocusTo":"9RKOGW","../LC/numberUtils":74,"../LC/placeholder-polyfill":75,"../LC/popup":76,"../LC/postalCodeServerValidation":77,"../LC/sanitizeWhitespaces":79,"../LC/smoothBoxBlock":"KQGzNM","../LC/tooltips":"UTsC2v","../LC/urlUtils":84,"../LC/validationHelper":"kqf9lt","./accountPopups":87,"./availabilityCalendarWidget":89,"./faqsPopups":90,"./home":91,"./legalPopups":92,"./providerWelcome":93,"./welcomePopup":94}],89:[function(require,module,exports){
/***** AVAILABILITY CALENDAR WIDGET *****/
var $ = require('jquery'),
    smoothBoxBlock = require('../LC/smoothBoxBlock'),
    dateToInterchangeableString = require('../LC/dateToInterchangeableString');
require('../LC/jquery.reload');

exports.init = function initAvailabilityCalendarWidget(baseUrl) {
    $(document).on('click', '.calendar-controls .action', function () {
        var $t = $(this);
        if ($t.hasClass('zoom-action')) {
            // Do zoom
            var c = $t.closest('.availability-calendar').find('.calendar').clone();
            c.css('font-size', '2px');
            var tab = $t.closest('.tab-body');
            c.data('popup-container', tab);
            smoothBoxBlock.open(c, tab, 'availability-calendar', { closable: true });
            // Nothing more
            return;
        }
        // Navigate calendar
        var next = $t.hasClass('next-week-action');
        var cont = $t.closest('.availability-calendar');
        var calcont = cont.children('.calendar-container');
        var cal = calcont.children('.calendar');
        var calinfo = cont.find('.calendar-info');
        var date = new Date(cal.data('showed-date'));
        var userId = cal.data('user-id');
        if (next)
            date.setDate(date.getDate() + 7);
        else
            date.setDate(date.getDate() - 7);
        var strdate = dateToInterchangeableString(date);
        var url = baseUrl + "Profile/$AvailabilityCalendarWidget/Week/" + encodeURIComponent(strdate) + "/?UserID=" + userId;
        calcont.reload(url, function () {
            // get the new object:
            var cal = $('.calendar', this.element);
            calinfo.find('.year-week').text(cal.data('showed-week'));
            calinfo.find('.first-week-day').text(cal.data('showed-first-day'));
            calinfo.find('.last-week-day').text(cal.data('showed-last-day'));
        });
        return false;
    });
};
},{"../LC/dateToInterchangeableString":51,"../LC/jquery.reload":66,"../LC/smoothBoxBlock":"KQGzNM"}],90:[function(require,module,exports){
/**
    Enable the use of popups to show links to FAQs (default links behavior is to open in a new tab)
**/
var $ = require('jquery');

var faqsBaseUrl = 'HelpCenter/$FAQs';

exports.enable = function (baseUrl) {
  faqsBaseUrl = (baseUrl || '/') + faqsBaseUrl;

  // Enable FAQs links in popup
  $(document).on('click', 'a[href|="#FAQs"]', popupFaqs);

  // Auto open current document location if hash is a FAQ link
  if (/^#FAQs/i.test(location.hash)) {
    popupFaqs(location.hash);
  }

  // return as utility
  return popupFaqs;
};

/* Pass a Faqs @url or use as a link handler to open the FAQ in a popup
 */
function popupFaqs(url) {
  url = typeof (url) === 'string' ? url : $(this).attr('href');

  var urlparts = url.split('-');

  if (urlparts[0] != '#FAQs') {
    if (console && console.error) console.error('The URL is not a FAQ url (doesn\'t starts with #FAQs-)', url);
    return true;
  }

  var urlsection = urlparts.length > 1 ? urlparts[1] : '';

  if (urlsection) {
    var pup = popup(faqsBaseUrl + urlsection, 'large', function () {
      var d = $(url),
        pel = pup.getContentElement();
      pel.scrollTop(pel.scrollTop() + d.position().top - 50);
      setTimeout(function () {
        d.effect("highlight", {}, 2000);
      }, 400);
    });
  }
  return false;
}
},{}],91:[function(require,module,exports){
/* INIT */
exports.init = function () {
    // Location js-dropdown
    var s = $('#search-location');
    s.prop('readonly', true);
    s.autocomplete({
        source: LC.searchLocations
                                , autoFocus: true
                                , minLength: 0
                                , select: function () {
                                    return false;
                                }
    });
    s.on('focus click', function () { s.autocomplete('search', ''); });

    /* Positions autocomplete */
    var positionsAutocomplete = $('#search-service').autocomplete({
        source: LcUrl.JsonPath + 'GetPositions/Autocomplete/',
        autoFocus: false,
        minLength: 0,
        select: function (event, ui) {
            // We want show the label (position name) in the textbox, not the id-value
            //$(this).val(ui.item.label);
            $(this).val(ui.item.positionSingular);
            return false;
        },
        focus: function (event, ui) {
            if (!ui || !ui.item || !ui.item.positionSingular);
            // We want the label in textbox, not the value
            //$(this).val(ui.item.label);
            $(this).val(ui.item.positionSingular);
            return false;
        }
    });
    // Load all positions in background to replace the autocomplete source (avoiding multiple, slow look-ups)
    /*$.getJSON(LcUrl.JsonPath + 'GetPositions/Autocomplete/',
    function (data) {
    positionsAutocomplete.autocomplete('option', 'source', data);
    }
    );*/
};
},{}],92:[function(require,module,exports){
/**
    Enable the use of popups to show links to some Legal pages (default links behavior is to open in a new tab)
**/
var $ = require('jquery');

exports.enable = function (baseUrl) {
    $(document)
    .on('click', '.view-privacy-policy', function () {
        popup(baseUrl + 'HelpCenter/$PrivacyPolicy/', 'large');
        return false;
    })
    .on('click', '.view-terms-of-use', function () {
        popup(baseUrl + 'HelpCenter/$TermsOfUse/', 'large');
        return false;
    });
};
},{}],93:[function(require,module,exports){
/**
* Provider Welcome page
*/
var $ = require('jquery');
var SimpleSlider = require('LC/SimpleSlider');

exports.show = function providerWelcome() {
  $('.ProviderWelcome .ProviderWelcome-presentation').each(function () {
    var t = $(this),
      slider = new SimpleSlider({
        element: t,
        selectors: {
          slides: '.ProviderWelcome-presentation-slides',
          slide: '.ProviderWelcome-presentation-slide'
        },
        currentSlideClass: 'js-isCurrent',
        hrefPrefix: 'goSlide_',
        // Duration of each slide in milliseconds
        duration: 1000
      });

    // Slide steps actions initially hidden, visible after 'start'
    var slidesActions = t.find('.ProviderWelcome-presentation-actions-slides').hide();
    t.find('.ProviderWelcome-presentation-actions-start .start-action').on('click', function () {
      $(this).hide();
      slidesActions.fadeIn(1000);
    });
  });
};

},{"LC/SimpleSlider":"aFoCK0"}],94:[function(require,module,exports){
/**
* Welcome popup
*/
var $ = require('jquery');
// bootstrap tooltips:
require('bootstrap');
//TODO more dependencies?

exports.show = function welcomePopup() {
  var c = $('#welcomepopup');
  if (c.length === 0) return;
  var skipStep1 = c.hasClass('select-position');

  // Init
  if (!skipStep1) {
    c.find('.profile-data, .terms, .position-description').hide();
  }
  c.find('form').get(0).reset();

  // Description show-up on autocomplete variations
  var showPositionDescription = {
    /**
    Show description in a textarea under the position singular,
    its showed on demand.
    **/
    textarea: function (event, ui) {
      c.find('.position-description')
      .slideDown('fast')
      .find('textarea').val(ui.item.description);
    },
    /**
    Show description in a tooltip that comes from the position singular
    field
    **/
    tooltip: function (event, ui) {
      // It needs to be destroyed (no problem the first time)
      // to get it updated on succesive attempts
      var el = $(this);
      el
      .popover('destroy')
      .popover({
        title: 'Does this sound like you?',
        content: ui.item.description,
        trigger: 'focus',
        placement: 'left'
      })
      .popover('show')
      // Hide on possible position name change to avoid confusions
      // (we can't use on-change, need to be keypress; its namespaced
      // to let off and on every time to avoid multiple handler registrations)
      .off('keypress.description-tooltip')
      .on('keypress..description-tooltip', function () {
        el.popover('hide');
      });

    }
  };

  // Re-enable autocomplete:
  setTimeout(function () { c.find('[placeholder]').placeholder(); }, 500);
  function setupPositionAutocomplete(seletCallback) {
    c.find('[name=jobtitle]').autocomplete({
      source: LcUrl.JsonPath + 'GetPositions/Autocomplete/',
      autoFocus: false,
      minLength: 0,
      select: function (event, ui) {
        // No value, no action :(
        if (!ui || !ui.item || !ui.item.value) return;
        // Save the id (value) in the hidden element
        c.find('[name=positionid]').val(ui.item.value);

        seletCallback.call(this, event, ui);

        // We want to show the label (position name) in the textbox, not the id-value
        $(this).val(ui.item.positionSingular);

        return false;
      },
      focus: function (event, ui) {
        if (!ui || !ui.item || !ui.item.positionSingular) return false;
        // We want the label in textbox, not the value
        $(this).val(ui.item.positionSingular);
        return false;
      }
    });
  }
  setupPositionAutocomplete(showPositionDescription.tooltip);
  c.find('#welcomepopupLoading').remove();

  // Actions
  c.on('change', '.profile-choice [name=profile-type]', function () {
    c.find('.profile-data li:not(.' + this.value + ')').hide();
    c.find('.profile-choice, header .presentation').slideUp('fast');
    c.find('.terms, .profile-data').slideDown('fast');
    // Terms of use different for profile type
    if (this.value == 'customer')
      c.find('a.terms-of-use').data('tooltip-url', null);
    // Change facebook redirect link
    var fbc = c.find('.facebook-connect');
    var addRedirect = 'customers';
    if (this.value == 'provider')
      addRedirect = 'providers';
    fbc.data('redirect', fbc.data('redirect') + addRedirect);
    fbc.data('profile', this.value);

    // Set validation-required for depending of profile-type form elements:
    c.find('.profile-data li.' + this.value + ' input:not([data-val]):not([type=hidden])')
                    .attr('data-val-required', '')
                    .attr('data-val', true);
    LC.setupValidation();
  });
  c.on('ajaxFormReturnedHtml', 'form.ajax', function () {
    setupPositionAutocomplete(showPositionDescription.tooltip);
    c.find('.profile-choice [name=profile-type]:checked').change();
  });

  // If profile type is prefilled by request:
  c.find('.profile-choice [name=profile-type]:checked').change();
};

},{}]},{},[88,"cwp+TC","0dIKTs","aFoCK0"])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0FycmF5LnJlbW92ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9CaW5kYWJsZUNvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9Db21wb25lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ1gvRGF0YVNvdXJjZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9MY1dpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9leHRlbmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ29va2llLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0ZhY2Vib29rQ29ubmVjdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9MY1VybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9QcmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9SZWdFeHAucXVvdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU2ltcGxlU2xpZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvTW9udGhseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9XZWVrbHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvV29ya0hvdXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2NsZWFyQ3VycmVudFNlbGVjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9kYXRlVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvZm9ybWF0RGF0ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9tYWtlVW5zZWxlY3RhYmxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL3V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2Jsb2NrUHJlc2V0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NyZWF0ZUlmcmFtZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlSVNPODYwMS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9nZXRUZXh0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFhQYXRoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dvb2dsZU1hcFJlYWR5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2d1aWRHZW5lcmF0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaGFzQ29uZmlybVN1cHBvcnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaTE4bi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pc0VtcHR5U3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5hcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmJvdW5kcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5pc0NoaWxkT2YuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lm91dGVySHRtbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkucmVsb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS54dHNoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeVV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tYXRoVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbnVtYmVyVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcGxhY2Vob2xkZXItcG9seWZpbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Ntb290aEJveEJsb2NrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Rvb2x0aXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3VybFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3ZhbGlkYXRpb25IZWxwZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FjY291bnRQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2ZhcXNQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2xlZ2FsUG9wdXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9wcm92aWRlcldlbGNvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3dlbGNvbWVQb3B1cC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBcnJheSBSZW1vdmUgLSBCeSBKb2huIFJlc2lnIChNSVQgTGljZW5zZWQpXHJcbi8qQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xyXG5JYWdvU1JMOiBpdCBzZWVtcyBpbmNvbXBhdGlibGUgd2l0aCBNb2Rlcm5penIgbG9hZGVyIGZlYXR1cmUgbG9hZGluZyBaZW5kZXNrIHNjcmlwdCxcclxubW92ZWQgZnJvbSBwcm90b3R5cGUgdG8gYSBjbGFzcy1zdGF0aWMgbWV0aG9kICovXHJcbmZ1bmN0aW9uIGFycmF5UmVtb3ZlKGFuQXJyYXksIGZyb20sIHRvKSB7XHJcbiAgICB2YXIgcmVzdCA9IGFuQXJyYXkuc2xpY2UoKHRvIHx8IGZyb20pICsgMSB8fCBhbkFycmF5Lmxlbmd0aCk7XHJcbiAgICBhbkFycmF5Lmxlbmd0aCA9IGZyb20gPCAwID8gYW5BcnJheS5sZW5ndGggKyBmcm9tIDogZnJvbTtcclxuICAgIHJldHVybiBhbkFycmF5LnB1c2guYXBwbHkoYW5BcnJheSwgcmVzdCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcnJheVJlbW92ZTtcclxufSBlbHNlIHtcclxuICAgIEFycmF5LnJlbW92ZSA9IGFycmF5UmVtb3ZlO1xyXG59IiwiLyoqXHJcbiAgQmluZGFibGUgVUkgQ29tcG9uZW50LlxyXG4gIEl0IHJlbGllcyBvbiBDb21wb25lbnQgYnV0IGFkZHMgRGF0YVNvdXJjZSBjYXBhYmlsaXRpZXNcclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL0NvbXBvbmVudCcpO1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKS5leHRlbmQ7XHJcblxyXG4vKipcclxuUmV1c2luZyB0aGUgb3JpZ2luYWwgZmV0Y2hEYXRhIG1ldGhvZCBidXQgYWRkaW5nIGNsYXNzZXMgdG8gb3VyXHJcbmNvbXBvbmVudCBlbGVtZW50IGZvciBhbnkgdmlzdWFsIG5vdGlmaWNhdGlvbiBvZiB0aGUgZGF0YSBsb2FkaW5nLlxyXG5NZXRob2QgZ2V0IGV4dGVuZGVkIHdpdGggaXNQcmVmZXRjaGluZyBtZXRob2QgZm9yIGRpZmZlcmVudFxyXG5jbGFzc2VzL25vdGlmaWNhdGlvbnMgZGVwZW5kYW50IG9uIHRoYXQgZmxhZywgYnkgZGVmYXVsdCBmYWxzZTpcclxuKiovXHJcbnZhciBjb21wb25lbnRGZXRjaERhdGEgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZldGNoRGF0YShxdWVyeURhdGEsIG1vZGUsIGlzUHJlZmV0Y2hpbmcpIHtcclxuICB2YXIgY2wgPSBpc1ByZWZldGNoaW5nID8gdGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIDogdGhpcy5jbGFzc2VzLmZldGNoaW5nO1xyXG4gIHRoaXMuJGVsLmFkZENsYXNzKGNsKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHZhciByZXEgPSBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEuY2FsbCh0aGlzLCBxdWVyeURhdGEsIG1vZGUpXHJcbiAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC4kZWwucmVtb3ZlQ2xhc3MoY2wgfHwgJ18nKVxyXG4gICAgLy8gUmVtb3ZlIGVycm9yIGNsYXNzIHRvbyAodG8gZmlsbCB0aGUgY2FzZSBvZiBhIHByZXZpb3VzIGVycm9yKVxyXG4gICAgLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5oYXNEYXRhRXJyb3IgfHwgJ18nKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHJlcTtcclxufTtcclxuLyoqXHJcblJlcGxhY2luZywgYnV0IHJldXNpbmcgaW50ZXJuYWxzLCB0aGUgZGVmYXVsdCBvbmVycm9yIGNhbGxiYWNrIGZvciB0aGVcclxuZmV0Y2hEYXRhIGZ1bmN0aW9uIHRvIGFkZCBub3RpZmljYXRpb24gY2xhc3NlcyB0byBvdXIgY29tcG9uZW50IG1vZGVsXHJcbioqL1xyXG5jb21wb25lbnRGZXRjaERhdGEub25lcnJvciA9IGZ1bmN0aW9uIGJpbmRhYmxlQ29tcG9uZW50RmVjaERhdGFPbmVycm9yKHgsIHMsIGUpIHtcclxuICBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEub25lcnJvci5jYWxsKHRoaXMsIHgsIHMsIGUpO1xyXG4gIC8vIEFkZCBlcnJvciBjbGFzczpcclxuICB0aGlzLiRlbFxyXG4gIC5hZGRDbGFzcyh0aGlzLmNsYXNzZXMuaGFzRGF0YUVycm9yKVxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKVxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMucHJlZmV0Y2hpbmcgfHwgJ18nKTtcclxufTtcclxuXHJcbi8qKlxyXG4gIEJpbmRhYmxlQ29tcG9uZW50IGNsYXNzXHJcbioqL1xyXG52YXIgQmluZGFibGVDb21wb25lbnQgPSBDb21wb25lbnQuZXh0ZW5kKFxyXG4gIERhdGFTb3VyY2UucHJvdG90eXBlLFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIGNsYXNzZXM6IHtcclxuICAgICAgZmV0Y2hpbmc6ICdpcy1sb2FkaW5nJyxcclxuICAgICAgcHJlZmV0Y2hpbmc6ICdpcy1wcmVsb2FkaW5nJyxcclxuICAgICAgZGlzYWJsZWQ6ICdpcy1kaXNhYmxlZCcsXHJcbiAgICAgIGhhc0RhdGFFcnJvcjogJ2hhcy1kYXRhRXJyb3InXHJcbiAgICB9LFxyXG4gICAgZmV0Y2hEYXRhOiBjb21wb25lbnRGZXRjaERhdGEsXHJcbiAgICAvLyBXaGF0IGF0dHJpYnV0ZSBuYW1lIHVzZSB0byBtYXJrIGVsZW1lbnRzIGluc2lkZSB0aGUgY29tcG9uZW50XHJcbiAgICAvLyB3aXRoIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBzb3VyY2UgdG8gYmluZC5cclxuICAgIC8vIFRoZSBwcmVmaXggJ2RhdGEtJyBpbiBjdXN0b20gYXR0cmlidXRlcyBpcyByZXF1aXJlZCBieSBodG1sNSxcclxuICAgIC8vIGp1c3Qgc3BlY2lmeSB0aGUgc2Vjb25kIHBhcnQsIGJlaW5nICdiaW5kJyB0aGUgYXR0cmlidXRlXHJcbiAgICAvLyBuYW1lIHRvIHVzZSBpcyAnZGF0YS1iaW5kJ1xyXG4gICAgZGF0YUJpbmRBdHRyaWJ1dGU6ICdiaW5kJyxcclxuICAgIC8vIERlZmF1bHQgYmluZERhdGEgaW1wbGVtZW50YXRpb24sIGNhbiBiZSByZXBsYWNlIG9uIGV4dGVuZGVkIGNvbXBvbmVudHNcclxuICAgIC8vIHRvIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggKGxpc3QvY29sbGVjdGlvbnMsIHN1Yi1vYmplY3RzLCBjdXN0b20gc3RydWN0dXJlc1xyXG4gICAgLy8gYW5kIHZpc3VhbGl6YXRpb24gLS1rZWVwIGFzIHBvc3NpYmxlIHRoZSB1c2Ugb2YgZGF0YUJpbmRBdHRyaWJ1dGUgZm9yIHJldXNhYmxlIGNvZGUpLlxyXG4gICAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiB3b3JrcyBmaW5lIGZvciBkYXRhIGFzIHBsYWluIG9iamVjdCB3aXRoIFxyXG4gICAgLy8gc2ltcGxlIHR5cGVzIGFzIHByb3BlcnRpZXMgKG5vdCBvYmplY3RzIG9yIGFycmF5cyBpbnNpZGUgdGhlbSkuXHJcbiAgICBiaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGEoKSB7XHJcbiAgICAgIGlmICghdGhpcy5kYXRhKSByZXR1cm47XHJcbiAgICAgIC8vIENoZWNrIGV2ZXJ5IGVsZW1lbnQgaW4gdGhlIGNvbXBvbmVudCB3aXRoIGEgYmluZFxyXG4gICAgICAvLyBwcm9wZXJ0eSBhbmQgdXBkYXRlIGl0IHdpdGggdGhlIHZhbHVlIG9mIHRoYXQgcHJvcGVydHlcclxuICAgICAgLy8gZnJvbSB0aGUgZGF0YSBzb3VyY2VcclxuICAgICAgdmFyIGF0dCA9IHRoaXMuZGF0YUJpbmRBdHRyaWJ1dGU7XHJcbiAgICAgIHZhciBhdHRyU2VsZWN0b3IgPSAnW2RhdGEtJyArIGF0dCArICddJztcclxuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICB0aGlzLiRlbC5maW5kKGF0dHJTZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKSxcclxuICAgICAgICAgIHByb3AgPSAkdC5kYXRhKGF0dCksXHJcbiAgICAgICAgICBiaW5kZWRWYWx1ZSA9IHRoYXQuZGF0YVtwcm9wXTtcclxuXHJcbiAgICAgICAgaWYgKCR0LmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICR0LnZhbChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgJHQudGV4dChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gQ29uc3RydWN0b3JcclxuICBmdW5jdGlvbiBCaW5kYWJsZUNvbXBvbmVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICBDb21wb25lbnQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLmRhdGEgPSB0aGlzLiRlbC5kYXRhKCdzb3VyY2UnKSB8fCB0aGlzLmRhdGEgfHwge307XHJcbiAgICBpZiAodHlwZW9mICh0aGlzLmRhdGEpID09ICdzdHJpbmcnKVxyXG4gICAgICB0aGlzLmRhdGEgPSBKU09OLnBhcnNlKHRoaXMuZGF0YSk7XHJcblxyXG4gICAgLy8gT24gaHRtbCBzb3VyY2UgdXJsIGNvbmZpZ3VyYXRpb246XHJcbiAgICB0aGlzLnVybCA9IHRoaXMuJGVsLmRhdGEoJ3NvdXJjZS11cmwnKSB8fCB0aGlzLnVybDtcclxuXHJcbiAgICAvLyBUT0RPOiAnY2hhbmdlJyBldmVudCBoYW5kbGVycyBvbiBmb3JtcyB3aXRoIGRhdGEtYmluZCB0byB1cGRhdGUgaXRzIHZhbHVlIGF0IHRoaXMuZGF0YVxyXG4gICAgLy8gVE9ETzogYXV0byAnYmluZERhdGEnIG9uIGZldGNoRGF0YSBlbmRzPyBjb25maWd1cmFibGUsIGJpbmREYXRhTW9kZXsgaW5tZWRpYXRlLCBub3RpZnkgfVxyXG4gIH1cclxuKTtcclxuXHJcbi8vIFB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gQmluZGFibGVDb21wb25lbnQ7IiwiLyoqIENvbXBvbmVudCBjbGFzczogd3JhcHBlciBmb3JcclxuICB0aGUgbG9naWMgYW5kIGJlaGF2aW9yIGFyb3VuZFxyXG4gIGEgRE9NIGVsZW1lbnRcclxuKiovXHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpO1xyXG5cclxuZnVuY3Rpb24gQ29tcG9uZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICB0aGlzLmVsID0gZWxlbWVudDtcclxuICB0aGlzLiRlbCA9ICQoZWxlbWVudCk7XHJcbiAgZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIC8vIFVzZSB0aGUgalF1ZXJ5ICdkYXRhJyBzdG9yYWdlIHRvIHByZXNlcnZlIGEgcmVmZXJlbmNlXHJcbiAgLy8gdG8gdGhpcyBpbnN0YW5jZSAodXNlZnVsIHRvIHJldHJpZXZlIGl0IGZyb20gZG9jdW1lbnQpXHJcbiAgdGhpcy4kZWwuZGF0YSgnY29tcG9uZW50JywgdGhpcyk7XHJcbn1cclxuXHJcbmV4dGVuZC5wbHVnSW4oQ29tcG9uZW50KTtcclxuZXh0ZW5kLnBsdWdJbihDb21wb25lbnQucHJvdG90eXBlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50OyIsIi8qKlxyXG4gIERhdGFTb3VyY2UgY2xhc3MgdG8gc2ltcGxpZnkgZmV0Y2hpbmcgZGF0YSBhcyBKU09OXHJcbiAgdG8gZmlsbCBhIGxvY2FsIGNhY2hlLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGZldGNoSlNPTiA9ICQuZ2V0SlNPTixcclxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyB9O1xyXG5cclxuLy8gVE9ETzogcmVwbGFjZSBlYWNoIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBieSBpbnN0YW5jZSBwcm9wZXJ0aWVzLCBzaW5jZSB0aGF0IHByb3BlcnRpZXMgYmVjb21lXHJcbi8vIHNoYXJlZCBiZXR3ZWVuIGluc3RhbmNlcyBhbmQgaXMgbm90IHdhbnRlZFxyXG5cclxudmFyIHJlcU1vZGVzID0gRGF0YVNvdXJjZS5yZXF1ZXN0TW9kZXMgPSB7XHJcbiAgLy8gUGFyYWxsZWwgcmVxdWVzdCwgbm8gbWF0dGVyIG9mIG90aGVyc1xyXG4gIG11bHRpcGxlOiAwLFxyXG4gIC8vIFdpbGwgYXZvaWQgYSByZXF1ZXN0IGlmIHRoZXJlIGlzIG9uZSBydW5uaW5nXHJcbiAgc2luZ2xlOiAxLFxyXG4gIC8vIExhdGVzdCByZXF1ZXQgd2lsbCByZXBsYWNlIGFueSBwcmV2aW91cyBvbmUgKHByZXZpb3VzIHdpbGwgYWJvcnQpXHJcbiAgcmVwbGFjZTogMlxyXG59O1xyXG5cclxudmFyIHVwZE1vZGVzID0gRGF0YVNvdXJjZS51cGRhdGVNb2RlcyA9IHtcclxuICAvLyBFdmVyeSBuZXcgZGF0YSB1cGRhdGUsIG5ldyBjb250ZW50IGlzIGFkZGVkIGluY3JlbWVudGFsbHlcclxuICAvLyAob3ZlcndyaXRlIGNvaW5jaWRlbnQgY29udGVudCwgYXBwZW5kIG5ldyBjb250ZW50LCBvbGQgY29udGVudFxyXG4gIC8vIGdldCBpbiBwbGFjZSlcclxuICBpbmNyZW1lbnRhbDogMCxcclxuICAvLyBPbiBuZXcgZGF0YSB1cGRhdGUsIG5ldyBkYXRhIHRvdGFsbHkgcmVwbGFjZSB0aGUgcHJldmlvdXMgb25lXHJcbiAgcmVwbGFjZW1lbnQ6IDFcclxufTtcclxuXHJcbi8qKlxyXG5VcGRhdGUgdGhlIGRhdGEgc3RvcmUgb3IgY2FjaGUgd2l0aCB0aGUgZ2l2ZW4gb25lLlxyXG5UaGVyZSBhcmUgZGlmZmVyZW50IG1vZGVzLCB0aGlzIG1hbmFnZXMgdGhhdCBsb2dpYyBhbmRcclxuaXRzIG93biBjb25maWd1cmF0aW9uLlxyXG5JcyBkZWNvdXBsZWQgZnJvbSB0aGUgcHJvdG90eXBlIGJ1dFxyXG5pdCB3b3JrcyBvbmx5IGFzIHBhcnQgb2YgYSBEYXRhU291cmNlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0YShkYXRhLCBtb2RlKSB7XHJcbiAgc3dpdGNoIChtb2RlIHx8IHRoaXMudXBkYXRlRGF0YS5kZWZhdWx0VXBkYXRlTW9kZSkge1xyXG5cclxuICAgIGNhc2UgdXBkTW9kZXMucmVwbGFjZW1lbnQ6XHJcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vY2FzZSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDogIFxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgLy8gSW4gY2FzZSBpbml0aWFsIGRhdGEgaXMgbnVsbCwgYXNzaWduIHRoZSByZXN1bHQgdG8gaXRzZWxmOlxyXG4gICAgICB0aGlzLmRhdGEgPSBleHRlbmQodGhpcy5kYXRhLCBkYXRhKTtcclxuICAgICAgYnJlYWs7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogRGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGNvbmZpZ3VyYWJsZSB1cGRhdGUgbW9kZTpcclxuKiovXHJcbnVwZGF0ZURhdGEuZGVmYXVsdFVwZGF0ZU1vZGUgPSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDtcclxuXHJcbi8qKlxyXG5GZXRjaCB0aGUgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuXHJcbkhlcmUgaXMgZGVjb3VwbGVkIGZyb20gdGhlIHJlc3Qgb2YgdGhlIHByb3RvdHlwZSBmb3JcclxuY29tbW9kaXR5LCBidXQgaXQgY2FuIHdvcmtzIG9ubHkgYXMgcGFydCBvZiBhIERhdGFTb3VyY2UgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiBmZXRjaERhdGEocXVlcnksIG1vZGUpIHtcclxuICBxdWVyeSA9IGV4dGVuZCh7fSwgdGhpcy5xdWVyeSwgcXVlcnkpO1xyXG4gIHN3aXRjaCAobW9kZSB8fCB0aGlzLmZldGNoRGF0YS5kZWZhdWx0UmVxdWVzdE1vZGUpIHtcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnNpbmdsZTpcclxuICAgICAgaWYgKHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkgcmV0dXJuIG51bGw7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgcmVxTW9kZXMucmVwbGFjZTpcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0c1tpXS5hYm9ydCgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7IH1cclxuICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cyA9IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vIEp1c3QgZG8gbm90aGluZyBmb3IgbXVsdGlwbGUgb3IgZGVmYXVsdCAgICAgXHJcbiAgICAvL2Nhc2UgcmVxTW9kZXMubXVsdGlwbGU6ICBcclxuICAgIC8vZGVmYXVsdDogXHJcbiAgfVxyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIHJlcSA9IHRoaXMuZmV0Y2hEYXRhLnByb3h5KFxyXG4gICAgdGhpcy51cmwsXHJcbiAgICBxdWVyeSxcclxuICAgIGZ1bmN0aW9uIChkYXRhLCB0LCB4aHIpIHtcclxuICAgICAgdmFyIHJldCA9IHRoYXQudXBkYXRlRGF0YShkYXRhKTtcclxuICAgICAgdGhhdC5mZXRjaERhdGEucmVxdWVzdHMuc3BsaWNlKHRoYXQuZmV0Y2hEYXRhLnJlcXVlc3RzLmluZGV4T2YocmVxKSwgMSk7XHJcbiAgICAgIC8vZGVsZXRlIGZldGNoRGF0YS5yZXF1ZXN0c1tmZXRjaERhdGEucmVxdWVzdHMuaW5kZXhPZihyZXEpXTtcclxuXHJcbiAgICAgIGlmIChyZXQgJiYgcmV0Lm5hbWUpIHtcclxuICAgICAgICAvLyBVcGRhdGUgZGF0YSBlbWl0cyBlcnJvciwgdGhlIEFqYXggc3RpbGwgcmVzb2x2ZXMgYXMgJ3N1Y2Nlc3MnIGJlY2F1c2Ugb2YgdGhlIHJlcXVlc3QsIGJ1dFxyXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gZXhlY3V0ZSB0aGUgZXJyb3IsIGJ1dCB3ZSBwaXBlIGl0IHRvIGVuc3VyZSBpcyBkb25lIGFmdGVyIG90aGVyICdkb25lJyBjYWxsYmFja3NcclxuICAgICAgICByZXEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHRoYXQuZmV0Y2hEYXRhLm9uZXJyb3IuY2FsbCh0aGF0LCBudWxsLCByZXQubmFtZSwgcmV0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuICApXHJcbiAgLmZhaWwoJC5wcm94eSh0aGlzLmZldGNoRGF0YS5vbmVycm9yLCB0aGlzKSk7XHJcbiAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMucHVzaChyZXEpO1xyXG5cclxuICByZXR1cm4gcmVxO1xyXG59XHJcblxyXG4vLyBEZWZhdWx0cyBmZXRjaERhdGEgcHJvcGVydGllcywgdGhleSBhcmUgZGVjb3VwbGVkIHRvIGFsbG93XHJcbi8vIHJlcGxhY2VtZW50LCBhbmQgaW5zaWRlIHRoZSBmZXRjaERhdGEgZnVuY3Rpb24gdG8gZG9uJ3RcclxuLy8gY29udGFtaW5hdGUgdGhlIG9iamVjdCBuYW1lc3BhY2UuXHJcblxyXG4vKiBDb2xsZWN0aW9uIG9mIGFjdGl2ZSAoZmV0Y2hpbmcpIHJlcXVlc3RzIHRvIHRoZSBzZXJ2ZXJcclxuKi9cclxuZmV0Y2hEYXRhLnJlcXVlc3RzID0gW107XHJcblxyXG4vKiBEZWNvdXBsZWQgZnVuY3Rpb25hbGl0eSB0byBwZXJmb3JtIHRoZSBBamF4IG9wZXJhdGlvbixcclxudGhpcyBhbGxvd3Mgb3ZlcndyaXRlIHRoaXMgYmVoYXZpb3IgdG8gaW1wbGVtZW50IGFub3RoZXJcclxud2F5cywgbGlrZSBhIG5vbi1qUXVlcnkgaW1wbGVtZW50YXRpb24sIGEgcHJveHkgdG8gZmFrZSBzZXJ2ZXJcclxuZm9yIHRlc3Rpbmcgb3IgcHJveHkgdG8gbG9jYWwgc3RvcmFnZSBpZiBvbmxpbmUsIGV0Yy5cclxuSXQgbXVzdCByZXR1cm5zIHRoZSB1c2VkIHJlcXVlc3Qgb2JqZWN0LlxyXG4qL1xyXG5mZXRjaERhdGEucHJveHkgPSBmZXRjaEpTT047XHJcblxyXG4vKiBCeSBkZWZhdWx0LCBmZXRjaERhdGEgYWxsb3dzIG11bHRpcGxlIHNpbXVsdGFuZW9zIGNvbm5lY3Rpb24sXHJcbnNpbmNlIHRoZSBzdG9yYWdlIGJ5IGRlZmF1bHQgYWxsb3dzIGluY3JlbWVudGFsIHVwZGF0ZXMgcmF0aGVyXHJcbnRoYW4gcmVwbGFjZW1lbnRzLlxyXG4qL1xyXG5mZXRjaERhdGEuZGVmYXVsdFJlcXVlc3RNb2RlID0gcmVxTW9kZXMubXVsdGlwbGU7XHJcblxyXG4vKiBEZWZhdWx0IG5vdGlmaWNhdGlvbiBvZiBlcnJvciBvbiBmZXRjaGluZywganVzdCBsb2dnaW5nLFxyXG5jYW4gYmUgcmVwbGFjZWQuXHJcbkl0IHJlY2VpdmVzIHRoZSByZXF1ZXN0IG9iamVjdCwgc3RhdHVzIGFuZCBlcnJvci5cclxuKi9cclxuZmV0Y2hEYXRhLm9uZXJyb3IgPSBmdW5jdGlvbiBlcnJvcih4LCBzLCBlKSB7XHJcbiAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignRmV0Y2ggZGF0YSBlcnJvciAlbycsIGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgRGF0YVNvdXJjZSBjbGFzc1xyXG4qKi9cclxuLy8gQ29uc3RydWN0b3I6IGV2ZXJ5dGhpbmcgaXMgaW4gdGhlIHByb3RvdHlwZS5cclxuZnVuY3Rpb24gRGF0YVNvdXJjZSgpIHsgfVxyXG5EYXRhU291cmNlLnByb3RvdHlwZSA9IHtcclxuICBkYXRhOiBudWxsLFxyXG4gIHVybDogJy8nLFxyXG4gIC8vIHF1ZXJ5OiBvYmplY3Qgd2l0aCBkZWZhdWx0IGV4dHJhIGluZm9ybWF0aW9uIHRvIGFwcGVuZCB0byB0aGUgdXJsXHJcbiAgLy8gd2hlbiBmZXRjaGluZyBkYXRhLCBleHRlbmRlZCB3aXRoIHRoZSBleHBsaWNpdCBxdWVyeSBzcGVjaWZpZWRcclxuICAvLyBleGVjdXRpbmcgZmV0Y2hEYXRhKHF1ZXJ5KVxyXG4gIHF1ZXJ5OiB7fSxcclxuICB1cGRhdGVEYXRhOiB1cGRhdGVEYXRhLFxyXG4gIGZldGNoRGF0YTogZmV0Y2hEYXRhXHJcbiAgLy8gVE9ETyAgcHVzaERhdGE6IGZ1bmN0aW9uKCl7IHBvc3QvcHV0IHRoaXMuZGF0YSB0byB1cmwgIH1cclxufTtcclxuXHJcbi8vIENsYXNzIGFzIHB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gRGF0YVNvdXJjZTsiLCIvKipcclxuICBMb2Nvbm9taWNzIHNwZWNpZmljIFdpZGdldCBiYXNlZCBvbiBCaW5kYWJsZUNvbXBvbmVudC5cclxuICBKdXN0IGRlY291cGxpbmcgc3BlY2lmaWMgYmVoYXZpb3JzIGZyb20gc29tZXRoaW5nIG1vcmUgZ2VuZXJhbFxyXG4gIHRvIGVhc2lseSB0cmFjayB0aGF0IGRldGFpbHMsIGFuZCBtYXliZSBmdXR1cmUgbWlncmF0aW9ucyB0b1xyXG4gIG90aGVyIGZyb250LWVuZCBmcmFtZXdvcmtzLlxyXG4qKi9cclxudmFyIERhdGFTb3VyY2UgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2UnKTtcclxudmFyIEJpbmRhYmxlQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9CaW5kYWJsZUNvbXBvbmVudCcpO1xyXG5cclxudmFyIExjV2lkZ2V0ID0gQmluZGFibGVDb21wb25lbnQuZXh0ZW5kKFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIC8vIFJlcGxhY2luZyB1cGRhdGVEYXRhIHRvIGltcGxlbWVudCB0aGUgcGFydGljdWxhclxyXG4gICAgLy8gSlNPTiBzY2hlbWUgb2YgTG9jb25vbWljcywgYnV0IHJldXNpbmcgb3JpZ2luYWxcclxuICAgIC8vIGxvZ2ljIGluaGVyaXQgZnJvbSBEYXRhU291cmNlXHJcbiAgICB1cGRhdGVEYXRhOiBmdW5jdGlvbiAoZGF0YSwgbW9kZSkge1xyXG4gICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICBEYXRhU291cmNlLnByb3RvdHlwZS51cGRhdGVEYXRhLmNhbGwodGhpcywgZGF0YS5SZXN1bHQsIG1vZGUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEVycm9yIG1lc3NhZ2UgaW4gdGhlIEpTT05cclxuICAgICAgICByZXR1cm4geyBuYW1lOiAnZGF0YS1mb3JtYXQnLCBtZXNzYWdlOiBkYXRhLkVycm9yTWVzc2FnZSB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICAvLyBDb25zdHJ1Y3RvclxyXG4gIGZ1bmN0aW9uIExjV2lkZ2V0KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIEJpbmRhYmxlQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgfVxyXG4pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1dpZGdldDsiLCIvKipcclxuICBEZWVwIEV4dGVuZCBvYmplY3QgdXRpbGl0eSwgaXMgcmVjdXJzaXZlIHRvIGdldCBhbGwgdGhlIGRlcHRoXHJcbiAgYnV0IG9ubHkgZm9yIHRoZSBwcm9wZXJ0aWVzIG93bmVkIGJ5IHRoZSBvYmplY3QsXHJcbiAgaWYgeW91IG5lZWQgdGhlIG5vbi1vd25lZCBwcm9wZXJ0aWVzIHRvIGluIHRoZSBvYmplY3QsXHJcbiAgY29uc2lkZXIgZXh0ZW5kIGZyb20gdGhlIHNvdXJjZSBwcm90b3R5cGUgdG9vIChhbmQgbWF5YmUgdG9cclxuICB0aGUgZGVzdGluYXRpb24gcHJvdG90eXBlIGluc3RlYWQgb2YgdGhlIGluc3RhbmNlLCBidXQgdXAgdG8gdG9vKS5cclxuKiovXHJcblxyXG4vKiBqcXVlcnkgaW1wbGVtZW50YXRpb246XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcclxucmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyBcclxufTsqL1xyXG5cclxudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChkZXN0aW5hdGlvbiwgc291cmNlKSB7XHJcbiAgZm9yICh2YXIgcHJvcGVydHkgaW4gc291cmNlKSB7XHJcbiAgICBpZiAoIXNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpXHJcbiAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgIC8vIEFsbG93IHByb3BlcnRpZXMgcmVtb3ZhbCwgaWYgc291cmNlIGNvbnRhaW5zIHZhbHVlICd1bmRlZmluZWQnLlxyXG4gICAgLy8gVGhlcmUgYXJlIG5vIHNwZWNpYWwgY29uc2lkZXJhdGlvbnMgb24gQXJyYXlzLCB0byBkb24ndCBnZXQgdW5kZXNpcmVkXHJcbiAgICAvLyByZXN1bHRzIGp1c3QgdGhlIHdhbnRlZCBpcyB0byByZXBsYWNlIHNwZWNpZmljIHBvc2l0aW9ucywgbm9ybWFsbHkuXHJcbiAgICBpZiAoc291cmNlW3Byb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRlbGV0ZSBkZXN0aW5hdGlvbltwcm9wZXJ0eV07XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChbJ29iamVjdCcsICdmdW5jdGlvbiddLmluZGV4T2YodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSkgIT0gLTEgJiZcclxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ29iamVjdCcpXHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9PSAnZnVuY3Rpb24nICYmXHJcbiAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB2YXIgb3JpZyA9IGRlc3RpbmF0aW9uW3Byb3BlcnR5XTtcclxuICAgICAgLy8gQ2xvbmUgZnVuY3Rpb25cclxuICAgICAgdmFyIHNvdXIgPSBjbG9uZUZ1bmN0aW9uKHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgICBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPSBzb3VyO1xyXG4gICAgICAvLyBBbnkgcHJldmlvdXMgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgb3JpZyk7XHJcbiAgICAgIC8vIEFueSBzb3VyY2UgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XHJcbiAgfVxyXG5cclxuICAvLyBTbyBtdWNoICdzb3VyY2UnIGFyZ3VtZW50cyBhcyB3YW50ZWQuIEluIEVTNiB3aWxsIGJlICdzb3VyY2UuLidcclxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcclxuICAgIHZhciBuZXh0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcbiAgICBuZXh0cy5zcGxpY2UoMSwgMSk7XHJcbiAgICBleHRlbmQuYXBwbHkodGhpcywgbmV4dHMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRlc3RpbmF0aW9uO1xyXG59O1xyXG5cclxuZXh0ZW5kLnBsdWdJbiA9IGZ1bmN0aW9uIHBsdWdJbihvYmopIHtcclxuICBvYmogPSBvYmogfHwgT2JqZWN0LnByb3RvdHlwZTtcclxuICBvYmouZXh0ZW5kTWUgPSBmdW5jdGlvbiBleHRlbmRNZSgpIHtcclxuICAgIGV4dGVuZC5hcHBseSh0aGlzLCBbdGhpc10uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcclxuICB9O1xyXG4gIG9iai5leHRlbmQgPSBmdW5jdGlvbiBleHRlbmRJbnN0YW5jZSgpIHtcclxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcclxuICAgICAgLy8gSWYgdGhlIG9iamVjdCB1c2VkIHRvIGV4dGVuZCBmcm9tIGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWRcclxuICAgICAgLy8gYSBjb25zdHJ1Y3RvciwgdGhlbiB3ZSBleHRlbmQgZnJvbSBpdHMgcHJvdG90eXBlLCBvdGhlcndpc2UgaXRzZWxmLlxyXG4gICAgICBjb25zdHJ1Y3RvckEgPSB0eXBlb2YgdGhpcyA9PSAnZnVuY3Rpb24nID8gdGhpcyA6IG51bGwsXHJcbiAgICAgIGJhc2VBID0gY29uc3RydWN0b3JBID8gdGhpcy5wcm90b3R5cGUgOiB0aGlzLFxyXG4gICAgICAvLyBJZiBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWQgYSBjb25zdHJ1Y3RvclxyXG4gICAgICAvLyBvZiB0aGUgbmV3IGNsYXNzL29iamVjdCB0aGVuIHdlIGV4dGVuZCBpdHMgcHJvdG90eXBlLlxyXG4gICAgICAvLyBXZSB1c2UgYW4gZW1wdHkgb2JqZWN0IG90aGVyd2lzZS5cclxuICAgICAgY29uc3RydWN0b3JCID0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nID9cclxuICAgICAgICBhcmdzLnNwbGljZShhcmdzLmxlbmd0aCAtIDEpWzBdIDpcclxuICAgICAgICBudWxsLFxyXG4gICAgICBiYXNlQiA9IGNvbnN0cnVjdG9yQiA/IGNvbnN0cnVjdG9yQi5wcm90b3R5cGUgOiB7fTtcclxuXHJcbiAgICB2YXIgZXh0ZW5kZWRSZXN1bHQgPSBleHRlbmQuYXBwbHkodGhpcywgW2Jhc2VCLCBiYXNlQV0uY29uY2F0KGFyZ3MpKTtcclxuICAgIC8vIElmIGJvdGggYXJlIGNvbnN0cnVjdG9ycywgd2Ugd2FudCB0aGUgc3RhdGljIG1ldGhvZHMgdG8gYmUgY29waWVkIHRvbzpcclxuICAgIGlmIChjb25zdHJ1Y3RvckEgJiYgY29uc3RydWN0b3JCKVxyXG4gICAgICBleHRlbmQoY29uc3RydWN0b3JCLCBjb25zdHJ1Y3RvckEpO1xyXG5cclxuICAgIC8vIElmIHdlIGFyZSBleHRlbmRpbmcgYSBjb25zdHJ1Y3Rvciwgd2UgcmV0dXJuIHRoYXQsIG90aGVyd2lzZSB0aGUgcmVzdWx0XHJcbiAgICByZXR1cm4gY29uc3RydWN0b3JCIHx8IGV4dGVuZGVkUmVzdWx0O1xyXG4gIH07XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICBtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZDtcclxufSBlbHNlIHtcclxuICAvLyBnbG9iYWwgc2NvcGVcclxuICBleHRlbmQucGx1Z0luKCk7XHJcbn1cclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gIENsb25lIFV0aWxzXHJcbiovXHJcbmZ1bmN0aW9uIGNsb25lT2JqZWN0KG9iaikge1xyXG4gIHJldHVybiBleHRlbmQoe30sIG9iaik7XHJcbn1cclxuXHJcbi8vIFRlc3RpbmcgaWYgYSBzdHJpbmcgc2VlbXMgYSBmdW5jdGlvbiBzb3VyY2UgY29kZTpcclxuLy8gV2UgdGVzdCBhZ2FpbnMgYSBzaW1wbGlzaWMgcmVndWxhciBleHByZXNpb24gdGhhdCBtYXRjaFxyXG4vLyBhIGNvbW1vbiBzdGFydCBvZiBmdW5jdGlvbiBkZWNsYXJhdGlvbi5cclxuLy8gT3RoZXIgd2F5cyB0byBkbyB0aGlzIGlzIGF0IGludmVyc2VyLCBieSBjaGVja2luZ1xyXG4vLyB0aGF0IHRoZSBmdW5jdGlvbiB0b1N0cmluZyBpcyBub3QgYSBrbm93ZWQgdGV4dFxyXG4vLyBhcyAnW29iamVjdCBGdW5jdGlvbl0nIG9yICdbbmF0aXZlIGNvZGVdJywgYnV0XHJcbi8vIHNpbmNlIHRoYSBjYW4gY2hhbmdlcyBiZXR3ZWVuIGJyb3dzZXJzLCBpcyBtb3JlIGNvbnNlcnZhdGl2ZVxyXG4vLyBjaGVjayBhZ2FpbnN0IGEgY29tbW9uIGNvbnN0cnVjdCBhbiBmYWxsYmFjayBvbiB0aGVcclxuLy8gY29tbW9uIHNvbHV0aW9uIGlmIG5vdCBtYXRjaGVzLlxyXG52YXIgdGVzdEZ1bmN0aW9uID0gL15cXHMqZnVuY3Rpb25bXlxcKF1cXCgvO1xyXG5cclxuZnVuY3Rpb24gY2xvbmVGdW5jdGlvbihmbikge1xyXG4gIHZhciB0ZW1wO1xyXG4gIHZhciBjb250ZW50cyA9IGZuLnRvU3RyaW5nKCk7XHJcbiAgLy8gQ29weSB0byBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgc2FtZSBwcm90b3R5cGUsIGZvciB0aGUgbm90ICdvd25lZCcgcHJvcGVydGllcy5cclxuICAvLyBBc3NpbmdlZCBhdCB0aGUgZW5kXHJcbiAgdmFyIHRlbXBQcm90byA9IE9iamVjdC5jcmVhdGUoZm4ucHJvdG90eXBlKTtcclxuXHJcbiAgLy8gRElTQUJMRUQgdGhlIGNvbnRlbnRzLWNvcHkgcGFydCBiZWNhdXNlIGl0IGZhaWxzIHdpdGggY2xvc3VyZXNcclxuICAvLyBnZW5lcmF0ZWQgYnkgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLCB1c2luZyB0aGUgc3ViLWNhbGwgd2F5IGV2ZXJcclxuICBpZiAodHJ1ZSB8fCAhdGVzdEZ1bmN0aW9uLnRlc3QoY29udGVudHMpKSB7XHJcbiAgICAvLyBDaGVjayBpZiBpcyBhbHJlYWR5IGEgY2xvbmVkIGNvcHksIHRvXHJcbiAgICAvLyByZXVzZSB0aGUgb3JpZ2luYWwgY29kZSBhbmQgYXZvaWQgbW9yZSB0aGFuXHJcbiAgICAvLyBvbmUgZGVwdGggaW4gc3RhY2sgY2FsbHMgKGdyZWF0ISlcclxuICAgIGlmICh0eXBlb2YgZm4ucHJvdG90eXBlLl9fX2Nsb25lZF9vZiA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICBmbiA9IGZuLnByb3RvdHlwZS5fX19jbG9uZWRfb2Y7XHJcblxyXG4gICAgdGVtcCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpOyB9O1xyXG5cclxuICAgIC8vIFNhdmUgbWFyayBhcyBjbG9uZWQuIERvbmUgaW4gaXRzIHByb3RvdHlwZVxyXG4gICAgLy8gdG8gbm90IGFwcGVhciBpbiB0aGUgbGlzdCBvZiAnb3duZWQnIHByb3BlcnRpZXMuXHJcbiAgICB0ZW1wUHJvdG8uX19fY2xvbmVkX29mID0gZm47XHJcbiAgICAvLyBSZXBsYWNlIHRvU3RyaW5nIHRvIHJldHVybiB0aGUgb3JpZ2luYWwgc291cmNlOlxyXG4gICAgdGVtcFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gZm4udG9TdHJpbmcoKTtcclxuICAgIH07XHJcbiAgICAvLyBUaGUgbmFtZSBjYW5ub3QgYmUgc2V0LCB3aWxsIGp1c3QgYmUgYW5vbnltb3VzXHJcbiAgICAvL3RlbXAubmFtZSA9IHRoYXQubmFtZTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gVGhpcyB3YXkgb24gY2FwYWJsZSBicm93c2VycyBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgbmFtZSxcclxuICAgIC8vIGRvIGEgcmVhbCBpbmRlcGVuZGVudCBjb3B5IGFuZCBhdm9pZCBmdW5jdGlvbiBzdWJjYWxscyB0aGF0XHJcbiAgICAvLyBjYW4gZGVncmF0ZSBwZXJmb3JtYW5jZSBhZnRlciBsb3Qgb2YgJ2Nsb25uaW5nJy5cclxuICAgIHZhciBmID0gRnVuY3Rpb247XHJcbiAgICB0ZW1wID0gKG5ldyBmKCdyZXR1cm4gJyArIGNvbnRlbnRzKSkoKTtcclxuICB9XHJcblxyXG4gIHRlbXAucHJvdG90eXBlID0gdGVtcFByb3RvO1xyXG4gIC8vIENvcHkgYW55IHByb3BlcnRpZXMgaXQgb3duc1xyXG4gIGV4dGVuZCh0ZW1wLCBmbik7XHJcblxyXG4gIHJldHVybiB0ZW1wO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbG9uZVBsdWdJbigpIHtcclxuICBpZiAodHlwZW9mIEZ1bmN0aW9uLnByb3RvdHlwZS5jbG9uZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoKSB7IHJldHVybiBjbG9uZUZ1bmN0aW9uKHRoaXMpOyB9O1xyXG4gIH1cclxuICBpZiAodHlwZW9mIE9iamVjdC5wcm90b3R5cGUuY2xvbmUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIE9qYmVjdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSgpIHsgcmV0dXJuIGNsb25lT2JqZWN0KHRoaXMpOyB9O1xyXG4gIH1cclxufVxyXG5cclxuZXh0ZW5kLmNsb25lT2JqZWN0ID0gY2xvbmVPYmplY3Q7XHJcbmV4dGVuZC5jbG9uZUZ1bmN0aW9uID0gY2xvbmVGdW5jdGlvbjtcclxuZXh0ZW5kLmNsb25lUGx1Z0luID0gY2xvbmVQbHVnSW47XHJcbiIsIi8qKlxyXG4qIENvb2tpZXMgbWFuYWdlbWVudC5cclxuKiBNb3N0IGNvZGUgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80ODI1Njk1LzE2MjIzNDZcclxuKi9cclxudmFyIENvb2tpZSA9IHt9O1xyXG5cclxuQ29va2llLnNldCA9IGZ1bmN0aW9uIHNldENvb2tpZShuYW1lLCB2YWx1ZSwgZGF5cykge1xyXG4gICAgdmFyIGV4cGlyZXMgPSBcIlwiO1xyXG4gICAgaWYgKGRheXMpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgKGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKSk7XHJcbiAgICAgICAgZXhwaXJlcyA9IFwiOyBleHBpcmVzPVwiICsgZGF0ZS50b0dNVFN0cmluZygpO1xyXG4gICAgfVxyXG4gICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArIFwiPVwiICsgdmFsdWUgKyBleHBpcmVzICsgXCI7IHBhdGg9L1wiO1xyXG59O1xyXG5Db29raWUuZ2V0ID0gZnVuY3Rpb24gZ2V0Q29va2llKGNfbmFtZSkge1xyXG4gICAgaWYgKGRvY3VtZW50LmNvb2tpZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY19zdGFydCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKGNfbmFtZSArIFwiPVwiKTtcclxuICAgICAgICBpZiAoY19zdGFydCAhPSAtMSkge1xyXG4gICAgICAgICAgICBjX3N0YXJ0ID0gY19zdGFydCArIGNfbmFtZS5sZW5ndGggKyAxO1xyXG4gICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKFwiO1wiLCBjX3N0YXJ0KTtcclxuICAgICAgICAgICAgaWYgKGNfZW5kID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHVuZXNjYXBlKGRvY3VtZW50LmNvb2tpZS5zdWJzdHJpbmcoY19zdGFydCwgY19lbmQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gXCJcIjtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gQ29va2llOyIsIi8qKiBDb25uZWN0IGFjY291bnQgd2l0aCBGYWNlYm9va1xyXG4qKi9cclxudmFyXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyksXHJcbiAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5mdW5jdGlvbiBGYWNlYm9va0Nvbm5lY3Qob3B0aW9ucykge1xyXG4gICQuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIGlmICghJCgnI2ZiLXJvb3QnKS5sZW5ndGgpXHJcbiAgICAkKCc8ZGl2IGlkPVwiZmItcm9vdFwiIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiPjwvZGl2PicpLmFwcGVuZFRvKCdib2R5Jyk7XHJcbn1cclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUgPSB7XHJcbiAgYXBwSWQ6IG51bGwsXHJcbiAgbGFuZzogJ2VuX1VTJyxcclxuICByZXN1bHRUeXBlOiAnanNvbicsIC8vICdyZWRpcmVjdCdcclxuICBmYlVybEJhc2U6ICcvL2Nvbm5lY3QuZmFjZWJvb2submV0L0AobGFuZykvYWxsLmpzJyxcclxuICBzZXJ2ZXJVcmxCYXNlOiBMY1VybC5MYW5nUGF0aCArICdBY2NvdW50L0ZhY2Vib29rL0AodXJsU2VjdGlvbikvP1JlZGlyZWN0PUAocmVkaXJlY3RVcmwpJnByb2ZpbGU9QChwcm9maWxlVXJsKScsXHJcbiAgcmVkaXJlY3RVcmw6ICcnLFxyXG4gIHByb2ZpbGVVcmw6ICcnLFxyXG4gIHVybFNlY3Rpb246ICcnLFxyXG4gIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnLFxyXG4gIHBlcm1pc3Npb25zOiAnJyxcclxuICBsaWJMb2FkZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdExpYkxvYWRlZCcsXHJcbiAgY29ubmVjdGVkRXZlbnQ6ICdGYWNlYm9va0Nvbm5lY3RDb25uZWN0ZWQnXHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldEZiVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZmJVcmxCYXNlLnJlcGxhY2UoL0BcXChsYW5nXFwpL2csIHRoaXMubGFuZyk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldFNlcnZlclVybCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnNlcnZlclVybEJhc2VcclxuICAucmVwbGFjZSgvQFxcKHJlZGlyZWN0VXJsXFwpL2csIHRoaXMucmVkaXJlY3RVcmwpXHJcbiAgLnJlcGxhY2UoL0BcXChwcm9maWxlVXJsXFwpL2csIHRoaXMucHJvZmlsZVVybClcclxuICAucmVwbGFjZSgvQFxcKHVybFNlY3Rpb25cXCkvZywgdGhpcy51cmxTZWN0aW9uKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUubG9hZExpYiA9IGZ1bmN0aW9uICgpIHtcclxuICAvLyBPbmx5IGlmIGlzIG5vdCBsb2FkZWQgc3RpbGxcclxuICAvLyAoRmFjZWJvb2sgc2NyaXB0IGF0dGFjaCBpdHNlbGYgYXMgdGhlIGdsb2JhbCB2YXJpYWJsZSAnRkInKVxyXG4gIGlmICghd2luZG93LkZCICYmICF0aGlzLl9sb2FkaW5nTGliKSB7XHJcbiAgICB0aGlzLl9sb2FkaW5nTGliID0gdHJ1ZTtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgc2NyaXB0czogW3RoaXMuZ2V0RmJVcmwoKV0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgRkIuaW5pdCh7IGFwcElkOiB0aGF0LmFwcElkLCBzdGF0dXM6IHRydWUsIGNvb2tpZTogdHJ1ZSwgeGZibWw6IHRydWUgfSk7XHJcbiAgICAgICAgdGhhdC5sb2FkaW5nTGliID0gZmFsc2U7XHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcih0aGF0LmxpYkxvYWRlZEV2ZW50KTtcclxuICAgICAgfSxcclxuICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuRkI7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUucHJvY2Vzc1Jlc3BvbnNlID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgaWYgKHJlc3BvbnNlLmF1dGhSZXNwb25zZSkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBXZWxjb21lIScpO1xyXG4gICAgdmFyIHVybCA9IHRoaXMuZ2V0U2VydmVyVXJsKCk7XHJcbiAgICBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwicmVkaXJlY3RcIikge1xyXG4gICAgICByZWRpcmVjdFRvKHVybCk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMucmVzdWx0VHlwZSA9PSBcImpzb25cIikge1xyXG4gICAgICBwb3B1cCh1cmwsICdzbWFsbCcsIG51bGwsIHRoaXMubG9hZGluZ1RleHQpO1xyXG4gICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoaXMuY29ubmVjdGVkRXZlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qRkIuYXBpKCcvbWUnLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgIGNvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IEdvb2QgdG8gc2VlIHlvdSwgJyArIHJlc3BvbnNlLm5hbWUgKyAnLicpO1xyXG4gICAgfSk7Ki9cclxuICB9IGVsc2Uge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBVc2VyIGNhbmNlbGxlZCBsb2dpbiBvciBkaWQgbm90IGZ1bGx5IGF1dGhvcml6ZS4nKTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLm9uTGliUmVhZHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICBpZiAod2luZG93LkZCKVxyXG4gICAgY2FsbGJhY2soKTtcclxuICBlbHNlIHtcclxuICAgIHRoaXMubG9hZExpYigpO1xyXG4gICAgJChkb2N1bWVudCkub24odGhpcy5saWJMb2FkZWRFdmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5vbkxpYlJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgIEZCLmxvZ2luKCQucHJveHkodGhhdC5wcm9jZXNzUmVzcG9uc2UsIHRoYXQpLCB7IHNjb3BlOiB0aGF0LnBlcm1pc3Npb25zIH0pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5hdXRvQ29ubmVjdE9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCBzZWxlY3RvciB8fCAnYS5mYWNlYm9vay1jb25uZWN0JywgJC5wcm94eSh0aGlzLmNvbm5lY3QsIHRoaXMpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmFjZWJvb2tDb25uZWN0OyIsIi8qKiBJbXBsZW1lbnRzIGEgc2ltaWxhciBMY1VybCBvYmplY3QgbGlrZSB0aGUgc2VydmVyLXNpZGUgb25lLCBiYXNpbmdcclxuICAgIGluIHRoZSBpbmZvcm1hdGlvbiBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYXQgJ2h0bWwnIHRhZyBpbiB0aGUgXHJcbiAgICAnZGF0YS1iYXNlLXVybCcgYXR0cmlidXRlICh0aGF0cyB2YWx1ZSBpcyB0aGUgZXF1aXZhbGVudCBmb3IgQXBwUGF0aCksXHJcbiAgICBhbmQgdGhlIGxhbmcgaW5mb3JtYXRpb24gYXQgJ2RhdGEtY3VsdHVyZScuXHJcbiAgICBUaGUgcmVzdCBvZiBVUkxzIGFyZSBidWlsdCBmb2xsb3dpbmcgdGhlIHdpbmRvdy5sb2NhdGlvbiBhbmQgc2FtZSBydWxlc1xyXG4gICAgdGhhbiBpbiB0aGUgc2VydmVyLXNpZGUgb2JqZWN0LlxyXG4qKi9cclxuXHJcbnZhciBiYXNlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVybCcpLFxyXG4gICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpLFxyXG4gICAgbCA9IHdpbmRvdy5sb2NhdGlvbixcclxuICAgIHVybCA9IGwucHJvdG9jb2wgKyAnLy8nICsgbC5ob3N0O1xyXG4vLyBsb2NhdGlvbi5ob3N0IGluY2x1ZGVzIHBvcnQsIGlmIGlzIG5vdCB0aGUgZGVmYXVsdCwgdnMgbG9jYXRpb24uaG9zdG5hbWVcclxuXHJcbmJhc2UgPSBiYXNlIHx8ICcvJztcclxuXHJcbnZhciBMY1VybCA9IHtcclxuICAgIFNpdGVVcmw6IHVybCxcclxuICAgIEFwcFBhdGg6IGJhc2UsXHJcbiAgICBBcHBVcmw6IHVybCArIGJhc2UsXHJcbiAgICBMYW5nSWQ6IGxhbmcsXHJcbiAgICBMYW5nUGF0aDogYmFzZSArIGxhbmcgKyAnLycsXHJcbiAgICBMYW5nVXJsOiB1cmwgKyBiYXNlICsgbGFuZ1xyXG59O1xyXG5MY1VybC5MYW5nVXJsID0gdXJsICsgTGNVcmwuTGFuZ1BhdGg7XHJcbkxjVXJsLkpzb25QYXRoID0gTGNVcmwuTGFuZ1BhdGggKyAnSlNPTi8nO1xyXG5MY1VybC5Kc29uVXJsID0gdXJsICsgTGNVcmwuSnNvblBhdGg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjVXJsOyIsIi8qIExvY29ub21pY3Mgc3BlY2lmaWMgUHJpY2UsIGZlZXMgYW5kIGhvdXItcHJpY2UgY2FsY3VsYXRpb25cclxuICAgIHVzaW5nIHNvbWUgc3RhdGljIG1ldGhvZHMgYW5kIHRoZSBQcmljZSBjbGFzcy5cclxuKi9cclxudmFyIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbi8qIENsYXNzIFByaWNlIHRvIGNhbGN1bGF0ZSBhIHRvdGFsIHByaWNlIGJhc2VkIG9uIGZlZXMgaW5mb3JtYXRpb24gKGZpeGVkIGFuZCByYXRlKVxyXG4gICAgYW5kIGRlc2lyZWQgZGVjaW1hbHMgZm9yIGFwcHJveGltYXRpb25zLlxyXG4qL1xyXG5mdW5jdGlvbiBQcmljZShiYXNlUHJpY2UsIGZlZSwgcm91bmRlZERlY2ltYWxzKSB7XHJcbiAgICAvLyBmZWUgcGFyYW1ldGVyIGNhbiBiZSBhIGZsb2F0IG51bWJlciB3aXRoIHRoZSBmZWVSYXRlIG9yIGFuIG9iamVjdFxyXG4gICAgLy8gdGhhdCBpbmNsdWRlcyBib3RoIGEgZmVlUmF0ZSBhbmQgYSBmaXhlZEZlZUFtb3VudFxyXG4gICAgLy8gRXh0cmFjdGluZyBmZWUgdmFsdWVzIGludG8gbG9jYWwgdmFyczpcclxuICAgIHZhciBmZWVSYXRlID0gMCwgZml4ZWRGZWVBbW91bnQgPSAwO1xyXG4gICAgaWYgKGZlZS5maXhlZEZlZUFtb3VudCB8fCBmZWUuZmVlUmF0ZSkge1xyXG4gICAgICAgIGZpeGVkRmVlQW1vdW50ID0gZmVlLmZpeGVkRmVlQW1vdW50IHx8IDA7XHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZS5mZWVSYXRlIHx8IDA7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBmZWVSYXRlID0gZmVlO1xyXG5cclxuICAgIC8vIENhbGN1bGF0aW5nOlxyXG4gICAgLy8gVGhlIHJvdW5kVG8gd2l0aCBhIGJpZyBmaXhlZCBkZWNpbWFscyBpcyB0byBhdm9pZCB0aGVcclxuICAgIC8vIGRlY2ltYWwgZXJyb3Igb2YgZmxvYXRpbmcgcG9pbnQgbnVtYmVyc1xyXG4gICAgdmFyIHRvdGFsUHJpY2UgPSBtdS5jZWlsVG8obXUucm91bmRUbyhiYXNlUHJpY2UgKiAoMSArIGZlZVJhdGUpICsgZml4ZWRGZWVBbW91bnQsIDEyKSwgcm91bmRlZERlY2ltYWxzKTtcclxuICAgIC8vIGZpbmFsIGZlZSBwcmljZSBpcyBjYWxjdWxhdGVkIGFzIGEgc3Vic3RyYWN0aW9uLCBidXQgYmVjYXVzZSBqYXZhc2NyaXB0IGhhbmRsZXNcclxuICAgIC8vIGZsb2F0IG51bWJlcnMgb25seSwgYSByb3VuZCBvcGVyYXRpb24gaXMgcmVxdWlyZWQgdG8gYXZvaWQgYW4gaXJyYXRpb25hbCBudW1iZXJcclxuICAgIHZhciBmZWVQcmljZSA9IG11LnJvdW5kVG8odG90YWxQcmljZSAtIGJhc2VQcmljZSwgMik7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgb2JqZWN0IHdpdGggZnVsbCBkZXRhaWxzOlxyXG4gICAgdGhpcy5iYXNlUHJpY2UgPSBiYXNlUHJpY2U7XHJcbiAgICB0aGlzLmZlZVJhdGUgPSBmZWVSYXRlO1xyXG4gICAgdGhpcy5maXhlZEZlZUFtb3VudCA9IGZpeGVkRmVlQW1vdW50O1xyXG4gICAgdGhpcy5yb3VuZGVkRGVjaW1hbHMgPSByb3VuZGVkRGVjaW1hbHM7XHJcbiAgICB0aGlzLnRvdGFsUHJpY2UgPSB0b3RhbFByaWNlO1xyXG4gICAgdGhpcy5mZWVQcmljZSA9IGZlZVByaWNlO1xyXG59XHJcblxyXG4vKiogQ2FsY3VsYXRlIGFuZCByZXR1cm5zIHRoZSBwcmljZSBhbmQgcmVsZXZhbnQgZGF0YSBhcyBhbiBvYmplY3QgZm9yXHJcbnRpbWUsIGhvdXJseVJhdGUgKHdpdGggZmVlcykgYW5kIHRoZSBob3VybHlGZWUuXHJcblRoZSB0aW1lIChAZHVyYXRpb24pIGlzIHVzZWQgJ2FzIGlzJywgd2l0aG91dCB0cmFuc2Zvcm1hdGlvbiwgbWF5YmUgeW91IGNhbiByZXF1aXJlXHJcbnVzZSBMQy5yb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyIGJlZm9yZSBwYXNzIHRoZSBkdXJhdGlvbiB0byB0aGlzIGZ1bmN0aW9uLlxyXG5JdCByZWNlaXZlcyB0aGUgcGFyYW1ldGVycyBAaG91cmx5UHJpY2UgYW5kIEBzdXJjaGFyZ2VQcmljZSBhcyBMQy5QcmljZSBvYmplY3RzLlxyXG5Ac3VyY2hhcmdlUHJpY2UgaXMgb3B0aW9uYWwuXHJcbioqL1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVIb3VybHlQcmljZShkdXJhdGlvbiwgaG91cmx5UHJpY2UsIHN1cmNoYXJnZVByaWNlKSB7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBzdXJjaGFyZ2UsIGdldCB6ZXJvc1xyXG4gICAgc3VyY2hhcmdlUHJpY2UgPSBzdXJjaGFyZ2VQcmljZSB8fCB7IHRvdGFsUHJpY2U6IDAsIGZlZVByaWNlOiAwLCBiYXNlUHJpY2U6IDAgfTtcclxuICAgIC8vIEdldCBob3VycyBmcm9tIHJvdW5kZWQgZHVyYXRpb246XHJcbiAgICB2YXIgaG91cnMgPSBtdS5yb3VuZFRvKGR1cmF0aW9uLnRvdGFsSG91cnMoKSwgMik7XHJcbiAgICAvLyBDYWxjdWxhdGUgZmluYWwgcHJpY2VzXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvdGFsUHJpY2U6ICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLnRvdGFsUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLnRvdGFsUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgZmVlUHJpY2U6ICAgICAgIG11LnJvdW5kVG8oaG91cmx5UHJpY2UuZmVlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmZlZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6ICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmJhc2VQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UuYmFzZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGR1cmF0aW9uSG91cnM6ICBob3Vyc1xyXG4gICAgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgUHJpY2U6IFByaWNlLFxyXG4gICAgICAgIGNhbGN1bGF0ZUhvdXJseVByaWNlOiBjYWxjdWxhdGVIb3VybHlQcmljZVxyXG4gICAgfTsiLCIvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI1OTM2MzcvaG93LXRvLWVzY2FwZS1yZWd1bGFyLWV4cHJlc3Npb24taW4tamF2YXNjcmlwdFxyXG5SZWdFeHAucXVvdGUgPSBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgcmV0dXJuIChzdHIgKyAnJykucmVwbGFjZSgvKFsuPyorXiRbXFxdXFxcXCgpe318LV0pL2csIFwiXFxcXCQxXCIpO1xyXG59O1xyXG4iLCIvKipcclxuICBBIHZlcnkgc2ltcGxlIHNsaWRlciBpbXBsZW1lbnRhdGlvbiBpbml0aWFsbHkgY3JlYXRlZFxyXG4gIGZvciB0aGUgcHJvdmlkZXItd2VsY29tZSBsYW5kaW5nIHBhZ2UgYW5kXHJcbiAgb3RoZXIgc2ltaWxhciB1c2VzLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9SZWdFeHAucXVvdGUnKTtcclxuXHJcbnZhciBTaW1wbGVTbGlkZXIgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFNpbXBsZVNsaWRlcihvcHRzKSB7XHJcbiAgJC5leHRlbmQodHJ1ZSwgdGhpcywgb3B0cyk7XHJcblxyXG4gIHRoaXMuZWxlbWVudCA9ICQodGhpcy5lbGVtZW50KTtcclxuICB0aGlzLmN1cnJlbnRJbmRleCA9IDA7XHJcblxyXG4gIC8qKlxyXG4gIEFjdGlvbnMgaGFuZGxlciB0byBtb3ZlIHNsaWRlc1xyXG4gICoqL1xyXG4gIHZhciBjaGVja0hyZWYgPSBuZXcgUmVnRXhwKCdeIycgKyBSZWdFeHAucXVvdGUodGhpcy5ocmVmUHJlZml4KSArICcoLiopJyksXHJcbiAgICB0aGF0ID0gdGhpcztcclxuICB0aGlzLmVsZW1lbnQub24oJ2NsaWNrJywgJ2EnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgaHJlZiA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJyk7XHJcbiAgICB2YXIgcmVzID0gY2hlY2tIcmVmLmV4ZWMoaHJlZik7XHJcblxyXG4gICAgaWYgKHJlcyAmJiByZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICB2YXIgaW5kZXggPSByZXNbMV07XHJcbiAgICAgIGlmIChpbmRleCA9PSAncHJldmlvdXMnKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHRoYXQuY3VycmVudEluZGV4IC0gMSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoaW5kZXggPT0gJ25leHQnKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHRoYXQuY3VycmVudEluZGV4ICsgMSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoL1xcZCsvLnRlc3QoaW5kZXgpKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHBhcnNlSW50KGluZGV4KSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBEbyBhbGwgdGhlIHNldHVwIG9uIHNsaWRlciBhbmQgc2xpZGVzXHJcbiAgdG8gZW5zdXJlIHRoZSBtb3ZlbWVudCB3aWxsIHdvcmsgZmluZS5cclxuICBJdHMgZG9uZSBhdXRvbWF0aWMgb25cclxuICBpbml0aWFsaXppbmcsIGlzIGp1c3QgYSBwdWJsaWMgbWV0aG9kIGZvciBcclxuICBjb252ZW5pZW5jZSAobWF5YmUgdG8gYmUgY2FsbCBpZiBzbGlkZXMgYXJlXHJcbiAgYWRkZWQvcmVtb3ZlZCBhZnRlciBpbml0KS5cclxuICAqKi9cclxuICB0aGlzLnJlZHJhdyA9IGZ1bmN0aW9uIHNsaWRlc1JlcG9zaXRpb24oKSB7XHJcbiAgICB2YXIgc2xpZGVzID0gdGhpcy5nZXRTbGlkZXMoKSxcclxuICAgICAgYyA9IHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyKCk7XHJcbiAgICAvLyBMb29rIGZvciB0aGUgY29udGFpbmVyIHNpemUsIGZyb20gdGhlIFxyXG4gICAgLy8gYmlnZ2VyIHNsaWRlOlxyXG4gICAgdmFyIFxyXG4gICAgICB3ID0gMCxcclxuICAgICAgaCA9IDA7XHJcbiAgICBzbGlkZXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBcclxuICAgICAgICB0ID0gJCh0aGlzKSxcclxuICAgICAgICB0dyA9IHQub3V0ZXJXaWR0aCgpLFxyXG4gICAgICAgIHRoID0gdC5vdXRlckhlaWdodCgpO1xyXG4gICAgICBpZiAodHcgPiB3KVxyXG4gICAgICAgIHcgPSB0dztcclxuICAgICAgaWYgKHRoID4gaClcclxuICAgICAgICBoID0gdGg7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDU1Mgc2V0dXAsIFxyXG4gICAgLy8gYWxsIHNsaWRlcyBpbiB0aGUgc2FtZSBsaW5lLFxyXG4gICAgLy8gYWxsIHdpdGggc2FtZSBzaXplIChleHRyYSBzcGFjaW5nIGNhblxyXG4gICAgLy8gYmUgZ2l2ZW4gd2l0aCBDU1MpXHJcbiAgICBjLmNzcyh7XHJcbiAgICAgIHdpZHRoOiB3IC0gKGMub3V0ZXJXaWR0aCgpIC0gYy53aWR0aCgpKSxcclxuICAgICAgLy9oZWlnaHQ6IGggLSAoYy5vdXRlckhlaWdodCgpIC0gYy5oZWlnaHQoKSksXHJcbiAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXHJcbiAgICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnXHJcbiAgICB9KTtcclxuXHJcbiAgICBzbGlkZXMuY3NzKHtcclxuICAgICAgd2hpdGVTcGFjZTogJ25vcm1hbCcsXHJcbiAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXHJcbiAgICB9KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICB0LmNzcyh7XHJcbiAgICAgICAgd2lkdGg6IHcgLSAodC5vdXRlcldpZHRoKCkgLSB0LndpZHRoKCkpXHJcbiAgICAgICAgLy8saGVpZ2h0OiBoIC0gKHQub3V0ZXJIZWlnaHQoKSAtIHQuaGVpZ2h0KCkpXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVwb3NpdGlvbmF0ZSBhdCB0aGUgYmVnZ2luaW5nOlxyXG4gICAgY1swXS5zY3JvbGxMZWZ0ID0gMDtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHbyB0byBhIHNsaWRlIGJ5IGluZGV4XHJcbiAgKiovXHJcbiAgdGhpcy5nb1NsaWRlID0gZnVuY3Rpb24gZ29TbGlkZShpbmRleCkge1xyXG4gICAgdmFyIHByZXYgPSB0aGlzLmN1cnJlbnRJbmRleDtcclxuICAgIGlmIChwcmV2ID09IGluZGV4KVxyXG4gICAgICByZXR1cm47XHJcblxyXG4gICAgLy8gQ2hlY2sgYm91bmRzXHJcbiAgICBpZiAoaW5kZXggPCAxKVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB2YXIgc2xpZGVzID0gdGhpcy5nZXRTbGlkZXMoKTtcclxuICAgIGlmIChpbmRleCA+IHNsaWRlcy5sZW5ndGgpXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAvLyBHb29kIGluZGV4LCBzZXQgYXMgY3VycmVudFxyXG4gICAgdGhpcy5jdXJyZW50SW5kZXggPSBpbmRleDtcclxuICAgIC8vIFNldCBsaW5rcyB0byB0aGlzIGFzIGN1cnJlbnQsIHJlbW92aW5nIGFueSBwcmV2aW91czpcclxuICAgIHRoaXMuZWxlbWVudC5maW5kKCdbaHJlZj0jJyArIHRoaXMuaHJlZlByZWZpeCArIGluZGV4ICsgJ10nKVxyXG4gICAgLmFkZENsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpXHJcbiAgICAucGFyZW50KCdsaScpLmFkZENsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpO1xyXG4gICAgdGhpcy5lbGVtZW50LmZpbmQoJ1tocmVmPSMnICsgdGhpcy5ocmVmUHJlZml4ICsgcHJldiArICddJylcclxuICAgIC5yZW1vdmVDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKVxyXG4gICAgLnBhcmVudCgnbGknKS5yZW1vdmVDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKTtcclxuXHJcbiAgICB2YXIgXHJcbiAgICAgIHNsaWRlID0gJChzbGlkZXMuZ2V0KGluZGV4IC0gMSkpLFxyXG4gICAgICBjID0gdGhpcy5nZXRTbGlkZXNDb250YWluZXIoKSxcclxuICAgICAgbGVmdCA9IGMuc2Nyb2xsTGVmdCgpICsgc2xpZGUucG9zaXRpb24oKS5sZWZ0O1xyXG5cclxuICAgIGMuc3RvcCgpLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiBsZWZ0IH0sIHRoaXMuZHVyYXRpb24pO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IEdldCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gb2Ygc2xpZGVzXHJcbiAgKiovXHJcbiAgdGhpcy5nZXRTbGlkZXMgPSBmdW5jdGlvbiBnZXRTbGlkZXMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50XHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZXMpXHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHZXQgdGhlIGpRdWVyeSBlbGVtZW50IGZvciB0aGUgY29udGFpbmVyIG9mIHNsaWRlc1xyXG4gICoqL1xyXG4gIHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyID0gZnVuY3Rpb24gZ2V0U2xpZGVzQ29udGFpbmVyKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGVzKTtcclxuICB9O1xyXG5cclxuICAvKiogTGFzdCBpbml0IHN0ZXBzXHJcbiAgKiovXHJcbiAgdGhpcy5yZWRyYXcoKTtcclxufTtcclxuXHJcblNpbXBsZVNsaWRlci5wcm90b3R5cGUgPSB7XHJcbiAgZWxlbWVudDogbnVsbCxcclxuICBzZWxlY3RvcnM6IHtcclxuICAgIHNsaWRlczogJy5zbGlkZXMnLFxyXG4gICAgc2xpZGU6ICdsaS5zbGlkZSdcclxuICB9LFxyXG4gIGN1cnJlbnRTbGlkZUNsYXNzOiAnanMtaXNDdXJyZW50JyxcclxuICBocmVmUHJlZml4OiAnZ29TbGlkZV8nLFxyXG4gIC8vIER1cmF0aW9uIG9mIGVhY2ggc2xpZGUgaW4gbWlsbGlzZWNvbmRzXHJcbiAgZHVyYXRpb246IDEwMDBcclxufTsiLCIvKiogUG9seWZpbGwgZm9yIHN0cmluZy5jb250YWluc1xyXG4qKi9cclxuaWYgKCEoJ2NvbnRhaW5zJyBpbiBTdHJpbmcucHJvdG90eXBlKSlcclxuICAgIFN0cmluZy5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoc3RyLCBzdGFydEluZGV4KSB7IHJldHVybiAtMSAhPT0gdGhpcy5pbmRleE9mKHN0ciwgc3RhcnRJbmRleCk7IH07IiwiLyoqID09PT09PT09PT09PT09PT09PT09PT1cclxuICogQSBzaW1wbGUgU3RyaW5nIEZvcm1hdFxyXG4gKiBmdW5jdGlvbiBmb3IgamF2YXNjcmlwdFxyXG4gKiBBdXRob3I6IElhZ28gTG9yZW56byBTYWxndWVpcm9cclxuICogTW9kdWxlOiBDb21tb25KU1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJpbmdGb3JtYXQoKSB7XHJcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcblx0dmFyIGZvcm1hdHRlZCA9IGFyZ3NbMF07XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXFxcXHsnK2krJ1xcXFx9JywgJ2dpJyk7XHJcblx0XHRmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSsxXSk7XHJcblx0fVxyXG5cdHJldHVybiBmb3JtYXR0ZWQ7XHJcbn07IiwiLyoqXHJcbiAgICBHZW5lcmFsIGF1dG8tbG9hZCBzdXBwb3J0IGZvciB0YWJzOiBcclxuICAgIElmIHRoZXJlIGlzIG5vIGNvbnRlbnQgd2hlbiBmb2N1c2VkLCB0aGV5IHVzZSB0aGUgJ3JlbG9hZCcganF1ZXJ5IHBsdWdpblxyXG4gICAgdG8gbG9hZCBpdHMgY29udGVudCAtdGFicyBuZWVkIHRvIGJlIGNvbmZpZ3VyZWQgd2l0aCBkYXRhLXNvdXJjZS11cmwgYXR0cmlidXRlXHJcbiAgICBpbiBvcmRlciB0byBrbm93IHdoZXJlIHRvIGZldGNoIHRoZSBjb250ZW50LS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuLy8gRGVwZW5kZW5jeSBUYWJiZWRVWCBmcm9tIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCkge1xyXG4gICAgLy8gVGFiYmVkVVguc2V0dXAudGFiQm9keVNlbGVjdG9yIHx8ICcudGFiLWJvZHknXHJcbiAgICAkKCcudGFiLWJvZHknKS5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgJHQucmVsb2FkKCk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIFRoaXMgYWRkcyBub3RpZmljYXRpb25zIHRvIHRhYnMgZnJvbSB0aGUgVGFiYmVkVVggc3lzdGVtIHVzaW5nXHJcbiAgICB0aGUgY2hhbmdlc05vdGlmaWNhdGlvbiB1dGlsaXR5IHRoYXQgZGV0ZWN0cyBub3Qgc2F2ZWQgY2hhbmdlcyBvbiBmb3JtcyxcclxuICAgIHNob3dpbmcgd2FybmluZyBtZXNzYWdlcyB0byB0aGVcclxuICAgIHVzZXIgYW5kIG1hcmtpbmcgdGFicyAoYW5kIHN1Yi10YWJzIC8gcGFyZW50LXRhYnMgcHJvcGVybHkpIHRvXHJcbiAgICBkb24ndCBsb3N0IGNoYW5nZXMgbWFkZS5cclxuICAgIEEgYml0IG9mIENTUyBmb3IgdGhlIGFzc2lnbmVkIGNsYXNzZXMgd2lsbCBhbGxvdyBmb3IgdmlzdWFsIG1hcmtzLlxyXG5cclxuICAgIEFLQTogRG9uJ3QgbG9zdCBkYXRhISB3YXJuaW5nIG1lc3NhZ2UgOy0pXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG4vLyBUYWJiZWRVWCBkZXBlbmRlbmN5IGFzIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCwgdGFyZ2V0U2VsZWN0b3IpIHtcclxuICAgIHZhciB0YXJnZXQgPSAkKHRhcmdldFNlbGVjdG9yIHx8ICcuY2hhbmdlcy1ub3RpZmljYXRpb24tZW5hYmxlZCcpO1xyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbi5pbml0KHsgdGFyZ2V0OiB0YXJnZXQgfSk7XHJcblxyXG4gICAgLy8gQWRkaW5nIGNoYW5nZSBub3RpZmljYXRpb24gdG8gdGFiLWJvZHkgZGl2c1xyXG4gICAgLy8gKG91dHNpZGUgdGhlIExDLkNoYW5nZXNOb3RpZmljYXRpb24gY2xhc3MgdG8gbGVhdmUgaXQgYXMgZ2VuZXJpYyBhbmQgc2ltcGxlIGFzIHBvc3NpYmxlKVxyXG4gICAgJCh0YXJnZXQpLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgJ2Zvcm0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHknKS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGRpbmcgY2xhc3MgdG8gdGhlIG1lbnUgaXRlbSAodGFiIHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgJCgnI2xjcmVzLWNoYW5nZXMtbm90LXNhdmVkJykudGV4dCgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKGUsIGYsIGVscywgZnVsbCkge1xyXG4gICAgICAgIGlmIChmdWxsKVxyXG4gICAgICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy50YWItYm9keTpub3QoOmhhcyhmb3JtLmhhcy1jaGFuZ2VzKSknKS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmluZyBjbGFzcyBmcm9tIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCBudWxsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLy8gVG8gYXZvaWQgdXNlciBiZSBub3RpZmllZCBvZiBjaGFuZ2VzIGFsbCB0aW1lIHdpdGggdGFiIG1hcmtzLCB3ZSBhZGRlZCBhICdub3RpZnknIGNsYXNzXHJcbiAgICAvLyBvbiB0YWJzIHdoZW4gYSBjaGFuZ2Ugb2YgdGFiIGhhcHBlbnNcclxuICAgIC5maW5kKCcudGFiLWJvZHknKS5vbigndGFiVW5mb2N1c2VkJywgZnVuY3Rpb24gKGV2ZW50LCBmb2N1c2VkQ3R4KSB7XHJcbiAgICAgICAgdmFyIG1pID0gVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbTtcclxuICAgICAgICBpZiAobWkuaXMoJy5oYXMtY2hhbmdlcycpKSB7XHJcbiAgICAgICAgICAgIG1pLmFkZENsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICAgICAgICAgIC8vIFNob3cgbm90aWZpY2F0aW9uIHBvcHVwXHJcbiAgICAgICAgICAgIHZhciBkID0gJCgnPGRpdiBjbGFzcz1cIndhcm5pbmdcIj5AMDwvZGl2PjxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBjb250aW51ZVwiIHZhbHVlPVwiQDJcIi8+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBzdG9wXCIgdmFsdWU9XCJAMVwiLz48L2Rpdj4nXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDAvZywgTEMuZ2V0VGV4dCgnY2hhbmdlcy1ub3Qtc2F2ZWQnKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMS9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtc3RheS1vbicpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AyL2csIExDLmdldFRleHQoJ3RhYi1oYXMtY2hhbmdlcy1jb250aW51ZS13aXRob3V0LWNoYW5nZScpKSk7XHJcbiAgICAgICAgICAgIGQub24oJ2NsaWNrJywgJy5zdG9wJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKCdjbGljaycsICcuY29udGludWUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh3aW5kb3cpO1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlICdoYXMtY2hhbmdlcycgdG8gYXZvaWQgZnV0dXJlIGJsb2NrcyAodW50aWwgbmV3IGNoYW5nZXMgaGFwcGVucyBvZiBjb3Vyc2UgOy0pXHJcbiAgICAgICAgICAgICAgICBtaS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKTtcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKGZvY3VzZWRDdHgudGFiLmdldCgwKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGQsIHdpbmRvdywgJ25vdC1zYXZlZC1wb3B1cCcsIHsgY2xvc2FibGU6IGZhbHNlLCBjZW50ZXI6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBFdmVyIHJldHVybiBmYWxzZSB0byBzdG9wIGN1cnJlbnQgdGFiIGZvY3VzXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ25vdGlmeS1jaGFuZ2VzJyk7IC8vaGFzLXRvb2x0aXBcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogVGFiYmVkVVg6IFRhYmJlZCBpbnRlcmZhY2UgbG9naWM7IHdpdGggbWluaW1hbCBIVE1MIHVzaW5nIGNsYXNzICd0YWJiZWQnIGZvciB0aGVcclxuY29udGFpbmVyLCB0aGUgb2JqZWN0IHByb3ZpZGVzIHRoZSBmdWxsIEFQSSB0byBtYW5pcHVsYXRlIHRhYnMgYW5kIGl0cyBzZXR1cFxyXG5saXN0ZW5lcnMgdG8gcGVyZm9ybSBsb2dpYyBvbiB1c2VyIGludGVyYWN0aW9uLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5cclxudmFyIFRhYmJlZFVYID0ge1xyXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoJ2JvZHknKS5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGk6bm90KC50YWJzLXNsaWRlcikgPiBhJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKFRhYmJlZFVYLmZvY3VzVGFiKCR0LmF0dHIoJ2hyZWYnKSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdCA9ICQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24uaGFzaCA9ICR0LmF0dHIoJ2hyZWYnKTtcclxuICAgICAgICAgICAgICAgICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcChzdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdtb3VzZWRvd24nLCBUYWJiZWRVWC5zdGFydE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2V1cCBtb3VzZWxlYXZlJywgVGFiYmVkVVguZW5kTW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLy8gdGhlIGNsaWNrIHJldHVybiBmYWxzZSBpcyB0byBkaXNhYmxlIHN0YW5kYXIgdXJsIGJlaGF2aW9yXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdjbGljaycsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlci1saW1pdCcsICdtb3VzZWVudGVyJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGkucmVtb3ZhYmxlJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgLy8gT25seSBvbiBkaXJlY3QgY2xpY2tzIHRvIHRoZSB0YWIsIHRvIGF2b2lkXHJcbiAgICAgICAgICAgIC8vIGNsaWNrcyB0byB0aGUgdGFiLWxpbmsgKHRoYXQgc2VsZWN0L2ZvY3VzIHRoZSB0YWIpOlxyXG4gICAgICAgICAgICBpZiAoZS50YXJnZXQgPT0gZS5jdXJyZW50VGFyZ2V0KVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKG51bGwsIHRoaXMpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBJbml0IHBhZ2UgbG9hZGVkIHRhYmJlZCBjb250YWluZXJzOlxyXG4gICAgICAgICQoJy50YWJiZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgLy8gQ29uc2lzdGVuY2UgY2hlY2s6IHRoaXMgbXVzdCBiZSBhIHZhbGlkIGNvbnRhaW5lciwgdGhpcyBpcywgbXVzdCBoYXZlIC50YWJzXHJcbiAgICAgICAgICAgIGlmICgkdC5jaGlsZHJlbignLnRhYnMnKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIC8vIEluaXQgc2xpZGVyXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnNldHVwU2xpZGVyKCR0KTtcclxuICAgICAgICAgICAgLy8gQ2xlYW4gd2hpdGUgc3BhY2VzICh0aGV5IGNyZWF0ZSBleGNlc2l2ZSBzZXBhcmF0aW9uIGJldHdlZW4gc29tZSB0YWJzKVxyXG4gICAgICAgICAgICAkKCcudGFicycsIHRoaXMpLmNvbnRlbnRzKCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGEgdGV4dCBub2RlLCByZW1vdmUgaXQ6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ub2RlVHlwZSA9PSAzKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciBkaXIgPSAkdC5oYXNDbGFzcygndGFicy1zbGlkZXItcmlnaHQnKSA/IDEgOiAtMTtcclxuICAgICAgICB2YXIgdGFic1NsaWRlciA9ICR0LnBhcmVudCgpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdGFic1NsaWRlci5zaWJsaW5ncygnLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICB0YWJzWzBdLnNjcm9sbExlZnQgKz0gMjAgKiBkaXI7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFic1NsaWRlci5wYXJlbnQoKSwgdGFicyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHN0YXJ0TW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIHRhYnMgPSB0LmNsb3Nlc3QoJy50YWJiZWQnKS5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTdG9wIHByZXZpb3VzIGFuaW1hdGlvbnM6XHJcbiAgICAgICAgdGFicy5zdG9wKHRydWUpO1xyXG4gICAgICAgIHZhciBzcGVlZCA9IDAuMzsgLyogc3BlZWQgdW5pdDogcGl4ZWxzL21pbGlzZWNvbmRzICovXHJcbiAgICAgICAgdmFyIGZ4YSA9IGZ1bmN0aW9uICgpIHsgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFicy5wYXJlbnQoKSwgdGFicyk7IH07XHJcbiAgICAgICAgdmFyIHRpbWU7XHJcbiAgICAgICAgaWYgKHQuaGFzQ2xhc3MoJ3JpZ2h0JykpIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSAodGFic1swXS5zY3JvbGxXaWR0aCAtIHRhYnNbMF0uc2Nyb2xsTGVmdCAtIHRhYnMud2lkdGgoKSkgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzLndpZHRoKCkgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSB0YWJzWzBdLnNjcm9sbExlZnQgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IDAgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBlbmRNb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWJDb250YWluZXIgPSAkKHRoaXMpLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuc3RvcCh0cnVlKTtcclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYlNsaWRlckxpbWl0czogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFicykge1xyXG4gICAgICAgIHRhYnMgPSB0YWJzIHx8IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTZXQgdmlzaWJpbGl0eSBvZiB2aXN1YWwgbGltaXRlcnM6XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtbGVmdCcpLnRvZ2dsZSh0YWJzWzBdLnNjcm9sbExlZnQgPiAwKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlci1saW1pdC1yaWdodCcpLnRvZ2dsZShcclxuICAgICAgICAgICAgKHRhYnNbMF0uc2Nyb2xsTGVmdCArIHRhYnMud2lkdGgoKSkgPCB0YWJzWzBdLnNjcm9sbFdpZHRoKTtcclxuICAgIH0sXHJcbiAgICBzZXR1cFNsaWRlcjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lcikge1xyXG4gICAgICAgIHZhciB0cyA9IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMnKS5oYXNTY3JvbGxCYXIoeyB4OiAtMiB9KS5ob3Jpem9udGFsKSB7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hZGRDbGFzcygnaGFzLXRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgICAgIGlmICh0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICB0cy5jbGFzc05hbWUgPSAndGFicy1zbGlkZXInO1xyXG4gICAgICAgICAgICAgICAgJCh0cylcclxuICAgICAgICAgICAgICAgIC8vIEFycm93czpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+Jmx0OyZsdDs8L2E+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLXJpZ2h0IHJpZ2h0XCIgaHJlZj1cIiNcIj4mZ3Q7Jmd0OzwvYT4nKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hcHBlbmQodHMpO1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyXHJcbiAgICAgICAgICAgICAgICAvLyBEZXNpbmcgZGV0YWlsczpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtbGVmdCBsZWZ0XCIgaHJlZj1cIiNcIj48L2Rpdj4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0YWJzLXNsaWRlci1saW1pdCB0YWJzLXNsaWRlci1saW1pdC1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0cy5zaG93KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIucmVtb3ZlQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICB0cy5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYkNvbnRhaW5lcik7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dEJ5QXJnczogZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiB0eXBlb2YgKGFyZ3NbMF0pID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KGFyZ3NbMF0sIG51bGwpO1xyXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIGFyZ3NbMF0udGFiKVxyXG4gICAgICAgICAgICByZXR1cm4gYXJnc1swXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhYkNvbnRleHQoXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDAgPyBhcmdzWzBdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMSA/IGFyZ3NbMV0gOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAyID8gYXJnc1syXSA6IG51bGxcclxuICAgICAgICAgICAgKTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWJDb250ZXh0OiBmdW5jdGlvbiAodGFiT3JTZWxlY3RvciwgbWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIG1pLCBtYSwgdGFiLCB0YWJDb250YWluZXI7XHJcbiAgICAgICAgaWYgKHRhYk9yU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdGFiID0gJCh0YWJPclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKHRhYi5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gdGFiLnBhcmVudHMoJy50YWJiZWQ6ZXEoMCknKTtcclxuICAgICAgICAgICAgICAgIG1hID0gdGFiQ29udGFpbmVyLmZpbmQoJz4gLnRhYnMgPiBsaSA+IGFbaHJlZj0jJyArIHRhYi5nZXQoMCkuaWQgKyAnXScpO1xyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAobWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIG1hID0gJChtZW51aXRlbU9yU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAobWEuaXMoJ2xpJykpIHtcclxuICAgICAgICAgICAgICAgIG1pID0gbWE7XHJcbiAgICAgICAgICAgICAgICBtYSA9IG1pLmNoaWxkcmVuKCdhOmVxKDApJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gbWkuY2xvc2VzdCgnLnRhYmJlZCcpO1xyXG4gICAgICAgICAgICB0YWIgPSB0YWJDb250YWluZXIuZmluZCgnPi50YWItYm9keUAwLCA+LnRhYi1ib2R5LWxpc3Q+LnRhYi1ib2R5QDAnLnJlcGxhY2UoL0AwL2csIG1hLmF0dHIoJ2hyZWYnKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyB0YWI6IHRhYiwgbWVudWFuY2hvcjogbWEsIG1lbnVpdGVtOiBtaSwgdGFiQ29udGFpbmVyOiB0YWJDb250YWluZXIgfTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYkNvbnRleHQ6IGZ1bmN0aW9uIChjdHgsIGZ1bmN0aW9ubmFtZSwgYXJncywgaXNUZXN0KSB7XHJcbiAgICAgICAgaWYgKCFjdHgudGFiIHx8IGN0eC50YWIubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC5tZW51aXRlbSB8fCBjdHgubWVudWl0ZW0ubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC50YWJDb250YWluZXIgfHwgY3R4LnRhYkNvbnRhaW5lci5sZW5ndGggIT0gMSB8fCBcclxuICAgICAgICAgICAgIWN0eC5tZW51YW5jaG9yIHx8IGN0eC5tZW51YW5jaG9yLmxlbmd0aCAhPSAxKSB7XHJcbiAgICAgICAgICAgIGlmICghaXNUZXN0ICYmIGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RhYmJlZFVYLicgKyBmdW5jdGlvbm5hbWUgKyAnLCBiYWQgYXJndW1lbnRzOiAnICsgQXJyYXkuam9pbihhcmdzLCAnLCAnKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMsIHRydWUpKSByZXR1cm4gbnVsbDtcclxuICAgICAgICByZXR1cm4gY3R4LnRhYi5nZXQoMCk7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdmb2N1c1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gR2V0IHByZXZpb3VzIGZvY3VzZWQgdGFiLCB0cmlnZ2VyICd0YWJVbmZvY3VzZWQnIGhhbmRsZXIgdGhhdCBjYW5cclxuICAgICAgICAvLyBzdG9wIHRoaXMgZm9jdXMgKHJldHVybmluZyBleHBsaWNpdHkgJ2ZhbHNlJylcclxuICAgICAgICB2YXIgcHJldlRhYiA9IGN0eC50YWIuc2libGluZ3MoJy5jdXJyZW50Jyk7XHJcbiAgICAgICAgaWYgKHByZXZUYWIudHJpZ2dlckhhbmRsZXIoJ3RhYlVuZm9jdXNlZCcsIFtjdHhdKSA9PT0gZmFsc2UpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgKGZpcnN0ISkgaWYgdGhlcmUgaXMgYSBwYXJlbnQgdGFiIGFuZCBmb2N1cyBpdCB0b28gKHdpbGwgYmUgcmVjdXJzaXZlIGNhbGxpbmcgdGhpcyBzYW1lIGZ1bmN0aW9uKVxyXG4gICAgICAgIHZhciBwYXJUYWIgPSBjdHgudGFiLnBhcmVudHMoJy50YWItYm9keTplcSgwKScpO1xyXG4gICAgICAgIGlmIChwYXJUYWIubGVuZ3RoID09IDEpIHRoaXMuZm9jdXNUYWIocGFyVGFiKTtcclxuXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpIHx8XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5oYXNDbGFzcygnZGlzYWJsZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBVbnNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnLmN1cnJlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpXHJcbiAgICAgICAgICAgIC5maW5kKCc+YScpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgLy8gU2V0IGN1cnJlbnQgbWVudSBlbGVtZW50XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgY3R4Lm1lbnVhbmNob3IuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuXHJcbiAgICAgICAgLy8gSGlkZSBjdXJyZW50IHRhYi1ib2R5XHJcbiAgICAgICAgcHJldlRhYi5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNob3cgY3VycmVudCB0YWItYm9keSBhbmQgdHJpZ2dlciBldmVudFxyXG4gICAgICAgIGN0eC50YWIuYWRkQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkZvY3VzZWQnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWJJbmRleDogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFiSW5kZXgpIHtcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb2N1c1RhYih0aGlzLmdldFRhYkNvbnRleHQodGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHk6ZXEoJyArIHRhYkluZGV4ICsgJyknKSkpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICAvKiBFbmFibGUgYSB0YWIsIGRpc2FibGluZyBhbGwgb3RoZXJzIHRhYnMgLXVzZWZ1bGwgaW4gd2l6YXJkIHN0eWxlIHBhZ2VzLSAqL1xyXG4gICAgZW5hYmxlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZW5hYmxlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBydG4gPSBmYWxzZTtcclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmlzKCcuZGlzYWJsZWQnKSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZGlzYWJsZWQgY2xhc3MgZnJvbSBmb2N1c2VkIHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgICAgIGN0eC50YWIucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJFbmFibGVkJyk7XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgcnRuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRm9jdXMgdGFiOlxyXG4gICAgICAgIHRoaXMuZm9jdXNUYWIoY3R4KTtcclxuICAgICAgICAvLyBEaXNhYmxlZCB0YWJzIGFuZCBtZW51IGl0ZW1zOlxyXG4gICAgICAgIGN0eC50YWIuc2libGluZ3MoJzpub3QoLmRpc2FibGVkKScpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkRpc2FibGVkJyk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgcmV0dXJuIHJ0bjtcclxuICAgIH0sXHJcbiAgICBzaG93aGlkZUR1cmF0aW9uOiAwLFxyXG4gICAgc2hvd2hpZGVFYXNpbmc6IG51bGwsXHJcbiAgICBzaG93VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2hvd1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTaG93IHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgY3R4LnRhYi5zaG93KHRoaXMuc2hvd2hpZGVEdXJhdGlvbik7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNob3codGhpcy5zaG93aGlkZUVhc2luZyk7XHJcbiAgICB9LFxyXG4gICAgaGlkZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2hpZGVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuaGlkZSh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5oaWRlKHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIHRhYkJvZHlDbGFzc0V4Y2VwdGlvbnM6IHsgJ3RhYi1ib2R5JzogMCwgJ3RhYmJlZCc6IDAsICdjdXJyZW50JzogMCwgJ2Rpc2FibGVkJzogMCB9LFxyXG4gICAgY3JlYXRlVGFiOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCBpZE5hbWUsIGxhYmVsKSB7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyID0gJCh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIC8vIHRhYkNvbnRhaW5lciBtdXN0IGJlIG9ubHkgb25lIGFuZCB2YWxpZCBjb250YWluZXJcclxuICAgICAgICAvLyBhbmQgaWROYW1lIG11c3Qgbm90IGV4aXN0c1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIubGVuZ3RoID09IDEgJiYgdGFiQ29udGFpbmVyLmlzKCcudGFiYmVkJykgJiZcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWROYW1lKSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGFiIGRpdjpcclxuICAgICAgICAgICAgdmFyIHRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICB0YWIuaWQgPSBpZE5hbWU7XHJcbiAgICAgICAgICAgIC8vIFJlcXVpcmVkIGNsYXNzZXNcclxuICAgICAgICAgICAgdGFiLmNsYXNzTmFtZSA9IFwidGFiLWJvZHlcIjtcclxuICAgICAgICAgICAgdmFyICR0YWIgPSAkKHRhYik7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbiBleGlzdGluZyBzaWJsaW5nIGFuZCBjb3B5ICh3aXRoIHNvbWUgZXhjZXB0aW9ucykgdGhlaXIgY3NzIGNsYXNzZXNcclxuICAgICAgICAgICAgJC5lYWNoKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYi1ib2R5OmVxKDApJykuYXR0cignY2xhc3MnKS5zcGxpdCgvXFxzKy8pLCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEodiBpbiBUYWJiZWRVWC50YWJCb2R5Q2xhc3NFeGNlcHRpb25zKSlcclxuICAgICAgICAgICAgICAgICAgICAkdGFiLmFkZENsYXNzKHYpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRhYik7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbWVudSBlbnRyeVxyXG4gICAgICAgICAgICB2YXIgbWVudWl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB0YWIsIGlzIGEgZHluYW1pY2FsbHkgcmVtb3ZhYmxlIHRhYjpcclxuICAgICAgICAgICAgbWVudWl0ZW0uY2xhc3NOYW1lID0gXCJyZW1vdmFibGVcIjtcclxuICAgICAgICAgICAgdmFyIG1lbnVhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgICAgIG1lbnVhbmNob3Iuc2V0QXR0cmlidXRlKCdocmVmJywgJyMnICsgaWROYW1lKTtcclxuICAgICAgICAgICAgLy8gbGFiZWwgY2Fubm90IGJlIG51bGwgb3IgZW1wdHlcclxuICAgICAgICAgICAgJChtZW51YW5jaG9yKS50ZXh0KGlzRW1wdHlTdHJpbmcobGFiZWwpID8gXCJUYWJcIiA6IGxhYmVsKTtcclxuICAgICAgICAgICAgJChtZW51aXRlbSkuYXBwZW5kKG1lbnVhbmNob3IpO1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gdGFicyBsaXN0IGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuYXBwZW5kKG1lbnVpdGVtKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgbmV3IHRhYiBhcyBkYXRhXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci50cmlnZ2VySGFuZGxlcigndGFiQ3JlYXRlZCcsIFt0YWJdKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0dXBTbGlkZXIodGFiQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICByZW1vdmVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdyZW1vdmVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIE9ubHkgcmVtb3ZlIGlmIGlzIGEgJ3JlbW92YWJsZScgdGFiXHJcbiAgICAgICAgaWYgKCFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3JlbW92YWJsZScpICYmICFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3ZvbGF0aWxlJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvLyBJZiB0YWIgaXMgY3VycmVudGx5IGZvY3VzZWQgdGFiLCBjaGFuZ2UgdG8gZmlyc3QgdGFiXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpKVxyXG4gICAgICAgICAgICB0aGlzLmZvY3VzVGFiSW5kZXgoY3R4LnRhYkNvbnRhaW5lciwgMCk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnJlbW92ZSgpO1xyXG4gICAgICAgIHZhciB0YWJpZCA9IGN0eC50YWIuZ2V0KDApLmlkO1xyXG4gICAgICAgIGN0eC50YWIucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dXBTbGlkZXIoY3R4LnRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgcmVtb3ZlZCB0YWIgaWQgYXMgZGF0YVxyXG4gICAgICAgIGN0eC50YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYlJlbW92ZWQnLCBbdGFiaWRdKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBzZXRUYWJUaXRsZTogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG5ld1RpdGxlKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdzZXRUYWJUaXRsZScsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTZXQgYW4gZW1wdHkgc3RyaW5nIGlzIG5vdCBhbGxvd2VkLCBwcmVzZXJ2ZSBwcmV2aW91c2x5OlxyXG4gICAgICAgIGlmICghaXNFbXB0eVN0cmluZyhuZXdUaXRsZSkpXHJcbiAgICAgICAgICAgIGN0eC5tZW51YW5jaG9yLnRleHQobmV3VGl0bGUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyogTW9yZSBzdGF0aWMgdXRpbGl0aWVzICovXHJcblxyXG4vKiogTG9vayB1cCB0aGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb24gYWRkcmVzcyBhbmQgdHJ5IHRvIGZvY3VzIGEgdGFiIHdpdGggdGhhdFxyXG4gICAgbmFtZSwgaWYgdGhlcmUgaXMgb25lLlxyXG4qKi9cclxuVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBJZiB0aGUgY3VycmVudCBsb2NhdGlvbiBoYXZlIGEgaGFzaCB2YWx1ZSBidXQgaXMgbm90IGEgSGFzaEJhbmdcclxuICAgIGlmICgvXiNbXiFdLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgIC8vIFRyeSBmb2N1cyBhIHRhYiB3aXRoIHRoYXQgbmFtZVxyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIod2luZG93LmxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmICh0YWIpXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRhYik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiogTG9vayBmb3Igdm9sYXRpbGUgdGFicyBvbiB0aGUgcGFnZSwgaWYgdGhleSBhcmVcclxuICAgIGVtcHR5IG9yIHJlcXVlc3RpbmcgYmVpbmcgJ3ZvbGF0aXplZCcsIHJlbW92ZSBpdC5cclxuKiovXHJcblRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJCgnLnRhYmJlZCA+IC50YWJzID4gLnZvbGF0aWxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhYiA9IFRhYmJlZFVYLmdldFRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICBpZiAodGFiICYmICgkKHRhYikuY2hpbGRyZW4oKS5sZW5ndGggPT09IDAgfHwgJCh0YWIpLmZpbmQoJzpub3QoLnRhYmJlZCkgLnZvbGF0aXplLW15LXRhYicpLmxlbmd0aCkpIHtcclxuICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKHRhYik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUYWJiZWRVWDsiLCIvKiBzbGlkZXItdGFicyBsb2dpYy5cclxuKiBFeGVjdXRlIGluaXQgYWZ0ZXIgVGFiYmVkVVguaW5pdCB0byBhdm9pZCBsYXVuY2ggYW5pbWF0aW9uIG9uIHBhZ2UgbG9hZC5cclxuKiBJdCByZXF1aXJlcyBUYWJiZWRVWCB0aHJvdWdodCBESSBvbiAnaW5pdCcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRTbGlkZXJUYWJzKFRhYmJlZFVYKSB7XHJcbiAgICAkKCcudGFiYmVkLnNsaWRlci10YWJzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgJHRhYnMgPSAkdC5jaGlsZHJlbignLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgdmFyIGMgPSAkdGFic1xyXG4gICAgICAgICAgICAud3JhcEFsbCgnPGRpdiBjbGFzcz1cInRhYi1ib2R5LWxpc3RcIi8+JylcclxuICAgICAgICAgICAgLmVuZCgpLmNoaWxkcmVuKCcudGFiLWJvZHktbGlzdCcpO1xyXG4gICAgICAgICR0YWJzLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjLnN0b3AodHJ1ZSwgZmFsc2UpLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiBjLnNjcm9sbExlZnQoKSArICQodGhpcykucG9zaXRpb24oKS5sZWZ0IH0sIDE0MDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIFNldCBob3Jpem9udGFsIHNjcm9sbCB0byB0aGUgcG9zaXRpb24gb2YgY3VycmVudCBzaG93ZWQgdGFiLCB3aXRob3V0IGFuaW1hdGlvbiAoZm9yIHBhZ2UtaW5pdCk6XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUYWIgPSAkKCR0LmZpbmQoJz4udGFicz5saS5jdXJyZW50PmEnKS5hdHRyKCdocmVmJykpO1xyXG4gICAgICAgIGMuc2Nyb2xsTGVmdChjLnNjcm9sbExlZnQoKSArIGN1cnJlbnRUYWIucG9zaXRpb24oKS5sZWZ0KTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgV2l6YXJkIFRhYmJlZCBGb3Jtcy5cclxuICAgIEl0IHVzZSB0YWJzIHRvIG1hbmFnZSB0aGUgZGlmZmVyZW50IGZvcm1zLXN0ZXBzIGluIHRoZSB3aXphcmQsXHJcbiAgICBsb2FkZWQgYnkgQUpBWCBhbmQgZm9sbG93aW5nIHRvIHRoZSBuZXh0IHRhYi9zdGVwIG9uIHN1Y2Nlc3MuXHJcblxyXG4gICAgUmVxdWlyZSBUYWJiZWRVWCB2aWEgREkgb24gJ2luaXQnXHJcbiAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRUYWJiZWRXaXphcmQoVGFiYmVkVVgsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgbG9hZGluZ0RlbGF5OiAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKFwiYm9keVwiKS5kZWxlZ2F0ZShcIi50YWJiZWQud2l6YXJkIC5uZXh0XCIsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGZvcm1cclxuICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGN1cnJlbnQgd2l6YXJkIHN0ZXAtdGFiXHJcbiAgICAgICAgdmFyIGN1cnJlbnRTdGVwID0gZm9ybS5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQgY29udGFpbmVyXHJcbiAgICAgICAgdmFyIHdpemFyZCA9IGZvcm0uY2xvc2VzdCgnLnRhYmJlZC53aXphcmQnKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQtbmV4dC1zdGVwXHJcbiAgICAgICAgdmFyIG5leHRTdGVwID0gJCh0aGlzKS5kYXRhKCd3aXphcmQtbmV4dC1zdGVwJyk7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgIGJveDogY3VycmVudFN0ZXAsXHJcbiAgICAgICAgICAgIGZvcm06IGZvcm1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgdmFsb2JqZWN0ID0gZm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBWYWxpZGF0aW9uIGlzIGFjdGl2ZWQsIHdhcyBleGVjdXRlZCBhbmQgdGhlIHJlc3VsdCBpcyAnZmFsc2UnOiBiYWQgZGF0YSwgc3RvcCBQb3N0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciBjdXN2YWwgPSBmb3JtLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAoY3VzdmFsICYmIGN1c3ZhbC52YWxpZGF0ZSAmJiBjdXN2YWwudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gY3VzdG9tIHZhbGlkYXRpb24gbm90IHBhc3NlZCwgb3V0IVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSYWlzZSBldmVudFxyXG4gICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2JlZ2luU3VibWl0V2l6YXJkU3RlcCcpO1xyXG5cclxuICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIHJldGFyZFxyXG4gICAgICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAuYmxvY2soYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgICAgIH0sIG9wdGlvbnMubG9hZGluZ0RlbGF5KTtcclxuICAgICAgICBcclxuICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIG9rID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIE1hcmsgYXMgc2F2ZWQ6XHJcbiAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogKGZvcm0uYXR0cignYWN0aW9uJykgfHwgJycpLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICAgICAgZGF0YTogZm9ybS5zZXJpYWxpemUoKSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgc3VjY2VzcywgZ28gbmV4dCBzdGVwLCB1c2luZyBjdXN0b20gSlNPTiBBY3Rpb24gZXZlbnQ6XHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5vbignYWpheFN1Y2Nlc3NQb3N0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5leHQtc3RlcFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0U3RlcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBuZXh0IHN0ZXAgaXMgaW50ZXJuYWwgdXJsIChhIG5leHQgd2l6YXJkIHRhYilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eIy8udGVzdChuZXh0U3RlcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2JlZ2luTG9hZFdpemFyZFN0ZXAnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWJiZWRVWC5lbmFibGVUYWIobmV4dFN0ZXApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9rID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2VuZExvYWRXaXphcmRTdGVwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG5leHQtc3RlcCBVUkkgdGhhdCBpcyBub3QgaW50ZXJuYWwgbGluaywgd2UgbG9hZCBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhuZXh0U3RlcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgICAgICAgICAgICAgaWYgKCFhamF4Q2FsbGJhY2tzLmRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAgICAgICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93aW5nIG5ldyBodG1sOlxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLmh0bWwobmV3aHRtbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0Zvcm0gPSBjdXJyZW50U3RlcDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnRTdGVwLmlzKCdmb3JtJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0gPSBjdXJyZW50U3RlcC5maW5kKCdmb3JtOmVxKDApJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcigncmVsb2FkZWRIdG1sV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgICAgICAgICAgY29tcGxldGU6IGFqYXhDYWxsYmFja3MuY29tcGxldGVcclxuICAgICAgICB9KS5jb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2VuZFN1Ym1pdFdpemFyZFN0ZXAnLCBvayk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqIHRpbWVTcGFuIGNsYXNzIHRvIG1hbmFnZSB0aW1lcywgcGFyc2UsIGZvcm1hdCwgY29tcHV0ZS5cclxuSXRzIG5vdCBzbyBjb21wbGV0ZSBhcyB0aGUgQyMgb25lcyBidXQgaXMgdXNlZnVsbCBzdGlsbC5cclxuKiovXHJcbnZhciBUaW1lU3BhbiA9IGZ1bmN0aW9uIChkYXlzLCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzKSB7XHJcbiAgICB0aGlzLmRheXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoZGF5cykpIHx8IDA7XHJcbiAgICB0aGlzLmhvdXJzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGhvdXJzKSkgfHwgMDtcclxuICAgIHRoaXMubWludXRlcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaW51dGVzKSkgfHwgMDtcclxuICAgIHRoaXMuc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChzZWNvbmRzKSkgfHwgMDtcclxuICAgIHRoaXMubWlsbGlzZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbGxpc2Vjb25kcykpIHx8IDA7XHJcblxyXG4gICAgLy8gaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbiAgICBmdW5jdGlvbiB0KG4pIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihuIC8gMTApICsgJycgKyBuICUgMTA7XHJcbiAgICB9XHJcbiAgICAvKiogU2hvdyBvbmx5IGhvdXJzIGFuZCBtaW51dGVzIGFzIGEgc3RyaW5nIHdpdGggdGhlIGZvcm1hdCBISDptbVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU2hvcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1Nob3J0U3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKTtcclxuICAgICAgICByZXR1cm4gKGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArIG0pO1xyXG4gICAgfTtcclxuICAgIC8qKiBTaG93IHRoZSBmdWxsIHRpbWUgYXMgYSBzdHJpbmcsIGRheXMgY2FuIGFwcGVhciBiZWZvcmUgaG91cnMgaWYgdGhlcmUgYXJlIDI0IGhvdXJzIG9yIG1vcmVcclxuICAgICoqL1xyXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgZCA9ICh0aGlzLmRheXMgPiAwID8gdGhpcy5kYXlzLnRvU3RyaW5nKCkgKyBUaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA6ICcnKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKSxcclxuICAgICAgICAgICAgcyA9IHQodGhpcy5zZWNvbmRzICsgdGhpcy5taWxsaXNlY29uZHMgLyAxMDAwKTtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBkICtcclxuICAgICAgICAgICAgaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgbSArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgcyk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy52YWx1ZU9mID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdmFsdWVPZigpIHtcclxuICAgICAgICAvLyBSZXR1cm4gdGhlIHRvdGFsIG1pbGxpc2Vjb25kcyBjb250YWluZWQgYnkgdGhlIHRpbWVcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmRheXMgKiAoMjQgKiAzNjAwMDAwKSArXHJcbiAgICAgICAgICAgIHRoaXMuaG91cnMgKiAzNjAwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taW51dGVzICogNjAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLnNlY29uZHMgKiAxMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHNcclxuICAgICAgICApO1xyXG4gICAgfTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBtaWxsaXNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWlsbGlzZWNvbmRzKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIG1zID0gbWlsbGlzZWNvbmRzICUgMTAwMCxcclxuICAgICAgICBzID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAxMDAwKSAlIDYwLFxyXG4gICAgICAgIG0gPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDYwMDAwKSAlIDYwLFxyXG4gICAgICAgIGggPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDM2MDAwMDApICUgMjQsXHJcbiAgICAgICAgZCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gKDM2MDAwMDAgKiAyNCkpO1xyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21TZWNvbmRzKHNlY29uZHMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaWxsaXNlY29uZHMoc2Vjb25kcyAqIDEwMDApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgbWludXRlc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWludXRlcyhtaW51dGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tU2Vjb25kcyhtaW51dGVzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgaG91cnNcclxuKiovXHJcblRpbWVTcGFuLmZyb21Ib3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21Ib3Vycyhob3Vycykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbnV0ZXMoaG91cnMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBkYXlzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21EYXlzKGRheXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21Ib3VycyhkYXlzICogMjQpO1xyXG59O1xyXG5cclxuLy8gRm9yIHNwYW5pc2ggYW5kIGVuZ2xpc2ggd29ya3MgZ29vZCAnOicgYXMgdW5pdHNEZWxpbWl0ZXIgYW5kICcuJyBhcyBkZWNpbWFsRGVsaW1pdGVyXHJcbi8vIFRPRE86IHRoaXMgbXVzdCBiZSBzZXQgZnJvbSBhIGdsb2JhbCBMQy5pMThuIHZhciBsb2NhbGl6ZWQgZm9yIGN1cnJlbnQgdXNlclxyXG5UaW1lU3Bhbi51bml0c0RlbGltaXRlciA9ICc6JztcclxuVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgPSAnLic7XHJcblRpbWVTcGFuLnBhcnNlID0gZnVuY3Rpb24gKHN0cnRpbWUpIHtcclxuICAgIHN0cnRpbWUgPSAoc3RydGltZSB8fCAnJykuc3BsaXQodGhpcy51bml0c0RlbGltaXRlcik7XHJcbiAgICAvLyBCYWQgc3RyaW5nLCByZXR1cm5zIG51bGxcclxuICAgIGlmIChzdHJ0aW1lLmxlbmd0aCA8IDIpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgLy8gRGVjb3VwbGVkIHVuaXRzOlxyXG4gICAgdmFyIGQsIGgsIG0sIHMsIG1zO1xyXG4gICAgaCA9IHN0cnRpbWVbMF07XHJcbiAgICBtID0gc3RydGltZVsxXTtcclxuICAgIHMgPSBzdHJ0aW1lLmxlbmd0aCA+IDIgPyBzdHJ0aW1lWzJdIDogMDtcclxuICAgIC8vIFN1YnN0cmFjdGluZyBkYXlzIGZyb20gdGhlIGhvdXJzIHBhcnQgKGZvcm1hdDogJ2RheXMuaG91cnMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIGlmIChoLmNvbnRhaW5zKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpKSB7XHJcbiAgICAgICAgdmFyIGRoc3BsaXQgPSBoLnNwbGl0KHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpO1xyXG4gICAgICAgIGQgPSBkaHNwbGl0WzBdO1xyXG4gICAgICAgIGggPSBkaHNwbGl0WzFdO1xyXG4gICAgfVxyXG4gICAgLy8gTWlsbGlzZWNvbmRzIGFyZSBleHRyYWN0ZWQgZnJvbSB0aGUgc2Vjb25kcyAoYXJlIHJlcHJlc2VudGVkIGFzIGRlY2ltYWwgbnVtYmVycyBvbiB0aGUgc2Vjb25kcyBwYXJ0OiAnc2Vjb25kcy5taWxsaXNlY29uZHMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIG1zID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHMucmVwbGFjZSh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyLCAnLicpKSAqIDEwMDAgJSAxMDAwKTtcclxuICAgIC8vIFJldHVybiB0aGUgbmV3IHRpbWUgaW5zdGFuY2VcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG5UaW1lU3Bhbi56ZXJvID0gbmV3IFRpbWVTcGFuKDAsIDAsIDAsIDAsIDApO1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9faXNaZXJvKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICB0aGlzLmRheXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLmhvdXJzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taW51dGVzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5zZWNvbmRzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taWxsaXNlY29uZHMgPT09IDBcclxuICAgICk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWlsbGlzZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWVPZigpO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxTZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxTZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWludXRlcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbFNlY29uZHMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbEhvdXJzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWludXRlcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxEYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxEYXlzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsSG91cnMoKSAvIDI0KTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGltZVNwYW47IiwiLyogRXh0cmEgdXRpbGl0aWVzIGFuZCBtZXRob2RzIFxyXG4gKi9cclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyoqIFNob3dzIHRpbWUgYXMgYSBsYXJnZSBzdHJpbmcgd2l0aCB1bml0cyBuYW1lcyBmb3IgdmFsdWVzIGRpZmZlcmVudCB0aGFuIHplcm8uXHJcbiAqKi9cclxuZnVuY3Rpb24gc21hcnRUaW1lKHRpbWUpIHtcclxuICAgIHZhciByID0gW107XHJcbiAgICBpZiAodGltZS5kYXlzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5kYXlzICsgJyBkYXlzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmRheXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgZGF5Jyk7XHJcbiAgICBpZiAodGltZS5ob3VycyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuaG91cnMgKyAnIGhvdXJzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmhvdXJzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGhvdXInKTtcclxuICAgIGlmICh0aW1lLm1pbnV0ZXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbnV0ZXMgKyAnIG1pbnV0ZXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWludXRlcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaW51dGUnKTtcclxuICAgIGlmICh0aW1lLnNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLnNlY29uZHMgKyAnIHNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBzZWNvbmQnKTtcclxuICAgIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWlsbGlzZWNvbmRzICsgJyBtaWxsaXNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWlsbGlzZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbGxpc2Vjb25kJyk7XHJcbiAgICByZXR1cm4gci5qb2luKCcsICcpO1xyXG59XHJcblxyXG4vKiogUm91bmRzIGEgdGltZSB0byB0aGUgbmVhcmVzdCAxNSBtaW51dGVzIGZyYWdtZW50LlxyXG5Acm91bmRUbyBzcGVjaWZ5IHRoZSBMQy5yb3VuZGluZ1R5cGVFbnVtIGFib3V0IGhvdyB0byByb3VuZCB0aGUgdGltZSAoZG93biwgbmVhcmVzdCBvciB1cClcclxuKiovXHJcbmZ1bmN0aW9uIHJvdW5kVGltZVRvUXVhcnRlckhvdXIoLyogVGltZVNwYW4gKi90aW1lLCAvKiBtYXRoVXRpbHMucm91bmRpbmdUeXBlRW51bSAqL3JvdW5kVG8pIHtcclxuICAgIHZhciByZXN0RnJvbVF1YXJ0ZXIgPSB0aW1lLnRvdGFsSG91cnMoKSAlIDAuMjU7XHJcbiAgICB2YXIgaG91cnMgPSB0aW1lLnRvdGFsSG91cnMoKTtcclxuICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPiAwLjApIHtcclxuICAgICAgICBzd2l0Y2ggKHJvdW5kVG8pIHtcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLkRvd246XHJcbiAgICAgICAgICAgICAgICBob3VycyAtPSByZXN0RnJvbVF1YXJ0ZXI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLk5lYXJlc3Q6XHJcbiAgICAgICAgICAgICAgICB2YXIgbGltaXQgPSAwLjI1IC8gMjtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPj0gbGltaXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uVXA6XHJcbiAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gVGltZVNwYW4uZnJvbUhvdXJzKGhvdXJzKTtcclxufVxyXG5cclxuLy8gRXh0ZW5kIGEgZ2l2ZW4gVGltZVNwYW4gb2JqZWN0IHdpdGggdGhlIEV4dHJhIG1ldGhvZHNcclxuZnVuY3Rpb24gcGx1Z0luKFRpbWVTcGFuKSB7XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUudG9TbWFydFN0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU21hcnRTdHJpbmcoKSB7IHJldHVybiBzbWFydFRpbWUodGhpcyk7IH07XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUucm91bmRUb1F1YXJ0ZXJIb3VyID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fcm91bmRUb1F1YXJ0ZXJIb3VyKCkgeyByZXR1cm4gcm91bmRUaW1lVG9RdWFydGVySG91ci5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpOyB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBzbWFydFRpbWU6IHNtYXJ0VGltZSxcclxuICAgICAgICByb3VuZFRvUXVhcnRlckhvdXI6IHJvdW5kVGltZVRvUXVhcnRlckhvdXIsXHJcbiAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgIH07XHJcbiIsIi8qKlxyXG4gICBBUEkgZm9yIGF1dG9tYXRpYyBjcmVhdGlvbiBvZiBsYWJlbHMgZm9yIFVJIFNsaWRlcnMgKGpxdWVyeS11aSlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB0b29sdGlwcyA9IHJlcXVpcmUoJy4vdG9vbHRpcHMnKSxcclxuICAgIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKSxcclxuICAgIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbi8qKiBDcmVhdGUgbGFiZWxzIGZvciBhIGpxdWVyeS11aS1zbGlkZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyByZW1vdmUgb2xkIG9uZXM6XHJcbiAgICB2YXIgb2xkID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pLnJlbW92ZSgpO1xyXG4gICAgLy8gQ3JlYXRlIGxhYmVscyBjb250YWluZXJcclxuICAgIHZhciBsYWJlbHMgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsc1wiLz4nKTtcclxuICAgIGxhYmVscy5kYXRhKCd1aS1zbGlkZXInLCBzbGlkZXIpO1xyXG5cclxuICAgIC8vIFNldHVwIG9mIHVzZWZ1bCB2YXJzIGZvciBsYWJlbCBjcmVhdGlvblxyXG4gICAgdmFyIG1heCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtYXgnKSxcclxuICAgICAgICBtaW4gPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnbWluJyksXHJcbiAgICAgICAgc3RlcCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdzdGVwJyksXHJcbiAgICAgICAgc3RlcHMgPSBNYXRoLmZsb29yKChtYXggLSBtaW4pIC8gc3RlcCk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgYW5kIHBvc2l0aW9uaW5nIGxhYmVsc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gc3RlcHM7IGkrKykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBsYWJlbFxyXG4gICAgICAgIHZhciBsYmwgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsXCI+PHNwYW4gY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWwtdGV4dFwiLz48L2Rpdj4nKTtcclxuICAgICAgICAvLyBTZXR1cCBsYWJlbCB3aXRoIGl0cyB2YWx1ZVxyXG4gICAgICAgIHZhciBsYWJlbFZhbHVlID0gbWluICsgaSAqIHN0ZXA7XHJcbiAgICAgICAgbGJsLmNoaWxkcmVuKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKS50ZXh0KGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIGxibC5kYXRhKCd1aS1zbGlkZXItdmFsdWUnLCBsYWJlbFZhbHVlKTtcclxuICAgICAgICAvLyBQb3NpdGlvbmF0ZVxyXG4gICAgICAgIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpO1xyXG4gICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICBsYWJlbHMuYXBwZW5kKGxibCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlciBmb3IgbGFiZWxzIGNsaWNrIHRvIHNlbGVjdCBpdHMgcG9zaXRpb24gdmFsdWVcclxuICAgIGxhYmVscy5vbignY2xpY2snLCAnLnVpLXNsaWRlci1sYWJlbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsID0gJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXItdmFsdWUnKSxcclxuICAgICAgICAgICAgc2xpZGVyID0gJCh0aGlzKS5wYXJlbnQoKS5kYXRhKCd1aS1zbGlkZXInKTtcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHZhbCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbnNlcnQgbGFiZWxzIGFzIGEgc2libGluZyBvZiB0aGUgc2xpZGVyIChjYW5ub3QgYmUgaW5zZXJ0ZWQgaW5zaWRlKVxyXG4gICAgc2xpZGVyLmFmdGVyKGxhYmVscyk7XHJcbn1cclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0byB0aGUgY29ycmVjdCBwb3NpdGlvbiBhbmQgd2lkdGggYW4gVUkgbGFiZWwgYXQgQGxibFxyXG5mb3IgdGhlIHJlcXVpcmVkIHBlcmNlbnRhZ2Utd2lkdGggQHN3XHJcbioqL1xyXG5mdW5jdGlvbiBwb3NpdGlvbmF0ZShsYmwsIGksIHN0ZXBzKSB7XHJcbiAgICB2YXIgc3cgPSAxMDAgLyBzdGVwcztcclxuICAgIHZhciBsZWZ0ID0gaSAqIHN3IC0gc3cgKiAwLjUsXHJcbiAgICAgICAgcmlnaHQgPSAxMDAgLSBsZWZ0IC0gc3csXHJcbiAgICAgICAgYWxpZ24gPSAnY2VudGVyJztcclxuICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgYWxpZ24gPSAnbGVmdCc7XHJcbiAgICAgICAgbGVmdCA9IDA7XHJcbiAgICB9IGVsc2UgaWYgKGkgPT0gc3RlcHMpIHtcclxuICAgICAgICBhbGlnbiA9ICdyaWdodCc7XHJcbiAgICAgICAgcmlnaHQgPSAwO1xyXG4gICAgfVxyXG4gICAgbGJsLmNzcyh7XHJcbiAgICAgICAgJ3RleHQtYWxpZ24nOiBhbGlnbixcclxuICAgICAgICBsZWZ0OiBsZWZ0ICsgJyUnLFxyXG4gICAgICAgIHJpZ2h0OiByaWdodCArICclJ1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpc2liaWxpdHkgb2YgbGFiZWxzIG9mIGEganF1ZXJ5LXVpLXNsaWRlciBkZXBlbmRpbmcgaWYgdGhleSBmaXQgaW4gdGhlIGF2YWlsYWJsZSBzcGFjZS5cclxuU2xpZGVyIG5lZWRzIHRvIGJlIHZpc2libGUuXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyBHZXQgbGFiZWxzIGZvciBzbGlkZXJcclxuICAgIHZhciBsYWJlbHNfYyA9IHNsaWRlci5zaWJsaW5ncygnLnVpLXNsaWRlci1sYWJlbHMnKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXInKS5nZXQoMCkgPT0gc2xpZGVyLmdldCgwKSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBsYWJlbHMgPSBsYWJlbHNfYy5maW5kKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKTtcclxuXHJcbiAgICAvLyBBcHBseSBhdXRvc2l6ZVxyXG4gICAgaWYgKChzbGlkZXIuZGF0YSgnc2xpZGVyLWF1dG9zaXplJykgfHwgZmFsc2UpLnRvU3RyaW5nKCkgPT0gJ3RydWUnKVxyXG4gICAgICAgIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBHZXQgYW5kIGFwcGx5IGxheW91dFxyXG4gICAgdmFyIGxheW91dF9uYW1lID0gc2xpZGVyLmRhdGEoJ3NsaWRlci1sYWJlbHMtbGF5b3V0JykgfHwgJ3N0YW5kYXJkJyxcclxuICAgICAgICBsYXlvdXQgPSBsYXlvdXRfbmFtZSBpbiBsYXlvdXRzID8gbGF5b3V0c1tsYXlvdXRfbmFtZV0gOiBsYXlvdXRzLnN0YW5kYXJkO1xyXG4gICAgbGFiZWxzX2MuYWRkQ2xhc3MoJ2xheW91dC0nICsgbGF5b3V0X25hbWUpO1xyXG4gICAgbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscyk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRvb2x0aXBzXHJcbiAgICB0b29sdGlwcy5jcmVhdGVUb29sdGlwKGxhYmVsc19jLmNoaWxkcmVuKCksIHtcclxuICAgICAgICB0aXRsZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJCh0aGlzKS50ZXh0KCk7IH1cclxuICAgICAgICAsIHBlcnNpc3RlbnQ6IHRydWVcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhdXRvc2l6ZShzbGlkZXIsIGxhYmVscykge1xyXG4gICAgdmFyIHRvdGFsX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0b3RhbF93aWR0aCArPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBjID0gc2xpZGVyLmNsb3Nlc3QoJy51aS1zbGlkZXItY29udGFpbmVyJyksXHJcbiAgICAgICAgbWF4ID0gcGFyc2VGbG9hdChjLmNzcygnbWF4LXdpZHRoJykpLFxyXG4gICAgICAgIG1pbiA9IHBhcnNlRmxvYXQoYy5jc3MoJ21pbi13aWR0aCcpKTtcclxuICAgIGlmIChtYXggIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA+IG1heClcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1heDtcclxuICAgIGlmIChtaW4gIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA8IG1pbilcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1pbjtcclxuICAgIGMud2lkdGgodG90YWxfd2lkdGgpO1xyXG59XHJcblxyXG4vKiogU2V0IG9mIGRpZmZlcmVudCBsYXlvdXRzIGZvciBsYWJlbHMsIGFsbG93aW5nIGRpZmZlcmVudCBraW5kcyBvZiBcclxucGxhY2VtZW50IGFuZCB2aXN1YWxpemF0aW9uIHVzaW5nIHRoZSBzbGlkZXIgZGF0YSBvcHRpb24gJ2xhYmVscy1sYXlvdXQnLlxyXG5Vc2VkIGJ5ICd1cGRhdGUnLCBhbG1vc3QgdGhlICdzdGFuZGFyZCcgbXVzdCBleGlzdCBhbmQgY2FuIGJlIGluY3JlYXNlZFxyXG5leHRlcm5hbGx5XHJcbioqL1xyXG52YXIgbGF5b3V0cyA9IHt9O1xyXG4vKiogU2hvdyB0aGUgbWF4aW11bSBudW1iZXIgb2YgbGFiZWxzIGluIGVxdWFsbHkgc2l6ZWQgZ2FwcyBidXRcclxudGhlIGxhc3QgbGFiZWwgdGhhdCBpcyBlbnN1cmVkIHRvIGJlIHNob3dlZCBldmVuIGlmIGl0IGNyZWF0ZXNcclxuYSBoaWdoZXIgZ2FwIHdpdGggdGhlIHByZXZpb3VzIG9uZS5cclxuKiovXHJcbmxheW91dHMuc3RhbmRhcmQgPSBmdW5jdGlvbiBzdGFuZGFyZF9sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgbW9yZSBsYWJlbHMgdGhhbiBhdmFpbGFibGUgc3BhY2VcclxuICAgIC8vIEdldCBtYXhpbXVtIGxhYmVsIHdpZHRoXHJcbiAgICB2YXIgaXRlbV93aWR0aCA9IDA7XHJcbiAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHR3ID0gJCh0aGlzKS5vdXRlcldpZHRoKHRydWUpO1xyXG4gICAgICAgIGlmICh0dyA+PSBpdGVtX3dpZHRoKVxyXG4gICAgICAgICAgICBpdGVtX3dpZHRoID0gdHc7XHJcbiAgICB9KTtcclxuICAgIC8vIElmIHRoZXJlIGlzIHdpZHRoLCBpZiBub3QsIGVsZW1lbnQgaXMgbm90IHZpc2libGUgY2Fubm90IGJlIGNvbXB1dGVkXHJcbiAgICBpZiAoaXRlbV93aWR0aCA+IDApIHtcclxuICAgICAgICAvLyBHZXQgdGhlIHJlcXVpcmVkIHN0ZXBwaW5nIG9mIGxhYmVsc1xyXG4gICAgICAgIHZhciBsYWJlbHNfc3RlcCA9IE1hdGguY2VpbChpdGVtX3dpZHRoIC8gKHNsaWRlci53aWR0aCgpIC8gbGFiZWxzLmxlbmd0aCkpLFxyXG4gICAgICAgIGxhYmVsc19zdGVwcyA9IGxhYmVscy5sZW5ndGggLyBsYWJlbHNfc3RlcDtcclxuICAgICAgICBpZiAobGFiZWxzX3N0ZXAgPiAxKSB7XHJcbiAgICAgICAgICAgIC8vIEhpZGUgdGhlIGxhYmVscyBvbiBwb3NpdGlvbnMgb3V0IG9mIHRoZSBzdGVwXHJcbiAgICAgICAgICAgIHZhciBuZXdpID0gMCxcclxuICAgICAgICAgICAgICAgIGxpbWl0ID0gbGFiZWxzLmxlbmd0aCAtIDEgLSBsYWJlbHNfc3RlcDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYWJlbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBsYmwgPSAkKGxhYmVsc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGkgKyAxKSA8IGxhYmVscy5sZW5ndGggJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgIGkgJSBsYWJlbHNfc3RlcCB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGkgPiBsaW1pdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgbGJsLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvd1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYmwuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwb3NpdGlvbmF0ZSBwYXJlbnRcclxuICAgICAgICAgICAgICAgICAgICAvLyBwb3NpdGlvbmF0ZShwYXJlbnQsIG5ld2ksIGxhYmVsc19zdGVwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4vKiogU2hvdyBsYWJlbHMgbnVtYmVyIHZhbHVlcyBmb3JtYXR0ZWQgYXMgaG91cnMsIHdpdGggb25seVxyXG5pbnRlZ2VyIGhvdXJzIGJlaW5nIHNob3dlZCwgdGhlIG1heGltdW0gbnVtYmVyIG9mIGl0LlxyXG4qKi9cclxubGF5b3V0cy5ob3VycyA9IGZ1bmN0aW9uIGhvdXJzX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMsIHNob3dfYWxsKSB7XHJcbiAgICB2YXIgaW50TGFiZWxzID0gc2xpZGVyLmZpbmQoJy5pbnRlZ2VyLWhvdXInKTtcclxuICAgIGlmICghaW50TGFiZWxzLmxlbmd0aCkge1xyXG4gICAgICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHBhcnNlRmxvYXQoJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgIGlmICh2ICE9IE51bWJlci5OYU4pIHtcclxuICAgICAgICAgICAgICAgICAgICB2ID0gbXUucm91bmRUbyh2LCAyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDEgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdkZWNpbWFsLWhvdXInKS5oaWRlKCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYgJSAwLjUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5wYXJlbnQoKS5hZGRDbGFzcygnc3Ryb25nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LnRleHQoVGltZVNwYW4uZnJvbUhvdXJzKHYpLnRvU2hvcnRTdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2ludGVnZXItaG91cicpLnNob3coKS5wYXJlbnQoKS5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnRMYWJlbHMgPSBpbnRMYWJlbHMuYWRkKCR0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoc2hvd19hbGwgIT09IHRydWUpXHJcbiAgICAgICAgbGF5b3V0cy5zdGFuZGFyZChzbGlkZXIsIGludExhYmVscy5wYXJlbnQoKSwgaW50TGFiZWxzKTtcclxufTtcclxubGF5b3V0c1snYWxsLXZhbHVlcyddID0gZnVuY3Rpb24gYWxsX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIFNob3dpbmcgYWxsIGxhYmVsc1xyXG4gICAgbGFiZWxzX2Muc2hvdygpLmFkZENsYXNzKCd2aXNpYmxlJykuY2hpbGRyZW4oKS5zaG93KCk7XHJcbn07XHJcbmxheW91dHNbJ2FsbC1ob3VycyddID0gZnVuY3Rpb24gYWxsX2hvdXJzX2xheW91dCgpIHtcclxuICAgIC8vIEp1c3QgdXNlIGhvdXJzIGxheW91dCBidXQgc2hvd2luZyBhbGwgaW50ZWdlciBob3Vyc1xyXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guY2FsbChhcmd1bWVudHMsIHRydWUpO1xyXG4gICAgbGF5b3V0cy5ob3Vycy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjcmVhdGU6IGNyZWF0ZSxcclxuICAgIHVwZGF0ZTogdXBkYXRlLFxyXG4gICAgbGF5b3V0czogbGF5b3V0c1xyXG59O1xyXG4iLCIvKiBTZXQgb2YgY29tbW9uIExDIGNhbGxiYWNrcyBmb3IgbW9zdCBBamF4IG9wZXJhdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gQUtBOiBhamF4RXJyb3JQb3B1cEhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkVycm9yKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgLy8gSWYgaXMgYSBjb25uZWN0aW9uIGFib3J0ZWQsIG5vIHNob3cgbWVzc2FnZS5cclxuICAgIC8vIHJlYWR5U3RhdGUgZGlmZmVyZW50IHRvICdkb25lOjQnIG1lYW5zIGFib3J0ZWQgdG9vLCBcclxuICAgIC8vIGJlY2F1c2Ugd2luZG93IGJlaW5nIGNsb3NlZC9sb2NhdGlvbiBjaGFuZ2VkXHJcbiAgICBpZiAobWVzc2FnZSA9PSAnYWJvcnQnIHx8IGp4LnJlYWR5U3RhdGUgIT0gNClcclxuICAgICAgICByZXR1cm47XHJcblxyXG4gICAgdmFyIG0gPSBtZXNzYWdlO1xyXG4gICAgdmFyIGlmcmFtZSA9IG51bGw7XHJcbiAgICBzaXplID0gcG9wdXAuc2l6ZSgnbGFyZ2UnKTtcclxuICAgIHNpemUuaGVpZ2h0IC09IDM0O1xyXG4gICAgaWYgKG0gPT0gJ2Vycm9yJykge1xyXG4gICAgICAgIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShqeC5yZXNwb25zZVRleHQsIHNpemUpO1xyXG4gICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgbSA9IG51bGw7XHJcbiAgICB9ICBlbHNlXHJcbiAgICAgICAgbSA9IG0gKyBcIjsgXCIgKyBleDtcclxuXHJcbiAgICAvLyBCbG9jayBhbGwgd2luZG93LCBub3Qgb25seSBjdXJyZW50IGVsZW1lbnRcclxuICAgICQuYmxvY2tVSShlcnJvckJsb2NrKG0sIG51bGwsIHBvcHVwLnN0eWxlKHNpemUpKSk7XHJcbiAgICBpZiAoaWZyYW1lKVxyXG4gICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgJCgnLmJsb2NrVUkgLmNsb3NlLXBvcHVwJykuY2xpY2soZnVuY3Rpb24gKCkgeyAkLnVuYmxvY2tVSSgpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uQ29tcGxldGUoKSB7XHJcbiAgICAvLyBEaXNhYmxlIGxvYWRpbmdcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmd0aW1lciB8fCB0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICAvLyBVbmJsb2NrXHJcbiAgICBpZiAodGhpcy5hdXRvVW5ibG9ja0xvYWRpbmcpIHtcclxuICAgICAgICAvLyBEb3VibGUgdW4tbG9jaywgYmVjYXVzZSBhbnkgb2YgdGhlIHR3byBzeXN0ZW1zIGNhbiBiZWluZyB1c2VkOlxyXG4gICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuYm94KTtcclxuICAgICAgICB0aGlzLmJveC51bmJsb2NrKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXJcclxuZnVuY3Rpb24gbGNPblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgLy8gU3VwcG9ydGVkIHRoZSBnZW5lcmljIGN0eC5lbGVtZW50IGZyb20ganF1ZXJ5LnJlbG9hZFxyXG4gICAgaWYgKGN0eC5lbGVtZW50KSBjdHguZm9ybSA9IGN0eC5lbGVtZW50O1xyXG4gICAgLy8gU3BlY2lmaWMgc3R1ZmYgb2YgYWpheEZvcm1zXHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICBpZiAoIWRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICAgICAgaWYgKCQudHJpbShkYXRhKSkge1xyXG4gICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYSBtYWxmb3JtZWQgZG9jdW1lbnQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGb3IgJ3JlbG9hZCcgc3VwcG9ydCwgY2hlY2sgdG9vIHRoZSBjb250ZXh0Lm1vZGUsIGFuZCBib3RoIHJlbG9hZCBvciBhamF4Rm9ybXMgY2hlY2sgZGF0YSBhdHRyaWJ1dGUgdG9vXHJcbiAgICAgICAgY3R4LmJveElzQ29udGFpbmVyID0gY3R4LmJveElzQ29udGFpbmVyO1xyXG4gICAgICAgIHZhciByZXBsYWNlQm94Q29udGVudCA9XHJcbiAgICAgICAgICAoY3R4Lm9wdGlvbnMgJiYgY3R4Lm9wdGlvbnMubW9kZSA9PT0gJ3JlcGxhY2UtY29udGVudCcpIHx8XHJcbiAgICAgICAgICBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnO1xyXG5cclxuICAgICAgICAvLyBTdXBwb3J0IGZvciByZWxvYWQsIGF2b2lkaW5nIGltcG9ydGFudCBidWdzIHdpdGggcmVsb2FkaW5nIGJveGVzIHRoYXQgY29udGFpbnMgZm9ybXM6XHJcbiAgICAgICAgLy8gSWYgb3BlcmF0aW9uIGlzIGEgcmVsb2FkLCBkb24ndCBjaGVjayB0aGUgYWpheC1ib3hcclxuICAgICAgICB2YXIgamIgPSBuZXdodG1sO1xyXG4gICAgICAgIGlmICghY3R4LmlzUmVsb2FkKSB7XHJcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgcmV0dXJuZWQgZWxlbWVudCBpcyB0aGUgYWpheC1ib3gsIGlmIG5vdCwgZmluZFxyXG4gICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaW4gdGhlIG5ld2h0bWw6XHJcbiAgICAgICAgICBqYiA9IG5ld2h0bWwuZmlsdGVyKCcuYWpheC1ib3gnKTtcclxuICAgICAgICAgIGlmIChqYi5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIGlmICghY3R4LmJveElzQ29udGFpbmVyICYmICFqYi5pcygnLmFqYXgtYm94JykpXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbC5maW5kKCcuYWpheC1ib3g6ZXEoMCknKTtcclxuICAgICAgICAgIGlmICghamIgfHwgamIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGFqYXgtYm94LCB1c2UgYWxsIGVsZW1lbnQgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpXHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIGJveCBjb250ZW50IHdpdGggdGhlIGNvbnRlbnQgb2YgdGhlIHJldHVybmVkIGJveFxyXG4gICAgICAgICAgICAvLyBvciBhbGwgaWYgdGhlcmUgaXMgbm8gYWpheC1ib3ggaW4gdGhlIHJlc3VsdC5cclxuICAgICAgICAgICAgamIgPSBqYi5pcygnLmFqYXgtYm94JykgPyBqYi5jb250ZW50cygpIDogamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpIHtcclxuICAgICAgICAgIGN0eC5ib3guZW1wdHkoKS5hcHBlbmQoamIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY3R4LmJveElzQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIC8vIGpiIGlzIGNvbnRlbnQgb2YgdGhlIGJveCBjb250YWluZXI6XHJcbiAgICAgICAgICAgIGN0eC5ib3guaHRtbChqYik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYm94IGlzIGNvbnRlbnQgdGhhdCBtdXN0IGJlIHJlcGxhY2VkIGJ5IHRoZSBuZXcgY29udGVudDpcclxuICAgICAgICAgICAgY3R4LmJveC5yZXBsYWNlV2l0aChqYik7XHJcbiAgICAgICAgICAgIC8vIGFuZCByZWZyZXNoIHRoZSByZWZlcmVuY2UgdG8gYm94IHdpdGggdGhlIG5ldyBlbGVtZW50XHJcbiAgICAgICAgICAgIGN0eC5ib3ggPSBqYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEl0IHN1cHBvcnRzIG5vcm1hbCBhamF4IGZvcm1zIGFuZCBzdWJmb3JtcyB0aHJvdWdoIGZpZWxkc2V0LmFqYXhcclxuICAgICAgICBpZiAoY3R4LmJveC5pcygnZm9ybS5hamF4JykgfHwgY3R4LmJveC5pcygnZmllbGRzZXQuYWpheCcpKVxyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94O1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2Zvcm0uYWpheDplcSgwKScpO1xyXG4gICAgICAgICAgaWYgKGN0eC5mb3JtLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2ZpZWxkc2V0LmFqYXg6ZXEoMCknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBNb3ZlIGZvY3VzIHRvIHRoZSBlcnJvcnMgYXBwZWFyZWQgb24gdGhlIHBhZ2UgKGlmIHRoZXJlIGFyZSk6XHJcbiAgICAgICAgdmFyIHZhbGlkYXRpb25TdW1tYXJ5ID0gamIuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKTtcclxuICAgICAgICBpZiAodmFsaWRhdGlvblN1bW1hcnkubGVuZ3RoKVxyXG4gICAgICAgICAgbW92ZUZvY3VzVG8odmFsaWRhdGlvblN1bW1hcnkpO1xyXG4gICAgICAgIC8vIFRPRE86IEl0IHNlZW1zIHRoYXQgaXQgcmV0dXJucyBhIGRvY3VtZW50LWZyYWdtZW50IGluc3RlYWQgb2YgYSBlbGVtZW50IGFscmVhZHkgaW4gZG9jdW1lbnRcclxuICAgICAgICAvLyBmb3IgY3R4LmZvcm0gKG1heWJlIGpiIHRvbz8pIHdoZW4gdXNpbmcgKiBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnICogXHJcbiAgICAgICAgLy8gKG1heWJlIG9uIG90aGVyIGNhc2VzIHRvbz8pLlxyXG4gICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgW2piLCBjdHguZm9ybSwganhdKTtcclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IGN0eC5mb3JtLmRhdGEoJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJykgfHwgJ0RvbmUhJztcclxuICAgIGN0eC5ib3guYmxvY2soaW5mb0Jsb2NrKG1lc3NhZ2UsIHtcclxuICAgICAgICBjc3M6IHBvcHVwLnN0eWxlKHBvcHVwLnNpemUoJ3NtYWxsJykpXHJcbiAgICB9KSlcclxuICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyBcclxuICAgIH0pO1xyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcblxyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2IGNsYXNzPVwib2stZ28tYm94XCIvPicpO1xyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPHNwYW4gY2xhc3M9XCJzdWNjZXNzLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuU3VjY2Vzc01lc3NhZ2UpKTtcclxuICAgIGlmIChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKVxyXG4gICAgICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhZGRpdGlvbmFsLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpKTtcclxuXHJcbiAgICB2YXIgb2tCdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBvay1hY3Rpb24gY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNva1wiLz4nKS5hcHBlbmQoZGF0YS5Pa0xhYmVsKTtcclxuICAgIHZhciBnb0J0biA9ICcnO1xyXG4gICAgaWYgKGRhdGEuR29VUkwgJiYgZGF0YS5Hb0xhYmVsKSB7XHJcbiAgICAgICAgZ29CdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBnby1hY3Rpb25cIi8+JykuYXR0cignaHJlZicsIGRhdGEuR29VUkwpLmFwcGVuZChkYXRhLkdvTGFiZWwpO1xyXG4gICAgICAgIC8vIEZvcmNpbmcgdGhlICdjbG9zZS1hY3Rpb24nIGluIHN1Y2ggYSB3YXkgdGhhdCBmb3IgaW50ZXJuYWwgbGlua3MgdGhlIHBvcHVwIGdldHMgY2xvc2VkIGluIGEgc2FmZSB3YXk6XHJcbiAgICAgICAgZ29CdG4uY2xpY2soZnVuY3Rpb24gKCkgeyBva0J0bi5jbGljaygpOyBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pOyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWN0aW9ucyBjbGVhcmZpeFwiLz4nKS5hcHBlbmQob2tCdG4pLmFwcGVuZChnb0J0bikpO1xyXG5cclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY3R4LmJveCwgbnVsbCwge1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkge1xyXG4gICAgLy8gSWYgaXMgYSBKU09OIHJlc3VsdDpcclxuICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGlmIChjdHguYm94KVxyXG4gICAgICAgICAgICAvLyBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9yc1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjdHguYm94KTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMDogZ2VuZXJhbCBzdWNjZXNzIGNvZGUsIHNob3cgbWVzc2FnZSBzYXlpbmcgdGhhdCAnYWxsIHdhcyBmaW5lJ1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdCwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMTogZG8gYSByZWRpcmVjdFxyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDEpIHtcclxuICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMjogc2hvdyBsb2dpbiBwb3B1cCAod2l0aCB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMzogcmVsb2FkIGN1cnJlbnQgcGFnZSBjb250ZW50IHRvIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIC8vIE5vdGU6IHRvIHJlbG9hZCBzYW1lIHVybCBwYWdlIGNvbnRlbnQsIGlzIGJldHRlciByZXR1cm4gdGhlIGh0bWwgZGlyZWN0bHkgZnJvbVxyXG4gICAgICAgICAgICAvLyB0aGlzIGFqYXggc2VydmVyIHJlcXVlc3QuXHJcbiAgICAgICAgICAgIC8vY29udGFpbmVyLnVuYmxvY2soKTsgaXMgYmxvY2tlZCBhbmQgdW5ibG9ja2VkIGFnYWluIGJ5IHRoZSByZWxvYWQgbWV0aG9kOlxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVsb2FkKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA0KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgU3VjY2Vzc01lc3NhZ2UsIGF0dGFjaGluZyBhbmQgZXZlbnQgaGFuZGxlciB0byBnbyB0byBSZWRpcmVjdFVSTFxyXG4gICAgICAgICAgICBjdHguYm94Lm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdC5SZWRpcmVjdFVSTCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5TdWNjZXNzTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNSkge1xyXG4gICAgICAgICAgICAvLyBDaGFuZ2UgbWFpbi1hY3Rpb24gYnV0dG9uIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBidG4gPSBjdHguZm9ybS5maW5kKCcubWFpbi1hY3Rpb24nKTtcclxuICAgICAgICAgICAgdmFyIGRtc2cgPSBidG4uZGF0YSgnZGVmYXVsdC10ZXh0Jyk7XHJcbiAgICAgICAgICAgIGlmICghZG1zZylcclxuICAgICAgICAgICAgICAgIGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnLCBidG4udGV4dCgpKTtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGRhdGEuUmVzdWx0IHx8IGJ0bi5kYXRhKCdzdWNjZXNzLXBvc3QtdGV4dCcpIHx8ICdEb25lISc7XHJcbiAgICAgICAgICAgIGJ0bi50ZXh0KG1zZyk7XHJcbiAgICAgICAgICAgIC8vIEFkZGluZyBzdXBwb3J0IHRvIHJlc2V0IGJ1dHRvbiB0ZXh0IHRvIGRlZmF1bHQgb25lXHJcbiAgICAgICAgICAgIC8vIHdoZW4gdGhlIEZpcnN0IG5leHQgY2hhbmdlcyBoYXBwZW5zIG9uIHRoZSBmb3JtOlxyXG4gICAgICAgICAgICAkKGN0eC5mb3JtKS5vbmUoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBidG4udGV4dChidG4uZGF0YSgnZGVmYXVsdC10ZXh0JykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBmb3IgY3VzdG9tIGhhbmRsZXJzXHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gT2stR28gYWN0aW9ucyBwb3B1cCB3aXRoICdzdWNjZXNzJyBhbmQgJ2FkZGl0aW9uYWwnIG1lc3NhZ2VzLlxyXG4gICAgICAgICAgICBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA3KSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSA3OiBzaG93IG1lc3NhZ2Ugc2F5aW5nIGNvbnRhaW5lZCBhdCBkYXRhLlJlc3VsdC5NZXNzYWdlLlxyXG4gICAgICAgICAgICAvLyBUaGlzIGNvZGUgYWxsb3cgYXR0YWNoIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gaW4gZGF0YS5SZXN1bHQgdG8gZGlzdGluZ3Vpc2hcclxuICAgICAgICAgICAgLy8gZGlmZmVyZW50IHJlc3VsdHMgYWxsIHNob3dpbmcgYSBtZXNzYWdlIGJ1dCBtYXliZSBub3QgYmVpbmcgYSBzdWNjZXNzIGF0IGFsbFxyXG4gICAgICAgICAgICAvLyBhbmQgbWF5YmUgZG9pbmcgc29tZXRoaW5nIG1vcmUgaW4gdGhlIHRyaWdnZXJlZCBldmVudCB3aXRoIHRoZSBkYXRhIG9iamVjdC5cclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICAgIC8vIFVzZXIgQ29kZTogdHJpZ2dlciBjdXN0b20gZXZlbnQgdG8gbWFuYWdlIHJlc3VsdHM6XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeCwgY3R4XSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gZGF0YS5Db2RlIDwgMFxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhbiBlcnJvciBjb2RlLlxyXG5cclxuICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybS5nZXQoMCksIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgICAgICAgICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IFwiRXJyb3I6IFwiICsgZGF0YS5Db2RlICsgXCI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YS5SZXN1bHQgPyAoZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlIDogZGF0YS5SZXN1bHQpIDogJycpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLmFwcGVuZChtZXNzYWdlKSwgY3R4LmJveCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXJyb3I6IGxjT25FcnJvcixcclxuICAgICAgICBzdWNjZXNzOiBsY09uU3VjY2VzcyxcclxuICAgICAgICBjb21wbGV0ZTogbGNPbkNvbXBsZXRlLFxyXG4gICAgICAgIGRvSlNPTkFjdGlvbjogZG9KU09OQWN0aW9uXHJcbiAgICB9O1xyXG59IiwiLyogRm9ybXMgc3VibWl0dGVkIHZpYSBBSkFYICovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgY2FsbGJhY2tzID0gcmVxdWlyZSgnLi9hamF4Q2FsbGJhY2tzJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpLFxyXG4gICAgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpO1xyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzLCB3aWxsIGJlIHVwZGF0ZWQgb24gaW5pdCBidXQgaXMgYWNjZXNzZWRcclxuLy8gdGhyb3VnaCBjbG9zdXJlIGZyb20gYWxsIGZ1bmN0aW9ucy5cclxuLy8gTk9URTogaXMgc3RhdGljLCBkb2Vzbid0IGFsbG93cyBtdWx0aXBsZSBjb25maWd1cmF0aW9uLCBvbmUgaW5pdCBjYWxsIHJlcGxhY2UgcHJldmlvdXNcclxuLy8gRGVmYXVsdHM6XHJcbnZhciBzZXR0aW5ncyA9IHtcclxuICAgIGxvYWRpbmdEZWxheTogMCxcclxuICAgIGVsZW1lbnQ6IGRvY3VtZW50XHJcbn07XHJcblxyXG4vLyBBZGFwdGVkIGNhbGxiYWNrc1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIoKSB7XHJcbiAgICBjYWxsYmFja3MuY29tcGxldGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEVycm9yUG9wdXBIYW5kbGVyKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gQ29tbW9uIGxvZ2ljXHJcbiAgICBjYWxsYmFja3MuZXJyb3IuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlcigpIHtcclxuICBjYWxsYmFja3Muc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG4vKipcclxuICBQZXJmb3JtcyB0aGUgdmFsaWRhdGlvbiBvbiB0aGUgZm9ybSBvciBzdWJmb3JtIGFzIGRldGVybWluZVxyXG4gIHRoZSB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgKEBjdHgpLCByZXR1cm5pbmcgdHJ1ZSBmb3Igc3VjY2Vzc1xyXG4gIGFuZCBmYWxzZSBmb3Igc29tZSBlcnJvciAoZWxlbWVudHMgZ2V0IG1hcmtlZCB3aXRoIHRoZSBlcnJvcixcclxuICBqdXN0IHRoZSBjYWxsZXIgbXVzdCBzdG9wIGFueSB0YXNrIG9uIGZhbHNlKS5cclxuKiovXHJcbmZ1bmN0aW9uIHZhbGlkYXRlRm9ybShjdHgpIHtcclxuICAvLyBWYWxpZGF0aW9uc1xyXG4gIHZhciB2YWxpZGF0aW9uUGFzc2VkID0gdHJ1ZTtcclxuICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3JtcyB0aHJvdWggZmllbGRzZXQuYWpheCwgd2UgbXVzdCBleGVjdXRlIHZhbGlkYXRpb25zIGFuZCB2ZXJpZmljYXRpb25cclxuICAvLyBpbiB0d28gc3RlcHMgYW5kIHVzaW5nIHRoZSByZWFsIGZvcm0gdG8gbGV0IHZhbGlkYXRpb24gbWVjaGFuaXNtIHdvcmtcclxuICB2YXIgaXNTdWJmb3JtID0gY3R4LmZvcm0uaXMoJ2ZpZWxkc2V0LmFqYXgnKTtcclxuICB2YXIgYWN0dWFsRm9ybSA9IGlzU3ViZm9ybSA/IGN0eC5mb3JtLmNsb3Nlc3QoJ2Zvcm0nKSA6IGN0eC5mb3JtLFxyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcyA9IG5ldyBqUXVlcnkoKSxcclxuICAgICAgZGlzYWJsZWRGaWVsZHMgPSBuZXcgalF1ZXJ5KCk7XHJcblxyXG4gIC8vIE9uIHN1YmZvcm0gdmFsaWRhdGlvbiwgd2UgZG9uJ3Qgd2FudCB0aGUgb3V0c2lkZSBzdWJmb3JtIGVsZW1lbnRzIGFuZCB2YWxpZGF0aW9uLXN1bW1hcnkgY29udHJvbHMgdG8gYmUgYWZmZWN0ZWRcclxuICAvLyBieSB0aGlzIHZhbGlkYXRpb24gKHRvIGF2b2lkIHRvIHNob3cgZXJyb3JzIHRoZXJlIHRoYXQgZG9lc24ndCBpbnRlcmVzdCB0byB0aGUgcmVzdCBvZiB0aGUgZm9ybSlcclxuICAvLyBUbyBmdWxsZmlsbCB0aGlzIHJlcXVpc2l0LCB3ZSBuZWVkIHRvIGhpZGUgaXQgZm9yIHRoZSB2YWxpZGF0b3IgZm9yIGEgd2hpbGUgYW5kIGxldCBvbmx5IGFmZmVjdFxyXG4gIC8vIGFueSBsb2NhbCBzdW1tYXJ5IChpbnNpZGUgdGhlIHN1YmZvcm0pLlxyXG4gIC8vIFRoZSBzYW1lIGZvciBmb3JtIGVsZW1lbnRzIG91dHNpZGUgdGhlIHN1YmZvcm0sIHdlIGRvbid0IHdhbnQgaXRzIGVycm9ycyBmb3Igbm93LlxyXG4gIGlmIChpc1N1YmZvcm0pIHtcclxuICAgIHZhciBvdXRzaWRlRWxlbWVudHMgPSAoZnVuY3Rpb24oZikge1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIE9ubHkgdGhvc2UgdGhhdCBhcmUgb3V0c2lkZSB0aGUgc3ViZm9ybVxyXG4gICAgICAgIHJldHVybiAhJC5jb250YWlucyhmLCB0aGlzKTtcclxuICAgICAgfTtcclxuICAgIH0pKGN0eC5mb3JtLmdldCgwKSk7XHJcblxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBhY3R1YWxGb3JtXHJcbiAgICAuZmluZCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAnZmFsc2UnKTtcclxuXHJcbiAgICBkaXNhYmxlZEZpZWxkcyA9IGFjdHVhbEZvcm1cclxuICAgIC5maW5kKCdbZGF0YS12YWw9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAuYXR0cignZGF0YS12YWwnLCAnZmFsc2UnKTtcclxuICB9XHJcblxyXG4gIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gIHZhciB2YWxvYmplY3QgPSBhY3R1YWxGb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlLlxyXG4gIC8vIEN1c3RvbSB2YWxpZGF0aW9uIGNhbiBiZSBhdHRhY2hlZCB0byBmb3JtcyBvciBmaWVsZHNldCwgYnV0XHJcbiAgLy8gdG8gc3VwcG9ydCBzdWJmb3Jtcywgb25seSBleGVjdXRlIGluIHRoZSBjdHguZm9ybSBlbGVtZW50IChjYW4gYmUgXHJcbiAgLy8gYSBmaWVsc2V0IHN1YmZvcm0pIGFuZCBhbnkgY2hpbGRyZW4gZmllbGRzZXQuXHJcbiAgY3R4LmZvcm0uYWRkKGN0eC5mb3JtLmZpbmQoJ2ZpZWxkc2V0JykpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1c3ZhbCA9ICQodGhpcykuZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnMoY3R4LmZvcm0pO1xyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIFRvIHN1cHBvcnQgc3ViLWZvcm1zLCB3ZSBtdXN0IGNoZWNrIHRoYXQgdmFsaWRhdGlvbnMgZXJyb3JzIGhhcHBlbmVkIGluc2lkZSB0aGVcclxuICAvLyBzdWJmb3JtIGFuZCBub3QgaW4gb3RoZXIgZWxlbWVudHMsIHRvIGRvbid0IHN0b3Agc3VibWl0IG9uIG5vdCByZWxhdGVkIGVycm9ycy5cclxuICAvLyAod2UgYXZvaWQgZXhlY3V0ZSB2YWxpZGF0aW9uIG9uIHRoYXQgZWxlbWVudHMgYnV0IGNvdWxkIGhhcHBlbiBhIHByZXZpb3VzIHZhbGlkYXRpb24pXHJcbiAgLy8gSnVzdCBsb29rIGZvciBtYXJrZWQgZWxlbWVudHM6XHJcbiAgaWYgKGlzU3ViZm9ybSAmJiBjdHguZm9ybS5maW5kKCcuaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmxlbmd0aClcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuXHJcbiAgLy8gUmUtZW5hYmxlIGFnYWluIHRoYXQgc3VtbWFyaWVzIHByZXZpb3VzbHkgZGlzYWJsZWRcclxuICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMuYXR0cignZGF0YS12YWxtc2ctc3VtbWFyeScsICd0cnVlJyk7XHJcbiAgICBkaXNhYmxlZEZpZWxkcy5hdHRyKCdkYXRhLXZhbCcsICd0cnVlJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdmFsaWRhdGlvblBhc3NlZDtcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuKiBBamF4IEZvcm1zIGdlbmVyaWMgZnVuY3Rpb24uXHJcbiogUmVzdWx0IGV4cGVjdGVkIGlzOlxyXG4qIC0gaHRtbCwgZm9yIHZhbGlkYXRpb24gZXJyb3JzIGZyb20gc2VydmVyLCByZXBsYWNpbmcgY3VycmVudCAuYWpheC1ib3ggY29udGVudFxyXG4qIC0ganNvbiwgd2l0aCBzdHJ1Y3R1cmU6IHsgQ29kZTogaW50ZWdlci1udW1iZXIsIFJlc3VsdDogc3RyaW5nLW9yLW9iamVjdCB9XHJcbiogICBDb2RlIG51bWJlcnM6XHJcbiogICAgLSBOZWdhdGl2ZTogZXJyb3JzLCB3aXRoIGEgUmVzdWx0IG9iamVjdCB7IEVycm9yTWVzc2FnZTogc3RyaW5nIH1cclxuKiAgICAtIFplcm86IHN1Y2Nlc3MgcmVzdWx0LCBpdCBzaG93cyBhIG1lc3NhZ2Ugd2l0aCBjb250ZW50OiBSZXN1bHQgc3RyaW5nLCBlbHNlIGZvcm0gZGF0YSBhdHRyaWJ1dGUgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJywgZWxzZSBhIGdlbmVyaWMgbWVzc2FnZVxyXG4qICAgIC0gMTogc3VjY2VzcyByZXN1bHQsIFJlc3VsdCBjb250YWlucyBhIFVSTCwgdGhlIHBhZ2Ugd2lsbCBiZSByZWRpcmVjdGVkIHRvIHRoYXQuXHJcbiogICAgLSBNYWpvciAxOiBzdWNjZXNzIHJlc3VsdCwgd2l0aCBjdXN0b20gaGFuZGxlciB0aHJvdWdodCB0aGUgZm9ybSBldmVudCAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLlxyXG4qL1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKGV2ZW50KSB7XHJcbiAgICAvLyBDb250ZXh0IHZhciwgdXNlZCBhcyBhamF4IGNvbnRleHQ6XHJcbiAgICB2YXIgY3R4ID0ge307XHJcbiAgICAvLyBEZWZhdWx0IGRhdGEgZm9yIHJlcXVpcmVkIHBhcmFtczpcclxuICAgIGN0eC5mb3JtID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmZvcm0gOiBudWxsKSB8fCAkKHRoaXMpO1xyXG4gICAgY3R4LmJveCA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5ib3ggOiBudWxsKSB8fCBjdHguZm9ybS5jbG9zZXN0KFwiLmFqYXgtYm94XCIpO1xyXG4gICAgdmFyIGFjdGlvbiA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5hY3Rpb24gOiBudWxsKSB8fCBjdHguZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCAnJztcclxuXHJcbiAgICAvLyBDaGVjayB2YWxpZGF0aW9uXHJcbiAgICBpZiAodmFsaWRhdGVGb3JtKGN0eCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIC8vIFZhbGlkYXRpb24gZmFpbGVkLCBzdWJtaXQgY2Fubm90IGNvbnRpbnVlLCBvdXQhXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBjdHguZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgIH0sIHNldHRpbmdzLmxvYWRpbmdEZWxheSk7XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiAoYWN0aW9uKSxcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgc3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBjb21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdG9wIG5vcm1hbCBQT1NUOlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfTsiLCIvKiBBdXRvIGNhbGN1bGF0ZSBzdW1tYXJ5IG9uIERPTSB0YWdnaW5nIHdpdGggY2xhc3NlcyB0aGUgZWxlbWVudHMgaW52b2x2ZWQuXHJcbiAqL1xyXG52YXIgbnUgPSByZXF1aXJlKCcuL251bWJlclV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMoKSB7XHJcbiAgICAkKCd0YWJsZS5jYWxjdWxhdGUtaXRlbXMtdG90YWxzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVSb3coKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciB0ciA9ICR0LmNsb3Nlc3QoJ3RyJyk7XHJcbiAgICAgICAgICAgIHZhciBpcCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZScpO1xyXG4gICAgICAgICAgICB2YXIgaXEgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKTtcclxuICAgICAgICAgICAgdmFyIGl0ID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsJyk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKG51LmdldE1vbmV5TnVtYmVyKGlwKSAqIG51LmdldE1vbmV5TnVtYmVyKGlxLCAxKSwgaXQpO1xyXG4gICAgICAgICAgICB0ci50cmlnZ2VyKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQodGhpcykuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlLCAuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKS5vbignY2hhbmdlJywgY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVTdW1tYXJ5KGZvcmNlKSB7XHJcbiAgICAkKCcuY2FsY3VsYXRlLXN1bW1hcnknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciBzID0gYy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeScpO1xyXG4gICAgICAgIHZhciBkID0gYy5maW5kKCd0YWJsZS5jYWxjdWxhdGUtc3VtbWFyeS1ncm91cCcpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGMoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGZlZSA9IDAsIGR1cmF0aW9uID0gMDtcclxuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IHt9O1xyXG4gICAgICAgICAgICBkLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwVG90YWwgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbENoZWNrZWQgPSAkKHRoaXMpLmlzKCcuY2FsY3VsYXRlLWFsbC1pdGVtcycpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQ2hlY2tlZCB8fCBpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuaXMoJzpjaGVja2VkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBUb3RhbCArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbDplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eTplcSgwKScpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmVlICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWZlZTplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWR1cmF0aW9uOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBncm91cHNbJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwJyldID0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3VwVG90YWwsICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihkdXJhdGlvbiwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1kdXJhdGlvbicpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgc3VtbWFyeSB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcih0b3RhbCwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS10b3RhbCcpKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZmVlLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWZlZScpKTtcclxuICAgICAgICAgICAgLy8gQW5kIGV2ZXJ5IGdyb3VwIHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGcgaW4gZ3JvdXBzKSB7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cHNbZ10sIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAtJyArIGcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuY2hhbmdlKGNhbGMpO1xyXG4gICAgICAgIGQub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIGNhbGMpO1xyXG4gICAgICAgIGNhbGMoKTtcclxuICAgICAgICBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSBkZXRhaWwgb2YgYSBwcmljaW5nIHN1bW1hcnksIG9uZSBkZXRhaWwgbGluZSBwZXIgc2VsZWN0ZWQgaXRlbVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkZCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbCcpLFxyXG4gICAgICAgICAgICAkdCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbC10cGwnKS5jaGlsZHJlbigndHI6ZXEoMCknKSxcclxuICAgICAgICAgICAgJGMgPSAkcy5jbG9zZXN0KCdmb3JtJyksXHJcbiAgICAgICAgICAgICRpdGVtcyA9ICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbScpO1xyXG5cclxuICAgICAgICAvLyBEbyBpdCFcclxuICAgICAgICAvLyBSZW1vdmUgb2xkIGxpbmVzXHJcbiAgICAgICAgJGQuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBDcmVhdGUgbmV3IG9uZXNcclxuICAgICAgICAkaXRlbXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyICRpID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25jZXB0ID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgcHJpY2UgPSBudS5nZXRNb25leU51bWJlcigkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2U6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcm93IGFuZCBzZXQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICB2YXIgJHJvdyA9ICR0LmNsb25lKClcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZGV0YWlsLXRwbCcpXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2RldGFpbCcpO1xyXG4gICAgICAgICAgICAgICAgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoY29uY2VwdCk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihwcmljZSwgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIHRhYmxlXHJcbiAgICAgICAgICAgICAgICAkZC5hcHBlbmQoJHJvdyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgIHZhciAkYyA9ICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAvLyBJbml0aWFsIGNhbGN1bGF0aW9uXHJcbiAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCk7XHJcbiAgICAvLyBDYWxjdWxhdGUgb24gcmVsZXZhbnQgZm9ybSBjaGFuZ2VzXHJcbiAgICAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLmNoYW5nZSh1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzIGV2ZW50XHJcbiAgICAkYy5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbn1cclxuXHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvblRhYmxlSXRlbXM6IHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyxcclxuICAgICAgICBvblN1bW1hcnk6IHNldHVwQ2FsY3VsYXRlU3VtbWFyeSxcclxuICAgICAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5LFxyXG4gICAgICAgIG9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5XHJcbiAgICB9OyIsIi8qIEZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBkb2N1bWVudCAob3IgaW4gQGNvbnRhaW5lcilcclxud2l0aCB0aGUgaHRtbDUgYXR0cmlidXRlICdhdXRvZm9jdXMnIChvciBhbHRlcm5hdGl2ZSBAY3NzU2VsZWN0b3IpLlxyXG5JdCdzIGZpbmUgYXMgYSBwb2x5ZmlsbCBhbmQgZm9yIGFqYXggbG9hZGVkIGNvbnRlbnQgdGhhdCB3aWxsIG5vdFxyXG5nZXQgdGhlIGJyb3dzZXIgc3VwcG9ydCBvZiB0aGUgYXR0cmlidXRlLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZvY3VzKGNvbnRhaW5lciwgY3NzU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8IGRvY3VtZW50KTtcclxuICAgIGNvbnRhaW5lci5maW5kKGNzc1NlbGVjdG9yIHx8ICdbYXV0b2ZvY3VzXScpLmZvY3VzKCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0ZvY3VzOyIsIi8qKiBBdXRvLWZpbGwgbWVudSBzdWItaXRlbXMgdXNpbmcgdGFiYmVkIHBhZ2VzIC1vbmx5IHdvcmtzIGZvciBjdXJyZW50IHBhZ2UgaXRlbXMtICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdXRvZmlsbFN1Ym1lbnUoKSB7XHJcbiAgICAkKCcuYXV0b2ZpbGwtc3VibWVudSAuY3VycmVudCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRtZW51ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBzdWJtZW51IGVsZW1lbnRzIGZyb20gdGFicyBtYXJrZWQgd2l0aCBjbGFzcyAnYXV0b2ZpbGwtc3VibWVudS1pdGVtcydcclxuICAgICAgICB2YXIgaXRlbXMgPSAkKCcuYXV0b2ZpbGwtc3VibWVudS1pdGVtcyBsaTpub3QoLnJlbW92YWJsZSknKTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBpdGVtcywgY3JlYXRlIHRoZSBzdWJtZW51IGNsb25pbmcgaXQhXHJcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHN1Ym1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHBhcmVudG1lbnUuYXBwZW5kKHN1Ym1lbnUpO1xyXG4gICAgICAgICAgICAvLyBDbG9uaW5nIHdpdGhvdXQgZXZlbnRzOlxyXG4gICAgICAgICAgICB2YXIgbmV3aXRlbXMgPSBpdGVtcy5jbG9uZShmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAkKHN1Ym1lbnUpLmFwcGVuZChuZXdpdGVtcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGF0dGFjaCBldmVudHMgdG8gbWFpbnRhaW4gdGhlIHRhYmJlZCBpbnRlcmZhY2Ugd29ya2luZ1xyXG4gICAgICAgICAgICAvLyBOZXcgSXRlbXMgKGNsb25lZCkgbXVzdCBjaGFuZ2UgdGFiczpcclxuICAgICAgICAgICAgbmV3aXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBpbiB0aGUgb3JpZ2luYWwgaXRlbVxyXG4gICAgICAgICAgICAgICAgJChcImFbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIsIGl0ZW1zKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9wIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gT3JpZ2luYWwgaXRlbXMgbXVzdCBjaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgaXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV3aXRlbXMucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKS5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihcIipbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gIE1vbnRobHkgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpO1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcblxyXG4vKipcclxuICBQcml2YXRlIHV0aWxzXHJcbioqL1xyXG5cclxuLyoqXHJcbiAgUHJlZmV0Y2ggbmV4dCBtb250aCAoYmFzZWQgb24gdGhlIGdpdmVuIGRhdGVzKVxyXG4gIE5vdGU6IHRoaXMgY29kZSBpcyB2ZXJ5IHNpbWlsYXIgdG8gdXRpbHMud2Vla2x5Q2hlY2tBbmRQcmVmZXRjaFxyXG4qKi9cclxuZnVuY3Rpb24gbW9udGhseUNoZWNrQW5kUHJlZmV0Y2gobW9udGhseSwgY3VycmVudERhdGVzUmFuZ2UpIHtcclxuICAvLyBXZSBnZXQgdGhlIG5leHQgbW9udGggZGF0ZXMtcmFuZ2UsIGJ1dFxyXG4gIC8vIHVzaW5nIGFzIGJhc2UtZGF0ZSBhIGRhdGUgaW5zaWRlIGN1cnJlbnQgZGlzcGxheWVkIG1vbnRoLCB0aGF0IG1vc3QgdGltZXMgaXNcclxuICAvLyBub3QgdGhlIG1vbnRoIG9mIHRoZSBzdGFydCBkYXRlIGluIGN1cnJlbnQgZGF0ZSwgdGhlbiBqdXN0IGZvcndhcmQgNyBkYXlzIHRoYXRcclxuICAvLyB0byBlbnN1cmUgd2UgcGljayB0aGUgY29ycmVjdCBtb250aDpcclxuICB2YXIgbmV4dERhdGVzUmFuZ2UgPSB1dGlscy5kYXRlLm5leHRNb250aFdlZWtzKHV0aWxzLmRhdGUuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5zdGFydCwgNyksIDEsIG1vbnRobHkuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgaWYgKCF1dGlscy5tb250aGx5SXNEYXRhSW5DYWNoZShtb250aGx5LCBuZXh0RGF0ZXNSYW5nZSkpIHtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgd2VlayBpbiBhZHZhbmNlXHJcbiAgICB2YXIgcHJlZmV0Y2hRdWVyeSA9IHV0aWxzLmRhdGVzVG9RdWVyeShuZXh0RGF0ZXNSYW5nZSk7XHJcbiAgICBtb250aGx5LmZldGNoRGF0YShwcmVmZXRjaFF1ZXJ5LCBudWxsLCB0cnVlKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG5Nb3ZlIHRoZSBiaW5kZWQgZGF0ZXMgdGhlIGFtb3VudCBvZiBAbW9udGhzIHNwZWNpZmllZC5cclxuTm90ZTogbW9zdCBvZiB0aGlzIGNvZGUgaXMgYWRhcHRlZCBmcm9tIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXMsXHJcbnRoZSBjb21wbGV4aXR5IGNvbWVzIGZyb20gdGhlIHByZWZldGNoIGZlYXR1cmUsIG1heWJlIGNhbiBiZSB0aGF0IGxvZ2ljXHJcbmlzb2xhdGVkIGFuZCBzaGFyZWQ/XHJcbioqL1xyXG5mdW5jdGlvbiBtb3ZlQmluZE1vbnRoKG1vbnRobHksIG1vbnRocykge1xyXG4gIC8vIFdlIGdldCB0aGUgbmV4dCAnbW9udGhzJyAobmVnYXRpdmUgZm9yIHByZXZpb3VzKSBkYXRlcy1yYW5nZSwgYnV0XHJcbiAgLy8gdXNpbmcgYXMgYmFzZS1kYXRlIGEgZGF0ZSBpbnNpZGUgY3VycmVudCBkaXNwbGF5ZWQgbW9udGgsIHRoYXQgbW9zdCB0aW1lcyBpc1xyXG4gIC8vIG5vdCB0aGUgbW9udGggb2YgdGhlIHN0YXJ0IGRhdGUgaW4gY3VycmVudCBkYXRlLCB0aGVuIGp1c3QgZm9yd2FyZCA3IGRheXMgdGhhdFxyXG4gIC8vIHRvIGVuc3VyZSB3ZSBwaWNrIHRoZSBjb3JyZWN0IG1vbnRoOlxyXG4gIHZhciBkYXRlc1JhbmdlID0gdXRpbHMuZGF0ZS5uZXh0TW9udGhXZWVrcyh1dGlscy5kYXRlLmFkZERheXMobW9udGhseS5kYXRlc1JhbmdlLnN0YXJ0LCA3KSwgbW9udGhzLCBtb250aGx5LnNob3dTaXhXZWVrcyk7XHJcblxyXG4gIC8vIENoZWNrIGNhY2hlIGJlZm9yZSB0cnkgdG8gZmV0Y2hcclxuICB2YXIgaW5DYWNoZSA9IHV0aWxzLm1vbnRobHlJc0RhdGFJbkNhY2hlKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG5cclxuICBpZiAoaW5DYWNoZSkge1xyXG4gICAgLy8gSnVzdCBzaG93IHRoZSBkYXRhXHJcbiAgICBtb250aGx5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgLy8gUHJlZmV0Y2ggZXhjZXB0IGlmIHRoZXJlIGlzIG90aGVyIHJlcXVlc3QgaW4gY291cnNlIChjYW4gYmUgdGhlIHNhbWUgcHJlZmV0Y2gsXHJcbiAgICAvLyBidXQgc3RpbGwgZG9uJ3Qgb3ZlcmxvYWQgdGhlIHNlcnZlcilcclxuICAgIGlmIChtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBmb3IgcHJlZmV0Y2hpbmc6XHJcbiAgICAvLyBJdHMgYXZvaWRlZCBpZiB0aGVyZSBhcmUgcmVxdWVzdHMgaW4gY291cnNlLCBzaW5jZVxyXG4gICAgLy8gdGhhdCB3aWxsIGJlIGEgcHJlZmV0Y2ggZm9yIHRoZSBzYW1lIGRhdGEuXHJcbiAgICBpZiAobW9udGhseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIFRoZSBsYXN0IHJlcXVlc3QgaW4gdGhlIHBvb2wgKm11c3QqIGJlIHRoZSBsYXN0IGluIGZpbmlzaFxyXG4gICAgICAvLyAobXVzdCBiZSBvbmx5IG9uZSBpZiBhbGwgZ29lcyBmaW5lKTpcclxuICAgICAgdmFyIHJlcXVlc3QgPSBtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0c1ttb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgICAgbW9udGhseS4kZWwuYWRkQ2xhc3MobW9udGhseS5jbGFzc2VzLmZldGNoaW5nKTtcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBtb3ZlQmluZE1vbnRoKG1vbnRobHksIG1vbnRocyk7XHJcbiAgICAgICAgbW9udGhseS4kZWwucmVtb3ZlQ2xhc3MobW9udGhseS5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggKGRvd25sb2FkKSB0aGUgZGF0YSBhbmQgc2hvdyBvbiByZWFkeTpcclxuICAgIG1vbnRobHlcclxuICAgIC5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGRhdGVzUmFuZ2UpKVxyXG4gICAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICBtb250aGx5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgICAvLyBQcmVmZXRjaFxyXG4gICAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaChtb250aGx5LCBkYXRlc1JhbmdlKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbk1hcmsgY2FsZW5kYXIgYXMgY3VycmVudC1tb250aCBhbmQgZGlzYWJsZSBwcmV2IGJ1dHRvbixcclxub3IgcmVtb3ZlIHRoZSBtYXJrIGFuZCBlbmFibGUgaXQgaWYgaXMgbm90LlxyXG5cclxuVXBkYXRlcyB0aGUgbW9udGggbGFiZWwgdG9vIGFuZCB0b2RheSBidXR0b25cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrQ3VycmVudE1vbnRoKCRlbCwgc3RhcnREYXRlLCBtb250aGx5KSB7XHJcbiAgLy8gRW5zdXJlIHRoZSBkYXRlIHRvIGJlIGZyb20gY3VycmVudCBtb250aCBhbmQgbm90IG9uZSBvZiB0aGUgbGF0ZXN0IGRhdGVzXHJcbiAgLy8gb2YgdGhlIHByZXZpb3VzIG9uZSAod2hlcmUgdGhlIHJhbmdlIHN0YXJ0KSBhZGRpbmcgNyBkYXlzIGZvciB0aGUgY2hlY2s6XHJcbiAgdmFyIG1vbnRoRGF0ZSA9IHV0aWxzLmRhdGUuYWRkRGF5cyhzdGFydERhdGUsIDcpO1xyXG4gIHZhciB5ZXAgPSB1dGlscy5kYXRlLmlzSW5DdXJyZW50TW9udGgobW9udGhEYXRlKTtcclxuICAkZWwudG9nZ2xlQ2xhc3MobW9udGhseS5jbGFzc2VzLmN1cnJlbnRXZWVrLCB5ZXApO1xyXG4gICRlbC5maW5kKCcuJyArIG1vbnRobHkuY2xhc3Nlcy5wcmV2QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcblxyXG4gIC8vIE1vbnRoIC0gWWVhclxyXG4gIHZhciBtbGJsID0gbW9udGhseS50ZXh0cy5tb250aHNbbW9udGhEYXRlLmdldE1vbnRoKCldICsgJyAnICsgbW9udGhEYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLm1vbnRoTGFiZWwpLnRleHQobWxibCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLnRvZGF5QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIFVwZGF0ZSB0aGUgY2FsZW5kYXIgZGF0ZXMgY2VsbHMgZm9yICdkYXkgb2YgdGhlIG1vbnRoJyB2YWx1ZXNcclxuICBhbmQgbnVtYmVyIG9mIHdlZWtzL3Jvd3MuXHJcbiAgQGRhdGVzUmFuZ2UgeyBzdGFydCwgZW5kIH1cclxuICBAc2xvdHNDb250YWluZXIgalF1ZXJ5LURPTSBmb3IgZGF0ZXMtY2VsbHMgdGJvZHlcclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIG9mZk1vbnRoRGF0ZUNsYXNzLCBjdXJyZW50RGF0ZUNsYXNzLCBzbG90RGF0ZUxhYmVsKSB7XHJcbiAgdmFyIGxhc3RZLFxyXG4gICAgY3VycmVudE1vbnRoID0gdXRpbHMuZGF0ZS5hZGREYXlzKGRhdGVzUmFuZ2Uuc3RhcnQsIDcpLmdldE1vbnRoKCksXHJcbiAgICB0b2RheSA9IGRhdGVJU08uZGF0ZUxvY2FsKG5ldyBEYXRlKCkpO1xyXG5cclxuICBpdGVyYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgZnVuY3Rpb24gKGRhdGUsIHgsIHkpIHtcclxuICAgIGxhc3RZID0geTtcclxuICAgIHRoaXMuZmluZCgnLicgKyBzbG90RGF0ZUxhYmVsKS50ZXh0KGRhdGUuZ2V0RGF0ZSgpKTtcclxuXHJcbiAgICAvLyBNYXJrIGRheXMgbm90IGluIHRoaXMgbW9udGhcclxuICAgIHRoaXMudG9nZ2xlQ2xhc3Mob2ZmTW9udGhEYXRlQ2xhc3MsIGRhdGUuZ2V0TW9udGgoKSAhPSBjdXJyZW50TW9udGgpO1xyXG5cclxuICAgIC8vIE1hcmsgdG9kYXlcclxuICAgIHRoaXMudG9nZ2xlQ2xhc3MoY3VycmVudERhdGVDbGFzcywgZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSkgPT0gdG9kYXkpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBTb21lIG1vbnRocyBhcmUgNSB3ZWVrcyB3aWRlIGFuZCBvdGhlcnMgNjsgb3VyIGxheW91dCBoYXMgcGVybWFuZW50IDYgcm93cy93ZWVrc1xyXG4gIC8vIGFuZCB3ZSBkb24ndCBsb29rIHVwIHRoZSA2dGggd2VlayBpZiBpcyBub3QgcGFydCBvZiB0aGUgbW9udGggdGhlbiB0aGF0IDZ0aCByb3dcclxuICAvLyBtdXN0IGJlIGhpZGRlbiBpZiB0aGVyZSBhcmUgb25seSA1LlxyXG4gIC8vIElmIHRoZSBsYXN0IHJvdyB3YXMgdGhlIDUgKGluZGV4IDQsIHplcm8tYmFzZWQpLCB0aGUgNnRoIGlzIGhpZGRlbjpcclxuICBzbG90c0NvbnRhaW5lci5jaGlsZHJlbigndHI6ZXEoNSknKS54dG9nZ2xlKGxhc3RZICE9IDQsIHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246IDAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIEl0IGV4ZWN1dGVzIHRoZSBnaXZlbiBjYWxsYmFjayAoQGVhY2hDZWxsQ2FsbGJhY2spIGZvciBcclxuICBlYWNoIGNlbGwgKHRoaXMgaW5zaWRlIHRoZSBjYWxsYmFjaykgaXRlcmF0ZWQgYmV0d2VlbiB0aGUgQGRhdGVzUmFuZ2VcclxuICBpbnNpZGUgdGhlIEBzbG90c0NvbnRhaW5lciAoYSB0Ym9keSBvciB0YWJsZSB3aXRoIHRyLXRkIGRhdGUgY2VsbHMpXHJcbioqL1xyXG5mdW5jdGlvbiBpdGVyYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgZWFjaENlbGxDYWxsYmFjaykge1xyXG4gIHZhciB4LCB5LCBkYXRlQ2VsbDtcclxuICAvLyBJdGVyYXRlIGRhdGVzXHJcbiAgdXRpbHMuZGF0ZS5lYWNoRGF0ZUluUmFuZ2UoZGF0ZXNSYW5nZS5zdGFydCwgZGF0ZXNSYW5nZS5lbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICAvLyBkYXRlcyBhcmUgc29ydGVkIGFzIDcgcGVyIHJvdyAoZWFjaCB3ZWVrLWRheSksXHJcbiAgICAvLyBidXQgcmVtZW1iZXIgdGhhdCBkYXktY2VsbCBwb3NpdGlvbiBpcyBvZmZzZXQgMSBiZWNhdXNlXHJcbiAgICAvLyBlYWNoIHJvdyBpcyA4IGNlbGxzIChmaXJzdCBpcyBoZWFkZXIgYW5kIHJlc3QgNyBhcmUgdGhlIGRhdGEtY2VsbHMgZm9yIGRhdGVzKVxyXG4gICAgLy8ganVzdCBsb29raW5nIG9ubHkgJ3RkJ3Mgd2UgY2FuIHVzZSB0aGUgcG9zaXRpb24gd2l0aG91dCBvZmZzZXRcclxuICAgIHggPSAoaSAlIDcpO1xyXG4gICAgeSA9IE1hdGguZmxvb3IoaSAvIDcpO1xyXG4gICAgZGF0ZUNlbGwgPSBzbG90c0NvbnRhaW5lci5jaGlsZHJlbigndHI6ZXEoJyArIHkgKyAnKScpLmNoaWxkcmVuKCd0ZDplcSgnICsgeCArICcpJyk7XHJcblxyXG4gICAgZWFjaENlbGxDYWxsYmFjay5hcHBseShkYXRlQ2VsbCwgW2RhdGUsIHgsIHksIGldKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAgVG9nZ2xlIGEgc2VsZWN0ZWQgZGF0ZS1jZWxsIGF2YWlsYWJpbGl0eSxcclxuICBmb3IgdGhlICdlZGl0YWJsZScgbW9kZVxyXG4qKi9cclxuZnVuY3Rpb24gdG9nZ2xlRGF0ZUF2YWlsYWJpbGl0eShtb250aGx5LCBjZWxsKSB7XHJcbiAgLy8gSWYgdGhlcmUgaXMgbm8gZGF0YSwganVzdCByZXR1cm4gKGRhdGEgbm90IGxvYWRlZClcclxuICBpZiAoIW1vbnRobHkuZGF0YSB8fCAhbW9udGhseS5kYXRhLnNsb3RzKSByZXR1cm47XHJcbiAgXHJcbiAgLy8gR2V0dGluZyB0aGUgcG9zaXRpb24gb2YgdGhlIGNlbGwgaW4gdGhlIG1hdHJpeCBmb3IgZGF0ZS1zbG90czpcclxuICB2YXIgdHIgPSBjZWxsLmNsb3Nlc3QoJ3RyJyksXHJcbiAgICB4ID0gdHIuZmluZCgndGQnKS5pbmRleChjZWxsKSxcclxuICAgIHkgPSB0ci5jbG9zZXN0KCd0Ym9keScpLmZpbmQoJ3RyJykuaW5kZXgodHIpLFxyXG4gICAgZGF5c09mZnNldCA9IHkgKiA3ICsgeDtcclxuXHJcbiAgLy8gR2V0dGluZyB0aGUgZGF0ZSBmb3IgdGhlIGNlbGwgYmFzZWQgb24gdGhlIHNob3dlZCBmaXJzdCBkYXRlXHJcbiAgdmFyIGRhdGUgPSBtb250aGx5LmRhdGVzUmFuZ2Uuc3RhcnQ7XHJcbiAgZGF0ZSA9IHV0aWxzLmRhdGUuYWRkRGF5cyhkYXRlLCBkYXlzT2Zmc2V0KTtcclxuICB2YXIgc3RyRGF0ZSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG5cclxuICAvLyBHZXQgYW5kIHVwZGF0ZSBmcm9tIHRoZSB1bmRlcmxheWluZyBkYXRhLCBcclxuICAvLyB0aGUgc3RhdHVzIGZvciB0aGUgZGF0ZSwgdG9nZ2xpbmcgaXQ6XHJcbiAgdmFyIHN0YXR1cyA9IG1vbnRobHkuZGF0YS5zbG90c1tzdHJEYXRlXTtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBzdGF0dXMsIGp1c3QgcmV0dXJuIChkYXRhIG5vdCBsb2FkZWQpXHJcbiAgaWYgKCFzdGF0dXMpIHJldHVybjtcclxuICBzdGF0dXMgPSBzdGF0dXMgPT0gJ3VuYXZhaWxhYmxlJyA/ICdhdmFpbGFibGUnIDogJ3VuYXZhaWxhYmxlJztcclxuICBtb250aGx5LmRhdGEuc2xvdHNbc3RyRGF0ZV0gPSBzdGF0dXM7XHJcblxyXG4gIC8vIFVwZGF0ZSB2aXN1YWxpemF0aW9uOlxyXG4gIG1vbnRobHkuYmluZERhdGEoKTtcclxufVxyXG5cclxuLyoqXHJcbk1vbnRseSBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIE1vbnRobHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5Q2xhc3Nlcywge1xyXG4gIHdlZWtseUNhbGVuZGFyOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudFdlZWs6IHVuZGVmaW5lZCxcclxuICBjdXJyZW50TW9udGg6ICdpcy1jdXJyZW50TW9udGgnLFxyXG4gIG1vbnRobHlDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS1tb250aGx5JyxcclxuICB0b2RheUFjdGlvbjogJ0FjdGlvbnMtdG9kYXknLFxyXG4gIG1vbnRoTGFiZWw6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1tb250aExhYmVsJyxcclxuICBzbG90RGF0ZUxhYmVsOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc2xvdERhdGVMYWJlbCcsXHJcbiAgb2ZmTW9udGhEYXRlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItb2ZmTW9udGhEYXRlJyxcclxuICBjdXJyZW50RGF0ZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWN1cnJlbnREYXRlJyxcclxuICBlZGl0YWJsZTogJ2lzLWVkaXRhYmxlJ1xyXG59KSxcclxudGV4dHM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5VGV4dHMsIHtcclxuICBtb250aHM6IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddXHJcbn0pLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5zaG93U2l4V2Vla3M6IHRydWUsXHJcbmVkaXRhYmxlOiBmYWxzZSxcclxuXHJcbi8vIE91ciAndmlldycgd2lsbCBiZSBhIHN1YnNldCBvZiB0aGUgZGF0YSxcclxuLy8gZGVsaW1pdGVkIGJ5IHRoZSBuZXh0IHByb3BlcnR5LCBhIGRhdGVzIHJhbmdlOlxyXG5kYXRlc1JhbmdlOiB7IHN0YXJ0OiBudWxsLCBlbmQ6IG51bGwgfSxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhTW9udGhseShkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5zbG90cykgcmV0dXJuO1xyXG5cclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICBjaGVja0N1cnJlbnRNb250aCh0aGlzLiRlbCwgZGF0ZXNSYW5nZS5zdGFydCwgdGhpcyk7XHJcblxyXG4gIHVwZGF0ZURhdGVzQ2VsbHModGhpcy5kYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgdGhpcy5jbGFzc2VzLm9mZk1vbnRoRGF0ZSwgdGhpcy5jbGFzc2VzLmN1cnJlbnREYXRlLCB0aGlzLmNsYXNzZXMuc2xvdERhdGVMYWJlbCk7XHJcblxyXG4gIC8vIFJlbW92ZSBhbnkgcHJldmlvdXMgc3RhdHVzIGNsYXNzIGZyb20gYWxsIHNsb3RzXHJcbiAgZm9yICh2YXIgcyA9IDA7IHMgPCB1dGlscy5zdGF0dXNUeXBlcy5sZW5ndGg7IHMrKykge1xyXG4gICAgc2xvdHMucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB1dGlscy5zdGF0dXNUeXBlc1tzXSB8fCAnXycpO1xyXG4gIH1cclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAvLyBTZXQgYXZhaWxhYmlsaXR5IG9mIGVhY2ggZGF0ZSBzbG90L2NlbGw6XHJcbiAgaXRlcmF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIGZ1bmN0aW9uIChkYXRlLCB4LCB5LCBpKSB7XHJcbiAgICB2YXIgZGF0ZWtleSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG4gICAgdmFyIGRhdGVTdGF0dXMgPSB0aGF0LmRhdGEuc2xvdHNbZGF0ZWtleV07XHJcblxyXG4gICAgaWYgKGRhdGVTdGF0dXMpXHJcbiAgICAgIHRoaXMuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyBkYXRlU3RhdHVzKTtcclxuICB9KTtcclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gTW9udGhseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICdtb250aGx5J1xyXG4gIH07XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgbW9udGhcclxuICB2YXIgZmlyc3REYXRlcyA9IHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCBtb250aCBpbiBhZHZhbmNlXHJcbiAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuXHJcbiAgY2hlY2tDdXJyZW50TW9udGgodGhpcy4kZWwsIGZpcnN0RGF0ZXMuc3RhcnQsIHRoaXMpO1xyXG5cclxuICAvLyBTZXQgaGFuZGxlcnMgZm9yIHByZXYtbmV4dCBhY3Rpb25zOlxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5wcmV2QWN0aW9uLCBmdW5jdGlvbiBwcmV2KCkge1xyXG4gICAgbW92ZUJpbmRNb250aCh0aGF0LCAtMSk7XHJcbiAgfSk7XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLm5leHRBY3Rpb24sIGZ1bmN0aW9uIG5leHQoKSB7XHJcbiAgICBtb3ZlQmluZE1vbnRoKHRoYXQsIDEpO1xyXG4gIH0pO1xyXG4gIC8vIEhhbmRsZXIgZm9yIHRvZGF5IGFjdGlvblxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy50b2RheUFjdGlvbiwgZnVuY3Rpb24gdG9kYXkoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRWRpdGFibGUgbW9kZVxyXG4gIGlmICh0aGlzLmVkaXRhYmxlKSB7XHJcbiAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMgKyAnIHRkJywgZnVuY3Rpb24gY2xpY2tUb2dnbGVBdmFpbGFiaWxpdHkoKSB7XHJcbiAgICAgIHRvZ2dsZURhdGVBdmFpbGFiaWxpdHkodGhhdCwgJCh0aGlzKSk7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5lZGl0YWJsZSk7XHJcbiAgfVxyXG5cclxufSk7XHJcblxyXG4vKiogU3RhdGljIHV0aWxpdHk6IGZvdW5kIGFsbCBjb21wb25lbnRzIHdpdGggdGhlIFdlZWtseSBjYWxlbmRhciBjbGFzc1xyXG5hbmQgZW5hYmxlIGl0XHJcbioqL1xyXG5Nb250aGx5LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgTW9udGhseS5wcm90b3R5cGUuY2xhc3Nlcy5tb250aGx5Q2FsZW5kYXIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgbGlzdC5wdXNoKG5ldyBNb250aGx5KHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9udGhseTtcclxuIiwiLyoqXHJcbiAgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKTtcclxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG5cclxuLyoqXHJcbldlZWtseSBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIFdlZWtseSA9IExjV2lkZ2V0LmV4dGVuZChcclxuLy8gUHJvdG90eXBlXHJcbntcclxuY2xhc3NlczogdXRpbHMud2Vla2x5Q2xhc3NlcyxcclxudGV4dHM6IHV0aWxzLndlZWtseVRleHRzLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5cclxuLy8gT3VyICd2aWV3JyB3aWxsIGJlIGEgc3Vic2V0IG9mIHRoZSBkYXRhLFxyXG4vLyBkZWxpbWl0ZWQgYnkgdGhlIG5leHQgcHJvcGVydHksIGEgZGF0ZXMgcmFuZ2U6XHJcbmRhdGVzUmFuZ2U6IHsgc3RhcnQ6IG51bGwsIGVuZDogbnVsbCB9LFxyXG5iaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGFXZWVrbHkoZGF0ZXNSYW5nZSkge1xyXG4gIHRoaXMuZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlIHx8IHRoaXMuZGF0ZXNSYW5nZTtcclxuICB2YXIgXHJcbiAgICAgIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgICBzbG90cyA9IHNsb3RzQ29udGFpbmVyLmZpbmQoJ3RkJyk7XHJcblxyXG4gIHV0aWxzLmNoZWNrQ3VycmVudFdlZWsodGhpcy4kZWwsIGRhdGVzUmFuZ2Uuc3RhcnQsIHRoaXMpO1xyXG5cclxuICB1dGlscy51cGRhdGVMYWJlbHMoZGF0ZXNSYW5nZSwgdGhpcy4kZWwsIHRoaXMpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgLy8gU2V0IGFsbCBzbG90cyB3aXRoIGRlZmF1bHQgc3RhdHVzXHJcbiAgc2xvdHMuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cyk7XHJcblxyXG4gIGlmICghdGhpcy5kYXRhLnNsb3RzIHx8ICF0aGlzLmRhdGEuc3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHV0aWxzLmRhdGUuZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbZGF0ZWtleV07XHJcbiAgICBpZiAoZGF0ZVNsb3RzKSB7XHJcbiAgICAgIGZvciAocyA9IDA7IHMgPCBkYXRlU2xvdHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc2xvdCA9IGRhdGVTbG90c1tzXTtcclxuICAgICAgICB2YXIgc2xvdENlbGwgPSB1dGlscy5maW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgaSwgc2xvdCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGRlZmF1bHQgc3RhdHVzXHJcbiAgICAgICAgc2xvdENlbGwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cyB8fCAnXycpO1xyXG4gICAgICAgIC8vIEFkZGluZyBzdGF0dXMgY2xhc3NcclxuICAgICAgICBzbG90Q2VsbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdlZWtseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3ZWVrbHknXHJcbiAgfTtcclxuXHJcbiAgLy8gU3RhcnQgZmV0Y2hpbmcgY3VycmVudCB3ZWVrXHJcbiAgdmFyIGZpcnN0RGF0ZXMgPSB1dGlscy5kYXRlLmN1cnJlbnRXZWVrKCk7XHJcbiAgdGhpcy5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGZpcnN0RGF0ZXMpKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoZmlyc3REYXRlcyk7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgdXRpbHMud2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuICB1dGlscy5jaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBmaXJzdERhdGVzLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgLy8gU2V0IGhhbmRsZXJzIGZvciBwcmV2LW5leHQgYWN0aW9uczpcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMucHJldkFjdGlvbiwgZnVuY3Rpb24gcHJldigpIHtcclxuICAgIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgLTcpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5uZXh0QWN0aW9uLCBmdW5jdGlvbiBuZXh0KCkge1xyXG4gICAgdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyh0aGF0LCA3KTtcclxuICB9KTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuV2Vla2x5LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgV2Vla2x5LnByb3RvdHlwZS5jbGFzc2VzLndlZWtseUNhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgV2Vla2x5KHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2Vla2x5O1xyXG4iLCIvKipcclxuICBXb3JrIEhvdXJzIGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKSxcclxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICBjbGVhckN1cnJlbnRTZWxlY3Rpb24gPSByZXF1aXJlKCcuL2NsZWFyQ3VycmVudFNlbGVjdGlvbicpLFxyXG4gIG1ha2VVbnNlbGVjdGFibGUgPSByZXF1aXJlKCcuL21ha2VVbnNlbGVjdGFibGUnKTtcclxucmVxdWlyZSgnLi4vanF1ZXJ5LmJvdW5kcycpO1xyXG5cclxuLyoqXHJcbldvcmsgaG91cnMgcHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBFZGl0V29ya0hvdXJzKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICAvLyBTZXQgaGFuZGxlcnMgdG8gc3dpdGNoIHN0YXR1cyBhbmQgdXBkYXRlIGJhY2tlbmQgZGF0YVxyXG4gIC8vIHdoZW4gdGhlIHVzZXIgc2VsZWN0IGNlbGxzXHJcbiAgdmFyIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpO1xyXG5cclxuICBmdW5jdGlvbiB0b2dnbGVDZWxsKGNlbGwpIHtcclxuICAgIC8vIEZpbmQgZGF5IGFuZCB0aW1lIG9mIHRoZSBjZWxsOlxyXG4gICAgdmFyIHNsb3QgPSB1dGlscy5maW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCk7XHJcbiAgICAvLyBHZXQgd2Vlay1kYXkgc2xvdHMgYXJyYXk6XHJcbiAgICB2YXIgd2tzbG90cyA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1tzbG90LmRheV1dID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3Nsb3QuZGF5XV0gfHwgW107XHJcbiAgICAvLyBJZiBpdCBoYXMgYWxyZWFkeSB0aGUgZGF0YS5zdGF0dXMsIHRvZ2dsZSB0byB0aGUgZGVmYXVsdFN0YXR1c1xyXG4gICAgLy8gIHZhciBzdGF0dXNDbGFzcyA9IHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyxcclxuICAgIC8vICAgICAgZGVmYXVsdFN0YXR1c0NsYXNzID0gdGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cztcclxuICAgIC8vaWYgKGNlbGwuaGFzQ2xhc3Moc3RhdHVzQ2xhc3NcclxuICAgIC8vIFRvZ2dsZSBmcm9tIHRoZSBhcnJheVxyXG4gICAgdmFyIHN0cnNsb3QgPSBkYXRlSVNPLnRpbWVMb2NhbChzbG90LnNsb3QsIHRydWUpLFxyXG4gICAgICBpc2xvdCA9IHdrc2xvdHMuaW5kZXhPZihzdHJzbG90KTtcclxuICAgIGlmIChpc2xvdCA9PSAtMSlcclxuICAgICAgd2tzbG90cy5wdXNoKHN0cnNsb3QpO1xyXG4gICAgZWxzZVxyXG4gICAgLy9kZWxldGUgd2tzbG90c1tpc2xvdF07XHJcbiAgICAgIHdrc2xvdHMuc3BsaWNlKGlzbG90LCAxKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHRvZ2dsZUNlbGxSYW5nZShmaXJzdENlbGwsIGxhc3RDZWxsKSB7XHJcbiAgICB2YXIgXHJcbiAgICAgIHggPSBmaXJzdENlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGZpcnN0Q2VsbCksXHJcbiAgICAgIHkxID0gZmlyc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIC8veDIgPSBsYXN0Q2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgobGFzdENlbGwpLFxyXG4gICAgICB5MiA9IGxhc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKTtcclxuXHJcbiAgICBpZiAoeTEgPiB5Mikge1xyXG4gICAgICB2YXIgeTAgPSB5MTtcclxuICAgICAgeTEgPSB5MjtcclxuICAgICAgeTIgPSB5MDtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciB5ID0geTE7IHkgPD0geTI7IHkrKykge1xyXG4gICAgICB2YXIgY2VsbCA9IGZpcnN0Q2VsbC5jbG9zZXN0KCd0Ym9keScpLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuICAgICAgdG9nZ2xlQ2VsbChjZWxsKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciBkcmFnZ2luZyA9IHtcclxuICAgIGZpcnN0OiBudWxsLFxyXG4gICAgbGFzdDogbnVsbCxcclxuICAgIHNlbGVjdGlvbkxheWVyOiAkKCc8ZGl2IGNsYXNzPVwiU2VsZWN0aW9uTGF5ZXJcIiAvPicpLmFwcGVuZFRvKHRoaXMuJGVsKSxcclxuICAgIGRvbmU6IGZhbHNlXHJcbiAgfTtcclxuICBcclxuICBmdW5jdGlvbiBvZmZzZXRUb1Bvc2l0aW9uKGVsLCBvZmZzZXQpIHtcclxuICAgIHZhciBwYiA9ICQoZWwub2Zmc2V0UGFyZW50KS5ib3VuZHMoKSxcclxuICAgICAgcyA9IHt9O1xyXG5cclxuICAgIHMudG9wID0gb2Zmc2V0LnRvcCAtIHBiLnRvcDtcclxuICAgIHMubGVmdCA9IG9mZnNldC5sZWZ0IC0gcGIubGVmdDtcclxuXHJcbiAgICAvL3MuYm90dG9tID0gcGIudG9wIC0gb2Zmc2V0LmJvdHRvbTtcclxuICAgIC8vcy5yaWdodCA9IG9mZnNldC5sZWZ0IC0gb2Zmc2V0LnJpZ2h0O1xyXG4gICAgcy5oZWlnaHQgPSBvZmZzZXQuYm90dG9tIC0gb2Zmc2V0LnRvcDtcclxuICAgIHMud2lkdGggPSBvZmZzZXQucmlnaHQgLSBvZmZzZXQubGVmdDtcclxuXHJcbiAgICAkKGVsKS5jc3Mocyk7XHJcbiAgICByZXR1cm4gcztcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZVNlbGVjdGlvbihlbCkge1xyXG4gICAgdmFyIGEgPSBkcmFnZ2luZy5maXJzdC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgdmFyIGIgPSBlbC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgdmFyIHMgPSBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG5cclxuICAgIHMudG9wID0gYS50b3AgPCBiLnRvcCA/IGEudG9wIDogYi50b3A7XHJcbiAgICBzLmJvdHRvbSA9IGEuYm90dG9tID4gYi5ib3R0b20gPyBhLmJvdHRvbSA6IGIuYm90dG9tO1xyXG5cclxuICAgIG9mZnNldFRvUG9zaXRpb24oZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXJbMF0sIHMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZmluaXNoRHJhZygpIHtcclxuICAgIGlmIChkcmFnZ2luZy5maXJzdCAmJiBkcmFnZ2luZy5sYXN0KSB7XHJcbiAgICAgIHRvZ2dsZUNlbGxSYW5nZShkcmFnZ2luZy5maXJzdCwgZHJhZ2dpbmcubGFzdCk7XHJcbiAgICAgIHRoYXQuYmluZERhdGEoKTtcclxuXHJcbiAgICAgIGRyYWdnaW5nLmRvbmUgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgZHJhZ2dpbmcuZmlyc3QgPSBkcmFnZ2luZy5sYXN0ID0gbnVsbDtcclxuICAgIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLmhpZGUoKTtcclxuICAgIG1ha2VVbnNlbGVjdGFibGUub2ZmKHRoYXQuJGVsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdGhpcy4kZWwuZmluZChzbG90c0NvbnRhaW5lcikub24oJ2NsaWNrJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gRG8gZXhjZXB0IGFmdGVyIGEgZHJhZ2dpbmcgZG9uZSBjb21wbGV0ZVxyXG4gICAgaWYgKGRyYWdnaW5nLmRvbmUpIHJldHVybiBmYWxzZTtcclxuICAgIHRvZ2dsZUNlbGwoJCh0aGlzKSk7XHJcbiAgICB0aGF0LmJpbmREYXRhKCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGVsLmZpbmQoc2xvdHNDb250YWluZXIpXHJcbiAgLm9uKCdtb3VzZWRvd24nLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBkcmFnZ2luZy5kb25lID0gZmFsc2U7XHJcbiAgICBkcmFnZ2luZy5maXJzdCA9ICQodGhpcyk7XHJcbiAgICBkcmFnZ2luZy5sYXN0ID0gbnVsbDtcclxuICAgIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLnNob3coKTtcclxuXHJcbiAgICBtYWtlVW5zZWxlY3RhYmxlKHRoYXQuJGVsKTtcclxuICAgIGNsZWFyQ3VycmVudFNlbGVjdGlvbigpO1xyXG5cclxuICAgIHZhciBzID0gZHJhZ2dpbmcuZmlyc3QuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIG9mZnNldFRvUG9zaXRpb24oZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXJbMF0sIHMpO1xyXG5cclxuICB9KVxyXG4gIC5vbignbW91c2VlbnRlcicsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGlmIChkcmFnZ2luZy5maXJzdCkge1xyXG4gICAgICBkcmFnZ2luZy5sYXN0ID0gJCh0aGlzKTtcclxuXHJcbiAgICAgIHVwZGF0ZVNlbGVjdGlvbihkcmFnZ2luZy5sYXN0KTtcclxuICAgIH1cclxuICB9KVxyXG4gIC5vbignbW91c2V1cCcsIGZpbmlzaERyYWcpXHJcbiAgLmZpbmQoJ3RkJylcclxuICAuYXR0cignZHJhZ2dhYmxlJywgZmFsc2UpO1xyXG5cclxuICAvLyBUaGlzIHdpbGwgbm90IHdvcmsgd2l0aCBwb2ludGVyLWV2ZW50czpub25lLCBidXQgb24gb3RoZXJcclxuICAvLyBjYXNlcyAocmVjZW50SUUpXHJcbiAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIub24oJ21vdXNldXAnLCBmaW5pc2hEcmFnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCBmYWxzZSk7XHJcblxyXG59XHJcblxyXG4vKipcclxuV29yayBob3VycyBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIFdvcmtIb3VycyA9IExjV2lkZ2V0LmV4dGVuZChcclxuLy8gUHJvdG90eXBlXHJcbntcclxuY2xhc3NlczogZXh0ZW5kKHt9LCB1dGlscy53ZWVrbHlDbGFzc2VzLCB7XHJcbiAgd2Vla2x5Q2FsZW5kYXI6IHVuZGVmaW5lZCxcclxuICB3b3JrSG91cnNDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS13b3JrSG91cnMnXHJcbn0pLFxyXG50ZXh0czogdXRpbHMud2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdvcmtIb3VycygpIHtcclxuICB2YXIgXHJcbiAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIGZvciAodmFyIHdrID0gMDsgd2sgPCB1dGlscy5zeXN0ZW1XZWVrRGF5cy5sZW5ndGg7IHdrKyspIHtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbd2tdXTtcclxuICAgIGlmIChkYXRlU2xvdHMgJiYgZGF0ZVNsb3RzLmxlbmd0aCkge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gdXRpbHMuZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIHdrLCBzbG90KTtcclxuICAgICAgICAvLyBSZW1vdmUgZGVmYXVsdCBzdGF0dXNcclxuICAgICAgICBzbG90Q2VsbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICdfJyk7XHJcbiAgICAgICAgLy8gQWRkaW5nIHN0YXR1cyBjbGFzc1xyXG4gICAgICAgIHNsb3RDZWxsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdvcmtIb3VycyhlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHRoaXMudXNlciA9IHRoaXMuJGVsLmRhdGEoJ2NhbGVuZGFyLXVzZXInKTtcclxuXHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3b3JrSG91cnMnXHJcbiAgfTtcclxuXHJcbiAgLy8gRmV0Y2ggdGhlIGRhdGE6IHRoZXJlIGlzIG5vdCBhIG1vcmUgc3BlY2lmaWMgcXVlcnksXHJcbiAgLy8gaXQganVzdCBnZXQgdGhlIGhvdXJzIGZvciBlYWNoIHdlZWstZGF5IChkYXRhXHJcbiAgLy8gc2xvdHMgYXJlIHBlciB3ZWVrLWRheSBpbnN0ZWFkIG9mIHBlciBkYXRlIGNvbXBhcmVkXHJcbiAgLy8gdG8gKndlZWtseSopXHJcbiAgdGhpcy5mZXRjaERhdGEoKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoKTtcclxuICB9KTtcclxuXHJcbiAgc2V0dXBFZGl0V29ya0hvdXJzLmNhbGwodGhpcyk7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV29ya2hvdXJzIGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldvcmtIb3Vycy5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdvcmtIb3Vycy5wcm90b3R5cGUuY2xhc3Nlcy53b3JrSG91cnNDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdvcmtIb3Vycyh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmtIb3VyczsiLCIvKipcclxuQ3Jvc3MgYnJvd3NlciB3YXkgdG8gdW5zZWxlY3QgY3VycmVudCBzZWxlY3Rpb25cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xlYXJDdXJyZW50U2VsZWN0aW9uKCkge1xyXG4gIGlmICh0eXBlb2YgKHdpbmRvdy5nZXRTZWxlY3Rpb24pID09PSAnZnVuY3Rpb24nKVxyXG4gIC8vIFN0YW5kYXJkXHJcbiAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgZWxzZSBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uICYmIHR5cGVvZiAoZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KSA9PT0gJ2Z1bmN0aW9uJylcclxuICAvLyBJRVxyXG4gICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XHJcbn07IiwiLyoqXHJcbiAgQSBjb2xsZWN0aW9uIG9mIHVzZWZ1bCBnZW5lcmljIHV0aWxzIG1hbmFnaW5nIERhdGVzXHJcbioqL1xyXG52YXIgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyk7XHJcblxyXG5mdW5jdGlvbiBjdXJyZW50V2VlaygpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSksXHJcbiAgICBlbmQ6IGdldExhc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50V2VlayA9IGN1cnJlbnRXZWVrO1xyXG5cclxuZnVuY3Rpb24gbmV4dFdlZWsoc3RhcnQsIGVuZCkge1xyXG4gIC8vIFVuaXF1ZSBwYXJhbSB3aXRoIGJvdGggcHJvcGllcnRpZXM6XHJcbiAgaWYgKHN0YXJ0LmVuZCkge1xyXG4gICAgZW5kID0gc3RhcnQuZW5kO1xyXG4gICAgc3RhcnQgPSBzdGFydC5zdGFydDtcclxuICB9XHJcbiAgLy8gT3B0aW9uYWwgZW5kOlxyXG4gIGVuZCA9IGVuZCB8fCBhZGREYXlzKHN0YXJ0LCA3KTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGFkZERheXMoc3RhcnQsIDcpLFxyXG4gICAgZW5kOiBhZGREYXlzKGVuZCwgNylcclxuICB9O1xyXG59XHJcbmV4cG9ydHMubmV4dFdlZWsgPSBuZXh0V2VlaztcclxuXHJcbmZ1bmN0aW9uIGdldEZpcnN0V2Vla0RhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpIC0gZC5nZXREYXkoKSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRGaXJzdFdlZWtEYXRlID0gZ2V0Rmlyc3RXZWVrRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGdldExhc3RXZWVrRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyAoNiAtIGQuZ2V0RGF5KCkpKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldExhc3RXZWVrRGF0ZSA9IGdldExhc3RXZWVrRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGlzSW5DdXJyZW50V2VlayhkYXRlKSB7XHJcbiAgcmV0dXJuIGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUoZGF0ZSkpID09IGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSkpO1xyXG59XHJcbmV4cG9ydHMuaXNJbkN1cnJlbnRXZWVrID0gaXNJbkN1cnJlbnRXZWVrO1xyXG5cclxuZnVuY3Rpb24gYWRkRGF5cyhkYXRlLCBkYXlzKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkYXlzKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmFkZERheXMgPSBhZGREYXlzO1xyXG5cclxuZnVuY3Rpb24gZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZuKSB7XHJcbiAgaWYgKCFmbi5jYWxsKSB0aHJvdyBuZXcgRXJyb3IoJ2ZuIG11c3QgYmUgYSBmdW5jdGlvbiBvciBcImNhbGxcImFibGUgb2JqZWN0Jyk7XHJcbiAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzdGFydCk7XHJcbiAgdmFyIGkgPSAwLCByZXQ7XHJcbiAgd2hpbGUgKGRhdGUgPD0gZW5kKSB7XHJcbiAgICByZXQgPSBmbi5jYWxsKGZuLCBkYXRlLCBpKTtcclxuICAgIC8vIEFsbG93IGZuIHRvIGNhbmNlbCB0aGUgbG9vcCB3aXRoIHN0cmljdCAnZmFsc2UnXHJcbiAgICBpZiAocmV0ID09PSBmYWxzZSlcclxuICAgICAgYnJlYWs7XHJcbiAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyAxKTtcclxuICAgIGkrKztcclxuICB9XHJcbn1cclxuZXhwb3J0cy5lYWNoRGF0ZUluUmFuZ2UgPSBlYWNoRGF0ZUluUmFuZ2U7XHJcblxyXG4vKiogTW9udGhzICoqL1xyXG5cclxuZnVuY3Rpb24gZ2V0Rmlyc3RNb250aERhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKDEpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0Rmlyc3RNb250aERhdGUgPSBnZXRGaXJzdE1vbnRoRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGdldExhc3RNb250aERhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyAxLCAxKTtcclxuICBkID0gYWRkRGF5cyhkLCAtMSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRMYXN0TW9udGhEYXRlID0gZ2V0TGFzdE1vbnRoRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGlzSW5DdXJyZW50TW9udGgoZGF0ZSkge1xyXG4gIHJldHVybiBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdE1vbnRoRGF0ZShkYXRlKSkgPT0gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RNb250aERhdGUobmV3IERhdGUoKSkpO1xyXG59XHJcbmV4cG9ydHMuaXNJbkN1cnJlbnRNb250aCA9IGlzSW5DdXJyZW50TW9udGg7XHJcblxyXG4vKipcclxuICBHZXQgYSBkYXRlcyByYW5nZSBmb3IgdGhlIGN1cnJlbnQgbW9udGhcclxuICAob3IgdGhlIGdpdmVuIGRhdGUgYXMgYmFzZSlcclxuKiovXHJcbmZ1bmN0aW9uIGN1cnJlbnRNb250aChiYXNlRGF0ZSkge1xyXG4gIGJhc2VEYXRlID0gYmFzZURhdGUgfHwgbmV3IERhdGUoKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGdldEZpcnN0TW9udGhEYXRlKGJhc2VEYXRlKSxcclxuICAgIGVuZDogZ2V0TGFzdE1vbnRoRGF0ZShiYXNlRGF0ZSlcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudE1vbnRoID0gY3VycmVudE1vbnRoO1xyXG5cclxuZnVuY3Rpb24gbmV4dE1vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpIHtcclxuICBhbW91bnRNb250aHMgPSBhbW91bnRNb250aHMgfHwgMTtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGZyb21EYXRlKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgYW1vdW50TW9udGhzLCAxKSxcclxuICAgIGVuZDogZ2V0TGFzdE1vbnRoRGF0ZShkKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5uZXh0TW9udGggPSBuZXh0TW9udGg7XHJcblxyXG5mdW5jdGlvbiBwcmV2aW91c01vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpIHtcclxuICByZXR1cm4gbmV4dE1vbnRoKGZyb21EYXRlLCAwIC0gYW1vdW50TW9udGhzKTtcclxufVxyXG5leHBvcnRzLnByZXZpb3VzTW9udGggPSBwcmV2aW91c01vbnRoO1xyXG5cclxuLyoqXHJcbiAgR2V0IGEgZGF0ZXMgcmFuZ2UgZm9yIHRoZSBjb21wbGV0ZSB3ZWVrc1xyXG4gIHRoYXQgYXJlIHBhcnQgb2YgdGhlIGN1cnJlbnQgbW9udGhcclxuICAob3IgdGhlIGdpdmVuIGRhdGUgYXMgYmFzZSkuXHJcbiAgVGhhdCBtZWFucywgdGhhdCBzdGFydCBkYXRlIHdpbGwgYmUgdGhlIGZpcnN0XHJcbiAgd2VlayBkYXRlIG9mIHRoZSBmaXJzdCBtb250aCB3ZWVrICh0aGF0IGNhblxyXG4gIGJlIHRoZSBkYXkgMSBvZiB0aGUgbW9udGggb3Igb25lIG9mIHRoZSBsYXN0XHJcbiAgZGF0ZXMgZnJvbSB0aGUgcHJldmlvdXMgbW9udGhzKSxcclxuICBhbmQgc2ltaWxhciBmb3IgdGhlIGVuZCBkYXRlIGJlaW5nIHRoZSBcclxuICBsYXN0IHdlZWsgZGF0ZSBvZiB0aGUgbGFzdCBtb250aCB3ZWVrLlxyXG5cclxuICBAaW5jbHVkZVNpeFdlZWtzOiBzb21ldGltZXMgaXMgdXNlZnVsIGdldCBldmVyIGFcclxuICBzaXggd2Vla3MgZGF0ZXMgcmFuZ2Ugc3RhcmluZyBieSB0aGUgZmlyc3Qgd2VlayBvZlxyXG4gIHRoZSBiYXNlRGF0ZSBtb250aC4gQnkgZGVmYXVsdCBpcyBmYWxzZS5cclxuKiovXHJcbmZ1bmN0aW9uIGN1cnJlbnRNb250aFdlZWtzKGJhc2VEYXRlLCBpbmNsdWRlU2l4V2Vla3MpIHtcclxuICB2YXIgciA9IGN1cnJlbnRNb250aChiYXNlRGF0ZSksXHJcbiAgICBzID0gZ2V0Rmlyc3RXZWVrRGF0ZShyLnN0YXJ0KSxcclxuICAgIGUgPSBpbmNsdWRlU2l4V2Vla3MgPyBhZGREYXlzKHMsIDYqNyAtIDEpIDogZ2V0TGFzdFdlZWtEYXRlKHIuZW5kKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IHMsXHJcbiAgICBlbmQ6IGVcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudE1vbnRoV2Vla3MgPSBjdXJyZW50TW9udGhXZWVrcztcclxuXHJcbmZ1bmN0aW9uIG5leHRNb250aFdlZWtzKGZyb21EYXRlLCBhbW91bnRNb250aHMsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHJldHVybiBjdXJyZW50TW9udGhXZWVrcyhuZXh0TW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykuc3RhcnQsIGluY2x1ZGVTaXhXZWVrcyk7XHJcbn1cclxuZXhwb3J0cy5uZXh0TW9udGhXZWVrcyA9IG5leHRNb250aFdlZWtzO1xyXG5cclxuZnVuY3Rpb24gcHJldmlvdXNNb250aFdlZWtzKGZyb21EYXRlLCBhbW91bnRNb250aHMsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHJldHVybiBjdXJyZW50TW9udGhXZWVrcyhwcmV2aW91c01vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpLnN0YXJ0LCBpbmNsdWRlU2l4V2Vla3MpO1xyXG59XHJcbmV4cG9ydHMucHJldmlvdXNNb250aFdlZWtzID0gcHJldmlvdXNNb250aFdlZWtzO1xyXG4iLCIvKiogVmVyeSBzaW1wbGUgY3VzdG9tLWZvcm1hdCBmdW5jdGlvbiB0byBhbGxvdyBcclxubDEwbiBvZiB0ZXh0cy5cclxuQ292ZXIgY2FzZXM6XHJcbi0gTSBmb3IgbW9udGhcclxuLSBEIGZvciBkYXlcclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlLCBmb3JtYXQpIHtcclxuICB2YXIgcyA9IGZvcm1hdCxcclxuICAgICAgTSA9IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgIEQgPSBkYXRlLmdldERhdGUoKTtcclxuICBzID0gcy5yZXBsYWNlKC9NL2csIE0pO1xyXG4gIHMgPSBzLnJlcGxhY2UoL0QvZywgRCk7XHJcbiAgcmV0dXJuIHM7XHJcbn07IiwiLyoqXHJcbiAgRXhwb3NpbmcgYWxsIHRoZSBwdWJsaWMgZmVhdHVyZXMgYW5kIGNvbXBvbmVudHMgb2YgYXZhaWxhYmlsaXR5Q2FsZW5kYXJcclxuKiovXHJcbmV4cG9ydHMuV2Vla2x5ID0gcmVxdWlyZSgnLi9XZWVrbHknKTtcclxuZXhwb3J0cy5Xb3JrSG91cnMgPSByZXF1aXJlKCcuL1dvcmtIb3VycycpO1xyXG5leHBvcnRzLk1vbnRobHkgPSByZXF1aXJlKCcuL01vbnRobHknKTsiLCIvKipcclxuICBNYWtlIGFuIGVsZW1lbnQgdW5zZWxlY3RhYmxlLCB1c2VmdWwgdG8gaW1wbGVtZW50IHNvbWUgY3VzdG9tXHJcbiAgc2VsZWN0aW9uIGJlaGF2aW9yIG9yIGRyYWcmZHJvcC5cclxuICBJZiBvZmZlcnMgYW4gJ29mZicgbWV0aG9kIHRvIHJlc3RvcmUgYmFjayB0aGUgZWxlbWVudCBiZWhhdmlvci5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gIHZhciBmYWxzeWZuID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XHJcbiAgdmFyIG5vZHJhZ1N0eWxlID0ge1xyXG4gICAgJy13ZWJraXQtdG91Y2gtY2FsbG91dCc6ICdub25lJyxcclxuICAgICcta2h0bWwtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy1raHRtbC11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnXHJcbiAgfTtcclxuICB2YXIgZHJhZ2RlZmF1bHRTdHlsZSA9IHtcclxuICAgICctd2Via2l0LXRvdWNoLWNhbGxvdXQnOiAnaW5oZXJpdCcsXHJcbiAgICAnLWtodG1sLXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICctd2Via2l0LXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICcta2h0bWwtdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctbW96LXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1tcy11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICd1c2VyLXNlbGVjdCc6ICdpbmhlcml0J1xyXG4gIH07XHJcblxyXG4gIHZhciBvbiA9IGZ1bmN0aW9uIG1ha2VVbnNlbGVjdGFibGUoZWwpIHtcclxuICAgIGVsID0gJChlbCk7XHJcbiAgICBlbC5vbignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIC8vJChkb2N1bWVudCkub24oJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3Mobm9kcmFnU3R5bGUpO1xyXG4gIH07XHJcblxyXG4gIHZhciBvZmYgPSBmdW5jdGlvbiBvZmZNYWtlVW5zZWxlY3RhYmxlKGVsKSB7XHJcbiAgICBlbCA9ICQoZWwpO1xyXG4gICAgZWwub2ZmKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgLy8kKGRvY3VtZW50KS5vZmYoJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3MoZHJhZ2RlZmF1bHRTdHlsZSk7XHJcbiAgfTtcclxuXHJcbiAgb24ub2ZmID0gb2ZmO1xyXG4gIHJldHVybiBvbjtcclxuXHJcbn0gKCkpOyIsIi8qKlxyXG4gIEF2YWlsYWJpbGl0eUNhbGVuZGFyIHNoYXJlZCB1dGlsc1xyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBkYXRlVXRpbHMgPSByZXF1aXJlKCcuL2RhdGVVdGlscycpLFxyXG4gIGZvcm1hdERhdGUgPSByZXF1aXJlKCcuL2Zvcm1hdERhdGUnKTtcclxuXHJcbi8vIFJlLWV4cG9ydGluZzpcclxuZXhwb3J0cy5mb3JtYXREYXRlID0gZm9ybWF0RGF0ZTtcclxuZXhwb3J0cy5kYXRlID0gZGF0ZVV0aWxzO1xyXG5cclxuLyotLS0tLS0gQ09OU1RBTlRTIC0tLS0tLS0tLSovXHJcbnZhciBzdGF0dXNUeXBlcyA9IGV4cG9ydHMuc3RhdHVzVHlwZXMgPSBbJ3VuYXZhaWxhYmxlJywgJ2F2YWlsYWJsZSddO1xyXG4vLyBXZWVrIGRheXMgbmFtZXMgaW4gZW5nbGlzaCBmb3IgaW50ZXJuYWwgc3lzdGVtXHJcbi8vIHVzZTsgTk9UIGZvciBsb2NhbGl6YXRpb24vdHJhbnNsYXRpb24uXHJcbnZhciBzeXN0ZW1XZWVrRGF5cyA9IGV4cG9ydHMuc3lzdGVtV2Vla0RheXMgPSBbXHJcbiAgJ3N1bmRheScsXHJcbiAgJ21vbmRheScsXHJcbiAgJ3R1ZXNkYXknLFxyXG4gICd3ZWRuZXNkYXknLFxyXG4gICd0aHVyc2RheScsXHJcbiAgJ2ZyaWRheScsXHJcbiAgJ3NhdHVyZGF5J1xyXG5dO1xyXG5cclxuLyotLS0tLS0tLS0gQ09ORklHIC0gSU5TVEFOQ0UgLS0tLS0tLS0tLSovXHJcbnZhciB3ZWVrbHlDbGFzc2VzID0gZXhwb3J0cy53ZWVrbHlDbGFzc2VzID0ge1xyXG4gIGNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXInLFxyXG4gIHdlZWtseUNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLXdlZWtseScsXHJcbiAgY3VycmVudFdlZWs6ICdpcy1jdXJyZW50V2VlaycsXHJcbiAgYWN0aW9uczogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWFjdGlvbnMnLFxyXG4gIHByZXZBY3Rpb246ICdBY3Rpb25zLXByZXYnLFxyXG4gIG5leHRBY3Rpb246ICdBY3Rpb25zLW5leHQnLFxyXG4gIGRheXM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1kYXlzJyxcclxuICBzbG90czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXNsb3RzJyxcclxuICBzbG90SG91cjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWhvdXInLFxyXG4gIHNsb3RTdGF0dXNQcmVmaXg6ICdpcy0nLFxyXG4gIGxlZ2VuZDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZCcsXHJcbiAgbGVnZW5kQXZhaWxhYmxlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kLWF2YWlsYWJsZScsXHJcbiAgbGVnZW5kVW5hdmFpbGFibGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQtdW5hdmFpbGFibGUnLFxyXG4gIHN0YXR1czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXN0YXR1cydcclxufTtcclxuXHJcbnZhciB3ZWVrbHlUZXh0cyA9IGV4cG9ydHMud2Vla2x5VGV4dHMgPSB7XHJcbiAgYWJicldlZWtEYXlzOiBbXHJcbiAgICAnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J1xyXG4gIF0sXHJcbiAgdG9kYXk6ICdUb2RheScsXHJcbiAgLy8gQWxsb3dlZCBzcGVjaWFsIHZhbHVlczogTTptb250aCwgRDpkYXlcclxuICBhYmJyRGF0ZUZvcm1hdDogJ00vRCdcclxufTtcclxuXHJcbi8qLS0tLS0tLS0tLS0gVklFVyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbmZ1bmN0aW9uIG1vdmVCaW5kUmFuZ2VJbkRheXMod2Vla2x5LCBkYXlzKSB7XHJcbiAgdmFyIFxyXG4gICAgc3RhcnQgPSBkYXRlVXRpbHMuYWRkRGF5cyh3ZWVrbHkuZGF0ZXNSYW5nZS5zdGFydCwgZGF5cyksXHJcbiAgICBlbmQgPSBkYXRlVXRpbHMuYWRkRGF5cyh3ZWVrbHkuZGF0ZXNSYW5nZS5lbmQsIGRheXMpLFxyXG4gICAgZGF0ZXNSYW5nZSA9IGRhdGVzVG9SYW5nZShzdGFydCwgZW5kKTtcclxuXHJcbiAgLy8gQ2hlY2sgY2FjaGUgYmVmb3JlIHRyeSB0byBmZXRjaFxyXG4gIHZhciBpbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZSh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG5cclxuICBpZiAoaW5DYWNoZSkge1xyXG4gICAgLy8gSnVzdCBzaG93IHRoZSBkYXRhXHJcbiAgICB3ZWVrbHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAvLyBQcmVmZXRjaCBleGNlcHQgaWYgdGhlcmUgaXMgb3RoZXIgcmVxdWVzdCBpbiBjb3Vyc2UgKGNhbiBiZSB0aGUgc2FtZSBwcmVmZXRjaCxcclxuICAgIC8vIGJ1dCBzdGlsbCBkb24ndCBvdmVybG9hZCB0aGUgc2VydmVyKVxyXG4gICAgaWYgKHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBTdXBwb3J0IGZvciBwcmVmZXRjaGluZzpcclxuICAgIC8vIEl0cyBhdm9pZGVkIGlmIHRoZXJlIGFyZSByZXF1ZXN0cyBpbiBjb3Vyc2UsIHNpbmNlXHJcbiAgICAvLyB0aGF0IHdpbGwgYmUgYSBwcmVmZXRjaCBmb3IgdGhlIHNhbWUgZGF0YS5cclxuICAgIGlmICh3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkge1xyXG4gICAgICAvLyBUaGUgbGFzdCByZXF1ZXN0IGluIHRoZSBwb29sICptdXN0KiBiZSB0aGUgbGFzdCBpbiBmaW5pc2hcclxuICAgICAgLy8gKG11c3QgYmUgb25seSBvbmUgaWYgYWxsIGdvZXMgZmluZSk6XHJcbiAgICAgIHZhciByZXF1ZXN0ID0gd2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0c1t3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgLy8gV2FpdCBmb3IgdGhlIGZldGNoIHRvIHBlcmZvcm0gYW5kIHNldHMgbG9hZGluZyB0byBub3RpZnkgdXNlclxyXG4gICAgICB3ZWVrbHkuJGVsLmFkZENsYXNzKHdlZWtseS5jbGFzc2VzLmZldGNoaW5nKTtcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBtb3ZlQmluZFJhbmdlSW5EYXlzKHdlZWtseSwgZGF5cyk7XHJcbiAgICAgICAgd2Vla2x5LiRlbC5yZW1vdmVDbGFzcyh3ZWVrbHkuY2xhc3Nlcy5mZXRjaGluZyB8fCAnXycpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZldGNoIChkb3dubG9hZCkgdGhlIGRhdGEgYW5kIHNob3cgb24gcmVhZHk6XHJcbiAgICB3ZWVrbHlcclxuICAgIC5mZXRjaERhdGEoZGF0ZXNUb1F1ZXJ5KGRhdGVzUmFuZ2UpKVxyXG4gICAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICB3ZWVrbHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAgIC8vIFByZWZldGNoXHJcbiAgICAgIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLm1vdmVCaW5kUmFuZ2VJbkRheXMgPSBtb3ZlQmluZFJhbmdlSW5EYXlzO1xyXG5cclxuZnVuY3Rpb24gd2Vla2x5SXNEYXRhSW5DYWNoZSh3ZWVrbHksIGRhdGVzUmFuZ2UpIHtcclxuICAvLyBDaGVjayBjYWNoZTogaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBkYXRlIGluIHRoZSByYW5nZVxyXG4gIC8vIHdpdGhvdXQgZGF0YSwgd2Ugc2V0IGluQ2FjaGUgYXMgZmFsc2UgYW5kIGZldGNoIHRoZSBkYXRhOlxyXG4gIHZhciBpbkNhY2hlID0gdHJ1ZTtcclxuICBkYXRlVXRpbHMuZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIGlmICghd2Vla2x5LmRhdGEuc2xvdHNbZGF0ZWtleV0pIHtcclxuICAgICAgaW5DYWNoZSA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGluQ2FjaGU7XHJcbn1cclxuZXhwb3J0cy53ZWVrbHlJc0RhdGFJbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZTtcclxuXHJcbi8qKlxyXG4gIEZvciBub3csIGdpdmVuIHRoZSBKU09OIHN0cnVjdHVyZSB1c2VkLCB0aGUgbG9naWNcclxuICBvZiBtb250aGx5SXNEYXRhSW5DYWNoZSBpcyB0aGUgc2FtZSBhcyB3ZWVrbHlJc0RhdGFJbkNhY2hlOlxyXG4qKi9cclxudmFyIG1vbnRobHlJc0RhdGFJbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZTtcclxuZXhwb3J0cy5tb250aGx5SXNEYXRhSW5DYWNoZSA9IG1vbnRobHlJc0RhdGFJbkNhY2hlO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBjdXJyZW50RGF0ZXNSYW5nZSkge1xyXG4gIHZhciBuZXh0RGF0ZXNSYW5nZSA9IGRhdGVzVG9SYW5nZShcclxuICAgIGRhdGVVdGlscy5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLnN0YXJ0LCA3KSxcclxuICAgIGRhdGVVdGlscy5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLmVuZCwgNylcclxuICApO1xyXG5cclxuICBpZiAoIXdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBuZXh0RGF0ZXNSYW5nZSkpIHtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgd2VlayBpbiBhZHZhbmNlXHJcbiAgICB2YXIgcHJlZmV0Y2hRdWVyeSA9IGRhdGVzVG9RdWVyeShuZXh0RGF0ZXNSYW5nZSk7XHJcbiAgICB3ZWVrbHkuZmV0Y2hEYXRhKHByZWZldGNoUXVlcnksIG51bGwsIHRydWUpO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2ggPSB3ZWVrbHlDaGVja0FuZFByZWZldGNoO1xyXG5cclxuLyoqIFVwZGF0ZSB0aGUgdmlldyBsYWJlbHMgZm9yIHRoZSB3ZWVrLWRheXMgKHRhYmxlIGhlYWRlcnMpXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVMYWJlbHMoZGF0ZXNSYW5nZSwgY2FsZW5kYXIsIG9wdGlvbnMpIHtcclxuICB2YXIgc3RhcnQgPSBkYXRlc1JhbmdlLnN0YXJ0LFxyXG4gICAgICBlbmQgPSBkYXRlc1JhbmdlLmVuZDtcclxuXHJcbiAgdmFyIGRheXMgPSBjYWxlbmRhci5maW5kKCcuJyArIG9wdGlvbnMuY2xhc3Nlcy5kYXlzICsgJyB0aCcpO1xyXG4gIHZhciB0b2RheSA9IGRhdGVJU08uZGF0ZUxvY2FsKG5ldyBEYXRlKCkpO1xyXG4gIC8vIEZpcnN0IGNlbGwgaXMgZW1wdHkgKCd0aGUgY3Jvc3MgaGVhZGVycyBjZWxsJyksIHRoZW4gb2Zmc2V0IGlzIDFcclxuICB2YXIgb2Zmc2V0ID0gMTtcclxuICBkYXRlVXRpbHMuZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICB2YXIgY2VsbCA9ICQoZGF5cy5nZXQob2Zmc2V0ICsgaSkpLFxyXG4gICAgICAgIHNkYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSksXHJcbiAgICAgICAgbGFiZWwgPSBzZGF0ZTtcclxuXHJcbiAgICBpZiAodG9kYXkgPT0gc2RhdGUpXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy50b2RheTtcclxuICAgIGVsc2VcclxuICAgICAgbGFiZWwgPSBvcHRpb25zLnRleHRzLmFiYnJXZWVrRGF5c1tkYXRlLmdldERheSgpXSArICcgJyArIGZvcm1hdERhdGUoZGF0ZSwgb3B0aW9ucy50ZXh0cy5hYmJyRGF0ZUZvcm1hdCk7XHJcblxyXG4gICAgY2VsbC50ZXh0KGxhYmVsKTtcclxuICB9KTtcclxufVxyXG5leHBvcnRzLnVwZGF0ZUxhYmVscyA9IHVwZGF0ZUxhYmVscztcclxuXHJcbmZ1bmN0aW9uIGZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCBkYXksIHNsb3QpIHtcclxuICBzbG90ID0gZGF0ZUlTTy5wYXJzZShzbG90KTtcclxuICB2YXIgXHJcbiAgICB4ID0gTWF0aC5yb3VuZChzbG90LmdldEhvdXJzKCkpLFxyXG4gIC8vIFRpbWUgZnJhbWVzIChzbG90cykgYXJlIDE1IG1pbnV0ZXMgZGl2aXNpb25zXHJcbiAgICB5ID0gTWF0aC5yb3VuZChzbG90LmdldE1pbnV0ZXMoKSAvIDE1KSxcclxuICAgIHRyID0gc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJzplcSgnICsgTWF0aC5yb3VuZCh4ICogNCArIHkpICsgJyknKTtcclxuXHJcbiAgLy8gU2xvdCBjZWxsIGZvciBvJ2Nsb2NrIGhvdXJzIGlzIGF0IDEgcG9zaXRpb24gb2Zmc2V0XHJcbiAgLy8gYmVjYXVzZSBvZiB0aGUgcm93LWhlYWQgY2VsbFxyXG4gIHZhciBkYXlPZmZzZXQgPSAoeSA9PT0gMCA/IGRheSArIDEgOiBkYXkpO1xyXG4gIHJldHVybiB0ci5jaGlsZHJlbignOmVxKCcgKyBkYXlPZmZzZXQgKyAnKScpO1xyXG59XHJcbmV4cG9ydHMuZmluZENlbGxCeVNsb3QgPSBmaW5kQ2VsbEJ5U2xvdDtcclxuXHJcbmZ1bmN0aW9uIGZpbmRTbG90QnlDZWxsKHNsb3RzQ29udGFpbmVyLCBjZWxsKSB7XHJcbiAgdmFyIFxyXG4gICAgeCA9IGNlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IGNlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpLFxyXG4gICAgZnVsbE1pbnV0ZXMgPSB5ICogMTUsXHJcbiAgICBob3VycyA9IE1hdGguZmxvb3IoZnVsbE1pbnV0ZXMgLyA2MCksXHJcbiAgICBtaW51dGVzID0gZnVsbE1pbnV0ZXMgLSAoaG91cnMgKiA2MCksXHJcbiAgICBzbG90ID0gbmV3IERhdGUoKTtcclxuICBzbG90LnNldEhvdXJzKGhvdXJzLCBtaW51dGVzLCAwLCAwKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGRheTogeCxcclxuICAgIHNsb3Q6IHNsb3RcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZmluZFNsb3RCeUNlbGwgPSBmaW5kU2xvdEJ5Q2VsbDtcclxuXHJcbi8qKlxyXG5NYXJrIGNhbGVuZGFyIGFzIGN1cnJlbnQtd2VlayBhbmQgZGlzYWJsZSBwcmV2IGJ1dHRvbixcclxub3IgcmVtb3ZlIHRoZSBtYXJrIGFuZCBlbmFibGUgaXQgaWYgaXMgbm90LlxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50V2VlayhjYWxlbmRhciwgZGF0ZSwgb3B0aW9ucykge1xyXG4gIHZhciB5ZXAgPSBkYXRlVXRpbHMuaXNJbkN1cnJlbnRXZWVrKGRhdGUpO1xyXG4gIGNhbGVuZGFyLnRvZ2dsZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5jdXJyZW50V2VlaywgeWVwKTtcclxuICBjYWxlbmRhci5maW5kKCcuJyArIG9wdGlvbnMuY2xhc3Nlcy5wcmV2QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcbn1cclxuZXhwb3J0cy5jaGVja0N1cnJlbnRXZWVrID0gY2hlY2tDdXJyZW50V2VlaztcclxuXHJcbi8qKiBHZXQgcXVlcnkgb2JqZWN0IHdpdGggdGhlIGRhdGUgcmFuZ2Ugc3BlY2lmaWVkOlxyXG4qKi9cclxuZnVuY3Rpb24gZGF0ZXNUb1F1ZXJ5KHN0YXJ0LCBlbmQpIHtcclxuICAvLyBVbmlxdWUgcGFyYW0gd2l0aCBib3RoIHByb3BpZXJ0aWVzOlxyXG4gIGlmIChzdGFydC5lbmQpIHtcclxuICAgIGVuZCA9IHN0YXJ0LmVuZDtcclxuICAgIHN0YXJ0ID0gc3RhcnQuc3RhcnQ7XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZGF0ZUlTTy5kYXRlTG9jYWwoc3RhcnQsIHRydWUpLFxyXG4gICAgZW5kOiBkYXRlSVNPLmRhdGVMb2NhbChlbmQsIHRydWUpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmRhdGVzVG9RdWVyeSA9IGRhdGVzVG9RdWVyeTtcclxuXHJcbi8qKiBQYWNrIHR3byBkYXRlcyBpbiBhIHNpbXBsZSBidXQgdXNlZnVsXHJcbnN0cnVjdHVyZSB7IHN0YXJ0LCBlbmQgfVxyXG4qKi9cclxuZnVuY3Rpb24gZGF0ZXNUb1JhbmdlKHN0YXJ0LCBlbmQpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IHN0YXJ0LFxyXG4gICAgZW5kOiBlbmRcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZGF0ZXNUb1JhbmdlID0gZGF0ZXNUb1JhbmdlO1xyXG4iLCIvKiBHZW5lcmljIGJsb2NrVUkgb3B0aW9ucyBzZXRzICovXHJcbnZhciBsb2FkaW5nQmxvY2sgPSB7IG1lc3NhZ2U6ICc8aW1nIHdpZHRoPVwiNDhweFwiIGhlaWdodD1cIjQ4cHhcIiBjbGFzcz1cImxvYWRpbmctaW5kaWNhdG9yXCIgc3JjPVwiJyArIExjVXJsLkFwcFBhdGggKyAnaW1nL3RoZW1lL2xvYWRpbmcuZ2lmXCIvPicgfTtcclxudmFyIGVycm9yQmxvY2sgPSBmdW5jdGlvbiAoZXJyb3IsIHJlbG9hZCwgc3R5bGUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3NzOiAkLmV4dGVuZCh7IGN1cnNvcjogJ2RlZmF1bHQnIH0sIHN0eWxlIHx8IHt9KSxcclxuICAgICAgICBtZXNzYWdlOiAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPjxkaXYgY2xhc3M9XCJpbmZvXCI+VGhlcmUgd2FzIGFuIGVycm9yJyArXHJcbiAgICAgICAgICAgIChlcnJvciA/ICc6ICcgKyBlcnJvciA6ICcnKSArXHJcbiAgICAgICAgICAgIChyZWxvYWQgPyAnIDxhIGhyZWY9XCJqYXZhc2NyaXB0OiAnICsgcmVsb2FkICsgJztcIj5DbGljayB0byByZWxvYWQ8L2E+JyA6ICcnKSArXHJcbiAgICAgICAgICAgICc8L2Rpdj4nXHJcbiAgICB9O1xyXG59O1xyXG52YXIgaW5mb0Jsb2NrID0gZnVuY3Rpb24gKG1lc3NhZ2UsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWVzc2FnZTogJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT48ZGl2IGNsYXNzPVwiaW5mb1wiPicgKyBtZXNzYWdlICsgJzwvZGl2PidcclxuICAgICAgICAvKixjc3M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfSovXHJcbiAgICAgICAgLCBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH1cclxuICAgIH0sIG9wdGlvbnMpO1xyXG59O1xyXG5cclxuLy8gTW9kdWxlOlxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGxvYWRpbmc6IGxvYWRpbmdCbG9jayxcclxuICAgICAgICBlcnJvcjogZXJyb3JCbG9jayxcclxuICAgICAgICBpbmZvOiBpbmZvQmxvY2tcclxuICAgIH07XHJcbn0iLCIvKj0gQ2hhbmdlc05vdGlmaWNhdGlvbiBjbGFzc1xyXG4qIHRvIG5vdGlmeSB1c2VyIGFib3V0IGNoYW5nZXMgaW4gZm9ybXMsXHJcbiogdGFicywgdGhhdCB3aWxsIGJlIGxvc3QgaWYgZ28gYXdheSBmcm9tXHJcbiogdGhlIHBhZ2UuIEl0IGtub3dzIHdoZW4gYSBmb3JtIGlzIHN1Ym1pdHRlZFxyXG4qIGFuZCBzYXZlZCB0byBkaXNhYmxlIG5vdGlmaWNhdGlvbiwgYW5kIGdpdmVzXHJcbiogbWV0aG9kcyBmb3Igb3RoZXIgc2NyaXB0cyB0byBub3RpZnkgY2hhbmdlc1xyXG4qIG9yIHNhdmluZy5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGdldFhQYXRoID0gcmVxdWlyZSgnLi9nZXRYUGF0aCcpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSB7XHJcbiAgICBjaGFuZ2VzTGlzdDoge30sXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICAgIHRhcmdldDogbnVsbCxcclxuICAgICAgICBnZW5lcmljQ2hhbmdlU3VwcG9ydDogdHJ1ZSxcclxuICAgICAgICBnZW5lcmljU3VibWl0U3VwcG9ydDogZmFsc2UsXHJcbiAgICAgICAgY2hhbmdlZEZvcm1DbGFzczogJ2hhcy1jaGFuZ2VzJyxcclxuICAgICAgICBjaGFuZ2VkRWxlbWVudENsYXNzOiAnY2hhbmdlZCcsXHJcbiAgICAgICAgbm90aWZ5Q2xhc3M6ICdub3RpZnktY2hhbmdlcydcclxuICAgIH0sXHJcbiAgICBpbml0OiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIC8vIFVzZXIgbm90aWZpY2F0aW9uIHRvIHByZXZlbnQgbG9zdCBjaGFuZ2VzIGRvbmVcclxuICAgICAgICAkKHdpbmRvdykub24oJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoYW5nZXNOb3RpZmljYXRpb24ubm90aWZ5KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRoaXMuZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG4gICAgICAgIGlmICghb3B0aW9ucy50YXJnZXQpXHJcbiAgICAgICAgICAgIG9wdGlvbnMudGFyZ2V0ID0gZG9jdW1lbnQ7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY0NoYW5nZVN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdjaGFuZ2UnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKSA6aW5wdXRbbmFtZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKCQodGhpcykuY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNTdWJtaXRTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignc3VibWl0JywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCknLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZSh0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgbm90aWZ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gQWRkIG5vdGlmaWNhdGlvbiBjbGFzcyB0byB0aGUgZG9jdW1lbnRcclxuICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5ub3RpZnlDbGFzcyk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBjaGFuZ2UgaW4gdGhlIHByb3BlcnR5IGxpc3QgcmV0dXJuaW5nIHRoZSBtZXNzYWdlOlxyXG4gICAgICAgIGZvciAodmFyIGMgaW4gdGhpcy5jaGFuZ2VzTGlzdClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVpdE1lc3NhZ2UgfHwgKHRoaXMucXVpdE1lc3NhZ2UgPSAkKCcjbGNyZXMtcXVpdC13aXRob3V0LXNhdmUnKS50ZXh0KCkpIHx8ICcnO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyQ2hhbmdlOiBmdW5jdGlvbiAoZiwgZSkge1xyXG4gICAgICAgIGlmICghZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIHZhciBmbCA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gfHwgW107XHJcbiAgICAgICAgaWYgKCQuaXNBcnJheShlKSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGUubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ2hhbmdlKGYsIGVbaV0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBuID0gZTtcclxuICAgICAgICBpZiAodHlwZW9mIChlKSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgbiA9IGUubmFtZTtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcmVhbGx5IHRoZXJlIHdhcyBhIGNoYW5nZSBjaGVja2luZyBkZWZhdWx0IGVsZW1lbnQgdmFsdWVcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZS5kZWZhdWx0VmFsdWUpICE9ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuY2hlY2tlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5zZWxlY3RlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIGUudmFsdWUgPT0gZS5kZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZXJlIHdhcyBubyBjaGFuZ2UsIG5vIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgbWF5YmUgaXMgYSByZWdyZXNzaW9uIGZyb20gYSBjaGFuZ2UgYW5kIG5vdyB0aGUgb3JpZ2luYWwgdmFsdWUgYWdhaW5cclxuICAgICAgICAgICAgICAgIC8vIHRyeSB0byByZW1vdmUgZnJvbSBjaGFuZ2VzIGxpc3QgZG9pbmcgcmVnaXN0ZXJTYXZlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyU2F2ZShmLCBbbl0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQoZSkuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCEobiBpbiBmbCkpXHJcbiAgICAgICAgICAgIGZsLnB1c2gobik7XHJcbiAgICAgICAgJChmKVxyXG4gICAgICAgIC5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpXHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50IG5hbWUgY2hhbmdlZCwgZm9ybSBlbGVtZW50IGNoYW5nZWQgKHRoaXMgY2FuIGJlIG51bGwpXHJcbiAgICAgICAgLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBbZiwgbiwgZV0pO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyU2F2ZTogZnVuY3Rpb24gKGYsIGVscykge1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pIHJldHVybjtcclxuICAgICAgICB2YXIgcHJldkVscyA9ICQuZXh0ZW5kKFtdLCB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSk7XHJcbiAgICAgICAgdmFyIHIgPSB0cnVlO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSAkLmdyZXAodGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0sIGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gKCQuaW5BcnJheShlbCwgZWxzKSA9PSAtMSk7IH0pO1xyXG4gICAgICAgICAgICAvLyBEb24ndCByZW1vdmUgJ2YnIGxpc3QgaWYgaXMgbm90IGVtcHR5XHJcbiAgICAgICAgICAgIHIgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXS5sZW5ndGggPT09IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyKSB7XHJcbiAgICAgICAgICAgICQoZikucmVtb3ZlQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdO1xyXG4gICAgICAgICAgICAvLyBsaW5rIGVsZW1lbnRzIGZyb20gZWxzIHRvIGNsZWFuLXVwIGl0cyBjbGFzc2VzXHJcbiAgICAgICAgICAgIGVscyA9IHByZXZFbHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudHMgcmVnaXN0ZXJlZCBhcyBzYXZlICh0aGlzIGNhbiBiZSBudWxsKSwgYW5kICdmb3JtIGZ1bGx5IHNhdmVkJyBhcyB0aGlyZCBwYXJhbSAoYm9vbClcclxuICAgICAgICAkKGYpLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgW2YsIGVscywgcl0pO1xyXG4gICAgICAgIHZhciBsY2huID0gdGhpcztcclxuICAgICAgICBpZiAoZWxzKSAkLmVhY2goZWxzLCBmdW5jdGlvbiAoKSB7ICQoJ1tuYW1lPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUodGhpcykgKyAnXCJdJykucmVtb3ZlQ2xhc3MobGNobi5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTsgfSk7XHJcbiAgICAgICAgcmV0dXJuIHByZXZFbHM7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNoYW5nZXNOb3RpZmljYXRpb247XHJcbn0iLCIvKiBVdGlsaXR5IHRvIGNyZWF0ZSBpZnJhbWUgd2l0aCBpbmplY3RlZCBodG1sL2NvbnRlbnQgaW5zdGVhZCBvZiBVUkwuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUlmcmFtZShjb250ZW50LCBzaXplKSB7XHJcbiAgICB2YXIgJGlmcmFtZSA9ICQoJzxpZnJhbWUgd2lkdGg9XCInICsgc2l6ZS53aWR0aCArICdcIiBoZWlnaHQ9XCInICsgc2l6ZS5oZWlnaHQgKyAnXCIgc3R5bGU9XCJib3JkZXI6bm9uZTtcIj48L2lmcmFtZT4nKTtcclxuICAgIHZhciBpZnJhbWUgPSAkaWZyYW1lLmdldCgwKTtcclxuICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyByZWFkeVxyXG4gICAgdmFyIGlmcmFtZWxvYWRlZCA9IGZhbHNlO1xyXG4gICAgaWZyYW1lLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBVc2luZyBpZnJhbWVsb2FkZWQgdG8gYXZvaWQgaW5maW5pdGUgbG9vcHNcclxuICAgICAgICBpZiAoIWlmcmFtZWxvYWRlZCkge1xyXG4gICAgICAgICAgICBpZnJhbWVsb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgY29udGVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiAkaWZyYW1lO1xyXG59O1xyXG5cclxuLyogUHV0cyBmdWxsIGh0bWwgaW5zaWRlIHRoZSBpZnJhbWUgZWxlbWVudCBwYXNzZWQgaW4gYSBzZWN1cmUgYW5kIGNvbXBsaWFudCBtb2RlICovXHJcbmZ1bmN0aW9uIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBodG1sKSB7XHJcbiAgICAvLyBwdXQgYWpheCBkYXRhIGluc2lkZSBpZnJhbWUgcmVwbGFjaW5nIGFsbCB0aGVpciBodG1sIGluIHNlY3VyZSBcclxuICAgIC8vIGNvbXBsaWFudCBtb2RlICgkLmh0bWwgZG9uJ3Qgd29ya3MgdG8gaW5qZWN0IDxodG1sPjxoZWFkPiBjb250ZW50KVxyXG5cclxuICAgIC8qIGRvY3VtZW50IEFQSSB2ZXJzaW9uIChwcm9ibGVtcyB3aXRoIElFLCBkb24ndCBleGVjdXRlIGlmcmFtZS1odG1sIHNjcmlwdHMpICovXHJcbiAgICAvKnZhciBpZnJhbWVEb2MgPVxyXG4gICAgLy8gVzNDIGNvbXBsaWFudDogbnMsIGZpcmVmb3gtZ2Vja28sIGNocm9tZS9zYWZhcmktd2Via2l0LCBvcGVyYSwgaWU5XHJcbiAgICBpZnJhbWUuY29udGVudERvY3VtZW50IHx8XHJcbiAgICAvLyBvbGQgSUUgKDUuNSspXHJcbiAgICAoaWZyYW1lLmNvbnRlbnRXaW5kb3cgPyBpZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudCA6IG51bGwpIHx8XHJcbiAgICAvLyBmYWxsYmFjayAodmVyeSBvbGQgSUU/KVxyXG4gICAgZG9jdW1lbnQuZnJhbWVzW2lmcmFtZS5pZF0uZG9jdW1lbnQ7XHJcbiAgICBpZnJhbWVEb2Mub3BlbigpO1xyXG4gICAgaWZyYW1lRG9jLndyaXRlKGh0bWwpO1xyXG4gICAgaWZyYW1lRG9jLmNsb3NlKCk7Ki9cclxuXHJcbiAgICAvKiBqYXZhc2NyaXB0IFVSSSB2ZXJzaW9uICh3b3JrcyBmaW5lIGV2ZXJ5d2hlcmUhKSAqL1xyXG4gICAgaWZyYW1lLmNvbnRlbnRXaW5kb3cuY29udGVudHMgPSBodG1sO1xyXG4gICAgaWZyYW1lLnNyYyA9ICdqYXZhc2NyaXB0OndpbmRvd1tcImNvbnRlbnRzXCJdJztcclxuXHJcbiAgICAvLyBBYm91dCB0aGlzIHRlY2huaXF1ZSwgdGhpcyBodHRwOi8vc3BhcmVjeWNsZXMud29yZHByZXNzLmNvbS8yMDEyLzAzLzA4L2luamVjdC1jb250ZW50LWludG8tYS1uZXctaWZyYW1lL1xyXG59XHJcblxyXG4iLCIvKiBDUlVETCBIZWxwZXIgKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG52YXIgZ2V0VGV4dCA9IHJlcXVpcmUoJy4vZ2V0VGV4dCcpO1xyXG52YXIgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcblxyXG5leHBvcnRzLmRlZmF1bHRTZXR0aW5ncyA9IHtcclxuICBlZmZlY3RzOiB7XHJcbiAgICAnc2hvdy12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdoaWRlLXZpZXdlcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LFxyXG4gICAgJ3Nob3ctZWRpdG9yJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sIC8vIHRoZSBzYW1lIGFzIGpxdWVyeS11aSB7IGVmZmVjdDogJ3NsaWRlJywgZHVyYXRpb246ICdzbG93JywgZGlyZWN0aW9uOiAnZG93bicgfVxyXG4gICAgJ2hpZGUtZWRpdG9yJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH1cclxuICB9LFxyXG4gIGV2ZW50czoge1xyXG4gICAgJ2VkaXQtZW5kcyc6ICdjcnVkbC1lZGl0LWVuZHMnLFxyXG4gICAgJ2VkaXQtc3RhcnRzJzogJ2NydWRsLWVkaXQtc3RhcnRzJyxcclxuICAgICdlZGl0b3ItcmVhZHknOiAnY3J1ZGwtZWRpdG9yLXJlYWR5JyxcclxuICAgICdlZGl0b3Itc2hvd2VkJzogJ2NydWRsLWVkaXRvci1zaG93ZWQnLFxyXG4gICAgJ2NyZWF0ZSc6ICdjcnVkbC1jcmVhdGUnLFxyXG4gICAgJ3VwZGF0ZSc6ICdjcnVkbC11cGRhdGUnLFxyXG4gICAgJ2RlbGV0ZSc6ICdjcnVkbC1kZWxldGUnXHJcbiAgfSxcclxuICBkYXRhOiB7XHJcbiAgICAnZm9jdXMtY2xvc2VzdCc6IHtcclxuICAgICAgbmFtZTogJ2NydWRsLWZvY3VzLWNsb3Nlc3QnLFxyXG4gICAgICAnZGVmYXVsdCc6ICcqJ1xyXG4gICAgfSxcclxuICAgICdmb2N1cy1tYXJnaW4nOiB7XHJcbiAgICAgIG5hbWU6ICdjcnVkbC1mb2N1cy1tYXJnaW4nLFxyXG4gICAgICAnZGVmYXVsdCc6IDBcclxuICAgIH0sXHJcbiAgICAnZm9jdXMtZHVyYXRpb24nOiB7XHJcbiAgICAgIG5hbWU6ICdjcnVkbC1mb2N1cy1kdXJhdGlvbicsXHJcbiAgICAgICdkZWZhdWx0JzogMjAwXHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgVXRpbGl0eSB0byBnZXQgYSBkYXRhIHZhbHVlIG9yIHRoZSBkZWZhdWx0IGJhc2VkIG9uIHRoZSBpbnN0YW5jZVxyXG4gIHNldHRpbmdzIG9uIHRoZSBnaXZlbiBlbGVtZW50XHJcbioqL1xyXG5mdW5jdGlvbiBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGVsLCBzZXR0aW5nTmFtZSkge1xyXG4gIHZhclxyXG4gICAgc2V0dGluZyA9IGluc3RhbmNlLnNldHRpbmdzLmRhdGFbc2V0dGluZ05hbWVdLFxyXG4gICAgdmFsID0gZWwuZGF0YShzZXR0aW5nLm5hbWUpIHx8IHNldHRpbmdbJ2RlZmF1bHQnXTtcclxuICByZXR1cm4gdmFsO1xyXG59XHJcblxyXG5leHBvcnRzLnNldHVwID0gZnVuY3Rpb24gc2V0dXBDcnVkbChvblN1Y2Nlc3MsIG9uRXJyb3IsIG9uQ29tcGxldGUpIHtcclxuICByZXR1cm4ge1xyXG4gICAgb246IGZ1bmN0aW9uIG9uKHNlbGVjdG9yLCBzZXR0aW5ncykge1xyXG4gICAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8ICcuY3J1ZGwnO1xyXG4gICAgICB2YXIgaW5zdGFuY2UgPSB7XHJcbiAgICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxyXG4gICAgICAgIGVsZW1lbnRzOiAkKHNlbGVjdG9yKVxyXG4gICAgICB9O1xyXG4gICAgICAvLyBFeHRlbmRpbmcgZGVmYXVsdCBzZXR0aW5ncyB3aXRoIHByb3ZpZGVkIG9uZXMsXHJcbiAgICAgIC8vIGJ1dCBzb21lIGNhbiBiZSB0d2VhayBvdXRzaWRlIHRvby5cclxuICAgICAgaW5zdGFuY2Uuc2V0dGluZ3MgPSAkLmV4dGVuZCh0cnVlLCBleHBvcnRzLmRlZmF1bHRTZXR0aW5ncywgc2V0dGluZ3MpO1xyXG4gICAgICBpbnN0YW5jZS5lbGVtZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3J1ZGwgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmIChjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nKSA9PT0gdHJ1ZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBkY3R4ID0gY3J1ZGwuZGF0YSgnY3J1ZGwtY29udGV4dCcpIHx8ICcnO1xyXG4gICAgICAgIHZhciB2d3IgPSBjcnVkbC5maW5kKCcuY3J1ZGwtdmlld2VyJyk7XHJcbiAgICAgICAgdmFyIGR0ciA9IGNydWRsLmZpbmQoJy5jcnVkbC1lZGl0b3InKTtcclxuICAgICAgICB2YXIgaWlkcGFyID0gY3J1ZGwuZGF0YSgnY3J1ZGwtaXRlbS1pZC1wYXJhbWV0ZXInKSB8fCAnSXRlbUlEJztcclxuICAgICAgICB2YXIgZm9ybXBhcnMgPSB7IGFjdGlvbjogJ2NyZWF0ZScgfTtcclxuICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gMDtcclxuICAgICAgICB2YXIgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRFeHRyYVF1ZXJ5KGVsKSB7XHJcbiAgICAgICAgICAvLyBHZXQgZXh0cmEgcXVlcnkgb2YgdGhlIGVsZW1lbnQsIGlmIGFueTpcclxuICAgICAgICAgIHZhciB4cSA9IGVsLmRhdGEoJ2NydWRsLWV4dHJhLXF1ZXJ5JykgfHwgJyc7XHJcbiAgICAgICAgICBpZiAoeHEpIHhxID0gJyYnICsgeHE7XHJcbiAgICAgICAgICAvLyBJdGVyYXRlIGFsbCBwYXJlbnRzIGluY2x1ZGluZyB0aGUgJ2NydWRsJyBlbGVtZW50IChwYXJlbnRzVW50aWwgZXhjbHVkZXMgdGhlIGZpcnN0IGVsZW1lbnQgZ2l2ZW4sXHJcbiAgICAgICAgICAvLyBiZWNhdXNlIG9mIHRoYXQgd2UgZ2V0IGl0cyBwYXJlbnQoKSlcclxuICAgICAgICAgIC8vIEZvciBhbnkgb2YgdGhlbSB3aXRoIGFuIGV4dHJhLXF1ZXJ5LCBhcHBlbmQgaXQ6XHJcbiAgICAgICAgICBlbC5wYXJlbnRzVW50aWwoY3J1ZGwucGFyZW50KCksICdbZGF0YS1jcnVkbC1leHRyYS1xdWVyeV0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHggPSAkKHRoaXMpLmRhdGEoJ2NydWRsLWV4dHJhLXF1ZXJ5Jyk7XHJcbiAgICAgICAgICAgIGlmICh4KSB4cSArPSAnJicgKyB4O1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXR1cm4geHE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjcnVkbC5maW5kKCcuY3J1ZGwtY3JlYXRlJykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IDA7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAnY3JlYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pXHJcbiAgICAgICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgLy8gSGlkZSB2aWV3ZXIgd2hlbiBpbiBlZGl0b3I6XHJcbiAgICAgICAgICB2d3IueGhpZGUoaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS12aWV3ZXInXSk7XHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddKVxyXG4gICAgICAgICAgLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzLmNyZWF0ZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2d3JcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC11cGRhdGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGl0ZW0gPSAkdC5jbG9zZXN0KCcuY3J1ZGwtaXRlbScpO1xyXG4gICAgICAgICAgdmFyIGl0ZW1pZCA9IGl0ZW0uZGF0YSgnY3J1ZGwtaXRlbS1pZCcpO1xyXG4gICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IGl0ZW1pZDtcclxuICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICd1cGRhdGUnO1xyXG4gICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgIGR0ci5yZWxvYWQoe1xyXG4gICAgICAgICAgICB1cmw6IGZ1bmN0aW9uICh1cmwsIGRlZmF1bHRVcmwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdFVybCArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBkdHIueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy1lZGl0b3InXSlcclxuICAgICAgICAgICAgICAucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgW2R0cl0pO1xyXG4gICAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBIaWRlIHZpZXdlciB3aGVuIGluIGVkaXRvcjpcclxuICAgICAgICAgIHZ3ci54aGlkZShpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLXZpZXdlciddKTtcclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10pXHJcbiAgICAgICAgICAudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHMudXBkYXRlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1kZWxldGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGl0ZW0gPSAkdC5jbG9zZXN0KCcuY3J1ZGwtaXRlbScpO1xyXG4gICAgICAgICAgdmFyIGl0ZW1pZCA9IGl0ZW0uZGF0YSgnY3J1ZGwtaXRlbS1pZCcpO1xyXG5cclxuICAgICAgICAgIGlmIChjb25maXJtKGdldFRleHQoJ2NvbmZpcm0tZGVsZXRlLWNydWRsLWl0ZW0tbWVzc2FnZTonICsgZGN0eCkpKSB7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJzxkaXY+JyArIGdldFRleHQoJ2RlbGV0ZS1jcnVkbC1pdGVtLWxvYWRpbmctbWVzc2FnZTonICsgZGN0eCkgKyAnPC9kaXY+JywgaXRlbSk7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICdkZWxldGUnO1xyXG4gICAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgIHVybDogZHRyLmF0dHIoJ2RhdGEtc291cmNlLXVybCcpICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cSxcclxuICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBkYXRhLlJlc3VsdCArICc8L2Rpdj4nLCBpdGVtLCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2FibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZhZGVPdXQoJ3Nsb3cnLCBmdW5jdGlvbiAoKSB7IGl0ZW0ucmVtb3ZlKCk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgb25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAgICAgICAgICAgICBvbkVycm9yKGp4LCBtZXNzYWdlLCBleCk7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZShpdGVtKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNvbXBsZXRlOiBvbkNvbXBsZXRlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2RlbGV0ZSddKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmlzaEVkaXQoKSB7XHJcbiAgICAgICAgICBmdW5jdGlvbiBvbmNvbXBsZXRlKGFub3RoZXJPbkNvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgLy8gU2hvdyBhZ2FpbiB0aGUgVmlld2VyXHJcbiAgICAgICAgICAgICAgLy92d3Iuc2xpZGVEb3duKCdzbG93Jyk7XHJcbiAgICAgICAgICAgICAgaWYgKCF2d3IuaXMoJzp2aXNpYmxlJykpXHJcbiAgICAgICAgICAgICAgICB2d3IueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSk7XHJcbiAgICAgICAgICAgICAgLy8gTWFyayB0aGUgZm9ybSBhcyB1bmNoYW5nZWQgdG8gYXZvaWQgcGVyc2lzdGluZyB3YXJuaW5nc1xyXG4gICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuICAgICAgICAgICAgICAvLyBBdm9pZCBjYWNoZWQgY29udGVudCBvbiB0aGUgRWRpdG9yXHJcbiAgICAgICAgICAgICAgZHRyLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFNjcm9sbCB0byBwcmVzZXJ2ZSBjb3JyZWN0IGZvY3VzIChvbiBsYXJnZSBwYWdlcyB3aXRoIHNoYXJlZCBjb250ZW50IHVzZXIgY2FuIGdldFxyXG4gICAgICAgICAgICAgIC8vIGxvc3QgYWZ0ZXIgYW4gZWRpdGlvbilcclxuICAgICAgICAgICAgICAvLyAod2UgcXVldWUgYWZ0ZXIgdndyLnhzaG93IGJlY2F1c2Ugd2UgbmVlZCB0byBkbyBpdCBhZnRlciB0aGUgeHNob3cgZmluaXNoKVxyXG4gICAgICAgICAgICAgIHZ3ci5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNDbG9zZXN0ID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLWNsb3Nlc3QnKTtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c0VsZW1lbnQgPSBjcnVkbC5jbG9zZXN0KGZvY3VzQ2xvc2VzdCk7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBubyBjbG9zZXN0LCBnZXQgdGhlIGNydWRsXHJcbiAgICAgICAgICAgICAgICBpZiAoZm9jdXNFbGVtZW50Lmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgZm9jdXNFbGVtZW50ID0gY3J1ZGw7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNNYXJnaW4gPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtbWFyZ2luJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNEdXJhdGlvbiA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1kdXJhdGlvbicpO1xyXG5cclxuICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGZvY3VzRWxlbWVudCwgeyBtYXJnaW5Ub3A6IGZvY3VzTWFyZ2luLCBkdXJhdGlvbjogZm9jdXNEdXJhdGlvbiB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB2d3IuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAvLyB1c2VyIGNhbGxiYWNrOlxyXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgKGFub3RoZXJPbkNvbXBsZXRlKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgIGFub3RoZXJPbkNvbXBsZXRlLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gV2UgbmVlZCBhIGN1c3RvbSBjb21wbGV0ZSBjYWxsYmFjaywgYnV0IHRvIG5vdCByZXBsYWNlIHRoZSB1c2VyIGNhbGxiYWNrLCB3ZVxyXG4gICAgICAgICAgLy8gY2xvbmUgZmlyc3QgdGhlIHNldHRpbmdzIGFuZCB0aGVuIGFwcGx5IG91ciBjYWxsYmFjayB0aGF0IGludGVybmFsbHkgd2lsbCBjYWxsXHJcbiAgICAgICAgICAvLyB0aGUgdXNlciBjYWxsYmFjayBwcm9wZXJseSAoaWYgYW55KVxyXG4gICAgICAgICAgdmFyIHdpdGhjYWxsYmFjayA9ICQuZXh0ZW5kKHRydWUsIHt9LCBpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLWVkaXRvciddKTtcclxuICAgICAgICAgIHdpdGhjYWxsYmFjay5jb21wbGV0ZSA9IG9uY29tcGxldGUod2l0aGNhbGxiYWNrLmNvbXBsZXRlKTtcclxuICAgICAgICAgIC8vIEhpZGluZyBlZGl0b3I6XHJcbiAgICAgICAgICBkdHIueGhpZGUod2l0aGNhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgICAvLyBNYXJrIGZvcm0gYXMgc2F2ZWQgdG8gcmVtb3ZlIHRoZSAnaGFzLWNoYW5nZXMnIG1hcmtcclxuICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZHRyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtY2FuY2VsJywgZmluaXNoRWRpdClcclxuICAgICAgICAub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCAnLmFqYXgtYm94JywgZmluaXNoRWRpdClcclxuICAgICAgICAub24oJ2FqYXhTdWNjZXNzUG9zdCcsICdmb3JtLCBmaWVsZHNldCcsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwIHx8IGRhdGEuQ29kZSA9PSA1IHx8IGRhdGEuQ29kZSA9PSA2KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgdmlld2VyIGFuZCByZWxvYWQgbGlzdDpcclxuICAgICAgICAgICAgdndyLmZpbmQoJy5jcnVkbC1saXN0JykucmVsb2FkKHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEEgc21hbGwgZGVsYXkgdG8gbGV0IHVzZXIgdG8gc2VlIHRoZSBuZXcgbWVzc2FnZSBvbiBidXR0b24gYmVmb3JlXHJcbiAgICAgICAgICAvLyBoaWRlIGl0IChiZWNhdXNlIGlzIGluc2lkZSB0aGUgZWRpdG9yKVxyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PSA1KVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZpbmlzaEVkaXQsIDEwMDApO1xyXG5cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybSxmaWVsZHNldCcsIGZ1bmN0aW9uIChqYiwgZm9ybSwgangpIHtcclxuICAgICAgICAgIC8vIEVtaXQgdGhlICdlZGl0b3ItcmVhZHknIGV2ZW50IG9uIGVkaXRvciBIdG1sIGJlaW5nIHJlcGxhY2VkXHJcbiAgICAgICAgICAvLyAoZmlyc3QgbG9hZCBvciBuZXh0IGxvYWRzIGJlY2F1c2Ugb2Ygc2VydmVyLXNpZGUgdmFsaWRhdGlvbiBlcnJvcnMpXHJcbiAgICAgICAgICAvLyB0byBhbGxvdyBsaXN0ZW5lcnMgdG8gZG8gYW55IHdvcmsgb3ZlciBpdHMgKG5ldykgRE9NIGVsZW1lbnRzLlxyXG4gICAgICAgICAgLy8gVGhlIHNlY29uZCBjdXN0b20gcGFyYW1ldGVyIHBhc3NlZCBtZWFucyBpcyBtZWFuIHRvXHJcbiAgICAgICAgICAvLyBkaXN0aW5ndWlzaCB0aGUgZmlyc3QgdGltZSBjb250ZW50IGxvYWQgYW5kIHN1Y2Nlc3NpdmUgdXBkYXRlcyAoZHVlIHRvIHZhbGlkYXRpb24gZXJyb3JzKS5cclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgW2R0ciwgZWRpdG9ySW5pdGlhbExvYWRdKTtcclxuXHJcbiAgICAgICAgICAvLyBOZXh0IHRpbWVzOlxyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3J1ZGwuZGF0YSgnX19jcnVkbF9pbml0aWFsaXplZF9fJywgdHJ1ZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIGluc3RhbmNlO1xyXG4gICAgfVxyXG4gIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gIFRoaXMgbW9kdWxlIGhhcyB1dGlsaXRpZXMgdG8gY29udmVydCBhIERhdGUgb2JqZWN0IGludG9cclxuICBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBmb2xsb3dpbmcgSVNPLTg2MDEgc3BlY2lmaWNhdGlvbi5cclxuICBcclxuICBJTkNPTVBMRVRFIEJVVCBVU0VGVUwuXHJcbiAgXHJcbiAgU3RhbmRhcmQgcmVmZXJzIHRvIGZvcm1hdCB2YXJpYXRpb25zOlxyXG4gIC0gYmFzaWM6IG1pbmltdW0gc2VwYXJhdG9yc1xyXG4gIC0gZXh0ZW5kZWQ6IGFsbCBzZXBhcmF0b3JzLCBtb3JlIHJlYWRhYmxlXHJcbiAgQnkgZGVmYXVsdCwgYWxsIG1ldGhvZHMgcHJpbnRzIHRoZSBiYXNpYyBmb3JtYXQsXHJcbiAgZXhjZXB0cyB0aGUgcGFyYW1ldGVyICdleHRlbmRlZCcgaXMgc2V0IHRvIHRydWVcclxuXHJcbiAgVE9ETzpcclxuICAtIFRaOiBhbGxvdyBmb3IgVGltZSBab25lIHN1ZmZpeGVzIChwYXJzZSBhbGxvdyBpdCBhbmQgXHJcbiAgICBkZXRlY3QgVVRDIGJ1dCBkbyBub3RoaW5nIHdpdGggYW55IHRpbWUgem9uZSBvZmZzZXQgZGV0ZWN0ZWQpXHJcbiAgLSBGcmFjdGlvbnMgb2Ygc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy5kYXRlVVRDID0gZnVuY3Rpb24gZGF0ZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBtID0gKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgIGQgPSBkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpLFxyXG4gICAgICB5ID0gZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcbiAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICBkID0gJzAnICsgZDtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIHkgKyAnLScgKyBtICsgJy0nICsgZDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4geSArIG0gKyBkO1xyXG59O1xyXG5cclxuZXhwb3J0cy5kYXRlTG9jYWwgPSBmdW5jdGlvbiBkYXRlTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgbSA9IChkYXRlLmdldE1vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICBkID0gZGF0ZS5nZXREYXRlKCkudG9TdHJpbmcoKSxcclxuICAgICAgeSA9IGRhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcbiAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICBkID0gJzAnICsgZDtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIHkgKyAnLScgKyBtICsgJy0nICsgZDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4geSArIG0gKyBkO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMsIG1pbnV0ZXMgYW5kIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMudGltZUxvY2FsID0gZnVuY3Rpb24gdGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIHMgPSBkYXRlLmdldFNlY29uZHMoKS50b1N0cmluZygpLFxyXG4gICAgICBobSA9IGV4cG9ydHMuc2hvcnRUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAocy5sZW5ndGggPT0gMSlcclxuICAgIHMgPSAnMCcgKyBzO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaG0gKyAnOicgKyBzO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBobSArIHM7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycywgbWludXRlcyBhbmQgc2Vjb25kcyBVVENcclxuKiovXHJcbmV4cG9ydHMudGltZVVUQyA9IGZ1bmN0aW9uIHRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgcyA9IGRhdGUuZ2V0VVRDU2Vjb25kcygpLnRvU3RyaW5nKCksXHJcbiAgICAgIGhtID0gZXhwb3J0cy5zaG9ydFRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAocy5sZW5ndGggPT0gMSlcclxuICAgIHMgPSAnMCcgKyBzO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaG0gKyAnOicgKyBzO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBobSArIHM7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycyBhbmQgbWludXRlc1xyXG4qKi9cclxuZXhwb3J0cy5zaG9ydFRpbWVMb2NhbCA9IGZ1bmN0aW9uIHNob3J0VGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIGggPSBkYXRlLmdldEhvdXJzKCkudG9TdHJpbmcoKSxcclxuICAgICAgbSA9IGRhdGUuZ2V0TWludXRlcygpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChoLmxlbmd0aCA9PSAxKVxyXG4gICAgaCA9ICcwJyArIGg7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGggKyAnOicgKyBtO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBoICsgbTtcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzIGFuZCBtaW51dGVzIFVUQ1xyXG4qKi9cclxuZXhwb3J0cy5zaG9ydFRpbWVVVEMgPSBmdW5jdGlvbiBzaG9ydFRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgaCA9IGRhdGUuZ2V0VVRDSG91cnMoKS50b1N0cmluZygpLFxyXG4gICAgICBtID0gZGF0ZS5nZXRVVENNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKGgubGVuZ3RoID09IDEpXHJcbiAgICBoID0gJzAnICsgaDtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaCArICc6JyArIG07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGggKyBtO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgVE9ETzogSG91cnMsIG1pbnV0ZXMsIHNlY29uZHMgYW5kIGZyYWN0aW9ucyBvZiBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLmxvbmdUaW1lTG9jYWwgPSBmdW5jdGlvbiBsb25nVGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgLy9UT0RPXHJcbn07XHJcblxyXG4vKipcclxuICBVVEMgRGF0ZSBhbmQgVGltZSBzZXBhcmF0ZWQgYnkgVC5cclxuICBTdGFuZGFyZCBhbGxvd3Mgb21pdCB0aGUgc2VwYXJhdG9yIGFzIGV4Y2VwdGlvbmFsLCBib3RoIHBhcnRzIGFncmVlbWVudCwgY2FzZXM7XHJcbiAgY2FuIGJlIGRvbmUgcGFzc2luZyB0cnVlIGFzIG9mIG9taXRTZXBhcmF0b3IgcGFyYW1ldGVyLCBieSBkZWZhdWx0IGZhbHNlLlxyXG4qKi9cclxuZXhwb3J0cy5kYXRldGltZUxvY2FsID0gZnVuY3Rpb24gZGF0ZXRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCwgb21pdFNlcGFyYXRvcikge1xyXG4gIHZhciBkID0gZXhwb3J0cy5kYXRlTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpLFxyXG4gICAgICB0ID0gZXhwb3J0cy50aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAob21pdFNlcGFyYXRvcilcclxuICAgIHJldHVybiBkICsgdDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZCArICdUJyArIHQ7XHJcbn07XHJcblxyXG4vKipcclxuICBMb2NhbCBEYXRlIGFuZCBUaW1lIHNlcGFyYXRlZCBieSBULlxyXG4gIFN0YW5kYXJkIGFsbG93cyBvbWl0IHRoZSBzZXBhcmF0b3IgYXMgZXhjZXB0aW9uYWwsIGJvdGggcGFydHMgYWdyZWVtZW50LCBjYXNlcztcclxuICBjYW4gYmUgZG9uZSBwYXNzaW5nIHRydWUgYXMgb2Ygb21pdFNlcGFyYXRvciBwYXJhbWV0ZXIsIGJ5IGRlZmF1bHQgZmFsc2UuXHJcbioqL1xyXG5leHBvcnRzLmRhdGV0aW1lVVRDID0gZnVuY3Rpb24gZGF0ZXRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQsIG9taXRTZXBhcmF0b3IpIHtcclxuICB2YXIgZCA9IGV4cG9ydHMuZGF0ZVVUQyhkYXRlLCBleHRlbmRlZCksXHJcbiAgICAgIHQgPSBleHBvcnRzLnRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAob21pdFNlcGFyYXRvcilcclxuICAgIHJldHVybiBkICsgdDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZCArICdUJyArIHQ7XHJcbn07XHJcblxyXG4vKipcclxuICBQYXJzZSBhIHN0cmluZyBpbnRvIGEgRGF0ZSBvYmplY3QgaWYgaXMgYSB2YWxpZCBJU08tODYwMSBmb3JtYXQuXHJcbiAgUGFyc2Ugc2luZ2xlIGRhdGUsIHNpbmdsZSB0aW1lIG9yIGRhdGUtdGltZSBmb3JtYXRzLlxyXG4gIElNUE9SVEFOVDogSXQgZG9lcyBOT1QgY29udmVydCBiZXR3ZWVuIHRoZSBkYXRlc3RyIFRpbWVab25lIGFuZCB0aGVcclxuICBsb2NhbCBUaW1lWm9uZSAoZWl0aGVyIGl0IGFsbG93cyBkYXRlc3RyIHRvIGluY2x1ZGVkIFRpbWVab25lIGluZm9ybWF0aW9uKVxyXG4gIFRPRE86IE9wdGlvbmFsIFQgc2VwYXJhdG9yIGlzIG5vdCBhbGxvd2VkLlxyXG4gIFRPRE86IE1pbGxpc2Vjb25kcy9mcmFjdGlvbnMgb2Ygc2Vjb25kcyBub3Qgc3VwcG9ydGVkXHJcbioqL1xyXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UoZGF0ZXN0cikge1xyXG4gIHZhciBkdCA9IGRhdGVzdHIuc3BsaXQoJ1QnKSxcclxuICAgIGRhdGUgPSBkdFswXSxcclxuICAgIHRpbWUgPSBkdC5sZW5ndGggPT0gMiA/IGR0WzFdIDogbnVsbDtcclxuXHJcbiAgaWYgKGR0Lmxlbmd0aCA+IDIpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgZm9ybWF0XCIpO1xyXG5cclxuICAvLyBDaGVjayBpZiBkYXRlIGNvbnRhaW5zIGEgdGltZTtcclxuICAvLyBiZWNhdXNlIG1heWJlIGRhdGVzdHIgaXMgb25seSB0aGUgdGltZSBwYXJ0XHJcbiAgaWYgKC86fF5cXGR7NCw2fVteXFwtXShcXC5cXGQqKT8oPzpafFsrXFwtXS4qKT8kLy50ZXN0KGRhdGUpKSB7XHJcbiAgICB0aW1lID0gZGF0ZTtcclxuICAgIGRhdGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgdmFyIHksIG0sIGQsIGgsIG1tLCBzLCB0eiwgdXRjO1xyXG5cclxuICBpZiAoZGF0ZSkge1xyXG4gICAgdmFyIGRwYXJ0cyA9IC8oXFxkezR9KVxcLT8oXFxkezJ9KVxcLT8oXFxkezJ9KS8uZXhlYyhkYXRlKTtcclxuICAgIGlmICghZHBhcnRzKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgZGF0ZSBmb3JtYXRcIik7XHJcblxyXG4gICAgeSA9IGRwYXJ0c1sxXTtcclxuICAgIG0gPSBkcGFydHNbMl07XHJcbiAgICBkID0gZHBhcnRzWzNdO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRpbWUpIHtcclxuICAgIHZhciB0cGFydHMgPSAvKFxcZHsyfSk6PyhcXGR7Mn0pKD86Oj8oXFxkezJ9KSk/KFp8WytcXC1dLiopPy8uZXhlYyh0aW1lKTtcclxuICAgIGlmICghdHBhcnRzKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgdGltZSBmb3JtYXRcIik7XHJcblxyXG4gICAgaCA9IHRwYXJ0c1sxXTtcclxuICAgIG1tID0gdHBhcnRzWzJdO1xyXG4gICAgcyA9IHRwYXJ0cy5sZW5ndGggPiAzID8gdHBhcnRzWzNdIDogbnVsbDtcclxuICAgIHR6ID0gdHBhcnRzLmxlbmd0aCA+IDQgPyB0cGFydHNbNF0gOiBudWxsO1xyXG4gICAgLy8gRGV0ZWN0cyBpZiBpcyBhIHRpbWUgaW4gVVRDOlxyXG4gICAgdXRjID0gL15aJC9pLnRlc3QodHopO1xyXG4gIH1cclxuXHJcbiAgLy8gVmFyIHRvIGhvbGQgdGhlIHBhcnNlZCB2YWx1ZSwgd2Ugc3RhcnQgd2l0aCB0b2RheSxcclxuICAvLyB0aGF0IHdpbGwgZmlsbCB0aGUgbWlzc2luZyBwYXJ0c1xyXG4gIHZhciBwYXJzZWREYXRlID0gbmV3IERhdGUoKTtcclxuXHJcbiAgaWYgKGRhdGUpIHtcclxuICAgIC8vIFVwZGF0aW5nIHRoZSBkYXRlIG9iamVjdCB3aXRoIGVhY2ggeWVhciwgbW9udGggYW5kIGRhdGUvZGF5IGRldGVjdGVkOlxyXG4gICAgaWYgKHV0YylcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRVVENGdWxsWWVhcih5LCBtLCBkKTtcclxuICAgIGVsc2VcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRGdWxsWWVhcih5LCBtLCBkKTtcclxuICB9XHJcblxyXG4gIGlmICh0aW1lKSB7XHJcbiAgICBpZiAodXRjKVxyXG4gICAgICBwYXJzZWREYXRlLnNldFVUQ0hvdXJzKGgsIG1tLCBzKTtcclxuICAgIGVsc2VcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRIb3VycyhoLCBtbSwgcyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGFyc2VkRGF0ZTtcclxufTsiLCIvKiBEYXRlIHBpY2tlciBpbml0aWFsaXphdGlvbiBhbmQgdXNlXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwRGF0ZVBpY2tlcigpIHtcclxuICAgIC8vIERhdGUgUGlja2VyXHJcbiAgICAkLmRhdGVwaWNrZXIuc2V0RGVmYXVsdHMoJC5kYXRlcGlja2VyLnJlZ2lvbmFsWyQoJ2h0bWwnKS5hdHRyKCdsYW5nJyldKTtcclxuICAgICQoJy5kYXRlLXBpY2snLCBkb2N1bWVudCkuZGF0ZXBpY2tlcih7XHJcbiAgICAgICAgc2hvd0FuaW06ICdibGluZCdcclxuICAgIH0pO1xyXG4gICAgYXBwbHlEYXRlUGlja2VyKCk7XHJcbn1cclxuZnVuY3Rpb24gYXBwbHlEYXRlUGlja2VyKGVsZW1lbnQpIHtcclxuICAgICQoXCIuZGF0ZS1waWNrXCIsIGVsZW1lbnQgfHwgZG9jdW1lbnQpXHJcbiAgICAvLy52YWwobmV3IERhdGUoKS5hc1N0cmluZygkLmRhdGVwaWNrZXIuX2RlZmF1bHRzLmRhdGVGb3JtYXQpKVxyXG4gICAgLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIHNob3dBbmltOiBcImJsaW5kXCJcclxuICAgIH0pO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBzZXR1cERhdGVQaWNrZXIsXHJcbiAgICAgICAgYXBwbHk6IGFwcGx5RGF0ZVBpY2tlclxyXG4gICAgfTtcclxuIiwiLyogRm9ybWF0IGEgZGF0ZSBhcyBZWVlZLU1NLUREIGluIFVUQyBmb3Igc2F2ZSB1c1xyXG4gICAgdG8gaW50ZXJjaGFuZ2Ugd2l0aCBvdGhlciBtb2R1bGVzIG9yIGFwcHMuXHJcbiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nKGRhdGUpIHtcclxuICAgIHZhciBtID0gKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgICAgZCA9IGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCk7XHJcbiAgICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgICAgICBtID0gJzAnICsgbTtcclxuICAgIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgIGQgPSAnMCcgKyBkO1xyXG4gICAgcmV0dXJuIGRhdGUuZ2V0VVRDRnVsbFllYXIoKS50b1N0cmluZygpICsgJy0nICsgbSArICctJyArIGQ7XHJcbn07IiwiLyoqIEFuIGkxOG4gdXRpbGl0eSwgZ2V0IGEgdHJhbnNsYXRpb24gdGV4dCBieSBsb29raW5nIGZvciBzcGVjaWZpYyBlbGVtZW50cyBpbiB0aGUgaHRtbFxyXG53aXRoIHRoZSBuYW1lIGdpdmVuIGFzIGZpcnN0IHBhcmFtZW50ZXIgYW5kIGFwcGx5aW5nIHRoZSBnaXZlbiB2YWx1ZXMgb24gc2Vjb25kIGFuZCBcclxub3RoZXIgcGFyYW1ldGVycy5cclxuICAgIFRPRE86IFJFLUlNUExFTUVOVCBub3QgdXNpbmcgalF1ZXJ5IG5lbHNlIERPTSBlbGVtZW50cywgb3IgYWxtb3N0IG5vdCBlbGVtZW50cyBpbnNpZGUgYm9keVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbmZ1bmN0aW9uIGdldFRleHQoKSB7XHJcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgIC8vIEdldCBrZXkgYW5kIHRyYW5zbGF0ZSBpdFxyXG4gICAgdmFyIGZvcm1hdHRlZCA9IGFyZ3NbMF07XHJcbiAgICB2YXIgdGV4dCA9ICQoJyNsY3Jlcy0nICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShmb3JtYXR0ZWQpKS50ZXh0KCk7XHJcbiAgICBpZiAodGV4dClcclxuICAgICAgICBmb3JtYXR0ZWQgPSB0ZXh0O1xyXG4gICAgLy8gQXBwbHkgZm9ybWF0IHRvIHRoZSB0ZXh0IHdpdGggYWRkaXRpb25hbCBwYXJhbWV0ZXJzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXFxcXHsnICsgaSArICdcXFxcfScsICdnaScpO1xyXG4gICAgICAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5yZXBsYWNlKHJlZ2V4cCwgYXJnc1tpICsgMV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZvcm1hdHRlZDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRUZXh0OyIsIi8qKiBSZXR1cm5zIHRoZSBwYXRoIHRvIHRoZSBnaXZlbiBlbGVtZW50IGluIFhQYXRoIGNvbnZlbnRpb25cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBnZXRYUGF0aChlbGVtZW50KSB7XHJcbiAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50LmlkKVxyXG4gICAgICAgIHJldHVybiAnLy8qW0BpZD1cIicgKyBlbGVtZW50LmlkICsgJ1wiXSc7XHJcbiAgICB2YXIgeHBhdGggPSAnJztcclxuICAgIGZvciAoOyBlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUgPT0gMTsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgIHZhciBpZCA9ICQoZWxlbWVudC5wYXJlbnROb2RlKS5jaGlsZHJlbihlbGVtZW50LnRhZ05hbWUpLmluZGV4KGVsZW1lbnQpICsgMTtcclxuICAgICAgICBpZCA9IChpZCA+IDEgPyAnWycgKyBpZCArICddJyA6ICcnKTtcclxuICAgICAgICB4cGF0aCA9ICcvJyArIGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpICsgaWQgKyB4cGF0aDtcclxuICAgIH1cclxuICAgIHJldHVybiB4cGF0aDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRYUGF0aDtcclxuIiwiLy8gSXQgZXhlY3V0ZXMgdGhlIGdpdmVuICdyZWFkeScgZnVuY3Rpb24gYXMgcGFyYW1ldGVyIHdoZW5cclxuLy8gbWFwIGVudmlyb25tZW50IGlzIHJlYWR5ICh3aGVuIGdvb2dsZSBtYXBzIGFwaSBhbmQgc2NyaXB0IGlzXHJcbi8vIGxvYWRlZCBhbmQgcmVhZHkgdG8gdXNlLCBvciBpbm1lZGlhdGVseSBpZiBpcyBhbHJlYWR5IGxvYWRlZCkuXHJcblxyXG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcclxuXHJcbi8vIFByaXZhdGUgc3RhdGljIGNvbGxlY3Rpb24gb2YgY2FsbGJhY2tzIHJlZ2lzdGVyZWRcclxudmFyIHN0YWNrID0gW107XHJcblxyXG52YXIgZ29vZ2xlTWFwUmVhZHkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdvb2dsZU1hcFJlYWR5KHJlYWR5KSB7XHJcbiAgc3RhY2sucHVzaChyZWFkeSk7XHJcblxyXG4gIGlmIChnb29nbGVNYXBSZWFkeS5pc1JlYWR5KVxyXG4gICAgcmVhZHkoKTtcclxuICBlbHNlIGlmICghZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nKSB7XHJcbiAgICBnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcgPSB0cnVlO1xyXG4gICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICBzY3JpcHRzOiBbXCJodHRwczovL3d3dy5nb29nbGUuY29tL2pzYXBpXCJdLFxyXG4gICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkgeyByZXR1cm4gISF3aW5kb3cuZ29vZ2xlOyB9LFxyXG4gICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGdvb2dsZS5sb2FkKFwibWFwc1wiLCBcIjMuMTBcIiwgeyBvdGhlcl9wYXJhbXM6IFwic2Vuc29yPWZhbHNlXCIsIFwiY2FsbGJhY2tcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSA9IHRydWU7XHJcbiAgICAgICAgICBnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIHN0YWNrW2ldKCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gVXRpbGl0eSB0byBmb3JjZSB0aGUgcmVmcmVzaCBvZiBtYXBzIHRoYXQgc29sdmUgdGhlIHByb2JsZW0gd2l0aCBiYWQtc2l6ZWQgbWFwIGFyZWFcclxuZ29vZ2xlTWFwUmVhZHkucmVmcmVzaE1hcCA9IGZ1bmN0aW9uIHJlZnJlc2hNYXBzKG1hcCkge1xyXG4gIGdvb2dsZU1hcFJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIobWFwLCBcInJlc2l6ZVwiKTtcclxuICB9KTtcclxufTtcclxuIiwiLyogR1VJRCBHZW5lcmF0b3JcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ3VpZEdlbmVyYXRvcigpIHtcclxuICAgIHZhciBTNCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCgoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkgfCAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiAoUzQoKSArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBTNCgpICsgUzQoKSk7XHJcbn07IiwiLyoqXHJcbiAgICBHZW5lcmljIHNjcmlwdCBmb3IgZmllbGRzZXRzIHdpdGggY2xhc3MgLmhhcy1jb25maXJtLCBhbGxvd2luZyBzaG93XHJcbiAgICB0aGUgY29udGVudCBvbmx5IGlmIHRoZSBtYWluIGNvbmZpcm0gZmllbGRzIGhhdmUgJ3llcycgc2VsZWN0ZWQuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIGRlZmF1bHRTZWxlY3RvciA9ICdmaWVsZHNldC5oYXMtY29uZmlybSA+IC5jb25maXJtIGlucHV0JztcclxuXHJcbmZ1bmN0aW9uIG9uY2hhbmdlKCkge1xyXG4gICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGZzID0gdC5jbG9zZXN0KCdmaWVsZHNldCcpO1xyXG4gICAgaWYgKHQuaXMoJzpjaGVja2VkJykpXHJcbiAgICAgICAgaWYgKHQudmFsKCkgPT0gJ3llcycgfHwgdC52YWwoKSA9PSAnVHJ1ZScpXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKCdjb25maXJtZWQtbm8nKS5hZGRDbGFzcygnY29uZmlybWVkLXllcycpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC15ZXMnKS5hZGRDbGFzcygnY29uZmlybWVkLW5vJyk7XHJcbn1cclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCBzZWxlY3Rvciwgb25jaGFuZ2UpO1xyXG4gICAgLy8gUGVyZm9ybXMgZmlyc3QgY2hlY2s6XHJcbiAgICAkKHNlbGVjdG9yKS5jaGFuZ2UoKTtcclxufTtcclxuXHJcbmV4cG9ydHMub2ZmID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IGRlZmF1bHRTZWxlY3RvcjtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NoYW5nZScsIHNlbGVjdG9yKTtcclxufTsiLCIvKiBJbnRlcm5hemlvbmFsaXphdGlvbiBVdGlsaXRpZXNcclxuICovXHJcbnZhciBpMThuID0ge307XHJcbmkxOG4uZGlzdGFuY2VVbml0cyA9IHtcclxuICAgICdFUyc6ICdrbScsXHJcbiAgICAnVVMnOiAnbWlsZXMnXHJcbn07XHJcbmkxOG4ubnVtZXJpY01pbGVzU2VwYXJhdG9yID0ge1xyXG4gICAgJ2VzLUVTJzogJy4nLFxyXG4gICAgJ2VzLVVTJzogJy4nLFxyXG4gICAgJ2VuLVVTJzogJywnLFxyXG4gICAgJ2VuLUVTJzogJywnXHJcbn07XHJcbmkxOG4ubnVtZXJpY0RlY2ltYWxTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLCcsXHJcbiAgICAnZXMtVVMnOiAnLCcsXHJcbiAgICAnZW4tVVMnOiAnLicsXHJcbiAgICAnZW4tRVMnOiAnLidcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFByZWZpeCA9IHtcclxuICAgICdFUyc6ICcnLFxyXG4gICAgJ1VTJzogJyQnXHJcbn07XHJcbmkxOG4ubW9uZXlTeW1ib2xTdWZpeCA9IHtcclxuICAgICdFUyc6ICfigqwnLFxyXG4gICAgJ1VTJzogJydcclxufTtcclxuaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSA9IGZ1bmN0aW9uIGdldEN1cnJlbnRDdWx0dXJlKCkge1xyXG4gICAgdmFyIGMgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKTtcclxuICAgIHZhciBzID0gYy5zcGxpdCgnLScpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdWx0dXJlOiBjLFxyXG4gICAgICAgIGxhbmd1YWdlOiBzWzBdLFxyXG4gICAgICAgIGNvdW50cnk6IHNbMV1cclxuICAgIH07XHJcbn07XHJcbmkxOG4uY29udmVydE1pbGVzS20gPSBmdW5jdGlvbiBjb252ZXJ0TWlsZXNLbShxLCB1bml0KSB7XHJcbiAgICB2YXIgTUlMRVNfVE9fS00gPSAxLjYwOTtcclxuICAgIGlmICh1bml0ID09ICdtaWxlcycpXHJcbiAgICAgICAgcmV0dXJuIE1JTEVTX1RPX0tNICogcTtcclxuICAgIGVsc2UgaWYgKHVuaXQgPT0gJ2ttJylcclxuICAgICAgICByZXR1cm4gcSAvIE1JTEVTX1RPX0tNO1xyXG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5sb2cpIGNvbnNvbGUubG9nKCdjb252ZXJ0TWlsZXNLbTogVW5yZWNvZ25pemVkIHVuaXQgJyArIHVuaXQpO1xyXG4gICAgcmV0dXJuIDA7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGkxOG47IiwiLyogUmV0dXJucyB0cnVlIHdoZW4gc3RyIGlzXHJcbi0gbnVsbFxyXG4tIGVtcHR5IHN0cmluZ1xyXG4tIG9ubHkgd2hpdGUgc3BhY2VzIHN0cmluZ1xyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzRW1wdHlTdHJpbmcoc3RyKSB7XHJcbiAgICByZXR1cm4gISgvXFxTL2cudGVzdChzdHIgfHwgXCJcIikpO1xyXG59OyIsIi8qKiBBcyB0aGUgJ2lzJyBqUXVlcnkgbWV0aG9kLCBidXQgY2hlY2tpbmcgQHNlbGVjdG9yIGluIGFsbCBlbGVtZW50c1xyXG4qIEBtb2RpZmllciB2YWx1ZXM6XHJcbiogLSAnYWxsJzogYWxsIGVsZW1lbnRzIG11c3QgbWF0Y2ggc2VsZWN0b3IgdG8gcmV0dXJuIHRydWVcclxuKiAtICdhbG1vc3Qtb25lJzogYWxtb3N0IG9uZSBlbGVtZW50IG11c3QgbWF0Y2hcclxuKiAtICdwZXJjZW50YWdlJzogcmV0dXJucyBwZXJjZW50YWdlIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG1hdGNoIHNlbGVjdG9yICgwLTEwMClcclxuKiAtICdzdW1tYXJ5JzogcmV0dXJucyB0aGUgb2JqZWN0IHsgeWVzOiBudW1iZXIsIG5vOiBudW1iZXIsIHBlcmNlbnRhZ2U6IG51bWJlciwgdG90YWw6IG51bWJlciB9XHJcbiogLSB7anVzdDogYSBudW1iZXJ9OiBleGFjdCBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7YWxtb3N0OiBhIG51bWJlcn06IG1pbmltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qIC0ge3VudGlsOiBhIG51bWJlcn06IG1heGltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uYXJlID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBtb2RpZmllcikge1xyXG4gICAgbW9kaWZpZXIgPSBtb2RpZmllciB8fCAnYWxsJztcclxuICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmlzKHNlbGVjdG9yKSlcclxuICAgICAgICAgICAgY291bnQrKztcclxuICAgIH0pO1xyXG4gICAgc3dpdGNoIChtb2RpZmllcikge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PSBjb3VudDtcclxuICAgICAgICBjYXNlICdhbG1vc3Qtb25lJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50ID4gMDtcclxuICAgICAgICBjYXNlICdwZXJjZW50YWdlJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50IC8gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgY2FzZSAnc3VtbWFyeSc6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB5ZXM6IGNvdW50LFxyXG4gICAgICAgICAgICAgICAgbm86IHRoaXMubGVuZ3RoIC0gY291bnQsXHJcbiAgICAgICAgICAgICAgICBwZXJjZW50YWdlOiBjb3VudCAvIHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgdG90YWw6IHRoaXMubGVuZ3RoXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCdqdXN0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuanVzdCAhPSBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2FsbW9zdCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLmFsbW9zdCA+IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgndW50aWwnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci51bnRpbCA8IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICB9XHJcbn07IiwiLyoqID09PT09PT09PT09PT09PT09PT1cclxuRXh0ZW5zaW9uIGpxdWVyeTogJ2JvdW5kcydcclxuUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgY29tYmluZWQgYm91bmRzIGZvciBhbGwgXHJcbmVsZW1lbnRzIGluIHRoZSBjb2xsZWN0aW9uXHJcbiovXHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgalF1ZXJ5LmZuLmJvdW5kcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHtcclxuICAgICAgaW5jbHVkZUJvcmRlcjogZmFsc2UsXHJcbiAgICAgIGluY2x1ZGVNYXJnaW46IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgIHZhciBib3VuZHMgPSB7XHJcbiAgICAgIGxlZnQ6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcclxuICAgICAgdG9wOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHJpZ2h0OiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIGJvdHRvbTogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgICB3aWR0aDogTnVtYmVyLk5hTixcclxuICAgICAgaGVpZ2h0OiBOdW1iZXIuTmFOXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBmbldpZHRoID0gb3B0aW9ucy5pbmNsdWRlQm9yZGVyIHx8IG9wdGlvbnMuaW5jbHVkZU1hcmdpbiA/IFxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLm91dGVyV2lkdGguY2FsbChlbCwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luKTsgfSA6XHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ud2lkdGguY2FsbChlbCk7IH07XHJcbiAgICB2YXIgZm5IZWlnaHQgPSBvcHRpb25zLmluY2x1ZGVCb3JkZXIgfHwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luID8gXHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ub3V0ZXJIZWlnaHQuY2FsbChlbCwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luKTsgfSA6XHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4uaGVpZ2h0LmNhbGwoZWwpOyB9O1xyXG5cclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoaSwgZWwpIHtcclxuICAgICAgdmFyIGVsUSA9ICQoZWwpO1xyXG4gICAgICB2YXIgb2ZmID0gZWxRLm9mZnNldCgpO1xyXG4gICAgICBvZmYucmlnaHQgPSBvZmYubGVmdCArIGZuV2lkdGgoJChlbFEpKTtcclxuICAgICAgb2ZmLmJvdHRvbSA9IG9mZi50b3AgKyBmbkhlaWdodCgkKGVsUSkpO1xyXG5cclxuICAgICAgaWYgKG9mZi5sZWZ0IDwgYm91bmRzLmxlZnQpXHJcbiAgICAgICAgYm91bmRzLmxlZnQgPSBvZmYubGVmdDtcclxuXHJcbiAgICAgIGlmIChvZmYudG9wIDwgYm91bmRzLnRvcClcclxuICAgICAgICBib3VuZHMudG9wID0gb2ZmLnRvcDtcclxuXHJcbiAgICAgIGlmIChvZmYucmlnaHQgPiBib3VuZHMucmlnaHQpXHJcbiAgICAgICAgYm91bmRzLnJpZ2h0ID0gb2ZmLnJpZ2h0O1xyXG5cclxuICAgICAgaWYgKG9mZi5ib3R0b20gPiBib3VuZHMuYm90dG9tKVxyXG4gICAgICAgIGJvdW5kcy5ib3R0b20gPSBvZmYuYm90dG9tO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYm91bmRzLndpZHRoID0gYm91bmRzLnJpZ2h0IC0gYm91bmRzLmxlZnQ7XHJcbiAgICBib3VuZHMuaGVpZ2h0ID0gYm91bmRzLmJvdHRvbSAtIGJvdW5kcy50b3A7XHJcbiAgICByZXR1cm4gYm91bmRzO1xyXG4gIH07XHJcbn0pKCk7IiwiLyoqXHJcbiogSGFzU2Nyb2xsQmFyIHJldHVybnMgYW4gb2JqZWN0IHdpdGggYm9vbCBwcm9wZXJ0aWVzICd2ZXJ0aWNhbCcgYW5kICdob3Jpem9udGFsJ1xyXG4qIHNheWluZyBpZiB0aGUgZWxlbWVudCBoYXMgbmVlZCBvZiBzY3JvbGxiYXJzIGZvciBlYWNoIGRpbWVuc2lvbiBvciBub3QgKGVsZW1lbnRcclxuKiBjYW4gbmVlZCBzY3JvbGxiYXJzIGFuZCBzdGlsbCBub3QgYmVpbmcgc2hvd2VkIGJlY2F1c2UgdGhlIGNzcy1vdmVybGZsb3cgcHJvcGVydHlcclxuKiBiZWluZyBzZXQgYXMgJ2hpZGRlbicsIGJ1dCBzdGlsbCB3ZSBrbm93IHRoYXQgdGhlIGVsZW1lbnQgcmVxdWlyZXMgaXQgYW5kIGl0c1xyXG4qIGNvbnRlbnQgaXMgbm90IGJlaW5nIGZ1bGx5IGRpc3BsYXllZCkuXHJcbiogQGV4dHJhZ2FwLCBkZWZhdWx0cyB0byB7eDowLHk6MH0sIGxldHMgc3BlY2lmeSBhbiBleHRyYSBzaXplIGluIHBpeGVscyBmb3IgZWFjaCBkaW1lbnNpb24gdGhhdCBhbHRlciB0aGUgcmVhbCBjaGVjayxcclxuKiByZXN1bHRpbmcgaW4gYSBmYWtlIHJlc3VsdCB0aGF0IGNhbiBiZSBpbnRlcmVzdGluZyB0byBkaXNjYXJkIHNvbWUgcGl4ZWxzIG9mIGV4Y2Vzc1xyXG4qIHNpemUgKG5lZ2F0aXZlIHZhbHVlcykgb3IgZXhhZ2VyYXRlIHRoZSByZWFsIHVzZWQgc2l6ZSB3aXRoIHRoYXQgZXh0cmEgcGl4ZWxzIChwb3NpdGl2ZSB2YWx1ZXMpLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaGFzU2Nyb2xsQmFyID0gZnVuY3Rpb24gKGV4dHJhZ2FwKSB7XHJcbiAgICBleHRyYWdhcCA9ICQuZXh0ZW5kKHtcclxuICAgICAgICB4OiAwLFxyXG4gICAgICAgIHk6IDBcclxuICAgIH0sIGV4dHJhZ2FwKTtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHsgdmVydGljYWw6IGZhbHNlLCBob3Jpem9udGFsOiBmYWxzZSB9O1xyXG4gICAgLy9ub3RlOiBjbGllbnRIZWlnaHQ9IGhlaWdodCBvZiBob2xkZXJcclxuICAgIC8vc2Nyb2xsSGVpZ2h0PSB3ZSBoYXZlIGNvbnRlbnQgdGlsbCB0aGlzIGhlaWdodFxyXG4gICAgdmFyIHQgPSB0aGlzLmdldCgwKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdmVydGljYWw6IHRoaXMub3V0ZXJIZWlnaHQoZmFsc2UpIDwgKHQuc2Nyb2xsSGVpZ2h0ICsgZXh0cmFnYXAueSksXHJcbiAgICAgICAgaG9yaXpvbnRhbDogdGhpcy5vdXRlcldpZHRoKGZhbHNlKSA8ICh0LnNjcm9sbFdpZHRoICsgZXh0cmFnYXAueClcclxuICAgIH07XHJcbn07IiwiLyoqIENoZWNrcyBpZiBjdXJyZW50IGVsZW1lbnQgb3Igb25lIG9mIHRoZSBjdXJyZW50IHNldCBvZiBlbGVtZW50cyBoYXNcclxuYSBwYXJlbnQgdGhhdCBtYXRjaCB0aGUgZWxlbWVudCBvciBleHByZXNzaW9uIGdpdmVuIGFzIGZpcnN0IHBhcmFtZXRlclxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaXNDaGlsZE9mID0gZnVuY3Rpb24galF1ZXJ5X3BsdWdpbl9pc0NoaWxkT2YoZXhwKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRzKCkuZmlsdGVyKGV4cCkubGVuZ3RoID4gMDtcclxufTsiLCIvKipcclxuICAgIEdldHMgdGhlIGh0bWwgc3RyaW5nIG9mIHRoZSBmaXJzdCBlbGVtZW50IGFuZCBhbGwgaXRzIGNvbnRlbnQuXHJcbiAgICBUaGUgJ2h0bWwnIG1ldGhvZCBvbmx5IHJldHJpZXZlcyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGNvbnRlbnQsIG5vdCB0aGUgZWxlbWVudCBpdHNlbGYuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5vdXRlckh0bWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAnJztcclxuICAgIHZhciBlbCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgdmFyIGh0bWwgPSAnJztcclxuICAgIGlmIChlbC5vdXRlckhUTUwpXHJcbiAgICAgICAgaHRtbCA9IGVsLm91dGVySFRNTDtcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGh0bWwgPSB0aGlzLndyYXBBbGwoJzxkaXY+PC9kaXY+JykucGFyZW50KCkuaHRtbCgpO1xyXG4gICAgICAgIHRoaXMudW53cmFwKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaHRtbDtcclxufTsiLCIvKipcclxuICAgIFVzaW5nIHRoZSBhdHRyaWJ1dGUgZGF0YS1zb3VyY2UtdXJsIG9uIGFueSBIVE1MIGVsZW1lbnQsXHJcbiAgICB0aGlzIGFsbG93cyByZWxvYWQgaXRzIGNvbnRlbnQgcGVyZm9ybWluZyBhbiBBSkFYIG9wZXJhdGlvblxyXG4gICAgb24gdGhlIGdpdmVuIFVSTCBvciB0aGUgb25lIGluIHRoZSBhdHRyaWJ1dGU7IHRoZSBlbmQtcG9pbnRcclxuICAgIG11c3QgcmV0dXJuIHRleHQvaHRtbCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIERlZmF1bHQgc3VjY2VzcyBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHksIGJhc2ljIGhvdy10byByZXBsYWNlIGVsZW1lbnQgY29udGVudCB3aXRoIGZldGNoZWQgaHRtbFxyXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50KGh0bWxDb250ZW50LCBjb250ZXh0KSB7XHJcbiAgICBjb250ZXh0ID0gJC5pc1BsYWluT2JqZWN0KGNvbnRleHQpICYmIGNvbnRleHQgPyBjb250ZXh0IDogdGhpcztcclxuXHJcbiAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgIC8vIEF2b2lkIGVtcHR5IGRvY3VtZW50cyBiZWluZyBwYXJzZWQgKHJhaXNlIGVycm9yKVxyXG4gICAgaHRtbENvbnRlbnQgPSAkLnRyaW0oaHRtbENvbnRlbnQpO1xyXG4gICAgaWYgKGh0bWxDb250ZW50KSB7XHJcbiAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhbiBlbXB0eSBkb2N1bWVudCBvciBtYWxmb3JtZWQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoaHRtbENvbnRlbnQpKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBuZXdodG1sID0gJChodG1sQ29udGVudCk7XHJcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBlbGVtZW50ID0gY29udGV4dC5lbGVtZW50O1xyXG4gICAgaWYgKGNvbnRleHQub3B0aW9ucy5tb2RlID09ICdyZXBsYWNlLW1lJylcclxuICAgICAgICBlbGVtZW50LnJlcGxhY2VXaXRoKG5ld2h0bWwpO1xyXG4gICAgZWxzZSAvLyAncmVwbGFjZS1jb250ZW50J1xyXG4gICAgICAgIGVsZW1lbnQuaHRtbChuZXdodG1sKTtcclxuXHJcbiAgICByZXR1cm4gY29udGV4dDtcclxufVxyXG5cclxuLy8gRGVmYXVsdCBjb21wbGV0ZSBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHlcclxuZnVuY3Rpb24gc3RvcExvYWRpbmdTcGlubmVyKCkge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuZWxlbWVudCk7XHJcbn1cclxuXHJcbi8vIERlZmF1bHRzXHJcbnZhciBkZWZhdWx0cyA9IHtcclxuICAgIHVybDogbnVsbCxcclxuICAgIHN1Y2Nlc3M6IFt1cGRhdGVFbGVtZW50XSxcclxuICAgIGVycm9yOiBbXSxcclxuICAgIGNvbXBsZXRlOiBbc3RvcExvYWRpbmdTcGlubmVyXSxcclxuICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgIG1vZGU6ICdyZXBsYWNlLWNvbnRlbnQnLFxyXG4gICAgbG9hZGluZzoge1xyXG4gICAgICAgIGxvY2tFbGVtZW50OiB0cnVlLFxyXG4gICAgICAgIGxvY2tPcHRpb25zOiB7fSxcclxuICAgICAgICBtZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIHNob3dMb2FkaW5nSW5kaWNhdG9yOiB0cnVlLFxyXG4gICAgICAgIGRlbGF5OiAwXHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiBSZWxvYWQgbWV0aG9kICovXHJcbnZhciByZWxvYWQgPSAkLmZuLnJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIE9wdGlvbnMgZnJvbSBkZWZhdWx0cyAoaW50ZXJuYWwgYW5kIHB1YmxpYylcclxuICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCByZWxvYWQuZGVmYXVsdHMpO1xyXG4gICAgLy8gSWYgb3B0aW9ucyBvYmplY3QgaXMgcGFzc2VkIGFzIHVuaXF1ZSBwYXJhbWV0ZXJcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEgJiYgJC5pc1BsYWluT2JqZWN0KGFyZ3VtZW50c1swXSkpIHtcclxuICAgICAgICAvLyBNZXJnZSBvcHRpb25zOlxyXG4gICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIGFyZ3VtZW50c1swXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIENvbW1vbiBvdmVybG9hZDogbmV3LXVybCBhbmQgY29tcGxldGUgY2FsbGJhY2ssIGJvdGggb3B0aW9uYWxzXHJcbiAgICAgICAgb3B0aW9ucy51cmwgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IG51bGw7XHJcbiAgICAgICAgb3B0aW9ucy5jb21wbGV0ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnVybCkge1xyXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG9wdGlvbnMudXJsKSlcclxuICAgICAgICAgICAgLy8gRnVuY3Rpb24gcGFyYW1zOiBjdXJyZW50UmVsb2FkVXJsLCBkZWZhdWx0UmVsb2FkVXJsXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgJC5wcm94eShvcHRpb25zLnVybCwgdGhpcykoJHQuZGF0YSgnc291cmNlLXVybCcpLCAkdC5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSkpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgb3B0aW9ucy51cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdXJsID0gJHQuZGF0YSgnc291cmNlLXVybCcpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbHJlYWR5IGJlaW5nIHJlbG9hZGVkLCB0byBjYW5jZWwgcHJldmlvdXMgYXR0ZW1wdFxyXG4gICAgICAgIHZhciBqcSA9ICR0LmRhdGEoJ2lzUmVsb2FkaW5nJyk7XHJcbiAgICAgICAgaWYgKGpxKSB7XHJcbiAgICAgICAgICAgIGlmIChqcS51cmwgPT0gdXJsKVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgdGhlIHNhbWUgdXJsLCBkbyBub3QgYWJvcnQgYmVjYXVzZSBpcyB0aGUgc2FtZSByZXN1bHQgYmVpbmcgcmV0cmlldmVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGpxLmFib3J0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPcHRpb25hbCBkYXRhIHBhcmFtZXRlciAncmVsb2FkLW1vZGUnIGFjY2VwdHMgdmFsdWVzOiBcclxuICAgICAgICAvLyAtICdyZXBsYWNlLW1lJzogVXNlIGh0bWwgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IHJlbG9hZGVkIGVsZW1lbnQgKGFrYTogcmVwbGFjZVdpdGgoKSlcclxuICAgICAgICAvLyAtICdyZXBsYWNlLWNvbnRlbnQnOiAoZGVmYXVsdCkgSHRtbCByZXR1cm5lZCByZXBsYWNlIGN1cnJlbnQgZWxlbWVudCBjb250ZW50IChha2E6IGh0bWwoKSlcclxuICAgICAgICBvcHRpb25zLm1vZGUgPSAkdC5kYXRhKCdyZWxvYWQtbW9kZScpIHx8IG9wdGlvbnMubW9kZTtcclxuXHJcbiAgICAgICAgaWYgKHVybCkge1xyXG5cclxuICAgICAgICAgICAgLy8gTG9hZGluZywgd2l0aCBkZWxheVxyXG4gICAgICAgICAgICB2YXIgbG9hZGluZ3RpbWVyID0gb3B0aW9ucy5sb2FkaW5nLmxvY2tFbGVtZW50ID9cclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0aW5nIGNvbnRlbnQgdXNpbmcgYSBmYWtlIHRlbXAgcGFyZW50IGVsZW1lbnQgdG8gcHJlbG9hZCBpbWFnZSBhbmQgdG8gZ2V0IHJlYWwgbWVzc2FnZSB3aWR0aDpcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG9hZGluZ2NvbnRlbnQgPSAkKCc8ZGl2Lz4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgPyAkKCc8ZGl2IGNsYXNzPVwibG9hZGluZy1tZXNzYWdlXCIvPicpLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSkgOiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLnNob3dMb2FkaW5nSW5kaWNhdG9yID8gb3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgOiBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nY29udGVudC5jc3MoeyBwb3NpdGlvbjogJ2Fic29sdXRlJywgbGVmdDogLTk5OTk5IH0pLmFwcGVuZFRvKCdib2R5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHcgPSBsb2FkaW5nY29udGVudC53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmRldGFjaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIExvY2tpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLmF1dG9mb2N1cyA9IG9wdGlvbnMuYXV0b2ZvY3VzO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucy53aWR0aCA9IHc7XHJcbiAgICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihsb2FkaW5nY29udGVudC5odG1sKCksICR0LCBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICdjdXN0b20tbG9hZGluZycgOiAnbG9hZGluZycsIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmxvYWRpbmcuZGVsYXkpXHJcbiAgICAgICAgICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAvLyBQcmVwYXJlIGNvbnRleHRcclxuICAgICAgICAgICAgdmFyIGN0eCA9IHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICR0LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGxvYWRpbmdUaW1lcjogbG9hZGluZ3RpbWVyXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICAgICAgICAgIGpxID0gJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0OiBjdHhcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcmwgaXMgc2V0IGluIHRoZSByZXR1cm5lZCBhamF4IG9iamVjdCBiZWNhdXNlIGlzIG5vdCBzZXQgYnkgYWxsIHZlcnNpb25zIG9mIGpRdWVyeVxyXG4gICAgICAgICAgICBqcS51cmwgPSB1cmw7XHJcblxyXG4gICAgICAgICAgICAvLyBNYXJrIGVsZW1lbnQgYXMgaXMgYmVpbmcgcmVsb2FkZWQsIHRvIGF2b2lkIG11bHRpcGxlIGF0dGVtcHMgYXQgc2FtZSB0aW1lLCBzYXZpbmdcclxuICAgICAgICAgICAgLy8gY3VycmVudCBhamF4IG9iamVjdCB0byBhbGxvdyBiZSBjYW5jZWxsZWRcclxuICAgICAgICAgICAgJHQuZGF0YSgnaXNSZWxvYWRpbmcnLCBqcSk7XHJcbiAgICAgICAgICAgIGpxLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENhbGxiYWNrczogZmlyc3QgZ2xvYmFscyBhbmQgdGhlbiBmcm9tIG9wdGlvbnMgaWYgdGhleSBhcmUgZGlmZmVyZW50XHJcbiAgICAgICAgICAgIC8vIHN1Y2Nlc3NcclxuICAgICAgICAgICAganEuZG9uZShyZWxvYWQuZGVmYXVsdHMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN1Y2Nlc3MgIT0gcmVsb2FkLmRlZmF1bHRzLnN1Y2Nlc3MpXHJcbiAgICAgICAgICAgICAgICBqcS5kb25lKG9wdGlvbnMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIC8vIGVycm9yXHJcbiAgICAgICAgICAgIGpxLmZhaWwocmVsb2FkLmRlZmF1bHRzLmVycm9yKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZXJyb3IgIT0gcmVsb2FkLmRlZmF1bHRzLmVycm9yKVxyXG4gICAgICAgICAgICAgICAganEuZmFpbChvcHRpb25zLmVycm9yKTtcclxuICAgICAgICAgICAgLy8gY29tcGxldGVcclxuICAgICAgICAgICAganEuYWx3YXlzKHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbXBsZXRlICE9IHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSlcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5jb21wbGV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8vIFB1YmxpYyBkZWZhdWx0c1xyXG5yZWxvYWQuZGVmYXVsdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMpO1xyXG5cclxuLy8gUHVibGljIHV0aWxpdGllc1xyXG5yZWxvYWQudXBkYXRlRWxlbWVudCA9IHVwZGF0ZUVsZW1lbnQ7XHJcbnJlbG9hZC5zdG9wTG9hZGluZ1NwaW5uZXIgPSBzdG9wTG9hZGluZ1NwaW5uZXI7XHJcblxyXG4vLyBNb2R1bGVcclxubW9kdWxlLmV4cG9ydHMgPSByZWxvYWQ7IiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsICEkKHRoaXMpLmlzKCc6dmlzaWJsZScpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUpXHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBEbyBqUXVlcnkgaW50ZWdyYXRpb24gYXMgeHRvZ2dsZSwgeHNob3csIHhoaWRlXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsdWdJbihqUXVlcnkpIHtcclxuICAgICAgICAgICAgLyoqIHRvZ2dsZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4dG9nZ2xlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnh0b2dnbGUgPSBmdW5jdGlvbiB4dG9nZ2xlKHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCB0b2dnbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogc2hvd0VsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhzaG93ID0gZnVuY3Rpb24geHNob3cob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBoaWRlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhoaWRlID0gZnVuY3Rpb24geGhpZGUob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9ydGluZzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b2dnbGVFbGVtZW50OiB0b2dnbGVFbGVtZW50LFxyXG4gICAgICAgICAgICBzaG93RWxlbWVudDogc2hvd0VsZW1lbnQsXHJcbiAgICAgICAgICAgIGhpZGVFbGVtZW50OiBoaWRlRWxlbWVudCxcclxuICAgICAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vZHVsZVxyXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIHh0c2gpO1xyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICAgICAgdmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0geHRzaChqUXVlcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBOb3JtYWwgc2NyaXB0IGxvYWQsIGlmIGpRdWVyeSBpcyBnbG9iYWwgKGF0IHdpbmRvdyksIGl0cyBleHRlbmRlZCBhdXRvbWF0aWNhbGx5ICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5qUXVlcnkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB4dHNoKHdpbmRvdy5qUXVlcnkpLnBsdWdJbih3aW5kb3cualF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLyogU29tZSB1dGlsaXRpZXMgZm9yIHVzZSB3aXRoIGpRdWVyeSBvciBpdHMgZXhwcmVzc2lvbnNcclxuICAgIHRoYXQgYXJlIG5vdCBwbHVnaW5zLlxyXG4qL1xyXG5mdW5jdGlvbiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyAjOyYsLisqflxcJzpcIiFeJFtcXF0oKT0+fFxcL10pL2csICdcXFxcJDEnKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTogZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZVxyXG4gICAgfTtcclxuIiwiLyogQXNzZXRzIGxvYWRlciB3aXRoIGxvYWRpbmcgY29uZmlybWF0aW9uIChtYWlubHkgZm9yIHNjcmlwdHMpXHJcbiAgICBiYXNlZCBvbiBNb2Rlcm5penIveWVwbm9wZSBsb2FkZXIuXHJcbiovXHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbmV4cG9ydHMubG9hZCA9IGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICBvcHRzID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIHNjcmlwdHM6IFtdLFxyXG4gICAgICAgIGNvbXBsZXRlOiBudWxsLFxyXG4gICAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBudWxsLFxyXG4gICAgICAgIGxvYWREZWxheTogMCxcclxuICAgICAgICB0cmlhbHNJbnRlcnZhbDogNTAwXHJcbiAgICB9LCBvcHRzKTtcclxuICAgIGlmICghb3B0cy5zY3JpcHRzLmxlbmd0aCkgcmV0dXJuO1xyXG4gICAgZnVuY3Rpb24gcGVyZm9ybUNvbXBsZXRlKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgKG9wdHMuY29tcGxldGVWZXJpZmljYXRpb24pICE9PSAnZnVuY3Rpb24nIHx8IG9wdHMuY29tcGxldGVWZXJpZmljYXRpb24oKSlcclxuICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSgpO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHBlcmZvcm1Db21wbGV0ZSwgb3B0cy50cmlhbHNJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUud2FybilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTEMubG9hZC5jb21wbGV0ZVZlcmlmaWNhdGlvbiBmYWlsZWQgZm9yICcgKyBvcHRzLnNjcmlwdHNbMF0gKyAnIHJldHJ5aW5nIGl0IGluICcgKyBvcHRzLnRyaWFsc0ludGVydmFsICsgJ21zJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbG9hZCgpIHtcclxuICAgICAgICBNb2Rlcm5penIubG9hZCh7XHJcbiAgICAgICAgICAgIGxvYWQ6IG9wdHMuc2NyaXB0cyxcclxuICAgICAgICAgICAgY29tcGxldGU6IG9wdHMuY29tcGxldGUgPyBwZXJmb3JtQ29tcGxldGUgOiBudWxsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAob3B0cy5sb2FkRGVsYXkpXHJcbiAgICAgICAgc2V0VGltZW91dChsb2FkLCBvcHRzLmxvYWREZWxheSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgbG9hZCgpO1xyXG59OyIsIi8qLS0tLS0tLS0tLS0tXHJcblV0aWxpdGllcyB0byBtYW5pcHVsYXRlIG51bWJlcnMsIGFkZGl0aW9uYWxseVxyXG50byB0aGUgb25lcyBhdCBNYXRoXHJcbi0tLS0tLS0tLS0tLSovXHJcblxyXG4vKiogRW51bWVyYXRpb24gdG8gYmUgdXNlcyBieSBmdW5jdGlvbnMgdGhhdCBpbXBsZW1lbnRzICdyb3VuZGluZycgb3BlcmF0aW9ucyBvbiBkaWZmZXJlbnRcclxuZGF0YSB0eXBlcy5cclxuSXQgaG9sZHMgdGhlIGRpZmZlcmVudCB3YXlzIGEgcm91bmRpbmcgb3BlcmF0aW9uIGNhbiBiZSBhcHBseS5cclxuKiovXHJcbnZhciByb3VuZGluZ1R5cGVFbnVtID0ge1xyXG4gICAgRG93bjogLTEsXHJcbiAgICBOZWFyZXN0OiAwLFxyXG4gICAgVXA6IDFcclxufTtcclxuXHJcbmZ1bmN0aW9uIHJvdW5kVG8obnVtYmVyLCBkZWNpbWFscywgcm91bmRpbmdUeXBlKSB7XHJcbiAgICAvLyBjYXNlIE5lYXJlc3QgaXMgdGhlIGRlZmF1bHQ6XHJcbiAgICB2YXIgZiA9IG5lYXJlc3RUbztcclxuICAgIHN3aXRjaCAocm91bmRpbmdUeXBlKSB7XHJcbiAgICAgICAgY2FzZSByb3VuZGluZ1R5cGVFbnVtLkRvd246XHJcbiAgICAgICAgICAgIGYgPSBmbG9vclRvO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uVXA6XHJcbiAgICAgICAgICAgIGYgPSBjZWlsVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGYobnVtYmVyLCBkZWNpbWFscyk7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXQgY2FuIHN1YnN0cmFjdCBpbnRlZ2VyIGRlY2ltYWxzIGJ5IHByb3ZpZGluZyBhIG5lZ2F0aXZlXHJcbm51bWJlciBvZiBkZWNpbWFscy5cclxuKiovXHJcbmZ1bmN0aW9uIG5lYXJlc3RUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5yb3VuZChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBVcCBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXRzIHNpbWlsYXIgdG8gcm91bmRUbywgYnV0IHRoZSBudW1iZXIgaXMgZXZlciByb3VuZGVkIHVwLFxyXG50byB0aGUgbG93ZXIgaW50ZWdlciBncmVhdGVyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gY2VpbFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vKiogUm91bmQgRG93biBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXRzIHNpbWlsYXIgdG8gcm91bmRUbywgYnV0IHRoZSBudW1iZXIgaXMgZXZlciByb3VuZGVkIGRvd24sXHJcbnRvIHRoZSBiaWdnZXIgaW50ZWdlciBsb3dlciBvciBlcXVhbHMgdG8gdGhlIG51bWJlci5cclxuKiovXHJcbmZ1bmN0aW9uIGZsb29yVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgcm91bmRpbmdUeXBlRW51bTogcm91bmRpbmdUeXBlRW51bSxcclxuICAgICAgICByb3VuZFRvOiByb3VuZFRvLFxyXG4gICAgICAgIG5lYXJlc3RUbzogbmVhcmVzdFRvLFxyXG4gICAgICAgIGNlaWxUbzogY2VpbFRvLFxyXG4gICAgICAgIGZsb29yVG86IGZsb29yVG9cclxuICAgIH07IiwiZnVuY3Rpb24gbW92ZUZvY3VzVG8oZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWFyZ2luVG9wOiAzMCxcclxuICAgICAgICBkdXJhdGlvbjogNTAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgb3B0aW9ucy5kdXJhdGlvbiwgbnVsbCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb3ZlRm9jdXNUbztcclxufSIsIi8qIFNvbWUgdXRpbGl0aWVzIHRvIGZvcm1hdCBhbmQgZXh0cmFjdCBudW1iZXJzLCBmcm9tIHRleHQgb3IgRE9NLlxyXG4gKi9cclxudmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgaTE4biA9IHJlcXVpcmUoJy4vaTE4bicpLFxyXG4gICAgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuZnVuY3Rpb24gZ2V0TW9uZXlOdW1iZXIodiwgYWx0KSB7XHJcbiAgICBhbHQgPSBhbHQgfHwgMDtcclxuICAgIGlmICh2IGluc3RhbmNlb2YgalF1ZXJ5KVxyXG4gICAgICAgIHYgPSB2LnZhbCgpIHx8IHYudGV4dCgpO1xyXG4gICAgdiA9IHBhcnNlRmxvYXQodlxyXG4gICAgICAgIC5yZXBsYWNlKC9bJOKCrF0vZywgJycpXHJcbiAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChMQy5udW1lcmljTWlsZXNTZXBhcmF0b3JbaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmN1bHR1cmVdLCAnZycpLCAnJylcclxuICAgICk7XHJcbiAgICByZXR1cm4gaXNOYU4odikgPyBhbHQgOiB2O1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcodikge1xyXG4gICAgdmFyIGN1bHR1cmUgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZTtcclxuICAgIC8vIEZpcnN0LCByb3VuZCB0byAyIGRlY2ltYWxzXHJcbiAgICB2ID0gbXUucm91bmRUbyh2LCAyKTtcclxuICAgIC8vIEdldCB0aGUgZGVjaW1hbCBwYXJ0IChyZXN0KVxyXG4gICAgdmFyIHJlc3QgPSBNYXRoLnJvdW5kKHYgKiAxMDAgJSAxMDApO1xyXG4gICAgcmV0dXJuICgnJyArXHJcbiAgICAvLyBJbnRlZ2VyIHBhcnQgKG5vIGRlY2ltYWxzKVxyXG4gICAgICAgIE1hdGguZmxvb3IodikgK1xyXG4gICAgLy8gRGVjaW1hbCBzZXBhcmF0b3IgZGVwZW5kaW5nIG9uIGxvY2FsZVxyXG4gICAgICAgIGkxOG4ubnVtZXJpY0RlY2ltYWxTZXBhcmF0b3JbY3VsdHVyZV0gK1xyXG4gICAgLy8gRGVjaW1hbHMsIGV2ZXIgdHdvIGRpZ2l0c1xyXG4gICAgICAgIE1hdGguZmxvb3IocmVzdCAvIDEwKSArIHJlc3QgJSAxMFxyXG4gICAgKTtcclxufVxyXG5mdW5jdGlvbiBudW1iZXJUb01vbmV5U3RyaW5nKHYpIHtcclxuICAgIHZhciBjb3VudHJ5ID0gaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmNvdW50cnk7XHJcbiAgICAvLyBUd28gZGlnaXRzIGluIGRlY2ltYWxzIGZvciByb3VuZGVkIHZhbHVlIHdpdGggbW9uZXkgc3ltYm9sIGFzIGZvclxyXG4gICAgLy8gY3VycmVudCBsb2NhbGVcclxuICAgIHJldHVybiAoaTE4bi5tb25leVN5bWJvbFByZWZpeFtjb3VudHJ5XSArIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcodikgKyBpMThuLm1vbmV5U3ltYm9sU3VmaXhbY291bnRyeV0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldE1vbmV5TnVtYmVyKHYsIGVsKSB7XHJcbiAgICAvLyBHZXQgdmFsdWUgaW4gbW9uZXkgZm9ybWF0OlxyXG4gICAgdiA9IG51bWJlclRvTW9uZXlTdHJpbmcodik7XHJcbiAgICAvLyBTZXR0aW5nIHZhbHVlOlxyXG4gICAgaWYgKGVsIGluc3RhbmNlb2YgalF1ZXJ5KVxyXG4gICAgICAgIGlmIChlbC5pcygnOmlucHV0JykpXHJcbiAgICAgICAgICAgIGVsLnZhbCh2KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGVsLnRleHQodik7XHJcbiAgICByZXR1cm4gdjtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZ2V0TW9uZXlOdW1iZXI6IGdldE1vbmV5TnVtYmVyLFxyXG4gICAgICAgIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmc6IG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcsXHJcbiAgICAgICAgbnVtYmVyVG9Nb25leVN0cmluZzogbnVtYmVyVG9Nb25leVN0cmluZyxcclxuICAgICAgICBzZXRNb25leU51bWJlcjogc2V0TW9uZXlOdW1iZXJcclxuICAgIH07IiwiLyoqXHJcbiogUGxhY2Vob2xkZXIgcG9seWZpbGwuXHJcbiogQWRkcyBhIG5ldyBqUXVlcnkgcGxhY2VIb2xkZXIgbWV0aG9kIHRvIHNldHVwIG9yIHJlYXBwbHkgcGxhY2VIb2xkZXJcclxuKiBvbiBlbGVtZW50cyAocmVjb21tZW50ZWQgdG8gYmUgYXBwbHkgb25seSB0byBzZWxlY3RvciAnW3BsYWNlaG9sZGVyXScpO1xyXG4qIHRoYXRzIG1ldGhvZCBpcyBmYWtlIG9uIGJyb3dzZXJzIHRoYXQgaGFzIG5hdGl2ZSBzdXBwb3J0IGZvciBwbGFjZWhvbGRlclxyXG4qKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFBsYWNlSG9sZGVycygpIHtcclxuICAgIGlmIChNb2Rlcm5penIuaW5wdXQucGxhY2Vob2xkZXIpXHJcbiAgICAgICAgJC5mbi5wbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHsgfTtcclxuICAgIGVsc2VcclxuICAgICAgICAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBkb1BsYWNlaG9sZGVyKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGlmICghJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQub24oJ2ZvY3Vzb3V0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICR0LmRhdGEoJ3BsYWNlaG9sZGVyLXN1cHBvcnRlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJC5mbi5wbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZG9QbGFjZWhvbGRlcik7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpO1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5hamF4Q29tcGxldGUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKCk7XHJcbn07IiwiLyogUG9wdXAgZnVuY3Rpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKlxyXG4qIFBvcHVwIHJlbGF0ZWQgXHJcbiogZnVuY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHBvcHVwU2l6ZShzaXplKSB7XHJcbiAgICB2YXIgcyA9IChzaXplID09ICdsYXJnZScgPyAwLjggOiAoc2l6ZSA9PSAnbWVkaXVtJyA/IDAuNSA6IChzaXplID09ICdzbWFsbCcgPyAwLjIgOiBzaXplIHx8IDAuNSkpKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgd2lkdGg6IE1hdGgucm91bmQoJCh3aW5kb3cpLndpZHRoKCkgKiBzKSxcclxuICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoJCh3aW5kb3cpLmhlaWdodCgpICogcyksXHJcbiAgICAgICAgc2l6ZUZhY3Rvcjogc1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cFN0eWxlKHNpemUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3Vyc29yOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgd2lkdGg6IHNpemUud2lkdGggKyAncHgnLFxyXG4gICAgICAgIGxlZnQ6IE1hdGgucm91bmQoKCQod2luZG93KS53aWR0aCgpIC0gc2l6ZS53aWR0aCkgLyAyKSAtIDI1ICsgJ3B4JyxcclxuICAgICAgICBoZWlnaHQ6IHNpemUuaGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICB0b3A6IE1hdGgucm91bmQoKCQod2luZG93KS5oZWlnaHQoKSAtIHNpemUuaGVpZ2h0KSAvIDIpIC0gMzIgKyAncHgnLFxyXG4gICAgICAgIHBhZGRpbmc6ICczNHB4IDI1cHggMzBweCcsXHJcbiAgICAgICAgb3ZlcmZsb3c6ICdhdXRvJyxcclxuICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAnLW1vei1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZycsXHJcbiAgICAgICAgJy13ZWJraXQtYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94JyxcclxuICAgICAgICAnYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94J1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cCh1cmwsIHNpemUsIGNvbXBsZXRlLCBsb2FkaW5nVGV4dCwgb3B0aW9ucykge1xyXG4gICAgaWYgKHR5cGVvZiAodXJsKSA9PT0gJ29iamVjdCcpXHJcbiAgICAgICAgb3B0aW9ucyA9IHVybDtcclxuXHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgdXJsOiB0eXBlb2YgKHVybCkgPT09ICdzdHJpbmcnID8gdXJsIDogJycsXHJcbiAgICAgICAgc2l6ZTogc2l6ZSB8fCB7IHdpZHRoOiAwLCBoZWlnaHQ6IDAgfSxcclxuICAgICAgICBjb21wbGV0ZTogY29tcGxldGUsXHJcbiAgICAgICAgbG9hZGluZ1RleHQ6IGxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNsb3NhYmxlOiB7XHJcbiAgICAgICAgICAgIG9uTG9hZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGFmdGVyTG9hZDogdHJ1ZSxcclxuICAgICAgICAgICAgb25FcnJvcjogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b1NpemU6IGZhbHNlLFxyXG4gICAgICAgIGNvbnRhaW5lckNsYXNzOiAnJyxcclxuICAgICAgICBhdXRvRm9jdXM6IHRydWVcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIC8vIFByZXBhcmUgc2l6ZSBhbmQgbG9hZGluZ1xyXG4gICAgb3B0aW9ucy5sb2FkaW5nVGV4dCA9IG9wdGlvbnMubG9hZGluZ1RleHQgfHwgJyc7XHJcbiAgICBpZiAodHlwZW9mIChvcHRpb25zLnNpemUud2lkdGgpID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICBvcHRpb25zLnNpemUgPSBwb3B1cFNpemUob3B0aW9ucy5zaXplKTtcclxuXHJcbiAgICAkLmJsb2NrVUkoe1xyXG4gICAgICAgIG1lc3NhZ2U6IChvcHRpb25zLmNsb3NhYmxlLm9uTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArXHJcbiAgICAgICAnPGltZyBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyArIG9wdGlvbnMubG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2VudGVyWTogZmFsc2UsXHJcbiAgICAgICAgY3NzOiBwb3B1cFN0eWxlKG9wdGlvbnMuc2l6ZSksXHJcbiAgICAgICAgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9LFxyXG4gICAgICAgIGZvY3VzSW5wdXQ6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExvYWRpbmcgVXJsIHdpdGggQWpheCBhbmQgcGxhY2UgY29udGVudCBpbnNpZGUgdGhlIGJsb2NrZWQtYm94XHJcbiAgICAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogb3B0aW9ucy51cmwsXHJcbiAgICAgICAgY29udGV4dDoge1xyXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICBjb250YWluZXI6ICQoJy5ibG9ja01zZycpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5jb250YWluZXIuYWRkQ2xhc3Mob3B0aW9ucy5jb250YWluZXJDbGFzcyk7XHJcbiAgICAgICAgICAgIC8vIEFkZCBjbG9zZSBidXR0b24gaWYgcmVxdWlyZXMgaXQgb3IgZW1wdHkgbWVzc2FnZSBjb250ZW50IHRvIGFwcGVuZCB0aGVuIG1vcmVcclxuICAgICAgICAgICAgY29udGFpbmVyLmh0bWwob3B0aW9ucy5jbG9zYWJsZS5hZnRlckxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJyk7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50SG9sZGVyID0gY29udGFpbmVyLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbnRlbnRcIi8+JykuY2hpbGRyZW4oJy5jb250ZW50Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLkNvZGUgJiYgZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIGNvZGUsIHNob3cgcmVzdWx0XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gUGFnZSBjb250ZW50IGdvdCwgcGFzdGUgaW50byB0aGUgcG9wdXAgaWYgaXMgcGFydGlhbCBodG1sICh1cmwgc3RhcnRzIHdpdGggJClcclxuICAgICAgICAgICAgICAgIGlmICgvKCheXFwkKXwoXFwvXFwkKSkvLnRlc3Qob3B0aW9ucy51cmwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50SG9sZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBdm9pZCBtaXNjYWxjdWxhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2SGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zdHlsZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsV2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsSGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zY3JvbGxIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250V2lkdGggPSBjb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRIZWlnaHQgPSBjb250YWluZXIuaGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYVdpZHRoID0gY29udGFpbmVyLm91dGVyV2lkdGgodHJ1ZSkgLSBjb250V2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUhlaWdodCA9IGNvbnRhaW5lci5vdXRlckhlaWdodCh0cnVlKSAtIGNvbnRIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA9ICQod2luZG93KS53aWR0aCgpIC0gZXh0cmFXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKSAtIGV4dHJhSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgYW5kIGFwcGx5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaXplID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGFjdHVhbFdpZHRoID4gbWF4V2lkdGggPyBtYXhXaWR0aCA6IGFjdHVhbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBhY3R1YWxIZWlnaHQgPiBtYXhIZWlnaHQgPyBtYXhIZWlnaHQgOiBhY3R1YWxIZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFuaW1hdGUoc2l6ZSwgMzAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgbWlzY2FsY3VsYXRpb25zIGNvcnJlY3Rpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsIHByZXZXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCBwcmV2SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEVsc2UsIGlmIHVybCBpcyBhIGZ1bGwgaHRtbCBwYWdlIChub3JtYWwgcGFnZSksIHB1dCBjb250ZW50IGludG8gYW4gaWZyYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShkYXRhLCB0aGlzLm9wdGlvbnMuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBsYWNlIGJsb2NraW5nIGVsZW1lbnQgY29udGVudCAodGhlIGxvYWRpbmcpIHdpdGggdGhlIGlmcmFtZTpcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGVycm9yOiBmdW5jdGlvbiAoaiwgdCwgZXgpIHtcclxuICAgICAgICAgICAgJCgnZGl2LmJsb2NrTXNnJykuaHRtbCgob3B0aW9ucy5jbG9zYWJsZS5vbkVycm9yID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICsgJzxkaXYgY2xhc3M9XCJjb250ZW50XCI+UGFnZSBub3QgZm91bmQ8L2Rpdj4nKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5pbmZvKSBjb25zb2xlLmluZm8oXCJQb3B1cC1hamF4IGVycm9yOiBcIiArIGV4KTtcclxuICAgICAgICB9LCBjb21wbGV0ZTogb3B0aW9ucy5jb21wbGV0ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHJldHVybmVkQmxvY2sgPSAkKCcuYmxvY2tVSScpO1xyXG5cclxuICAgIHJldHVybmVkQmxvY2sub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgcmV0dXJuZWRCbG9jay50cmlnZ2VyKCdwb3B1cC1jbG9zZWQnKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJldHVybmVkQmxvY2suY2xvc2VQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldEJsb2NrRWxlbWVudCA9IGZ1bmN0aW9uIGdldEJsb2NrRWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmlsdGVyKCcuYmxvY2tNc2cnKTsgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0Q29udGVudEVsZW1lbnQgPSBmdW5jdGlvbiBnZXRDb250ZW50RWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmluZCgnLmNvbnRlbnQnKTsgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0T3ZlcmxheUVsZW1lbnQgPSBmdW5jdGlvbiBnZXRPdmVybGF5RWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmlsdGVyKCcuYmxvY2tPdmVybGF5Jyk7IH07XHJcbiAgICByZXR1cm4gcmV0dXJuZWRCbG9jaztcclxufVxyXG5cclxuLyogU29tZSBwb3B1cCB1dGlsaXRpdGVzL3Nob3J0aGFuZHMgKi9cclxuZnVuY3Rpb24gbWVzc2FnZVBvcHVwKG1lc3NhZ2UsIGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgJ2JvZHknKTtcclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdi8+JykudGV4dChtZXNzYWdlKTtcclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY29udGFpbmVyLCAnbWVzc2FnZS1wb3B1cCBmdWxsLWJsb2NrJywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25uZWN0UG9wdXBBY3Rpb24oYXBwbHlUb1NlbGVjdG9yKSB7XHJcbiAgICBhcHBseVRvU2VsZWN0b3IgPSBhcHBseVRvU2VsZWN0b3IgfHwgJy5wb3B1cC1hY3Rpb24nO1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgYXBwbHlUb1NlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGMgPSAkKCQodGhpcykuYXR0cignaHJlZicpKS5jbG9uZSgpO1xyXG4gICAgICAgIGlmIChjLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIGRvY3VtZW50LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vIFRoZSBwb3B1cCBmdW5jdGlvbiBjb250YWlucyBhbGwgdGhlIG90aGVycyBhcyBtZXRob2RzXHJcbnBvcHVwLnNpemUgPSBwb3B1cFNpemU7XHJcbnBvcHVwLnN0eWxlID0gcG9wdXBTdHlsZTtcclxucG9wdXAuY29ubmVjdEFjdGlvbiA9IGNvbm5lY3RQb3B1cEFjdGlvbjtcclxucG9wdXAubWVzc2FnZSA9IG1lc3NhZ2VQb3B1cDtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHBvcHVwOyIsIi8qKioqIFBvc3RhbCBDb2RlOiBvbiBmbHksIHNlcnZlci1zaWRlIHZhbGlkYXRpb24gKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBiYXNlVXJsOiAnLycsXHJcbiAgICAgICAgc2VsZWN0b3I6ICdbZGF0YS12YWwtcG9zdGFsY29kZV0nLFxyXG4gICAgICAgIHVybDogJ0pTT04vVmFsaWRhdGVQb3N0YWxDb2RlLydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCBvcHRpb25zLnNlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBJZiBjb250YWlucyBhIHZhbHVlICh0aGlzIG5vdCB2YWxpZGF0ZSBpZiBpcyByZXF1aXJlZCkgYW5kIFxyXG4gICAgICAgIC8vIGhhcyB0aGUgZXJyb3IgZGVzY3JpcHRpdmUgbWVzc2FnZSwgdmFsaWRhdGUgdGhyb3VnaCBhamF4XHJcbiAgICAgICAgdmFyIHBjID0gJHQudmFsKCk7XHJcbiAgICAgICAgdmFyIG1zZyA9ICR0LmRhdGEoJ3ZhbC1wb3N0YWxjb2RlJyk7XHJcbiAgICAgICAgaWYgKHBjICYmIG1zZykge1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBvcHRpb25zLmJhc2VVcmwgKyBvcHRpb25zLnVybCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHsgUG9zdGFsQ29kZTogcGMgfSxcclxuICAgICAgICAgICAgICAgIGNhY2hlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdKU09OJyxcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5SZXN1bHQuSXNWYWxpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5hZGRDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50ZXh0KCcnKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYW4gc3VtbWFyeSBlcnJvcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJz4gdWwgPiBsaScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS50ZXh0KCkgPT0gbXNnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdpbnB1dC12YWxpZGF0aW9uLWVycm9yJykucmVtb3ZlQ2xhc3MoJ3ZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5zaWJsaW5ncygnLmZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8c3BhbiBmb3I9XCInICsgJHQuYXR0cignbmFtZScpICsgJ1wiIGdlbmVyYXRlZD1cInRydWVcIj4nICsgbXNnICsgJzwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBzdW1tYXJ5IGVycm9yIChpZiB0aGVyZSBpcyBub3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNoaWxkcmVuKCd1bCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGxpPicgKyBtc2cgKyAnPC9saT4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTsiLCIvKiogQXBwbHkgZXZlciBhIHJlZGlyZWN0IHRvIHRoZSBnaXZlbiBVUkwsIGlmIHRoaXMgaXMgYW4gaW50ZXJuYWwgVVJMIG9yIHNhbWVcclxucGFnZSwgaXQgZm9yY2VzIGEgcGFnZSByZWxvYWQgZm9yIHRoZSBnaXZlbiBVUkwuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZWRpcmVjdFRvKHVybCkge1xyXG4gICAgLy8gQmxvY2sgdG8gYXZvaWQgbW9yZSB1c2VyIGludGVyYWN0aW9uczpcclxuICAgICQuYmxvY2tVSSh7IG1lc3NhZ2U6ICcnIH0pOyAvL2xvYWRpbmdCbG9jayk7XHJcbiAgICAvLyBDaGVja2luZyBpZiBpcyBiZWluZyByZWRpcmVjdGluZyBvciBub3RcclxuICAgIHZhciByZWRpcmVjdGVkID0gZmFsc2U7XHJcbiAgICAkKHdpbmRvdykub24oJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uIGNoZWNrUmVkaXJlY3QoKSB7XHJcbiAgICAgICAgcmVkaXJlY3RlZCA9IHRydWU7XHJcbiAgICB9KTtcclxuICAgIC8vIE5hdmlnYXRlIHRvIG5ldyBsb2NhdGlvbjpcclxuICAgIHdpbmRvdy5sb2NhdGlvbiA9IHVybDtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIElmIHBhZ2Ugbm90IGNoYW5nZWQgKHNhbWUgdXJsIG9yIGludGVybmFsIGxpbmspLCBwYWdlIGNvbnRpbnVlIGV4ZWN1dGluZyB0aGVuIHJlZnJlc2g6XHJcbiAgICAgICAgaWYgKCFyZWRpcmVjdGVkKVxyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9LCA1MCk7XHJcbn07XHJcbiIsIi8qKiBTYW5pdGl6ZSB0aGUgd2hpdGVzcGFjZXMgaW4gYSB0ZXh0IGJ5OlxyXG4tIHJlcGxhY2luZyBjb250aWd1b3VzIHdoaXRlc3BhY2VzIGNoYXJhY3RlcmVzIChhbnkgbnVtYmVyIG9mIHJlcGV0aXRpb24gXHJcbmFuZCBhbnkga2luZCBvZiB3aGl0ZSBjaGFyYWN0ZXIpIGJ5IGEgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbi0gcmVwbGFjZSBlbmNvZGVkIG5vbi1icmVha2luZy1zcGFjZXMgYnkgYSBub3JtYWwgd2hpdGUtc3BhY2VcclxuLSByZW1vdmUgc3RhcnRpbmcgYW5kIGVuZGluZyB3aGl0ZS1zcGFjZXNcclxuLSBldmVyIHJldHVybiBhIHN0cmluZywgZW1wdHkgd2hlbiBudWxsXHJcbioqL1xyXG5mdW5jdGlvbiBzYW5pdGl6ZVdoaXRlc3BhY2VzKHRleHQpIHtcclxuICAgIC8vIEV2ZXIgcmV0dXJuIGEgc3RyaW5nLCBlbXB0eSB3aGVuIG51bGxcclxuICAgIHRleHQgPSAodGV4dCB8fCAnJylcclxuICAgIC8vIFJlcGxhY2UgYW55IGtpbmQgb2YgY29udGlndW91cyB3aGl0ZXNwYWNlcyBjaGFyYWN0ZXJzIGJ5IGEgc2luZ2xlIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4gICAgLy8gKHRoYXRzIGluY2x1ZGUgcmVwbGFjZSBlbmNvbmRlZCBub24tYnJlYWtpbmctc3BhY2VzLFxyXG4gICAgLy8gYW5kIGR1cGxpY2F0ZWQtcmVwZWF0ZWQgYXBwZWFyYW5jZXMpXHJcbiAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xyXG4gICAgLy8gUmVtb3ZlIHN0YXJ0aW5nIGFuZCBlbmRpbmcgd2hpdGVzcGFjZXNcclxuICAgIHJldHVybiAkLnRyaW0odGV4dCk7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHNhbml0aXplV2hpdGVzcGFjZXM7IiwiLyoqIEN1c3RvbSBMb2Nvbm9taWNzICdsaWtlIGJsb2NrVUknIHBvcHVwc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSxcclxuICAgIGF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4vYXV0b0ZvY3VzJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxuXHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrKGNvbnRlbnRCb3gsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7XHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgY2xvc2FibGU6IGZhbHNlLFxyXG4gICAgICAgIGNlbnRlcjogZmFsc2UsXHJcbiAgICAgICAgLyogYXMgYSB2YWxpZCBvcHRpb25zIHBhcmFtZXRlciBmb3IgTEMuaGlkZUVsZW1lbnQgZnVuY3Rpb24gKi9cclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZHVyYXRpb246IDYwMCxcclxuICAgICAgICAgICAgZWZmZWN0OiAnZmFkZSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgICAgICBhdXRvZm9jdXNPcHRpb25zOiB7IG1hcmdpblRvcDogNjAgfSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBjb250ZW50Qm94ID0gJChjb250ZW50Qm94KTtcclxuICAgIHZhciBmdWxsID0gZmFsc2U7XHJcbiAgICBpZiAoYmxvY2tlZCA9PSBkb2N1bWVudCB8fCBibG9ja2VkID09IHdpbmRvdykge1xyXG4gICAgICAgIGJsb2NrZWQgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgZnVsbCA9IHRydWU7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBibG9ja2VkID0gJChibG9ja2VkKTtcclxuXHJcbiAgICB2YXIgYm94SW5zaWRlQmxvY2tlZCA9ICFibG9ja2VkLmlzKCdib2R5LHRyLHRoZWFkLHRib2R5LHRmb290LHRhYmxlLHVsLG9sLGRsJyk7XHJcblxyXG4gICAgLy8gR2V0dGluZyBib3ggZWxlbWVudCBpZiBleGlzdHMgYW5kIHJlZmVyZW5jaW5nXHJcbiAgICB2YXIgYklEID0gYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJyk7XHJcbiAgICBpZiAoIWJJRClcclxuICAgICAgICBiSUQgPSAoY29udGVudEJveC5hdHRyKCdpZCcpIHx8ICcnKSArIChibG9ja2VkLmF0dHIoJ2lkJykgfHwgJycpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICBpZiAoYklEID09ICctc21vb3RoQm94QmxvY2snKSB7XHJcbiAgICAgICAgYklEID0gJ2lkLScgKyBndWlkR2VuZXJhdG9yKCkgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIH1cclxuICAgIGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcsIGJJRCk7XHJcbiAgICB2YXIgYm94ID0gJCgnIycgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGJJRCkpO1xyXG4gICAgLy8gSGlkaW5nIGJveDpcclxuICAgIGlmIChjb250ZW50Qm94Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGJveC54aGlkZShvcHRpb25zLmNsb3NlT3B0aW9ucyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIGJveGM7XHJcbiAgICBpZiAoYm94Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGJveGMgPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1lbGVtZW50XCIvPicpO1xyXG4gICAgICAgIGJveCA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLW92ZXJsYXlcIj48L2Rpdj4nKTtcclxuICAgICAgICBib3guYWRkQ2xhc3MoYWRkY2xhc3MpO1xyXG4gICAgICAgIGlmIChmdWxsKSBib3guYWRkQ2xhc3MoJ2Z1bGwtYmxvY2snKTtcclxuICAgICAgICBib3guYXBwZW5kKGJveGMpO1xyXG4gICAgICAgIGJveC5hdHRyKCdpZCcsIGJJRCk7XHJcbiAgICAgICAgaWYgKGJveEluc2lkZUJsb2NrZWQpXHJcbiAgICAgICAgICAgIGJsb2NrZWQuYXBwZW5kKGJveCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKGJveCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGJveGMgPSBib3guY2hpbGRyZW4oJy5zbW9vdGgtYm94LWJsb2NrLWVsZW1lbnQnKTtcclxuICAgIH1cclxuICAgIC8vIEhpZGRlbiBmb3IgdXNlciwgYnV0IGF2YWlsYWJsZSB0byBjb21wdXRlOlxyXG4gICAgY29udGVudEJveC5zaG93KCk7XHJcbiAgICBib3guc2hvdygpLmNzcygnb3BhY2l0eScsIDApO1xyXG4gICAgLy8gU2V0dGluZyB1cCB0aGUgYm94IGFuZCBzdHlsZXMuXHJcbiAgICBib3hjLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICBpZiAob3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICBib3hjLmFwcGVuZCgkKCc8YSBjbGFzcz1cImNsb3NlLXBvcHVwIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicpKTtcclxuICAgIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycsIG9wdGlvbnMpO1xyXG4gICAgaWYgKCFib3hjLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnKSlcclxuICAgICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKCkgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7IHJldHVybiBmYWxzZTsgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJylcclxuICAgICAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJyk7XHJcbiAgICAgICAgLy9vZmZzID0gYmxvY2tlZC5wb3NpdGlvbigpO1xyXG4gICAgICAgIGJveC5jc3MoJ3RvcCcsIDApO1xyXG4gICAgICAgIGJveC5jc3MoJ2xlZnQnLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gb3V0c2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50LCBhcyBhIGRpcmVjdCBjaGlsZCBvZiBCb2R5OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBNYXRoLmZsb29yKE51bWJlci5NQVhfVkFMVUUpKTtcclxuICAgICAgICBib3guY3NzKGJsb2NrZWQub2Zmc2V0KCkpO1xyXG4gICAgfVxyXG4gICAgLy8gRGltZW5zaW9ucyBtdXN0IGJlIGNhbGN1bGF0ZWQgYWZ0ZXIgYmVpbmcgYXBwZW5kZWQgYW5kIHBvc2l0aW9uIHR5cGUgYmVpbmcgc2V0OlxyXG4gICAgYm94LndpZHRoKGJsb2NrZWQub3V0ZXJXaWR0aCgpKTtcclxuICAgIGJveC5oZWlnaHQoYmxvY2tlZC5vdXRlckhlaWdodCgpKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5jZW50ZXIpIHtcclxuICAgICAgICBib3hjLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgICAgICB2YXIgY2wsIGN0O1xyXG4gICAgICAgIGlmIChmdWxsKSB7XHJcbiAgICAgICAgICAgIGN0ID0gc2NyZWVuLmhlaWdodCAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gc2NyZWVuLndpZHRoIC8gMjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdCA9IGJveC5vdXRlckhlaWdodCh0cnVlKSAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gYm94Lm91dGVyV2lkdGgodHJ1ZSkgLyAyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBib3hjLmNzcygndG9wJywgY3QgLSBib3hjLm91dGVySGVpZ2h0KHRydWUpIC8gMik7XHJcbiAgICAgICAgYm94Yy5jc3MoJ2xlZnQnLCBjbCAtIGJveGMub3V0ZXJXaWR0aCh0cnVlKSAvIDIpO1xyXG4gICAgfVxyXG4gICAgLy8gTGFzdCBzZXR1cFxyXG4gICAgYXV0b0ZvY3VzKGJveCk7XHJcbiAgICAvLyBTaG93IGJsb2NrXHJcbiAgICBib3guYW5pbWF0ZSh7IG9wYWNpdHk6IDEgfSwgMzAwKTtcclxuICAgIGlmIChvcHRpb25zLmF1dG9mb2N1cylcclxuICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50Qm94LCBvcHRpb25zLmF1dG9mb2N1c09wdGlvbnMpO1xyXG4gICAgcmV0dXJuIGJveDtcclxufVxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsKGNvbnRhaW5lcikge1xyXG4gICAgJChjb250YWluZXIgfHwgZG9jdW1lbnQpLmZpbmQoJy5zbW9vdGgtYm94LWJsb2NrLW92ZXJsYXknKS5oaWRlKCk7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvcGVuOiBzbW9vdGhCb3hCbG9jayxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHsgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpOyB9LFxyXG4gICAgICAgIGNsb3NlQWxsOiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsXHJcbiAgICB9OyIsIi8qKlxyXG4qKiBNb2R1bGU6OiB0b29sdGlwc1xyXG4qKiBDcmVhdGVzIHNtYXJ0IHRvb2x0aXBzIHdpdGggcG9zc2liaWxpdGllcyBmb3Igb24gaG92ZXIgYW5kIG9uIGNsaWNrLFxyXG4qKiBhZGRpdGlvbmFsIGRlc2NyaXB0aW9uIG9yIGV4dGVybmFsIHRvb2x0aXAgY29udGVudC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lm91dGVySHRtbCcpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5pc0NoaWxkT2YnKTtcclxuXHJcbi8vIE1haW4gaW50ZXJuYWwgcHJvcGVydGllc1xyXG52YXIgcG9zb2Zmc2V0ID0geyB4OiAxNiwgeTogOCB9O1xyXG52YXIgc2VsZWN0b3IgPSAnW3RpdGxlXVtkYXRhLWRlc2NyaXB0aW9uXSwgW3RpdGxlXS5oYXMtdG9vbHRpcCwgW3RpdGxlXS5zZWN1cmUtZGF0YSwgW2RhdGEtdG9vbHRpcC11cmxdLCBbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJztcclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0aGUgdG9vbHRpcCBkZXBlbmRpbmcgb24gdGhlXHJcbmV2ZW50IG9yIHRoZSB0YXJnZXQgZWxlbWVudCBwb3NpdGlvbiBhbmQgYW4gb2Zmc2V0XHJcbioqL1xyXG5mdW5jdGlvbiBwb3ModCwgZSwgbCkge1xyXG4gICAgdmFyIHgsIHk7XHJcbiAgICBpZiAoZS5wYWdlWCAmJiBlLnBhZ2VZKSB7XHJcbiAgICAgICAgeCA9IGUucGFnZVg7XHJcbiAgICAgICAgeSA9IGUucGFnZVk7XHJcbiAgICB9IGVsc2UgaWYgKGUudGFyZ2V0KSB7XHJcbiAgICAgICAgdmFyICRldCA9ICQoZS50YXJnZXQpO1xyXG4gICAgICAgIHggPSAkZXQub3V0ZXJXaWR0aCgpICsgJGV0Lm9mZnNldCgpLmxlZnQ7XHJcbiAgICAgICAgeSA9ICRldC5vdXRlckhlaWdodCgpICsgJGV0Lm9mZnNldCgpLnRvcDtcclxuICAgIH1cclxuICAgIHQuY3NzKCdsZWZ0JywgeCArIHBvc29mZnNldC54KTtcclxuICAgIHQuY3NzKCd0b3AnLCB5ICsgcG9zb2Zmc2V0LnkpO1xyXG4gICAgLy8gQWRqdXN0IHdpZHRoIHRvIHZpc2libGUgdmlld3BvcnRcclxuICAgIHZhciB0ZGlmID0gdC5vdXRlcldpZHRoKCkgLSB0LndpZHRoKCk7XHJcbiAgICB0LmNzcygnbWF4LXdpZHRoJywgJCh3aW5kb3cpLndpZHRoKCkgLSB4IC0gcG9zb2Zmc2V0LnggLSB0ZGlmKTtcclxuICAgIC8vdC5oZWlnaHQoJChkb2N1bWVudCkuaGVpZ2h0KCkgLSB5IC0gcG9zb2Zmc2V0LnkpO1xyXG59XHJcbi8qKiBHZXQgb3IgY3JlYXRlLCBhbmQgcmV0dXJucywgdGhlIHRvb2x0aXAgY29udGVudCBmb3IgdGhlIGVsZW1lbnRcclxuKiovXHJcbmZ1bmN0aW9uIGNvbihsKSB7XHJcbiAgICBpZiAobC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGMgPSBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcpLFxyXG4gICAgICAgIHBlcnNpc3RlbnQgPSBsLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcpO1xyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgdmFyIGggPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuYXR0cigndGl0bGUnKSk7XHJcbiAgICAgICAgdmFyIGQgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuZGF0YSgnZGVzY3JpcHRpb24nKSk7XHJcbiAgICAgICAgaWYgKGQpXHJcbiAgICAgICAgICAgIGMgPSAnPGg0PicgKyBoICsgJzwvaDQ+PHA+JyArIGQgKyAnPC9wPic7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjID0gaDtcclxuICAgICAgICAvLyBBcHBlbmQgZGF0YS10b29sdGlwLXVybCBjb250ZW50IGlmIGV4aXN0c1xyXG4gICAgICAgIHZhciB1cmxjb250ZW50ID0gJChsLmRhdGEoJ3Rvb2x0aXAtdXJsJykpO1xyXG4gICAgICAgIGMgPSAoYyB8fCAnJykgKyB1cmxjb250ZW50Lm91dGVySHRtbCgpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBvcmlnaW5hbCwgaXMgbm8gbW9yZSBuZWVkIGFuZCBhdm9pZCBpZC1jb25mbGljdHNcclxuICAgICAgICB1cmxjb250ZW50LnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIFNhdmUgdG9vbHRpcCBjb250ZW50XHJcbiAgICAgICAgbC5kYXRhKCd0b29sdGlwLWNvbnRlbnQnLCBjKTtcclxuICAgICAgICAvLyBSZW1vdmUgYnJvd3NlciB0b29sdGlwIChib3RoIHdoZW4gd2UgYXJlIHVzaW5nIG91ciBvd24gdG9vbHRpcCBhbmQgd2hlbiBubyB0b29sdGlwXHJcbiAgICAgICAgLy8gaXMgbmVlZClcclxuICAgICAgICBsLmF0dHIoJ3RpdGxlJywgJycpO1xyXG4gICAgfVxyXG4gICAgLy8gUmVtb3ZlIHRvb2x0aXAgY29udGVudCAoYnV0IHByZXNlcnZlIGl0cyBjYWNoZSBpbiB0aGUgZWxlbWVudCBkYXRhKVxyXG4gICAgLy8gaWYgaXMgdGhlIHNhbWUgdGV4dCBhcyB0aGUgZWxlbWVudCBjb250ZW50IGFuZCB0aGUgZWxlbWVudCBjb250ZW50XHJcbiAgICAvLyBpcyBmdWxseSB2aXNpYmxlLiBUaGF0cywgZm9yIGNhc2VzIHdpdGggZGlmZmVyZW50IGNvbnRlbnQsIHdpbGwgYmUgc2hvd2VkLFxyXG4gICAgLy8gYW5kIGZvciBjYXNlcyB3aXRoIHNhbWUgY29udGVudCBidXQgaXMgbm90IHZpc2libGUgYmVjYXVzZSB0aGUgZWxlbWVudFxyXG4gICAgLy8gb3IgY29udGFpbmVyIHdpZHRoLCB0aGVuIHdpbGwgYmUgc2hvd2VkLlxyXG4gICAgLy8gRXhjZXB0IGlmIGlzIHBlcnNpc3RlbnRcclxuICAgIGlmIChwZXJzaXN0ZW50ICE9PSB0cnVlICYmXHJcbiAgICAgICAgc2FuaXRpemVXaGl0ZXNwYWNlcyhsLnRleHQoKSkgPT0gYyAmJlxyXG4gICAgICAgIGwub3V0ZXJXaWR0aCgpID49IGxbMF0uc2Nyb2xsV2lkdGgpIHtcclxuICAgICAgICBjID0gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIGNvbnRlbnQ6XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdGFyZ2V0IHJlbW92aW5nIHRoZSBjbGFzcyB0byBhdm9pZCBjc3MgbWFya2luZyB0b29sdGlwIHdoZW4gdGhlcmUgaXMgbm90XHJcbiAgICAgICAgbC5yZW1vdmVDbGFzcygnaGFzLXRvb2x0aXAnKS5yZW1vdmVDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIH1cclxuICAgIC8vIFJldHVybiB0aGUgY29udGVudCBhcyBzdHJpbmc6XHJcbiAgICByZXR1cm4gYztcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZXMgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBmb3IgYSB0b29sdGlwIG9mIHRoZSBnaXZlbiB0eXBlXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRUb29sdGlwKHR5cGUpIHtcclxuICAgIHR5cGUgPSB0eXBlIHx8ICd0b29sdGlwJztcclxuICAgIHZhciBpZCA9ICdzaW5nbGV0b24tJyArIHR5cGU7XHJcbiAgICB2YXIgdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgIGlmICghdCkge1xyXG4gICAgICAgIHQgPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIiBjbGFzcz1cInRvb2x0aXBcIj48L2Rpdj4nKTtcclxuICAgICAgICB0LmF0dHIoJ2lkJywgaWQpO1xyXG4gICAgICAgIHQuaGlkZSgpO1xyXG4gICAgICAgICQoJ2JvZHknKS5hcHBlbmQodCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJCh0KTtcclxufVxyXG4vKiogU2hvdyB0aGUgdG9vbHRpcCBvbiBhbiBldmVudCB0cmlnZ2VyZWQgYnkgdGhlIGVsZW1lbnQgY29udGFpbmluZ1xyXG5pbmZvcm1hdGlvbiBmb3IgYSB0b29sdGlwXHJcbioqL1xyXG5mdW5jdGlvbiBzaG93VG9vbHRpcChlKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGlzUG9wdXAgPSAkdC5oYXNDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIC8vIEdldCBvciBjcmVhdGUgdG9vbHRpcCBsYXllclxyXG4gICAgdmFyIHQgPSBnZXRUb29sdGlwKGlzUG9wdXAgPyAncG9wdXAtdG9vbHRpcCcgOiAndG9vbHRpcCcpO1xyXG4gICAgLy8gSWYgdGhpcyBpcyBub3QgcG9wdXAgYW5kIHRoZSBldmVudCBpcyBjbGljaywgZGlzY2FyZCB3aXRob3V0IGNhbmNlbCBldmVudFxyXG4gICAgaWYgKCFpc1BvcHVwICYmIGUudHlwZSA9PSAnY2xpY2snKVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIC8vIENyZWF0ZSBjb250ZW50OiBpZiB0aGVyZSBpcyBjb250ZW50LCBjb250aW51ZVxyXG4gICAgdmFyIGNvbnRlbnQgPSBjb24oJHQpO1xyXG4gICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAvLyBJZiBpcyBhIGhhcy1wb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBkb24ndCBzaG93XHJcbiAgICAgICAgaWYgKGlzUG9wdXAgJiYgZS50eXBlICE9ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vIFRoZSB0b29sdGlwIHNldHVwIG11c3QgYmUgcXVldWVkIHRvIGF2b2lkIGNvbnRlbnQgdG8gYmUgc2hvd2VkIGFuZCBwbGFjZWRcclxuICAgICAgICAvLyB3aGVuIHN0aWxsIGhpZGRlbiB0aGUgcHJldmlvdXNcclxuICAgICAgICB0LnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gU2V0IHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgICAgICB0Lmh0bWwoY29udGVudCk7XHJcbiAgICAgICAgICAgIC8vIEZvciBwb3B1cHMsIHNldHVwIGNsYXNzIGFuZCBjbG9zZSBidXR0b25cclxuICAgICAgICAgICAgaWYgKGlzUG9wdXApIHtcclxuICAgICAgICAgICAgICAgIHQuYWRkQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKTtcclxuICAgICAgICAgICAgICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxhIGhyZWY9XCIjY2xvc2UtcG9wdXBcIiBjbGFzcz1cImNsb3NlLWFjdGlvblwiPlg8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0LmFwcGVuZChjbG9zZUJ1dHRvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICAgICAgcG9zKHQsIGUsICR0KTtcclxuICAgICAgICAgICAgdC5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgIC8vIFNob3cgKGFuaW1hdGlvbnMgYXJlIHN0b3BwZWQgb25seSBvbiBoaWRlIHRvIGF2b2lkIGNvbmZsaWN0cylcclxuICAgICAgICAgICAgdC5mYWRlSW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdG9wIGJ1YmJsaW5nIGFuZCBkZWZhdWx0XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEhpZGUgYWxsIG9wZW5lZCB0b29sdGlwcywgZm9yIGFueSB0eXBlLlxyXG5JdCBoYXMgc29tZSBzcGVjaWFsIGNvbnNpZGVyYXRpb25zIGZvciBwb3B1cC10b29sdGlwcyBkZXBlbmRpbmdcclxub24gdGhlIGV2ZW50IGJlaW5nIHRyaWdnZXJlZC5cclxuKiovXHJcbmZ1bmN0aW9uIGhpZGVUb29sdGlwKGUpIHtcclxuICAgICQoJy50b29sdGlwOnZpc2libGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBvciB0aGUgaW52ZXJzZSxcclxuICAgICAgICAvLyB0aGlzIGlzIG5vdCBhIHBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgYSBjbGljaywgZG8gbm90aGluZ1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlICE9ICdjbGljaycgfHxcclxuICAgICAgICAgICAgIXQuaGFzQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKSAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIFN0b3AgYW5pbWF0aW9ucyBhbmQgaGlkZVxyXG4gICAgICAgIHQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEluaXRpYWxpemUgdG9vbHRpcHNcclxuKiovXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyB0byBzaG93L2hpZGUgdG9vbHRpcHNcclxuICAgICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlIGZvY3VzaW4nLCBzZWxlY3Rvciwgc2hvd1Rvb2x0aXApXHJcbiAgICAub24oJ21vdXNlbGVhdmUgZm9jdXNvdXQnLCBzZWxlY3RvciwgaGlkZVRvb2x0aXApXHJcbiAgICAvLyBMaXN0ZW4gZXZlbnQgZm9yIGNsaWNrYWJsZSBwb3B1cC10b29sdGlwc1xyXG4gICAgLm9uKCdjbGljaycsICdbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJywgc2hvd1Rvb2x0aXApXHJcbiAgICAvLyBBbGxvd2luZyBidXR0b25zIGluc2lkZSB0aGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcudG9vbHRpcC1idXR0b24nLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgIC8vIEFkZGluZyBjbG9zZS10b29sdGlwIGhhbmRsZXIgZm9yIHBvcHVwLXRvb2x0aXBzIChjbGljayBvbiBhbnkgZWxlbWVudCBleGNlcHQgdGhlIHRvb2x0aXAgaXRzZWxmKVxyXG4gICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKCcucG9wdXAtdG9vbHRpcDp2aXNpYmxlJykuZ2V0KDApO1xyXG4gICAgICAgIC8vIElmIHRoZSBjbGljayBpcyBOb3Qgb24gdGhlIHRvb2x0aXAgb3IgYW55IGVsZW1lbnQgY29udGFpbmVkXHJcbiAgICAgICAgLy8gaGlkZSB0b29sdGlwXHJcbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9IHQgJiYgISQoZS50YXJnZXQpLmlzQ2hpbGRPZih0KSlcclxuICAgICAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KVxyXG4gICAgLy8gQXZvaWQgY2xvc2UtYWN0aW9uIGNsaWNrIGZyb20gcmVkaXJlY3QgcGFnZSwgYW5kIGhpZGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcucG9wdXAtdG9vbHRpcCAuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KTtcclxuICAgIHVwZGF0ZSgpO1xyXG59XHJcbi8qKiBVcGRhdGUgZWxlbWVudHMgb24gdGhlIHBhZ2UgdG8gcmVmbGVjdCBjaGFuZ2VzIG9yIG5lZWQgZm9yIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoZWxlbWVudF9zZWxlY3Rvcikge1xyXG4gICAgLy8gUmV2aWV3IGV2ZXJ5IHBvcHVwIHRvb2x0aXAgdG8gcHJlcGFyZSBjb250ZW50IGFuZCBtYXJrL3VubWFyayB0aGUgbGluayBvciB0ZXh0OlxyXG4gICAgJChlbGVtZW50X3NlbGVjdG9yIHx8IHNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb24oJCh0aGlzKSk7XHJcbiAgICB9KTtcclxufVxyXG4vKiogQ3JlYXRlIHRvb2x0aXAgb24gZWxlbWVudCBieSBkZW1hbmRcclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZV90b29sdGlwKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCB7XHJcbiAgICAgIHRpdGxlOiAnJ1xyXG4gICAgICAsIGRlc2NyaXB0aW9uOiBudWxsXHJcbiAgICAgICwgdXJsOiBudWxsXHJcbiAgICAgICwgaXNfcG9wdXA6IGZhbHNlXHJcbiAgICAgICwgcGVyc2lzdGVudDogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoZWxlbWVudClcclxuICAgIC5hdHRyKCd0aXRsZScsIHNldHRpbmdzLnRpdGxlKVxyXG4gICAgLmRhdGEoJ2Rlc2NyaXB0aW9uJywgc2V0dGluZ3MuZGVzY3JpcHRpb24pXHJcbiAgICAuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJywgc2V0dGluZ3MucGVyc2lzdGVudClcclxuICAgIC5hZGRDbGFzcyhzZXR0aW5ncy5pc19wb3B1cCA/ICdoYXMtcG9wdXAtdG9vbHRpcCcgOiAnaGFzLXRvb2x0aXAnKTtcclxuICAgIHVwZGF0ZShlbGVtZW50KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdFRvb2x0aXBzOiBpbml0LFxyXG4gICAgICAgIHVwZGF0ZVRvb2x0aXBzOiB1cGRhdGUsXHJcbiAgICAgICAgY3JlYXRlVG9vbHRpcDogY3JlYXRlX3Rvb2x0aXBcclxuICAgIH07XHJcbiIsIi8qIFNvbWUgdG9vbHMgZm9ybSBVUkwgbWFuYWdlbWVudFxyXG4qL1xyXG5leHBvcnRzLmdldFVSTFBhcmFtZXRlciA9IGZ1bmN0aW9uIGdldFVSTFBhcmFtZXRlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gZGVjb2RlVVJJKFxyXG4gICAgICAgIChSZWdFeHAobmFtZSArICc9JyArICcoLis/KSgmfCQpJywgJ2knKS5leGVjKGxvY2F0aW9uLnNlYXJjaCkgfHwgWywgbnVsbF0pWzFdKTtcclxufTtcclxuZXhwb3J0cy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSBmdW5jdGlvbiBnZXRIYXNoQmFuZ1BhcmFtZXRlcnMoaGFzaGJhbmd2YWx1ZSkge1xyXG4gICAgLy8gSGFzaGJhbmd2YWx1ZSBpcyBzb21ldGhpbmcgbGlrZTogVGhyZWFkLTFfTWVzc2FnZS0yXHJcbiAgICAvLyBXaGVyZSAnMScgaXMgdGhlIFRocmVhZElEIGFuZCAnMicgdGhlIG9wdGlvbmFsIE1lc3NhZ2VJRCwgb3Igb3RoZXIgcGFyYW1ldGVyc1xyXG4gICAgdmFyIHBhcnMgPSBoYXNoYmFuZ3ZhbHVlLnNwbGl0KCdfJyk7XHJcbiAgICB2YXIgdXJsUGFyYW1ldGVycyA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHBhcnN2YWx1ZXMgPSBwYXJzW2ldLnNwbGl0KCctJyk7XHJcbiAgICAgICAgaWYgKHBhcnN2YWx1ZXMubGVuZ3RoID09IDIpXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSBwYXJzdmFsdWVzWzFdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXJsUGFyYW1ldGVyc1twYXJzdmFsdWVzWzBdXSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXJsUGFyYW1ldGVycztcclxufTtcclxuIiwiLyoqIFZhbGlkYXRpb24gbG9naWMgd2l0aCBsb2FkIGFuZCBzZXR1cCBvZiB2YWxpZGF0b3JzIGFuZCBcclxuICAgIHZhbGlkYXRpb24gcmVsYXRlZCB1dGlsaXRpZXNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbi8vIFVzaW5nIG9uIHNldHVwIGFzeW5jcm9ub3VzIGxvYWQgaW5zdGVhZCBvZiB0aGlzIHN0YXRpYy1saW5rZWQgbG9hZFxyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qcycpO1xyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qcycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBWYWxpZGF0aW9uKHJlYXBwbHlPbmx5VG8pIHtcclxuICAgIHJlYXBwbHlPbmx5VG8gPSByZWFwcGx5T25seVRvIHx8IGRvY3VtZW50O1xyXG4gICAgaWYgKCF3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkgd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmICghanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkge1xyXG4gICAgICAgIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKFtcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qc1wiIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanNcIiB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDaGVjayBmaXJzdCBpZiB2YWxpZGF0aW9uIGlzIGVuYWJsZWQgKGNhbiBoYXBwZW4gdGhhdCB0d2ljZSBpbmNsdWRlcyBvZlxyXG4gICAgICAgIC8vIHRoaXMgY29kZSBoYXBwZW4gYXQgc2FtZSBwYWdlLCBiZWluZyBleGVjdXRlZCB0aGlzIGNvZGUgYWZ0ZXIgZmlyc3QgYXBwZWFyYW5jZVxyXG4gICAgICAgIC8vIHdpdGggdGhlIHN3aXRjaCBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkIGNoYW5nZWRcclxuICAgICAgICAvLyBidXQgd2l0aG91dCB2YWxpZGF0aW9uIGJlaW5nIGFscmVhZHkgbG9hZGVkIGFuZCBlbmFibGVkKVxyXG4gICAgICAgIGlmICgkICYmICQudmFsaWRhdG9yICYmICQudmFsaWRhdG9yLnVub2J0cnVzaXZlKSB7XHJcbiAgICAgICAgICAgIC8vIEFwcGx5IHRoZSB2YWxpZGF0aW9uIHJ1bGVzIHRvIHRoZSBuZXcgZWxlbWVudHNcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd2YWxpZGF0b3InKTtcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICAgICAgJC52YWxpZGF0b3IudW5vYnRydXNpdmUucGFyc2UocmVhcHBseU9ubHlUbyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXRpZXMgKi9cclxuXHJcbi8qIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzIG9mIHRoZSB2YWxpZGF0aW9uIHN1bW1hcnlcclxuaW5jbHVkZWQgaW4gJ2NvbnRhaW5lcicgYW5kIHNldCBhcyB2YWxpZCB0aGUgc3VtbWFyeVxyXG4qL1xyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgICAkKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAuZmluZCgnPnVsPmxpJykucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gU2V0IGFsbCBmaWVsZHMgdmFsaWRhdGlvbiBpbnNpZGUgdGhpcyBmb3JtIChhZmZlY3RlZCBieSB0aGUgc3VtbWFyeSB0b28pXHJcbiAgICAvLyBhcyB2YWxpZCB0b29cclxuICAgICQoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAudGV4dCgnJyk7XHJcblxyXG4gICAgLy8gUmUtYXBwbHkgc2V0dXAgdmFsaWRhdGlvbiB0byBlbnN1cmUgaXMgd29ya2luZywgYmVjYXVzZSBqdXN0IGFmdGVyIGEgc3VjY2Vzc2Z1bFxyXG4gICAgLy8gdmFsaWRhdGlvbiwgYXNwLm5ldCB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIHN0b3BzIHdvcmtpbmcgb24gY2xpZW50LXNpZGUuXHJcbiAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGNvbnRhaW5lcikge1xyXG4gIHZhciB2ID0gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcik7XHJcbiAgdi5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSkge1xyXG4gICAgdmFyIG9mZiA9IGZvcm0uZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5vZmZzZXQoKTtcclxuICAgIGlmIChvZmYpXHJcbiAgICAgICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBvZmYudG9wIH0sIDUwMCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignZ29Ub1N1bW1hcnlFcnJvcnM6IG5vIHN1bW1hcnkgdG8gZm9jdXMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcikge1xyXG4gIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudDtcclxuICByZXR1cm4gJCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZXR1cDogc2V0dXBWYWxpZGF0aW9uLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQsXHJcbiAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3I6IHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcixcclxuICAgIGdvVG9TdW1tYXJ5RXJyb3JzOiBnb1RvU3VtbWFyeUVycm9ycyxcclxuICAgIGZpbmRWYWxpZGF0aW9uU3VtbWFyeTogZmluZFZhbGlkYXRpb25TdW1tYXJ5XHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIEFjY291bnQgcGFnZXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC5vbignY2xpY2snLCAnYS5sb2dpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArICdBY2NvdW50LyRMb2dpbi8/UmV0dXJuVXJsPScgKyBlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5yZWdpc3RlcicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9SZWdpc3RlcicsICcvQWNjb3VudC8kUmVnaXN0ZXInKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQ1MCwgaGVpZ2h0OiA1MDAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5mb3Jnb3QtcGFzc3dvcmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvRm9yZ290UGFzc3dvcmQnLCAnL0FjY291bnQvJEZvcmdvdFBhc3N3b3JkJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MDAsIGhlaWdodDogMjQwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuY2hhbmdlLXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0NoYW5nZVBhc3N3b3JkJywgJy9BY2NvdW50LyRDaGFuZ2VQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDUwLCBoZWlnaHQ6IDM0MCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvLyBPVVIgbmFtZXNwYWNlIChhYmJyZXZpYXRlZCBMb2Nvbm9taWNzKVxyXG53aW5kb3cuTEMgPSB3aW5kb3cuTEMgfHwge307XHJcblxyXG4vLyBUT0RPIFJldmlldyBMY1VybCB1c2UgYXJvdW5kIGFsbCB0aGUgbW9kdWxlcywgdXNlIERJIHdoZW5ldmVyIHBvc3NpYmxlIChpbml0L3NldHVwIG1ldGhvZCBvciBpbiB1c2UgY2FzZXMpXHJcbi8vIGJ1dCBvbmx5IGZvciB0aGUgd2FudGVkIGJhc2VVcmwgb24gZWFjaCBjYXNlIGFuZCBub3QgcGFzcyBhbGwgdGhlIExjVXJsIG9iamVjdC5cclxuLy8gTGNVcmwgaXMgc2VydmVyLXNpZGUgZ2VuZXJhdGVkIGFuZCB3cm90ZSBpbiBhIExheW91dCBzY3JpcHQtdGFnLlxyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzXHJcbndpbmRvdy5nTG9hZGluZ1JldGFyZCA9IDMwMDtcclxuXHJcbi8qKipcclxuICoqIExvYWRpbmcgbW9kdWxlc1xyXG4qKiovXHJcbi8vVE9ETzogQ2xlYW4gZGVwZW5kZW5jaWVzLCByZW1vdmUgYWxsIHRoYXQgbm90IHVzZWQgZGlyZWN0bHkgaW4gdGhpcyBmaWxlLCBhbnkgb3RoZXIgZmlsZVxyXG4vLyBvciBwYWdlIG11c3QgcmVxdWlyZSBpdHMgZGVwZW5kZW5jaWVzLlxyXG5cclxud2luZG93LkxjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKTtcclxuXHJcbi8qIGpRdWVyeSwgc29tZSB2ZW5kb3IgcGx1Z2lucyAoZnJvbSBidW5kbGUpIGFuZCBvdXIgYWRkaXRpb25zIChzbWFsbCBwbHVnaW5zKSwgdGhleSBhcmUgYXV0b21hdGljYWxseSBwbHVnLWVkIG9uIHJlcXVpcmUgKi9cclxudmFyICQgPSB3aW5kb3cuJCA9IHdpbmRvdy5qUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmEtaGFzaGNoYW5nZScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkuYXJlJyk7XHJcbi8vIE1hc2tlZCBpbnB1dCwgZm9yIGRhdGVzIC1hdCBteS1hY2NvdW50LS5cclxucmVxdWlyZSgnanF1ZXJ5LmZvcm1hdHRlcicpO1xyXG5cclxuLy8gR2VuZXJhbCBjYWxsYmFja3MgZm9yIEFKQVggZXZlbnRzIHdpdGggY29tbW9uIGxvZ2ljXHJcbnZhciBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi4vTEMvYWpheENhbGxiYWNrcycpO1xyXG4vLyBGb3JtLmFqYXggbG9naWMgYW5kIG1vcmUgc3BlY2lmaWMgY2FsbGJhY2tzIGJhc2VkIG9uIGFqYXhDYWxsYmFja3NcclxudmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxud2luZG93LmFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyID0gYWpheEZvcm1zLm9uU3VjY2Vzcztcclxud2luZG93LmFqYXhFcnJvclBvcHVwSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkVycm9yO1xyXG53aW5kb3cuYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyID0gYWpheEZvcm1zLm9uQ29tcGxldGU7XHJcbi8vfVxyXG5cclxuLyogUmVsb2FkICovXHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuLy8gV3JhcHBlciBmdW5jdGlvbiBhcm91bmQgb25TdWNjZXNzIHRvIG1hcmsgb3BlcmF0aW9uIGFzIHBhcnQgb2YgYSBcclxuLy8gcmVsb2FkIGF2b2lkaW5nIHNvbWUgYnVncyAoYXMgcmVwbGFjZS1jb250ZW50IG9uIGFqYXgtYm94LCBub3Qgd2FudGVkIGZvclxyXG4vLyByZWxvYWQgb3BlcmF0aW9ucylcclxuZnVuY3Rpb24gcmVsb2FkU3VjY2Vzc1dyYXBwZXIoKSB7XHJcbiAgdmFyIGNvbnRleHQgPSAkLmlzUGxhaW5PYmplY3QodGhpcykgPyB0aGlzIDogeyBlbGVtZW50OiB0aGlzIH07XHJcbiAgY29udGV4dC5pc1JlbG9hZCA9IHRydWU7XHJcbiAgYWpheEZvcm1zLm9uU3VjY2Vzcy5hcHBseShjb250ZXh0LCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcclxufVxyXG4kLmZuLnJlbG9hZC5kZWZhdWx0cyA9IHtcclxuICBzdWNjZXNzOiBbcmVsb2FkU3VjY2Vzc1dyYXBwZXJdLFxyXG4gIGVycm9yOiBbYWpheEZvcm1zLm9uRXJyb3JdLFxyXG4gIGRlbGF5OiBnTG9hZGluZ1JldGFyZFxyXG59O1xyXG5cclxuTEMubW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuLi9MQy9tb3ZlRm9jdXNUbycpO1xyXG4vKiBEaXNhYmxlZCBiZWNhdXNlIGNvbmZsaWN0cyB3aXRoIHRoZSBtb3ZlRm9jdXNUbyBvZiBcclxuICBhamF4Rm9ybS5vbnN1Y2Nlc3MsIGl0IGhhcHBlbnMgYSBibG9jay5sb2FkaW5nIGp1c3QgYWZ0ZXJcclxuICB0aGUgc3VjY2VzcyBoYXBwZW5zLlxyXG4kLmJsb2NrVUkuZGVmYXVsdHMub25CbG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFNjcm9sbCB0byBibG9jay1tZXNzYWdlIHRvIGRvbid0IGxvc3QgaW4gbGFyZ2UgcGFnZXM6XHJcbiAgICBMQy5tb3ZlRm9jdXNUbyh0aGlzKTtcclxufTsqL1xyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4uL0xDL2xvYWRlcicpO1xyXG5MQy5sb2FkID0gbG9hZGVyLmxvYWQ7XHJcblxyXG52YXIgYmxvY2tzID0gTEMuYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi4vTEMvYmxvY2tQcmVzZXRzJyk7XHJcbi8ve1RFTVBcclxud2luZG93LmxvYWRpbmdCbG9jayA9IGJsb2Nrcy5sb2FkaW5nO1xyXG53aW5kb3cuaW5mb0Jsb2NrID0gYmxvY2tzLmluZm87XHJcbndpbmRvdy5lcnJvckJsb2NrID0gYmxvY2tzLmVycm9yO1xyXG4vL31cclxuXHJcbkFycmF5LnJlbW92ZSA9IHJlcXVpcmUoJy4uL0xDL0FycmF5LnJlbW92ZScpO1xyXG5yZXF1aXJlKCcuLi9MQy9TdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zJyk7XHJcblxyXG5MQy5nZXRUZXh0ID0gcmVxdWlyZSgnLi4vTEMvZ2V0VGV4dCcpO1xyXG5cclxudmFyIFRpbWVTcGFuID0gTEMudGltZVNwYW4gPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbicpO1xyXG52YXIgdGltZVNwYW5FeHRyYSA9IHJlcXVpcmUoJy4uL0xDL1RpbWVTcGFuRXh0cmEnKTtcclxudGltZVNwYW5FeHRyYS5wbHVnSW4oVGltZVNwYW4pO1xyXG4vL3tURU1QICBvbGQgYWxpYXNlc1xyXG5MQy5zbWFydFRpbWUgPSB0aW1lU3BhbkV4dHJhLnNtYXJ0VGltZTtcclxuTEMucm91bmRUaW1lVG9RdWFydGVySG91ciA9IHRpbWVTcGFuRXh0cmEucm91bmRUb1F1YXJ0ZXJIb3VyO1xyXG4vL31cclxuXHJcbkxDLkNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuLi9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbndpbmRvdy5UYWJiZWRVWCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYJyk7XHJcbnZhciBzbGlkZXJUYWJzID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguc2xpZGVyVGFicycpO1xyXG5cclxuLy8gUG9wdXAgQVBJc1xyXG53aW5kb3cuc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi4vTEMvcG9wdXAnKTtcclxuLy97VEVNUFxyXG52YXIgcG9wdXBTdHlsZSA9IHBvcHVwLnN0eWxlLFxyXG4gICAgcG9wdXBTaXplID0gcG9wdXAuc2l6ZTtcclxuTEMubWVzc2FnZVBvcHVwID0gcG9wdXAubWVzc2FnZTtcclxuTEMuY29ubmVjdFBvcHVwQWN0aW9uID0gcG9wdXAuY29ubmVjdEFjdGlvbjtcclxud2luZG93LnBvcHVwID0gcG9wdXA7XHJcbi8vfVxyXG5cclxuTEMuc2FuaXRpemVXaGl0ZXNwYWNlcyA9IHJlcXVpcmUoJy4uL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxuLy97VEVNUCAgIGFsaWFzIGJlY2F1c2UgbWlzc3BlbGxpbmdcclxuTEMuc2FuaXRpemVXaGl0ZXBhY2VzID0gTEMuc2FuaXRpemVXaGl0ZXNwYWNlcztcclxuLy99XHJcblxyXG5MQy5nZXRYUGF0aCA9IHJlcXVpcmUoJy4uL0xDL2dldFhQYXRoJyk7XHJcblxyXG52YXIgc3RyaW5nRm9ybWF0ID0gcmVxdWlyZSgnLi4vTEMvU3RyaW5nRm9ybWF0Jyk7XHJcblxyXG4vLyBFeHBhbmRpbmcgZXhwb3J0ZWQgdXRpbGl0ZXMgZnJvbSBtb2R1bGVzIGRpcmVjdGx5IGFzIExDIG1lbWJlcnM6XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9QcmljZScpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL21hdGhVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL251bWJlclV0aWxzJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvdG9vbHRpcHMnKSk7XHJcbnZhciBpMThuID0gTEMuaTE4biA9IHJlcXVpcmUoJy4uL0xDL2kxOG4nKTtcclxuLy97VEVNUCBvbGQgYWxpc2VzIG9uIExDIGFuZCBnbG9iYWxcclxuJC5leHRlbmQoTEMsIGkxOG4pO1xyXG4kLmV4dGVuZCh3aW5kb3csIGkxOG4pO1xyXG4vL31cclxuXHJcbi8vIHh0c2g6IHBsdWdlZCBpbnRvIGpxdWVyeSBhbmQgcGFydCBvZiBMQ1xyXG52YXIgeHRzaCA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeS54dHNoJyk7XHJcbnh0c2gucGx1Z0luKCQpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBMQy4qIGFsaWFzXHJcbiQuZXh0ZW5kKExDLCB4dHNoKTtcclxuZGVsZXRlIExDLnBsdWdJbjtcclxuLy99XHJcblxyXG52YXIgYXV0b0NhbGN1bGF0ZSA9IExDLmF1dG9DYWxjdWxhdGUgPSByZXF1aXJlKCcuLi9MQy9hdXRvQ2FsY3VsYXRlJyk7XHJcbi8ve1RFTVAgICByZW1vdmUgb2xkIGFsaWFzIHVzZVxyXG52YXIgbGNTZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMgPSBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcztcclxuTEMuc2V0dXBDYWxjdWxhdGVTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnk7XHJcbkxDLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnk7XHJcbkxDLnNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25EZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG4vL31cclxuXHJcbnZhciBDb29raWUgPSBMQy5Db29raWUgPSByZXF1aXJlKCcuLi9MQy9Db29raWUnKTtcclxuLy97VEVNUCAgICBvbGQgYWxpYXNcclxudmFyIGdldENvb2tpZSA9IENvb2tpZS5nZXQsXHJcbiAgICBzZXRDb29raWUgPSBDb29raWUuc2V0O1xyXG4vL31cclxuXHJcbkxDLmRhdGVQaWNrZXIgPSByZXF1aXJlKCcuLi9MQy9kYXRlUGlja2VyJyk7XHJcbi8ve1RFTVAgICBvbGQgYWxpYXNcclxud2luZG93LnNldHVwRGF0ZVBpY2tlciA9IExDLnNldHVwRGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuaW5pdDtcclxud2luZG93LmFwcGx5RGF0ZVBpY2tlciA9IExDLmFwcGx5RGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuYXBwbHk7XHJcbi8vfVxyXG5cclxuTEMuYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi4vTEMvYXV0b0ZvY3VzJyk7XHJcblxyXG4vLyBDUlVETDogbG9hZGluZyBtb2R1bGUsIHNldHRpbmcgdXAgY29tbW9uIGRlZmF1bHQgdmFsdWVzIGFuZCBjYWxsYmFja3M6XHJcbnZhciBjcnVkbE1vZHVsZSA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJyk7XHJcbmNydWRsTW9kdWxlLmRlZmF1bHRTZXR0aW5ncy5kYXRhWydmb2N1cy1jbG9zZXN0J11bJ2RlZmF1bHQnXSA9ICcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nO1xyXG5jcnVkbE1vZHVsZS5kZWZhdWx0U2V0dGluZ3MuZGF0YVsnZm9jdXMtbWFyZ2luJ11bJ2RlZmF1bHQnXSA9IDEwO1xyXG52YXIgY3J1ZGwgPSBjcnVkbE1vZHVsZS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vLyBQcmV2aW91cyB1c2VkIGFsaWFzIChkZXByZWNhdGVkKTpcclxuTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcblxyXG4vLyBVSSBTbGlkZXIgTGFiZWxzXHJcbnZhciBzbGlkZXJMYWJlbHMgPSByZXF1aXJlKCcuLi9MQy9VSVNsaWRlckxhYmVscycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuY3JlYXRlTGFiZWxzRm9yVUlTbGlkZXIgPSBzbGlkZXJMYWJlbHMuY3JlYXRlO1xyXG5MQy51cGRhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy51cGRhdGU7XHJcbkxDLnVpU2xpZGVyTGFiZWxzTGF5b3V0cyA9IHNsaWRlckxhYmVscy5sYXlvdXRzO1xyXG4vL31cclxuXHJcbnZhciB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi4vTEMvdmFsaWRhdGlvbkhlbHBlcicpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuc2V0dXBWYWxpZGF0aW9uID0gdmFsaWRhdGlvbkhlbHBlci5zZXR1cDtcclxuTEMuc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkID0gdmFsaWRhdGlvbkhlbHBlci5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQ7XHJcbkxDLmdvVG9TdW1tYXJ5RXJyb3JzID0gdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycztcclxuLy99XHJcblxyXG5MQy5wbGFjZUhvbGRlciA9IHJlcXVpcmUoJy4uL0xDL3BsYWNlaG9sZGVyLXBvbHlmaWxsJykuaW5pdDtcclxuXHJcbkxDLm1hcFJlYWR5ID0gcmVxdWlyZSgnLi4vTEMvZ29vZ2xlTWFwUmVhZHknKTtcclxuXHJcbndpbmRvdy5pc0VtcHR5U3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvaXNFbXB0eVN0cmluZycpO1xyXG5cclxud2luZG93Lmd1aWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9MQy9ndWlkR2VuZXJhdG9yJyk7XHJcblxyXG52YXIgdXJsVXRpbHMgPSByZXF1aXJlKCcuLi9MQy91cmxVdGlscycpO1xyXG53aW5kb3cuZ2V0VVJMUGFyYW1ldGVyID0gdXJsVXRpbHMuZ2V0VVJMUGFyYW1ldGVyO1xyXG53aW5kb3cuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gdXJsVXRpbHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzO1xyXG5cclxudmFyIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZycpO1xyXG4vL3tURU1QXHJcbkxDLmRhdGVUb0ludGVyY2hhbmdsZVN0cmluZyA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZztcclxuLy99XHJcblxyXG4vLyBQYWdlcyBpbiBwb3B1cFxyXG52YXIgd2VsY29tZVBvcHVwID0gcmVxdWlyZSgnLi93ZWxjb21lUG9wdXAnKTtcclxuLy92YXIgdGFrZUFUb3VyUG9wdXAgPSByZXF1aXJlKCd0YWtlQVRvdXJQb3B1cCcpO1xyXG52YXIgZmFxc1BvcHVwcyA9IHJlcXVpcmUoJy4vZmFxc1BvcHVwcycpO1xyXG52YXIgYWNjb3VudFBvcHVwcyA9IHJlcXVpcmUoJy4vYWNjb3VudFBvcHVwcycpO1xyXG52YXIgbGVnYWxQb3B1cHMgPSByZXF1aXJlKCcuL2xlZ2FsUG9wdXBzJyk7XHJcblxyXG4vLyBPbGQgYXZhaWxhYmxpdHkgY2FsZW5kYXJcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0ID0gcmVxdWlyZSgnLi9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldCcpO1xyXG4vLyBOZXcgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhciA9IHJlcXVpcmUoJy4uL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyJyk7XHJcblxyXG52YXIgYXV0b2ZpbGxTdWJtZW51ID0gcmVxdWlyZSgnLi4vTEMvYXV0b2ZpbGxTdWJtZW51Jyk7XHJcblxyXG52YXIgdGFiYmVkV2l6YXJkID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVgud2l6YXJkJyk7XHJcblxyXG52YXIgaGFzQ29uZmlybVN1cHBvcnQgPSByZXF1aXJlKCcuLi9MQy9oYXNDb25maXJtU3VwcG9ydCcpO1xyXG5cclxudmFyIHBvc3RhbENvZGVWYWxpZGF0aW9uID0gcmVxdWlyZSgnLi4vTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24nKTtcclxuXHJcbnZhciB0YWJiZWROb3RpZmljYXRpb25zID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxudmFyIHRhYnNBdXRvbG9hZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmF1dG9sb2FkJyk7XHJcblxyXG52YXIgaG9tZVBhZ2UgPSByZXF1aXJlKCcuL2hvbWUnKTtcclxuXHJcbi8ve1RFTVAgcmVtb3ZlIGdsb2JhbCBkZXBlbmRlbmN5IGZvciB0aGlzXHJcbndpbmRvdy5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi4vTEMvanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG4vL31cclxuXHJcbnZhciBwcm92aWRlcldlbGNvbWUgPSByZXF1aXJlKCcuL3Byb3ZpZGVyV2VsY29tZScpO1xyXG5cclxuLyoqXHJcbiAqKiBJbml0IGNvZGVcclxuKioqL1xyXG4kKHdpbmRvdykubG9hZChmdW5jdGlvbiAoKSB7XHJcbiAgLy8gRGlzYWJsZSBicm93c2VyIGJlaGF2aW9yIHRvIGF1dG8tc2Nyb2xsIHRvIHVybCBmcmFnbWVudC9oYXNoIGVsZW1lbnQgcG9zaXRpb246XHJcbiAgLy8gRVhDRVBUIGluIERhc2hib2FyZDpcclxuICAvLyBUT0RPOiBSZXZpZXcgaWYgdGhpcyBpcyByZXF1aXJlZCBvbmx5IGZvciBIb3dJdFdvcmtzIG9yIHNvbWV0aGluZyBtb3JlICh0YWJzLCBwcm9maWxlKVxyXG4gIC8vIGFuZCByZW1vdmUgaWYgcG9zc2libGUgb3Igb25seSBvbiB0aGUgY29uY3JldGUgY2FzZXMuXHJcbiAgaWYgKCEvXFwvZGFzaGJvYXJkXFwvL2kudGVzdChsb2NhdGlvbikpXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgJCgnaHRtbCxib2R5Jykuc2Nyb2xsVG9wKDApOyB9LCAxKTtcclxufSk7XHJcbiQoZnVuY3Rpb24gKCkge1xyXG5cclxuICBwcm92aWRlcldlbGNvbWUuc2hvdygpO1xyXG5cclxuICAvLyBQbGFjZWhvbGRlciBwb2x5ZmlsbFxyXG4gIExDLnBsYWNlSG9sZGVyKCk7XHJcblxyXG4gIC8vIEF1dG9mb2N1cyBwb2x5ZmlsbFxyXG4gIExDLmF1dG9Gb2N1cygpO1xyXG5cclxuICAvLyBHZW5lcmljIHNjcmlwdCBmb3IgZW5oYW5jZWQgdG9vbHRpcHMgYW5kIGVsZW1lbnQgZGVzY3JpcHRpb25zXHJcbiAgTEMuaW5pdFRvb2x0aXBzKCk7XHJcblxyXG4gIGFqYXhGb3Jtcy5pbml0KCk7XHJcblxyXG4gIC8vdGFrZUFUb3VyUG9wdXAuc2hvdygpO1xyXG4gIHdlbGNvbWVQb3B1cC5zaG93KCk7XHJcbiAgLy8gRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIGZvciBzb21lIGxpbmtzIHRoYXQgYnkgZGVmYXVsdCBvcGVuIGEgbmV3IHRhYjpcclxuICBmYXFzUG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcbiAgYWNjb3VudFBvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIGxlZ2FsUG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcblxyXG4gIC8vIE9sZCBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxuICBhdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5pbml0KExjVXJsLkxhbmdQYXRoKTtcclxuICAvLyBOZXcgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbiAgYXZhaWxhYmlsaXR5Q2FsZW5kYXIuV2Vla2x5LmVuYWJsZUFsbCgpO1xyXG5cclxuICBwb3B1cC5jb25uZWN0QWN0aW9uKCk7XHJcblxyXG4gIC8vIERhdGUgUGlja2VyXHJcbiAgTEMuZGF0ZVBpY2tlci5pbml0KCk7XHJcblxyXG4gIC8qIEF1dG8gY2FsY3VsYXRlIHRhYmxlIGl0ZW1zIHRvdGFsIChxdWFudGl0eSp1bml0cHJpY2U9aXRlbS10b3RhbCkgc2NyaXB0ICovXHJcbiAgYXV0b0NhbGN1bGF0ZS5vblRhYmxlSXRlbXMoKTtcclxuICBhdXRvQ2FsY3VsYXRlLm9uU3VtbWFyeSgpO1xyXG5cclxuICBoYXNDb25maXJtU3VwcG9ydC5vbigpO1xyXG5cclxuICBwb3N0YWxDb2RlVmFsaWRhdGlvbi5pbml0KHsgYmFzZVVybDogTGNVcmwuTGFuZ1BhdGggfSk7XHJcblxyXG4gIC8vIFRhYmJlZCBpbnRlcmZhY2VcclxuICB0YWJzQXV0b2xvYWQuaW5pdChUYWJiZWRVWCk7XHJcbiAgVGFiYmVkVVguaW5pdCgpO1xyXG4gIFRhYmJlZFVYLmZvY3VzQ3VycmVudExvY2F0aW9uKCk7XHJcbiAgVGFiYmVkVVguY2hlY2tWb2xhdGlsZVRhYnMoKTtcclxuICBzbGlkZXJUYWJzLmluaXQoVGFiYmVkVVgpO1xyXG5cclxuICB0YWJiZWRXaXphcmQuaW5pdChUYWJiZWRVWCwge1xyXG4gICAgbG9hZGluZ0RlbGF5OiBnTG9hZGluZ1JldGFyZFxyXG4gIH0pO1xyXG5cclxuICB0YWJiZWROb3RpZmljYXRpb25zLmluaXQoVGFiYmVkVVgpO1xyXG5cclxuICBhdXRvZmlsbFN1Ym1lbnUoKTtcclxuXHJcbiAgLy8gVE9ETzogJ2xvYWRIYXNoQmFuZycgY3VzdG9tIGV2ZW50IGluIHVzZT9cclxuICAvLyBJZiB0aGUgaGFzaCB2YWx1ZSBmb2xsb3cgdGhlICdoYXNoIGJhbmcnIGNvbnZlbnRpb24sIGxldCBvdGhlclxyXG4gIC8vIHNjcmlwdHMgZG8gdGhlaXIgd29yayB0aHJvdWdodCBhICdsb2FkSGFzaEJhbmcnIGV2ZW50IGhhbmRsZXJcclxuICBpZiAoL14jIS8udGVzdCh3aW5kb3cubG9jYXRpb24uaGFzaCkpXHJcbiAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdsb2FkSGFzaEJhbmcnLCB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkpO1xyXG5cclxuICAvLyBSZWxvYWQgYnV0dG9uc1xyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucmVsb2FkLWFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIEdlbmVyaWMgYWN0aW9uIHRvIGNhbGwgbGMuanF1ZXJ5ICdyZWxvYWQnIGZ1bmN0aW9uIGZyb20gYW4gZWxlbWVudCBpbnNpZGUgaXRzZWxmLlxyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICR0LmNsb3Nlc3QoJHQuZGF0YSgncmVsb2FkLXRhcmdldCcpKS5yZWxvYWQoKTtcclxuICB9KTtcclxuXHJcbiAgLyogRW5hYmxlIGZvY3VzIHRhYiBvbiBldmVyeSBoYXNoIGNoYW5nZSwgbm93IHRoZXJlIGFyZSB0d28gc2NyaXB0cyBtb3JlIHNwZWNpZmljIGZvciB0aGlzOlxyXG4gICogb25lIHdoZW4gcGFnZSBsb2FkICh3aGVyZT8pLFxyXG4gICogYW5kIGFub3RoZXIgb25seSBmb3IgbGlua3Mgd2l0aCAndGFyZ2V0LXRhYicgY2xhc3MuXHJcbiAgKiBOZWVkIGJlIHN0dWR5IGlmIHNvbWV0aGluZyBvZiB0aGVyZSBtdXN0IGJlIHJlbW92ZWQgb3IgY2hhbmdlZC5cclxuICAqIFRoaXMgaXMgbmVlZGVkIGZvciBvdGhlciBiZWhhdmlvcnMgdG8gd29yay4gKi9cclxuICAvLyBPbiB0YXJnZXQtdGFiIGxpbmtzXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2EudGFyZ2V0LXRhYicsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciB0aGVyZUlzVGFiID0gVGFiYmVkVVguZ2V0VGFiKCQodGhpcykuYXR0cignaHJlZicpKTtcclxuICAgIGlmICh0aGVyZUlzVGFiKSB7XHJcbiAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRoZXJlSXNUYWIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgLy8gT24gaGFzaCBjaGFuZ2VcclxuICBpZiAoJC5mbi5oYXNoY2hhbmdlKVxyXG4gICAgJCh3aW5kb3cpLmhhc2hjaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICBpZiAoIS9eIyEvLnRlc3QobG9jYXRpb24uaGFzaCkpIHtcclxuICAgICAgICB2YXIgdGhlcmVJc1RhYiA9IFRhYmJlZFVYLmdldFRhYihsb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICBpZiAodGhlcmVJc1RhYilcclxuICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRoZXJlSXNUYWIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgLy8gSE9NRSBQQUdFIC8gU0VBUkNIIFNUVUZGXHJcbiAgaG9tZVBhZ2UuaW5pdCgpO1xyXG5cclxuICAvLyBWYWxpZGF0aW9uIGF1dG8gc2V0dXAgZm9yIHBhZ2UgcmVhZHkgYW5kIGFmdGVyIGV2ZXJ5IGFqYXggcmVxdWVzdFxyXG4gIC8vIGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgZm9ybSBpbiB0aGUgcGFnZS5cclxuICAvLyBUaGlzIGF2b2lkIHRoZSBuZWVkIGZvciBldmVyeSBwYWdlIHdpdGggZm9ybSB0byBkbyB0aGUgc2V0dXAgaXRzZWxmXHJcbiAgLy8gYWxtb3N0IGZvciBtb3N0IG9mIHRoZSBjYXNlLlxyXG4gIGZ1bmN0aW9uIGF1dG9TZXR1cFZhbGlkYXRpb24oKSB7XHJcbiAgICBpZiAoJChkb2N1bWVudCkuaGFzKCdmb3JtJykubGVuZ3RoKVxyXG4gICAgICB2YWxpZGF0aW9uSGVscGVyLnNldHVwKCdmb3JtJyk7XHJcbiAgfVxyXG4gIGF1dG9TZXR1cFZhbGlkYXRpb24oKTtcclxuICAkKGRvY3VtZW50KS5hamF4Q29tcGxldGUoYXV0b1NldHVwVmFsaWRhdGlvbik7XHJcblxyXG4gIC8vIFRPRE86IHVzZWQgc29tZSB0aW1lPyBzdGlsbCByZXF1aXJlZCB1c2luZyBtb2R1bGVzP1xyXG4gIC8qXHJcbiAgKiBDb21tdW5pY2F0ZSB0aGF0IHNjcmlwdC5qcyBpcyByZWFkeSB0byBiZSB1c2VkXHJcbiAgKiBhbmQgdGhlIGNvbW1vbiBMQyBsaWIgdG9vLlxyXG4gICogQm90aCBhcmUgZW5zdXJlZCB0byBiZSByYWlzZWQgZXZlciBhZnRlciBwYWdlIGlzIHJlYWR5IHRvby5cclxuICAqL1xyXG4gICQoZG9jdW1lbnQpXHJcbiAgICAudHJpZ2dlcignbGNTY3JpcHRSZWFkeScpXHJcbiAgICAudHJpZ2dlcignbGNMaWJSZWFkeScpO1xyXG59KTsiLCIvKioqKiogQVZBSUxBQklMSVRZIENBTEVOREFSIFdJREdFVCAqKioqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi4vTEMvc21vb3RoQm94QmxvY2snKSxcclxuICAgIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZycpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkucmVsb2FkJyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0QXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5jYWxlbmRhci1jb250cm9scyAuYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCR0Lmhhc0NsYXNzKCd6b29tLWFjdGlvbicpKSB7XHJcbiAgICAgICAgICAgIC8vIERvIHpvb21cclxuICAgICAgICAgICAgdmFyIGMgPSAkdC5jbG9zZXN0KCcuYXZhaWxhYmlsaXR5LWNhbGVuZGFyJykuZmluZCgnLmNhbGVuZGFyJykuY2xvbmUoKTtcclxuICAgICAgICAgICAgYy5jc3MoJ2ZvbnQtc2l6ZScsICcycHgnKTtcclxuICAgICAgICAgICAgdmFyIHRhYiA9ICR0LmNsb3Nlc3QoJy50YWItYm9keScpO1xyXG4gICAgICAgICAgICBjLmRhdGEoJ3BvcHVwLWNvbnRhaW5lcicsIHRhYik7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgdGFiLCAnYXZhaWxhYmlsaXR5LWNhbGVuZGFyJywgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgLy8gTm90aGluZyBtb3JlXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTmF2aWdhdGUgY2FsZW5kYXJcclxuICAgICAgICB2YXIgbmV4dCA9ICR0Lmhhc0NsYXNzKCduZXh0LXdlZWstYWN0aW9uJyk7XHJcbiAgICAgICAgdmFyIGNvbnQgPSAkdC5jbG9zZXN0KCcuYXZhaWxhYmlsaXR5LWNhbGVuZGFyJyk7XHJcbiAgICAgICAgdmFyIGNhbGNvbnQgPSBjb250LmNoaWxkcmVuKCcuY2FsZW5kYXItY29udGFpbmVyJyk7XHJcbiAgICAgICAgdmFyIGNhbCA9IGNhbGNvbnQuY2hpbGRyZW4oJy5jYWxlbmRhcicpO1xyXG4gICAgICAgIHZhciBjYWxpbmZvID0gY29udC5maW5kKCcuY2FsZW5kYXItaW5mbycpO1xyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoY2FsLmRhdGEoJ3Nob3dlZC1kYXRlJykpO1xyXG4gICAgICAgIHZhciB1c2VySWQgPSBjYWwuZGF0YSgndXNlci1pZCcpO1xyXG4gICAgICAgIGlmIChuZXh0KVxyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyA3KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSAtIDcpO1xyXG4gICAgICAgIHZhciBzdHJkYXRlID0gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nKGRhdGUpO1xyXG4gICAgICAgIHZhciB1cmwgPSBiYXNlVXJsICsgXCJQcm9maWxlLyRBdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC9XZWVrL1wiICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmRhdGUpICsgXCIvP1VzZXJJRD1cIiArIHVzZXJJZDtcclxuICAgICAgICBjYWxjb250LnJlbG9hZCh1cmwsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBuZXcgb2JqZWN0OlxyXG4gICAgICAgICAgICB2YXIgY2FsID0gJCgnLmNhbGVuZGFyJywgdGhpcy5lbGVtZW50KTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcueWVhci13ZWVrJykudGV4dChjYWwuZGF0YSgnc2hvd2VkLXdlZWsnKSk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLmZpcnN0LXdlZWstZGF5JykudGV4dChjYWwuZGF0YSgnc2hvd2VkLWZpcnN0LWRheScpKTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcubGFzdC13ZWVrLWRheScpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC1sYXN0LWRheScpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIEZBUXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIGZhcXNCYXNlVXJsID0gJ0hlbHBDZW50ZXIvJEZBUXMnO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gIGZhcXNCYXNlVXJsID0gKGJhc2VVcmwgfHwgJy8nKSArIGZhcXNCYXNlVXJsO1xyXG5cclxuICAvLyBFbmFibGUgRkFRcyBsaW5rcyBpbiBwb3B1cFxyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhW2hyZWZ8PVwiI0ZBUXNcIl0nLCBwb3B1cEZhcXMpO1xyXG5cclxuICAvLyBBdXRvIG9wZW4gY3VycmVudCBkb2N1bWVudCBsb2NhdGlvbiBpZiBoYXNoIGlzIGEgRkFRIGxpbmtcclxuICBpZiAoL14jRkFRcy9pLnRlc3QobG9jYXRpb24uaGFzaCkpIHtcclxuICAgIHBvcHVwRmFxcyhsb2NhdGlvbi5oYXNoKTtcclxuICB9XHJcblxyXG4gIC8vIHJldHVybiBhcyB1dGlsaXR5XHJcbiAgcmV0dXJuIHBvcHVwRmFxcztcclxufTtcclxuXHJcbi8qIFBhc3MgYSBGYXFzIEB1cmwgb3IgdXNlIGFzIGEgbGluayBoYW5kbGVyIHRvIG9wZW4gdGhlIEZBUSBpbiBhIHBvcHVwXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3B1cEZhcXModXJsKSB7XHJcbiAgdXJsID0gdHlwZW9mICh1cmwpID09PSAnc3RyaW5nJyA/IHVybCA6ICQodGhpcykuYXR0cignaHJlZicpO1xyXG5cclxuICB2YXIgdXJscGFydHMgPSB1cmwuc3BsaXQoJy0nKTtcclxuXHJcbiAgaWYgKHVybHBhcnRzWzBdICE9ICcjRkFRcycpIHtcclxuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ1RoZSBVUkwgaXMgbm90IGEgRkFRIHVybCAoZG9lc25cXCd0IHN0YXJ0cyB3aXRoICNGQVFzLSknLCB1cmwpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICB2YXIgdXJsc2VjdGlvbiA9IHVybHBhcnRzLmxlbmd0aCA+IDEgPyB1cmxwYXJ0c1sxXSA6ICcnO1xyXG5cclxuICBpZiAodXJsc2VjdGlvbikge1xyXG4gICAgdmFyIHB1cCA9IHBvcHVwKGZhcXNCYXNlVXJsICsgdXJsc2VjdGlvbiwgJ2xhcmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgZCA9ICQodXJsKSxcclxuICAgICAgICBwZWwgPSBwdXAuZ2V0Q29udGVudEVsZW1lbnQoKTtcclxuICAgICAgcGVsLnNjcm9sbFRvcChwZWwuc2Nyb2xsVG9wKCkgKyBkLnBvc2l0aW9uKCkudG9wIC0gNTApO1xyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBkLmVmZmVjdChcImhpZ2hsaWdodFwiLCB7fSwgMjAwMCk7XHJcbiAgICAgIH0sIDQwMCk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59IiwiLyogSU5JVCAqL1xyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBMb2NhdGlvbiBqcy1kcm9wZG93blxyXG4gICAgdmFyIHMgPSAkKCcjc2VhcmNoLWxvY2F0aW9uJyk7XHJcbiAgICBzLnByb3AoJ3JlYWRvbmx5JywgdHJ1ZSk7XHJcbiAgICBzLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgc291cmNlOiBMQy5zZWFyY2hMb2NhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgbWluTGVuZ3RoOiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBzZWxlY3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcy5vbignZm9jdXMgY2xpY2snLCBmdW5jdGlvbiAoKSB7IHMuYXV0b2NvbXBsZXRlKCdzZWFyY2gnLCAnJyk7IH0pO1xyXG5cclxuICAgIC8qIFBvc2l0aW9ucyBhdXRvY29tcGxldGUgKi9cclxuICAgIHZhciBwb3NpdGlvbnNBdXRvY29tcGxldGUgPSAkKCcjc2VhcmNoLXNlcnZpY2UnKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb2N1czogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHRoZSBsYWJlbCBpbiB0ZXh0Ym94LCBub3QgdGhlIHZhbHVlXHJcbiAgICAgICAgICAgIC8vJCh0aGlzKS52YWwodWkuaXRlbS5sYWJlbCk7XHJcbiAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIExvYWQgYWxsIHBvc2l0aW9ucyBpbiBiYWNrZ3JvdW5kIHRvIHJlcGxhY2UgdGhlIGF1dG9jb21wbGV0ZSBzb3VyY2UgKGF2b2lkaW5nIG11bHRpcGxlLCBzbG93IGxvb2stdXBzKVxyXG4gICAgLyokLmdldEpTT04oTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgIHBvc2l0aW9uc0F1dG9jb21wbGV0ZS5hdXRvY29tcGxldGUoJ29wdGlvbicsICdzb3VyY2UnLCBkYXRhKTtcclxuICAgIH1cclxuICAgICk7Ki9cclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIHNvbWUgTGVnYWwgcGFnZXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC5vbignY2xpY2snLCAnLnZpZXctcHJpdmFjeS1wb2xpY3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRQcml2YWN5UG9saWN5LycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXRlcm1zLW9mLXVzZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBwb3B1cChiYXNlVXJsICsgJ0hlbHBDZW50ZXIvJFRlcm1zT2ZVc2UvJywgJ2xhcmdlJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiogUHJvdmlkZXIgV2VsY29tZSBwYWdlXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBTaW1wbGVTbGlkZXIgPSByZXF1aXJlKCdMQy9TaW1wbGVTbGlkZXInKTtcclxuXHJcbmV4cG9ydHMuc2hvdyA9IGZ1bmN0aW9uIHByb3ZpZGVyV2VsY29tZSgpIHtcclxuICAkKCcuUHJvdmlkZXJXZWxjb21lIC5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgdCA9ICQodGhpcyksXHJcbiAgICAgIHNsaWRlciA9IG5ldyBTaW1wbGVTbGlkZXIoe1xyXG4gICAgICAgIGVsZW1lbnQ6IHQsXHJcbiAgICAgICAgc2VsZWN0b3JzOiB7XHJcbiAgICAgICAgICBzbGlkZXM6ICcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1zbGlkZXMnLFxyXG4gICAgICAgICAgc2xpZGU6ICcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1zbGlkZSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGN1cnJlbnRTbGlkZUNsYXNzOiAnanMtaXNDdXJyZW50JyxcclxuICAgICAgICBocmVmUHJlZml4OiAnZ29TbGlkZV8nLFxyXG4gICAgICAgIC8vIER1cmF0aW9uIG9mIGVhY2ggc2xpZGUgaW4gbWlsbGlzZWNvbmRzXHJcbiAgICAgICAgZHVyYXRpb246IDEwMDBcclxuICAgICAgfSk7XHJcblxyXG4gICAgLy8gU2xpZGUgc3RlcHMgYWN0aW9ucyBpbml0aWFsbHkgaGlkZGVuLCB2aXNpYmxlIGFmdGVyICdzdGFydCdcclxuICAgIHZhciBzbGlkZXNBY3Rpb25zID0gdC5maW5kKCcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1hY3Rpb25zLXNsaWRlcycpLmhpZGUoKTtcclxuICAgIHQuZmluZCgnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tYWN0aW9ucy1zdGFydCAuc3RhcnQtYWN0aW9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkKHRoaXMpLmhpZGUoKTtcclxuICAgICAgc2xpZGVzQWN0aW9ucy5mYWRlSW4oMTAwMCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiogV2VsY29tZSBwb3B1cFxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyBib290c3RyYXAgdG9vbHRpcHM6XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcCcpO1xyXG4vL1RPRE8gbW9yZSBkZXBlbmRlbmNpZXM/XHJcblxyXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiB3ZWxjb21lUG9wdXAoKSB7XHJcbiAgdmFyIGMgPSAkKCcjd2VsY29tZXBvcHVwJyk7XHJcbiAgaWYgKGMubGVuZ3RoID09PSAwKSByZXR1cm47XHJcbiAgdmFyIHNraXBTdGVwMSA9IGMuaGFzQ2xhc3MoJ3NlbGVjdC1wb3NpdGlvbicpO1xyXG5cclxuICAvLyBJbml0XHJcbiAgaWYgKCFza2lwU3RlcDEpIHtcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSwgLnRlcm1zLCAucG9zaXRpb24tZGVzY3JpcHRpb24nKS5oaWRlKCk7XHJcbiAgfVxyXG4gIGMuZmluZCgnZm9ybScpLmdldCgwKS5yZXNldCgpO1xyXG5cclxuICAvLyBEZXNjcmlwdGlvbiBzaG93LXVwIG9uIGF1dG9jb21wbGV0ZSB2YXJpYXRpb25zXHJcbiAgdmFyIHNob3dQb3NpdGlvbkRlc2NyaXB0aW9uID0ge1xyXG4gICAgLyoqXHJcbiAgICBTaG93IGRlc2NyaXB0aW9uIGluIGEgdGV4dGFyZWEgdW5kZXIgdGhlIHBvc2l0aW9uIHNpbmd1bGFyLFxyXG4gICAgaXRzIHNob3dlZCBvbiBkZW1hbmQuXHJcbiAgICAqKi9cclxuICAgIHRleHRhcmVhOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgIGMuZmluZCgnLnBvc2l0aW9uLWRlc2NyaXB0aW9uJylcclxuICAgICAgLnNsaWRlRG93bignZmFzdCcpXHJcbiAgICAgIC5maW5kKCd0ZXh0YXJlYScpLnZhbCh1aS5pdGVtLmRlc2NyaXB0aW9uKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgIFNob3cgZGVzY3JpcHRpb24gaW4gYSB0b29sdGlwIHRoYXQgY29tZXMgZnJvbSB0aGUgcG9zaXRpb24gc2luZ3VsYXJcclxuICAgIGZpZWxkXHJcbiAgICAqKi9cclxuICAgIHRvb2x0aXA6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgLy8gSXQgbmVlZHMgdG8gYmUgZGVzdHJveWVkIChubyBwcm9ibGVtIHRoZSBmaXJzdCB0aW1lKVxyXG4gICAgICAvLyB0byBnZXQgaXQgdXBkYXRlZCBvbiBzdWNjZXNpdmUgYXR0ZW1wdHNcclxuICAgICAgdmFyIGVsID0gJCh0aGlzKTtcclxuICAgICAgZWxcclxuICAgICAgLnBvcG92ZXIoJ2Rlc3Ryb3knKVxyXG4gICAgICAucG9wb3Zlcih7XHJcbiAgICAgICAgdGl0bGU6ICdEb2VzIHRoaXMgc291bmQgbGlrZSB5b3U/JyxcclxuICAgICAgICBjb250ZW50OiB1aS5pdGVtLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgIHRyaWdnZXI6ICdmb2N1cycsXHJcbiAgICAgICAgcGxhY2VtZW50OiAnbGVmdCdcclxuICAgICAgfSlcclxuICAgICAgLnBvcG92ZXIoJ3Nob3cnKVxyXG4gICAgICAvLyBIaWRlIG9uIHBvc3NpYmxlIHBvc2l0aW9uIG5hbWUgY2hhbmdlIHRvIGF2b2lkIGNvbmZ1c2lvbnNcclxuICAgICAgLy8gKHdlIGNhbid0IHVzZSBvbi1jaGFuZ2UsIG5lZWQgdG8gYmUga2V5cHJlc3M7IGl0cyBuYW1lc3BhY2VkXHJcbiAgICAgIC8vIHRvIGxldCBvZmYgYW5kIG9uIGV2ZXJ5IHRpbWUgdG8gYXZvaWQgbXVsdGlwbGUgaGFuZGxlciByZWdpc3RyYXRpb25zKVxyXG4gICAgICAub2ZmKCdrZXlwcmVzcy5kZXNjcmlwdGlvbi10b29sdGlwJylcclxuICAgICAgLm9uKCdrZXlwcmVzcy4uZGVzY3JpcHRpb24tdG9vbHRpcCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBlbC5wb3BvdmVyKCdoaWRlJyk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvLyBSZS1lbmFibGUgYXV0b2NvbXBsZXRlOlxyXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBjLmZpbmQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpOyB9LCA1MDApO1xyXG4gIGZ1bmN0aW9uIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2VsZXRDYWxsYmFjaykge1xyXG4gICAgYy5maW5kKCdbbmFtZT1qb2J0aXRsZV0nKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAvLyBObyB2YWx1ZSwgbm8gYWN0aW9uIDooXHJcbiAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS52YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNhdmUgdGhlIGlkICh2YWx1ZSkgaW4gdGhlIGhpZGRlbiBlbGVtZW50XHJcbiAgICAgICAgYy5maW5kKCdbbmFtZT1wb3NpdGlvbmlkXScpLnZhbCh1aS5pdGVtLnZhbHVlKTtcclxuXHJcbiAgICAgICAgc2VsZXRDYWxsYmFjay5jYWxsKHRoaXMsIGV2ZW50LCB1aSk7XHJcblxyXG4gICAgICAgIC8vIFdlIHdhbnQgdG8gc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9LFxyXG4gICAgICBmb2N1czogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24udG9vbHRpcCk7XHJcbiAgYy5maW5kKCcjd2VsY29tZXBvcHVwTG9hZGluZycpLnJlbW92ZSgpO1xyXG5cclxuICAvLyBBY3Rpb25zXHJcbiAgYy5vbignY2hhbmdlJywgJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpOm5vdCguJyArIHRoaXMudmFsdWUgKyAnKScpLmhpZGUoKTtcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlLCBoZWFkZXIgLnByZXNlbnRhdGlvbicpLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICAgIGMuZmluZCgnLnRlcm1zLCAucHJvZmlsZS1kYXRhJykuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICAvLyBUZXJtcyBvZiB1c2UgZGlmZmVyZW50IGZvciBwcm9maWxlIHR5cGVcclxuICAgIGlmICh0aGlzLnZhbHVlID09ICdjdXN0b21lcicpXHJcbiAgICAgIGMuZmluZCgnYS50ZXJtcy1vZi11c2UnKS5kYXRhKCd0b29sdGlwLXVybCcsIG51bGwpO1xyXG4gICAgLy8gQ2hhbmdlIGZhY2Vib29rIHJlZGlyZWN0IGxpbmtcclxuICAgIHZhciBmYmMgPSBjLmZpbmQoJy5mYWNlYm9vay1jb25uZWN0Jyk7XHJcbiAgICB2YXIgYWRkUmVkaXJlY3QgPSAnY3VzdG9tZXJzJztcclxuICAgIGlmICh0aGlzLnZhbHVlID09ICdwcm92aWRlcicpXHJcbiAgICAgIGFkZFJlZGlyZWN0ID0gJ3Byb3ZpZGVycyc7XHJcbiAgICBmYmMuZGF0YSgncmVkaXJlY3QnLCBmYmMuZGF0YSgncmVkaXJlY3QnKSArIGFkZFJlZGlyZWN0KTtcclxuICAgIGZiYy5kYXRhKCdwcm9maWxlJywgdGhpcy52YWx1ZSk7XHJcblxyXG4gICAgLy8gU2V0IHZhbGlkYXRpb24tcmVxdWlyZWQgZm9yIGRlcGVuZGluZyBvZiBwcm9maWxlLXR5cGUgZm9ybSBlbGVtZW50czpcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaS4nICsgdGhpcy52YWx1ZSArICcgaW5wdXQ6bm90KFtkYXRhLXZhbF0pOm5vdChbdHlwZT1oaWRkZW5dKScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsLXJlcXVpcmVkJywgJycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgdHJ1ZSk7XHJcbiAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxuICB9KTtcclxuICBjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBzZXR1cFBvc2l0aW9uQXV0b2NvbXBsZXRlKHNob3dQb3NpdGlvbkRlc2NyaXB0aW9uLnRvb2x0aXApO1xyXG4gICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJykuY2hhbmdlKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIElmIHByb2ZpbGUgdHlwZSBpcyBwcmVmaWxsZWQgYnkgcmVxdWVzdDpcclxuICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdOmNoZWNrZWQnKS5jaGFuZ2UoKTtcclxufTtcclxuIl19
