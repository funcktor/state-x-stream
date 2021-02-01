/* eslint-disable */
import React from "react";
import { BehaviorSubject, pipe, Subject, isObservable, of } from "rxjs";
import { map, takeUntil, mergeAll } from "rxjs/operators";

function internalizeKey(key) {
  return function (val) {
    return { [key]: val };
  };
}

function parseInput(obj, streams, props) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var val = obj[key];
    if (isObservable(val)) {
      var newObs = val.pipe(map(internalizeKey(key)));
      streams.push(newObs);
    } else {
      props[key] = val;
    }
  }
}

function isShallowEqual(v, o) {
  var k1 = Object.keys(v);
  var k2 = Object.keys(o);
  if (k1.length !== k2.length) {
    return false;
  }
  for (var i = 0; i < k1.length; i++) {
    if (o[k1[i]] !== v[k2[i]]) {
      return false;
    }
  }
  return true;
}

function mergeObjTo(ob1, ob2) {
  var keys = Object.keys(ob2);
  for (var i = 0; i < keys.length; i++) {
    ob1[keys[i]] = ob2[keys[i]];
  }
}

function init(component, controller) {
  var onDestroyCallback;
  var intercept;

  function updateData(obj) {
    mergeObjTo(component.resolved, obj);
  }

  function rerender() {
    component.force$.next();
  }

  function onError(e) {
    console.error(e);
  }

  function finalize() {
    if (onDestroyCallback) {
      onDestroyCallback();
    }
  }

  controller({
    props$: component.props$,
    onDestroy: function (fn) {
      component.onDestroyCallback = fn;
    },
    resolve: function (strObj) {
      parseInput(strObj || {}, component.streams, component.resolved);
    },
    setIntercept: function (i) {
      intercept = i;
    },
  });

  var pipes = component.intercept
    ? pipe(mergeAll(), takeUntil(component.destroyed$), map(updateData), intercept)
    : pipe(mergeAll(), takeUntil(component.destroyed$), map(updateData));

  of.apply(null, [component.props$].concat(component.streams))
    .pipe(pipes)
    .subscribe(rerender, onError, finalize);
}

function xstream(controller, Wrapped) {
  function StreamC() {
    this.props$ = new BehaviorSubject(arguments[0]);
    this.force$ = new Subject();
    this.destroyed$ = new Subject();
    this.streams = [];
    this.resolved = {};

    init(this, controller);

    React.Component.apply(this, arguments);
  }

  StreamC.prototype = Object.create(React.Component.prototype);

  var sProto = StreamC.prototype;

  sProto.constructor = StreamC;

  sProto.componentDidMount = function () {
    var self = this;
    self.force$.pipe(takeUntil(self.destroyed$)).subscribe(function () {
      self.forceUpdate();
    });
  };

  sProto.componentWillUnmount = function () {
    this.destroyed$.next();
  };

  sProto.shouldComponentUpdate = function (nextProps) {
    if (!isShallowEqual(this.props, nextProps)) {
      this.props$.next(nextProps);
    }
    return false;
  };

  sProto.render = function () {
    return React.createElement(Wrapped, this.resolved);
  };

  return StreamC;
}

export default xstream;
