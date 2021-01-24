import * as React from "react";
import { BehaviorSubject, merge, pipe, Subject, isObservable } from "rxjs";
import { map, takeUntil } from "rxjs/operators";

function toStreamArr(streamObj) {
  var props = {};
  var streamProps = [];
  Object.keys(streamObj)
    .map(function (key) {
      return { key, val: streamObj[key] };
    })
    .forEach(function (x) {
      if (isObservable(x.val)) {
        streamProps.push(
          x.val.pipe(
            map(function (y) {
              return { [x.key]: y };
            })
          )
        );
      } else {
        props[x.key] = x.val;
      }
    });
  return { props: props, streamProps: streamProps };
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

function rx(controller) {
  var force$ = new Subject();
  var props$ = new BehaviorSubject({});
  var destroyed$ = new Subject();
  var streams = [];

  var data = {};
  var onDestroyCallback = function () {};
  var intercept = pipe();

  function updateData(obj) {
    data = Object.assign({}, data, obj);
  }

  controller({
    props$,
    onDestroy: function (fn) {
      if (fn) {
        onDestroyCallback = fn;
      }
    },
    resolve: function (strObj) {
      const conf = toStreamArr(strObj || {});
      streams = conf.streamProps;
      data = conf.props;
    },
    setIntercept: function (i) {
      if (i) {
        intercept = i;
      }
    },
  });

  merge
    .apply(null, [props$].concat(streams))
    .pipe(takeUntil(destroyed$), map(updateData), intercept)
    .subscribe(
      function () {
        force$.next();
      },
      function (e) {
        throw e;
      },
      onDestroyCallback
    );

  return function (Wrapped) {
    function StreamC() {
      props$.next(arguments[0]);
      React.Component.apply(this, arguments);
    }

    StreamC.prototype = Object.create(React.Component.prototype);

    var sProto = StreamC.prototype;

    sProto.constructor = StreamC;

    sProto.componentDidMount = function () {
      var self = this;
      force$.pipe(takeUntil(destroyed$)).subscribe(function () {
        self.forceUpdate();
      });
    };

    sProto.componentWillUnmount = function () {
      destroyed$.next();
    };

    sProto.shouldComponentUpdate = function (nextProps) {
      if (!isShallowEqual(this.props, nextProps)) {
        props$.next(nextProps);
      }
      return false;
    };

    sProto.render = function () {
      return React.createElement(Wrapped, data);
    };

    return StreamC;
  };
}

export default rx;
