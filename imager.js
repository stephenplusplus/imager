(function (window, document) {

  'use strict';

  var $;
  var listeners;
  var listen;
  var yell;
  var Imager;

  requestAnimationFrameShimishStuff: {

    window.requestAnimationFrame
      = window.requestAnimationFrame
      || window.mozRequestAnimationFrame
      || window.webkitRequestAnimationFrame
      || function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  }

  selectorEngine: {

    // jQuery substitute, if necessary.
    $ = (function (dollar) {

      if (dollar) {
        return dollar;
      }

      var slice = Array.prototype.slice;
      return function (selector) {
        return slice.call(document.querySelectorAll(selector));
      };
    })(window.$);
  }

  pubSubSystem: {

    // Collection of listeners.
    listeners = {};

    // Registers listeners with a given callback.
    listen = function (event, then) {

      if (typeof then === 'function') {
        listeners[event] = then;
      }
    };

    // Invokes callback for a given event.
    yell = function (event, what) {

      if (listeners[event]) {
        listeners[event](what);
      }
    };
  }

  Imager = function (opts) {

    var self = this;
    opts = opts || {};

    this.availableWidths = opts.availableWidths || [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900,
      1000
    ];

    this.selector = opts.selector || '.delayed-image-load';
    this.className = '.' + (opts.className || 'image-replace').replace(/^\.+/, '.');
    this.regex = opts.regex || /^(.+\/)\d+$/i;

    this.gif = document.createElement('img');
    this.gif.src = 'data:image/gif;base64,R0lGODlhEAAJAIAAAP///wAAACH5BAEAAAAALAAAAAAQAAkAAAIKhI+py+0Po5yUFQA7';
    this.gif.className = this.className.replace(/^[#\.]/, '');

    this.divs = $(this.selector);
    this.swapDivs();

    this.cache = {};

    listen('imager:resize', function () {
      self.resizeImages();
    });

    listen('div:added', function () {
      self.swapDivs();
    });

    listen('div:changed', function () {
      self.resizeImages();
    });

    window.requestAnimationFrame(function () {
      self.init();
    });
  };

  Imager.prototype.init = function () {

    this.initialized = true;
    this.resizeImages();

    window.addEventListener('resize', function () {
      yell('imager:resize');
    }, false);
  };

  Imager.prototype.swapDivs = function () {

    var divs = this.divs;
    var gif;

    var i = 0, l = divs.length;

    for (; i < l; i++) {
      gif = this.gif.cloneNode(false);
      gif.width = divs[i].getAttribute('data-width');
      gif.setAttribute('data-src', divs[i].getAttribute('data-src'));
      divs[i].parentNode.replaceChild(gif, divs[i]);
    }

    if (this.initialized) {
      yell('div:changed');
    }
  };

  Imager.prototype.resizeImages = function () {

    var self = this;
    var images = $(this.className);

    var i = 0, l = images.length;

    if (!this.isResizing) {
      this.isResizing = true;

      for (; i < l; i++) {
        this.placeImage(images[i]);
      }

      this.isResizing = false;
    }
  };

  Imager.prototype.placeImage = function (image) {

    var src = this.calculate(image);
    var parent = image.parentNode;
    var replacedImage;

    if (this.cache[src]) {
      replacedImage = this.cache[src].cloneNode(false);
      replacedImage.width = image.getAttribute('width');
    } else {
      replacedImage = image.cloneNode(false);
      replacedImage.src = src;
      this.cache[src] = replacedImage;
    }

    parent.replaceChild(replacedImage, image);
  };

  Imager.prototype.calculate = function (image) {

    var self = this;
    var src = image.getAttribute('data-src');
    var width = image.clientWidth;
    var selectedWidth = this.availableWidths[0];

    var i = 0, l = this.availableWidths.length;

    for (; i < l; i++) {
      if (width >= this.availableWidths[i]) {
        selectedWidth = this.availableWidths[i];
      }
    }

    return src.replace(this.regex, function (match, captured) {
      return captured + selectedWidth;
    });
  };

  window.Imager = Imager;
  window.onload = function () {
    new Imager();
  };
})(window, document);
