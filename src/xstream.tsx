import React, { ComponentType, PropsWithRef } from "react";
import StateObserver from "./StateObserver";
import shallowEqual from "./shallowEqual";

// import React from "react";

// type Fn<TArg, TResult> = (arg: TArg) => TResult;

// const withMouseClicks =
//   <TArg, TResult>(fn: Fn<TArg, TResult>) =>
//   <P extends object>(Wrapped: React.ComponentType<P & TResult>) => {
//     return class WithMouseClicks extends React.Component<P, TResult> {
//       state: TResult = {} as TResult;

//       handleClick = () => {
//         this.setState(fn(this.state));
//       };

//       render() {
//         return (
//           <div onClick={this.handleClick}>
//             <Wrapped
//               {...(this.props as P & TResult)}
//               {...(this.state as TResult)}
//             />
//           </div>
//         );
//       }
//     };
//   };

// export default withMouseClicks;

type Fn<TArg, TResult> = (arg: TArg) => TResult;

export function xstream<TArg, TResult>(injector: Fn<TArg, TResult>) {
  const createObserved = <P extends object>(
    Wrapped: ComponentType<PropsWithRef<any>>
  ): ComponentType<P & TResult> => {
    return class Component extends React.Component<P, TResult> {
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
