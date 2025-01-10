import { FC, Component } from "react";
import { BehaviorSubject, Subject } from "rxjs";
import StateObserver from "./StateObserver";
import shallowEqual from "./shallowEqual";

export type ControllerProps<T> = {
  props$: BehaviorSubject<T>;
  destroyed$: Subject<boolean>;
};

type InjectorFunction = <T>(injProps: ControllerProps<T>) => any;

export function xstream(injector: InjectorFunction) {
  function createObserved<P extends object>(Wrapped: FC<P>): FC<any> {
    return class ObservedComponent extends Component {
      private observer: StateObserver | null;

      constructor(props) {
        super(props);
        this.observer = new StateObserver(injector, props);
        this.state = this.observer.state$.value;
      }

      componentDidMount() {
        if (!this.observer) {
          this.observer = new StateObserver(injector, this.props);
        }
        const next = (x: any) => this.setState(x);
        const error = (x: any) => console.error(x);

        this.observer.state$.subscribe({ next, error });
      }

      shouldComponentUpdate(nextProps, nextState) {
        if (this.observer) {
          this.observer.setProps(nextProps);
        }
        return !shallowEqual(this.state, nextState) || !shallowEqual(this.props, nextProps);
      }

      componentWillUnmount() {
        if (this.observer) {
          this.observer.destroy();
          this.observer = null;
        }
      }

      render() {
        console.log("psoles");
        return <Wrapped {...(this.state as P)} />;
      }
    };
  }

  return createObserved;
}

export default xstream;
