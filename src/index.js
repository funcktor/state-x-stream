import React, { useEffect, useState } from "react";
import { BehaviorSubject, Subject, pipe } from "rxjs";
import { takeUntil, distinctUntilChanged, tap, debounceTime } from "rxjs/operators";
import mapStreamsToStateObj from "./mapStreamsToStateObj";
import isShallowEqual from "./isShallowEqual";

function xstream(controller, Wrapped, debug) {
  const props$ = new BehaviorSubject({});
  const destroyed$ = new Subject();

  return function StreamedComp(props) {
    props$.next(props);
    const [streamVals, setStreamVals] = useState(null);

    useEffect(() => {
      controller({
        props$,
        destroyed$,
        getProps: () => props$.value,
        resolve: (params) => {
          mapStreamsToStateObj(params)
            .pipe(
              takeUntil(destroyed$),
              distinctUntilChanged((a, b) => isShallowEqual(a, b)),
              tap((x) => setStreamVals(x))
            )
            .subscribe(() => {});
        },
      });
      return () => destroyed$.next();
    }, []);

    return streamVals ? <Wrapped {...props} {...streamVals} /> : null;
  };
}

export default xstream;
