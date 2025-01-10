import { ComponentType, Component } from "react";
import { BehaviorSubject, Subject } from "rxjs";
import StateObserver from "./StateObserver";
import shallowEqual from "./shallowEqual";

export type ControllerProps<T> = {
  props$: BehaviorSubject<T>;
  destroyed$: Subject<boolean>;
};

type InjectorFunction = <T>(injProps: ControllerProps<T>) => any;

function xstream<P extends object>(injector: InjectorFunction) {
  const createObserved = (Wrapped: ComponentType<P>) => {
    return class ObservedComponent extends Component {
      private observer: StateObserver | null;

      constructor(props: P) {
        super(props);
        this.observer = new StateObserver(injector, props);
        this.state = this.observer.state$.value || {};
      }

      componentDidMount() {
        if (!this.observer) {
          this.observer = new StateObserver(injector, this.props);
        }

        const next = (state: Partial<P>) => this.setState(state);
        const error = (err: unknown) => console.error("Observer Error:", err);

        this.observer.state$.subscribe({ next, error });
      }

      shouldComponentUpdate(nextProps: P, nextState: Partial<P>) {
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
        return <Wrapped {...(this.state as P)} />;
      }
    };
  };

  return createObserved;
}

export default xstream;
