import React, { useEffect, useState } from "react";
import { BehaviorSubject, Subject, pipe } from "rxjs";
import { takeUntil, distinctUntilChanged, tap, debounceTime } from "rxjs/operators";
import mapStreamsToStateObj from "./mapStreamsToStateObj";
import isShallowEqual from "./isShallowEqual";

function xstream(controller, Wrapped) {
  const props$ = new BehaviorSubject({});
  const destroyed$ = new Subject();

  return function StreamedComp(props) {
    const [streamVals, setStreamVals] = useState(null);

    props$.next(props);

    useEffect(() => {
      controller({
        props$,
        destroyed$,
        getProps: () => props$.value,
        resolve: (params) => {
          mapStreamsToStateObj(params)
            .pipe(
              takeUntil(destroyed$),
              distinctUntilChanged((a, b) => isShallowEqual(a, b))
            )
            .subscribe(setStreamVals);
        },
      });
      return () => {
        destroyed$.next();
        props$.complete();
      };
    }, []);

    return streamVals ? <Wrapped {...props} {...streamVals} /> : null;
  };
}

export default xstream;
