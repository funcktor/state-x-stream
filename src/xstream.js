import React, { useEffect, useState, useRef } from "react";
import { BehaviorSubject, Subject } from "rxjs";
import mapStreamsToStateObj from "./mapStreamsToStateObj";

function xstream(controller, Wrapped) {
  return React.memo((props) => {
    const [streamVals, setStreamVals] = useState(null);
    const props$Ref = useRef(null);

    useEffect(() => {
      const destroyed$ = new Subject();
      const props$ = new BehaviorSubject(props);
      props$Ref.current = props$;

      const conf = controller({ props$, destroyed$ });
      const streamedState$ = mapStreamsToStateObj(conf);
      streamedState$.subscribe(
        (x) => setStreamVals(x),
        (e) => console.error(e)
      );

      return () => {
        destroyed$.next();
        props$.complete();
        destroyed$.complete();
        streamedState$.complete();
      };
    }, []);

    useEffect(() => {
      const { current: props$ } = props$Ref;
      props$.next(props);
    }, [props]);

    return streamVals ? <Wrapped {...props} {...streamVals} /> : null;
  });
}

export default xstream;
