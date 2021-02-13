import React from "react";
import { BehaviorSubject, pipe, Subject, isObservable, of } from "rxjs";
import { map, takeUntil, mergeAll } from "rxjs/operators";

function internalizeKey(key) {
  return function (val) {
    return { [key]: val };
  };
}

function forEachKey(obj, callback) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    callback(obj[keys[i]], keys[i]);
  }
}

function partitionProps(params) {
  var streams = [];
  var nonStreams = {};
  forEachKey(params, function (val, key) {
    if (isObservable(val)) {
      streams.push(val.pipe(map(internalizeKey(key))));
    } else {
      nonStreams[key] = val;
    }
  });
  return { streams: streams, nonStreams: nonStreams };
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
  forEachKey(ob1, function (val, key) {
    result[key] = val;
  });
  forEachKey(ob2, function (val, key) {
    result[key] = val;
  });
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
        const result = partitionProps(strObj || {});
        self.resolved = result.nonStreams;
        self.streams = result.streams;
      },
      setIntercept: function (i) {
        intercept = i;
      },
    });

    var resolvedStreams = of.apply(null, self.streams).pipe(
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
