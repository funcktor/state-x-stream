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
  var result = {};
  var keys1 = Object.keys(ob1);
  var keys2 = Object.keys(ob2);
  for (var i = 0; i < keys1.length; i++) {
    result[keys1[i]] = ob1[keys1[i]];
  }
  for (var i = 0; i < keys2.length; i++) {
    result[keys2[i]] = ob2[keys2[i]];
  }
  return result;
}

function xstream(controller, Wrapped) {
  function StreamC() {
    var self = this;
    this.props$ = new BehaviorSubject(mergeObjTo({}, arguments[0]));
    this.force$ = new Subject();
    this.destroyed$ = new Subject();
    this.streams = [];
    this.resolved = {};

    var intercept = pipe();

    controller({
      props$: self.props$,
      destroyed$: self.destroyed$,
      resolve: function (strObj) {
        parseInput(strObj || {}, self.streams, self.resolved);
      },
      setIntercept: function (i) {
        intercept = i;
      },
    });

    var resolvedStreams = of(self.streams).pipe(
      mergeAll(),
      map(function (obj) {
        self.resolved = mergeObjTo(self.resolved, obj);
      })
    );

    of(self.props$, resolvedStreams)
      .pipe(mergeAll(), takeUntil(self.destroyed$), intercept)
      .subscribe(
        function () {
          self.force$.next();
        },
        function (e) {
          console.error(e);
        }
      );

    React.Component.apply(self, arguments);
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
      this.props$.next(mergeObjTo(nextProps, {}));
    }
    return false;
  };

  sProto.render = function () {
    var props = mergeObjTo(this.props$.value, this.resolved);
    return React.createElement(Wrapped, props);
  };

  return StreamC;
}

export default xstream;
