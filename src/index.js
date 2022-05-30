import React, { useEffect, useState } from "react";
import { BehaviorSubject, Subject, isObservable, merge, pipe } from "rxjs";
import { map, takeUntil, distinctUntilChanged, scan } from "rxjs/operators";

console.log(React);

function mapStreamsToState(params) {
  const streams = Object.keys(params)
    .map((key) => ({ key, obs$: params[key] }))
    .filter(({ obs$ }) => isObservable(obs$));

  const init = streams.reduce((a, { key, obs$ }) => {
    return { ...a, [key]: obs$.value };
  }, params);

  const fixed = streams.map(({ key, obs$ }) => obs$.pipe(map((x) => ({ [key]: x }))));
  return merge(...fixed).pipe(scan((acc, curr) => ({ ...acc, ...curr }), init));
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

function xstream(controller, Wrapped) {
  console.log("------------> > > >");
  const props$ = new BehaviorSubject({});
  const destroyed$ = new Subject();
  const updated$ = new BehaviorSubject({});
  let interceptor = pipe();

  controller({
    props$: props$.pipe(takeUntil(destroyed$)),
    getProps: () => props$.value,
    destroyed$,
    resolve: function (params) {
      mapStreamsToState(params)
        .pipe(takeUntil(destroyed$))
        .subscribe((x) => updated$.next(x));
    },

    setIntercept: function (i) {
      interceptor = i;
    },
  });

  function StreamedComponent(props) {
    const [streamVals, setStreamVals] = useState(updated$.value);

    useEffect(() => {
      updated$
        .pipe(
          takeUntil(destroyed$),
          distinctUntilChanged((a, b) => isShallowEqual(a, b)),
          interceptor,
          takeUntil(destroyed$)
        )
        .subscribe((x) => setStreamVals(x));

      return () => destroyed$.next();
    }, []);

    // useEffect(() => {
    //   props$.next(props);
    // }, [props]);

    return Wrapped({ ...props, ...streamVals });
  }

  return React.memo(StreamedComponent);
}

export default xstream;
