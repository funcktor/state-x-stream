import React, { useEffect, useState, useRef } from "react";
import { BehaviorSubject, Subject } from "rxjs";
import mapStreamsToStateObj from "./mapStreamsToStateObj";

function xstream(controller, Wrapped, shouldLog) {
  const log = shouldLog ? console.log : () => {};

  return React.memo((props) => {
    const [streamVals, setStreamVals] = useState(null);
    const props$Ref = useRef(null);

    useEffect(() => {
      const destroyed$ = new Subject();
      const props$ = new BehaviorSubject(props);
      props$Ref.current = props$;

      const conf = controller({ props$, destroyed$ });
      const streamedState$ = mapStreamsToStateObj(conf, log);
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

    log(Wrapped.name);

    return streamVals ? <Wrapped {...props} {...streamVals} /> : null;
  });
}

export default xstream;

// import React, { useEffect, useState, useRef } from "react";
// import { BehaviorSubject, Subject } from "rxjs";
// import { takeUntil, distinctUntilChanged, take, skip, tap } from "rxjs/operators";
// import mapStreamsToStateObj from "./mapStreamsToStateObj";
// import isShallowEqual from "./isShallowEqual";
// import convertToBehaviorSubject from "./convertToBSubject";

// function xstream(controller, Wrapped, shouldLog) {
//   const log = shouldLog ? console.log : () => {};
//   function StreamedComp(props) {
//     const [streamVals, setStreamVals] = useState(null);
//     const state$ = useRef(new BehaviorSubject(null)).current;
//     const props$ = useRef(new BehaviorSubject(null)).current;
//     const destroyed$ = useRef(new Subject()).current;

//     useEffect(() => {
//       props$.next(props);
//       state$
//         .pipe(
//           skip(1),
//           takeUntil(destroyed$),
//           distinctUntilChanged(isShallowEqual),
//           tap((x) => log(x))
//         )

//         .subscribe(setStreamVals);
//     }, [props]);

//     useEffect(() => {
//       console.log("-->");
//       controller({
//         props$: convertToBehaviorSubject(props$.pipe(takeUntil(destroyed$))),
//         destroyed$: destroyed$.pipe(take(1)),
//         getProps: () => props$.current.value,
//         resolve: (params) => {
//           mapStreamsToStateObj(params, state$);
//         },
//       });
//       return () => destroyed$.next();
//     }, []);

//     return streamVals ? <Wrapped {...props} {...streamVals} /> : null;
//   }
//   return () => React.memo(StreamedComp);
// }

// export default xstream;

// import React, { useEffect, useState } from "react";
// import { BehaviorSubject, Subject, animationFrameScheduler } from "rxjs";
// import {
//   takeUntil,
//   tap,
//   catchError,
//   distinctUntilChanged,
//   skip,
//   take,
//   filter,
//   auditTime,
// } from "rxjs/operators";
// import mapStreamsToStateObj from "./mapStreamsToStateObj";
// import isShallowEqual from "./isShallowEqual";
// import convertToBehaviorSubject from "./convertToBSubject";

// function xstream(controller, shouldLog) {
//   const log = shouldLog ? console.log : () => {};

//   return (Wrapped) => {
//     let props$ = new BehaviorSubject(null);
//     let destroyed$ = new Subject();
//     let state$ = new BehaviorSubject(null);

//     function init() {
//       // log("on init the props are: ", props$.value);
//       controller({
//         props$,
//         destroyed$: destroyed$.pipe(take(1)),
//         getProps: () => props$.value,
//         resolve: (params) => {
//           const p = mapStreamsToStateObj(params);
//           p.pipe().subscribe(
//             (x) => {
//               // log("--->", x, p);
//               state$.next(x);
//             }
//             // (e) => console.error(e),
//             // (d) => log("AAAAAAAAAAA: ", d)
//           );
//           log(p);
//         },
//       });
//     }

//     function StreamedComp(props) {
//       const [streamVals, setStreamVals] = useState(state$?.value);

//       useEffect(() => {
//         // log("-----------------------------------------------------");
//         props$ = new BehaviorSubject(props);
//         props$.next(props);
//         destroyed$ = new Subject();
//         state$ = new BehaviorSubject(null);

//         init();
//       }, []);

//       useEffect(() => {
//         props$.next(props);
//       }, [props]);

//       useEffect(() => {
//         state$.subscribe((x) => {
//           // log("received: ", x);
//           setStreamVals(x);
//         });

//         return () => {
//           // state$.complete();
//           // props$.complete();
//           // destroyed$.next();
//         };
//       }, []);

//       log(props?.track?.title);

//       return streamVals ? <Wrapped {...props} {...streamVals} /> : null;
//     }
//     return React.memo(StreamedComp);
//   };
// }

// export default xstream;
