import React, { useEffect, useState, useRef } from "react";
import { BehaviorSubject, Subject } from "rxjs";
import { takeUntil, distinctUntilChanged } from "rxjs/operators";
import mapStreamsToStateObj from "./mapStreamsToStateObj";
import isShallowEqual from "./isShallowEqual";

function xstream(controller, Wrapped) {
  return function StreamedComp(props) {
    const [streamVals, setStreamVals] = useState(null);
    const props$ = useRef(new BehaviorSubject({}));
    const destroyed$ = useRef(new Subject());

    props$.current.next(props);

    useEffect(() => {
      controller({
        props$: props$.current,
        destroyed$: destroyed$.current,
        getProps: () => props$.current.value,
        resolve: (params) => {
          mapStreamsToStateObj(params)
            .pipe(
              takeUntil(destroyed$.current),
              distinctUntilChanged((a, b) => isShallowEqual(a, b))
            )
            .subscribe(setStreamVals);
        },
      });
      return () => {
        destroyed$.current.next();
        props$.current.complete();
        destroyed$.complete();
      };
    }, []);

    return streamVals ? <Wrapped {...props} {...streamVals} /> : null;
  };
}

export default xstream;
