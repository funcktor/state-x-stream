import { FC, Component, ComponentType } from "react";
import { BehaviorSubject, Subject } from "rxjs";
import StateObserver from "./StateObserver";
import shallowEqual from "./shallowEqual";

export type ControllerProps<T> = {
  props$: BehaviorSubject<T>;
  destroyed$: Subject<boolean>;
};

export type InjectorFunction<T, K> = (injProps: ControllerProps<T>) => K;

export function xstream<L extends object, M extends object>(injector: InjectorFunction<L, M>) {
  function createObserved<P extends object>(Wrapped: ComponentType<P>): ComponentType<L> {
    return class ObservedComponent extends Component<L, M> {
      private observer: StateObserver | null;

      constructor(props: L) {
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

      shouldComponentUpdate(nextProps: any, nextState: any) {
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
  }

  return createObserved;
}

export default xstream;
