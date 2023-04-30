import React, { ComponentType, PropsWithRef } from "react";
import StateObserver from "./StateObserver";
import shallowEqual from "./shallowEqual";

export function xstream(injector: any) {
  const createObserved = <P extends object>(
    Wrapped: ComponentType<PropsWithRef<any>>
  ): ComponentType<P> => {
    return class Component extends React.Component<P> {
      observer: any;

      constructor(props: any) {
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
        this.observer.setProps(nextProps);
        return !shallowEqual(this.state, nextState);
      }

      componentWillUnmount() {
        this.observer && this.observer.destroy();
        this.observer = null;
      }

      render() {
        return <Wrapped {...this.state} />;
      }
    };
  };

  return createObserved;
}
