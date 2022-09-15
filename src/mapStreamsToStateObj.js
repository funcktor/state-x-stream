import { combineLatest, isObservable, merge, BehaviorSubject } from "rxjs";
import { map, filter, scan, distinctUntilChanged } from "rxjs/operators";
import isShallowEqual from "./isShallowEqual";
import convertToBSSubject from "./convertToBSubject";

function mapStreamsToStateObj(params, log) {
  const state$ = new BehaviorSubject(null);
  const streams = Object.keys(params)
    .map((key) => ({ key, val: params[key] }))
    .filter((x) => isObservable(x.val));

  const init = Object.keys(params)
    .map((key) => ({ key, val: params[key] }))
    .reduce((a, i) => {
      return { ...a, [i.key]: isObservable(i.val) ? i.val.value : i.val };
    }, {});

  const fixed = streams.map(({ key, val }) =>
    val.pipe(
      distinctUntilChanged(),
      map((x) => [key, x])
    )
  );

  combineLatest(fixed)
    .pipe(
      map((x) => {
        return x.reduce((a, i) => ({ ...a, ...{ [i[0]]: i[1] } }), {});
      })
    )
    .subscribe((x) => {
      state$.next({ ...init, ...x });
    });

  if (streams.length === 0) {
    return new BehaviorSubject(init);
  }

  return state$.pipe(filter(Boolean));
}

export default mapStreamsToStateObj;
