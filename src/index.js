import React from "react";
import { isObservable, Subject, BehaviorSubject, takeUntil, tap } from "rxjs";

function shallowEqual(a, b) {
  const k1 = Object.keys(a);
  const k2 = Object.keys(b);
  const sameKeys = k1.length === k2.length;
  return sameKeys && !k1.find((k) => a[k] !== b[k]);
}

function blockIfSame(a, b, fn) {
  if (!shallowEqual(a, b)) fn();
}

function createObserver(controller, props, ref$) {
  const destroyed$ = new Subject();
  const props$ = new BehaviorSubject(props);
  const ctrl = controller({ props$, destroyed$, ref$ });
  const keyVals = Object.entries(ctrl || {});
  const streams = keyVals.filter((x) => isObservable(x[1]));
  const nonStreams = keyVals.filter((x) => !isObservable(x[1]));
  const vals = nonStreams.reduce((a, i) => Object.assign({}, a, { [i[0]]: i[1] }), {});
  const state$ = new BehaviorSubject(Object.assign({}, props, vals));

  function updateState() {
    const newState = Object.assign({}, props$.value, vals);
    blockIfSame(newState, state$.value, () => state$.next(newState));
  }

  props$.subscribe(updateState);

  const subs = streams.map((x) => {
    return x[1].pipe(tap((y) => (vals[x[0]] = y))).subscribe(updateState);
  });

  return {
    sub: state$.pipe(),
    initVal: state$.value,
    setProps: (x) => blockIfSame(x, props$.value, () => props$.next(x)),
    destroy: () => {
      destroyed$.next(true);
      ref$.complete();
      props$.complete();
      destroyed$.complete();
      state$.complete();
      subs.forEach((x) => x.unsubscribe());
    },
  };
}

function xstream(controller, WrappedComp) {
  const isFunctional = typeof WrappedComp === "function";
  const Wrapped = React.memo(WrappedComp);

  class Component extends React.Component {
    constructor(props) {
      super(props);
      this.destroy$ = new Subject();
      this.ref$ = new BehaviorSubject(null);
      this.ref = React.createRef();
      this.refCallback = isFunctional ? null : (x) => (this.ref = x);
      this.state = this.createObserver();
    }

    setRef(x) {
      this.ref = x;
      this.ref$.next(this.ref);
    }

    createObserver() {
      if (this.isObsOpen) return this.observer.initVal;
      this.isObsOpen = true;
      this.observer = createObserver(controller, this.props, this.ref$);
      return this.observer.initVal;
    }

    componentDidMount() {
      const next = (x) => this.setState(x);
      const complete = () => (this.isObsOpen = false);
      const error = (x) => console.error(x);
      const conf = { next, complete, error };
      this.createObserver();
      this.observer.sub.pipe(takeUntil(this.destroy$)).subscribe(conf);
    }

    shouldComponentUpdate(nextProps, nextState) {
      this.observer.setProps(nextProps);
      return !shallowEqual(this.state, nextState);
    }

    componentWillUnmount() {
      this.destroy$.next();
      this.observer.destroy();
    }

    render() {
      return <Wrapped {...this.state} ref={this.refCallback} />;
    }
  }

  return Component;
}

export default xstream;
