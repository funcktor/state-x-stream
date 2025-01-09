import React, { ComponentType } from "react";
import StateObserver from "./StateObserver";
import shallowEqual from "./shallowEqual";

// Define the type for the injector function
type InjectorFunction = (injProps: any) => any;

// Define the xstream function
export function xstream<P extends object>(injector: InjectorFunction) {
  const createObserved = (Wrapped: React.Component<P>) => {
    return class ObservedComponent extends React.Component {
      private observer: StateObserver | null;

      constructor(props: P) {
        super(props);
        this.observer = new StateObserver(injector, props);
        this.state = this.observer.state$.value || {}; // Ensure state is initialized
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
        // Pass only props to the wrapped component
        return <Wrapped {...this.props} {...(this.state as P)} />;
      }
    };
  };

  return createObserved;
}
