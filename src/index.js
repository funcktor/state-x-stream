import React, { useEffect, useState } from "react";
import { BehaviorSubject, Subject, pipe } from "rxjs";
import { takeUntil, distinctUntilChanged } from "rxjs/operators";
import mapStreamsToStateObj from "./mapStreamsToStateObj";
import isShallowEqual from "./isShallowEqual";

function xstream(controller, Wrapped) {
  const props$ = new BehaviorSubject({});
  const destroyed$ = new Subject();
  const updated$ = new BehaviorSubject({});
  let interceptor = pipe();

  controller({
    props$,
    destroyed$,
    getProps: () => props$.value,
    resolve: (params) => {
      mapStreamsToStateObj(params)
        .pipe(takeUntil(destroyed$))
        .subscribe((x) => updated$.next(x));
    },

    setIntercept: (i) => (interceptor = i),
  });

  return function StreamedComp(props) {
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

    useEffect(() => {
      props$.next(props);
    }, [props]);

    return <Wrapped {...props} {...streamVals} />;
  };
}

export default xstream;
