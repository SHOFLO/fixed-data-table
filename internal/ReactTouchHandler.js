/**
 * Copyright Schrodinger, LLC
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * This is utility that handles touch events and calls provided touch
 * callback with correct frame rate.
 *
 * @providesModule ReactTouchHandler
 * @typechecks
 */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var emptyFunction = require('./emptyFunction');
var requestAnimationFramePolyfill = require('./requestAnimationFramePolyfill');

var ReactTouchHandler = (function () {
  /**
   * onTouchScroll is the callback that will be called with right frame rate if
   * any touch events happened
   * onTouchScroll should is to be called with two arguments: deltaX and deltaY in
   * this order
   */

  function ReactTouchHandler(
  /*function*/onTouchScroll,
  /*boolean|function*/handleScrollX,
  /*boolean|function*/handleScrollY,
  /*?boolean|?function*/stopPropagation) {
    _classCallCheck(this, ReactTouchHandler);

    this._animationFrameID = null;

    this._startX = 0;
    this._startY = 0;

    this._didTouchMove = this._didTouchMove.bind(this);

    if (typeof handleScrollX !== 'function') {
      handleScrollX = handleScrollX ? emptyFunction.thatReturnsTrue : emptyFunction.thatReturnsFalse;
    }

    if (typeof handleScrollY !== 'function') {
      handleScrollY = handleScrollY ? emptyFunction.thatReturnsTrue : emptyFunction.thatReturnsFalse;
    }

    if (typeof stopPropagation !== 'function') {
      stopPropagation = stopPropagation ? emptyFunction.thatReturnsTrue : emptyFunction.thatReturnsFalse;
    }

    this._handleScrollX = handleScrollX;
    this._handleScrollY = handleScrollY;
    this._stopPropagation = stopPropagation;
    this._onTouchScrollCallback = onTouchScroll;
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
  }

  _createClass(ReactTouchHandler, [{
    key: 'onTouchStart',
    value: function onTouchStart( /*object*/event) {
      this._startX = event.touches[0].pageX;
      this._startY = event.touches[0].pageY;
    }
  }, {
    key: 'onTouchMove',
    value: function onTouchMove( /*object*/event) {
      var moveX = event.touches[0].pageX;
      var moveY = event.touches[0].pageY;

      //Mobile, scrolling is inverted
      this._deltaX = this._startX - moveX;
      this._deltaY = this._startY - moveY;

      var handleScrollX = this._handleScrollX(this._deltaX, this._deltaY);
      var handleScrollY = this._handleScrollY(this._deltaY, this._deltaX);
      if (!handleScrollX && !handleScrollY) {
        return;
      }

      this._startX = handleScrollX ? moveX : this._startX;
      this._startY = handleScrollY ? moveY : this._startY;

      event.preventDefault();

      var changed;
      if (this._deltaX !== 0 || this._deltaY !== 0) {
        if (this._stopPropagation()) {
          event.stopPropagation();
        }
        changed = true;
      }

      if (changed === true && this._animationFrameID === null) {
        this._didTouchMove();
      }
      //if (changed === true && this._animationFrameID === null) {
      //  this._animationFrameID = requestAnimationFramePolyfill(this._didTouchMove);
      //}
    }
  }, {
    key: '_didTouchMove',
    value: function _didTouchMove() {
      //this._animationFrameID = null;
      //this._onTouchScrollCallback(this._deltaX, this._deltaY);

      var currentX;
      var currentY;
      var iterationCount = 0; // the current frame
      var self = this;

      var totalIterations = 60 / 2; // ~60 animation frames/sec

      if (Math.abs(self._deltaY) < 20 && Math.abs(self._deltaX) < 20) {
        console.log('not easing..');
        self._onTouchScrollCallback(self._deltaX, self._deltaY);
        self._deltaX = 0;
        self._deltaY = 0;
        return;
      }

      (function scrollWithEase() {
        iterationCount++;

        currentX = easeInOutQuad(iterationCount, self._startX, self._deltaX, totalIterations);
        currentY = easeInOutQuad(iterationCount, self._startY, self._deltaY, totalIterations);

        self._onTouchScrollCallback(currentX, currentY);

        if (iterationCount >= totalIterations) {
          self._deltaX = 0;
          self._deltaY = 0;
          self._animationFrameID = null;
          return;
        }

        self._animationFrameID = requestAnimationFramePolyfill(scrollWithEase);
      })();

      function easeInOutQuad(currentIteration, startValue, changeInValue, totalIterations) {
        if ((currentIteration /= totalIterations / 2) < 1) {
          return changeInValue / 2 * currentIteration * currentIteration + startValue;
        }
        return -changeInValue / 2 * (--currentIteration * (currentIteration - 2) - 1) + startValue;
      }
    }
  }]);

  return ReactTouchHandler;
})();

module.exports = ReactTouchHandler;