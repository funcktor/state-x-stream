import * as React from 'react';
import { BehaviorSubject, merge, pipe, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

interface Conf {
  readonly props$: BehaviorSubject<any>,
  readonly onDestroy: { (callback: {(): void}): void}
  readonly resolve: {(streamDict: any): void }
  readonly setIntercept: {(streamDict: any): void }
}

function handleStreams(arr: any[]) {
  return function (streamObj: any) {
    const keys = Object.keys(streamObj);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      arr.push(streamObj[k].pipe(map((x) => ({ [k]: x }))));
    }
  };
}

function isShallowEqual(v: any, o: any) {
  for(var key in v) {
      if(!(key in o) || v[key] !== o[key]) {
          return false;
      }
  }
  for(var key in o) {
      if(!(key in v) || v[key] !== o[key]) {
          return false;
      }
  }
  return true 
}


function rx(controller: {(conf: Conf): void}) {
  const force$ = new Subject();
  const props$ = new BehaviorSubject({});
  const destroyed$ = new Subject();
  const streams: any[] = [];
  const resolved = { data: {} };
  
  function updateData (obj: any) {
    resolved.data = Object.assign({}, resolved.data, obj);
    return resolved.data;
  };

  let onDestroy: any = null;
  let intercept: any = pipe();

  const conf = {
    props$,
    onDestroy: (fn: any) => (onDestroy = typeof fn === 'function' ? fn : () => {}),
    resolve: handleStreams(streams),
    setIntercept: (i: any) => (intercept = i),
  }

  controller(conf);

  merge.apply(null, [props$].concat(streams))
    .pipe(takeUntil(destroyed$), map(updateData), intercept)
    .subscribe(
      () => force$.next(),
      (e: any) => console.error(e),
      onDestroy,
    );

  return function (Wrapped:any) {
    function StreamC() {
      props$.next(arguments[0])
      React.Component.apply(this, arguments);
    }
  
    StreamC.prototype = Object.create(React.Component.prototype);
  
    const sProto = StreamC.prototype;
  
    sProto.constructor = StreamC;
  
    sProto.componentDidMount = function () {
      force$.pipe(takeUntil(destroyed$)).subscribe(() => this.forceUpdate());
    };
  
    sProto.componentWillUnmount = function ()  {
      destroyed$.next();
    }
  
    sProto.shouldComponentUpdate = function (nextProps:any) {
      if (!isShallowEqual(this.props, nextProps)) {
        props$.next(nextProps);
      }
      return false;
    };
  
    sProto.render = function () {
      return React.createElement(Wrapped, resolved.data);
    };
  
    return StreamC;
  }
}


export default rx;

