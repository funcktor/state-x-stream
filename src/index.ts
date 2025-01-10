import xstream from "./xstream";
import { BehaviorSubject, Subject } from "rxjs";

export type ControllerProps<T> = {
  props$: BehaviorSubject<T>;
  destroyed$: Subject<boolean>;
};

export default xstream;
