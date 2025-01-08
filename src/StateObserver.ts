import { isObservable, Subject, BehaviorSubject, takeUntil, tap, Observable } from "rxjs";
import shallowEqual from "./shallowEqual";

interface KeyVal {
  key: string;
  val: any;
}

interface KeyValSub {
  key: string;
  val: Observable<any>;
}

export default class StateObserver {
  destroyed$: Subject<boolean>;
  props$: BehaviorSubject<any>;
  state$: BehaviorSubject<any>;
  vals: any;

  constructor(controller: any, props: any) {
    this.destroyed$ = new Subject();
    this.props$ = new BehaviorSubject(props);

    const ctrl = controller({ props$: this.props$, destroyed$: this.destroyed$ });
    const keyVals: KeyVal[] = Object.entries(ctrl || {}).map((x) => ({ key: x[0], val: x[1] }));
    const streams: KeyValSub[] = keyVals.filter((x: KeyValSub) => isObservable(x.val));
    const nonStreams: KeyVal[] = keyVals.filter((x: any) => !isObservable(x.val));

    this.vals = nonStreams.reduce((a: any, i: any) => ({ ...a, [i.key]: i.val }), {});
    this.state$ = new BehaviorSubject({ ...props, ...this.vals });
    this.props$.subscribe(() => this.updateState());

    streams.forEach((x: KeyValSub) => {
      return x.val
        .pipe(
          tap((y) => (this.vals[x.key] = y)),
          takeUntil(this.destroyed$)
        )
        .subscribe(() => this.updateState());
    });
  }

  updateState() {
    const newState = { ...this.props$.value, ...this.vals };
    const oldState = this.state$.value;
    if (!shallowEqual(newState, oldState)) this.state$.next(newState);
  }

  setProps(newProps: any) {
    if (!shallowEqual(newProps, this.props$.value)) this.props$.next(newProps);
  }

  destroy() {
    this.state$.complete();
  }
}
