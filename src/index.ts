import { BehaviorSubject, Subject } from "rxjs";

import xstream from "./xstream";

export type ControllerProps<T> = {
  props$: BehaviorSubject<T>;
  destroyed$: Subject<boolean>;
};

export default xstream;
