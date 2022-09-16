import { combineLatest, isObservable, BehaviorSubject } from "rxjs";
import { map, filter, distinctUntilChanged } from "rxjs/operators";

function mapStreamsToStateObj(params) {
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
    .pipe(map((x) => x.reduce((a, i) => ({ ...a, ...{ [i[0]]: i[1] } }), {})))
    .subscribe((x) => {
      state$.next({ ...init, ...x });
    });

  if (streams.length === 0) {
    return new BehaviorSubject(init);
  }

  return state$.pipe(filter(Boolean));
}

export default mapStreamsToStateObj;
