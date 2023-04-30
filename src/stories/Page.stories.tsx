import type { Meta, StoryObj } from "@storybook/react";
import { PropsWithRef } from "react";
import xstream from "../";
import { ComponentType } from "react";
import { BehaviorSubject, map, of } from "rxjs";

type StreamedProps = {
  step: number;
};

type ControllerProps = {
  props$: BehaviorSubject<StreamedProps>;
};

function controller({ props$ }: ControllerProps) {
  let counter = 1;

  return {
    test: of(100).pipe(map(() => props$.value.step * counter++)),
  };
}

const Comp: ComponentType<PropsWithRef<any>> = ({ test }) => {
  return <div>test: {test}</div>;
};

const Streamed: ComponentType<StreamedProps> = xstream(controller)(Comp);

const meta: Meta<typeof Streamed> = {
  title: "Stream/Test2",
  component: Streamed,
};

type Story = StoryObj<typeof Streamed>;

export default meta;

export const Primary: Story = {
  render: () => <Streamed step={200} />,
};
export const Secondary: Story = {
  render: () => <Streamed step={100} />,
};
