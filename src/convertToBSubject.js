import { BehaviorSubject } from "rxjs";

function convertToBehaviorSubject(observable, initValue) {
  const bs = new BehaviorSubject(initValue);
  observable.subscribe({
    complete: () => bs.complete(),
    error: (x) => bs.error(x),
    next: (x) => bs.next(x),
  });
  return bs;
}

export default convertToBehaviorSubject;
