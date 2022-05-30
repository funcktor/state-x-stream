import { isObservable, merge } from "rxjs";
import { map, scan } from "rxjs/operators";

function mapStreamsToStateObj(params) {
  const streams = Object.keys(params)
    .map((key) => ({ key, obs$: params[key] }))
    .filter(({ obs$ }) => isObservable(obs$));

  const init = streams.reduce((a, { key, obs$ }) => {
    return { ...a, [key]: obs$.value };
  }, params);

  const fixed = streams.map(({ key, obs$ }) =>
    obs$.pipe(map((x) => ({ [key]: x })))
  );
  return merge(...fixed).pipe(scan((acc, curr) => ({ ...acc, ...curr }), init));
}

export default mapStreamsToStateObj;
