import { act, render, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, Text } from "react-native";

import { __motionStoreForTests, useReducedMotionEnabled } from "./motion";

let mockAddEventListener: jest.SpiedFunction<typeof AccessibilityInfo.addEventListener>;
let mockIsReduceMotionEnabled: jest.SpiedFunction<typeof AccessibilityInfo.isReduceMotionEnabled>;
let nativeListeners: ((enabled: boolean) => void)[] = [];

function Probe({ testID }: { testID: string }): React.JSX.Element {
  const reducedMotionEnabled = useReducedMotionEnabled();
  return <Text testID={testID}>{reducedMotionEnabled ? "on" : "off"}</Text>;
}

describe("useReducedMotionEnabled", () => {
  beforeEach(() => {
    nativeListeners = [];
    mockIsReduceMotionEnabled = jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    mockAddEventListener = jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockImplementation(((eventName: string, listener: unknown) => {
        if (eventName !== "reduceMotionChanged") {
          return {
            remove: () => undefined,
          } as never;
        }

        const reduceMotionListener = listener as (enabled: boolean) => void;
        nativeListeners.push(reduceMotionListener);
        return {
          remove: () => {
            nativeListeners = nativeListeners.filter((entry) => entry !== reduceMotionListener);
          },
        };
      }) as never);

    __motionStoreForTests.reset();
  });

  afterEach(() => {
    __motionStoreForTests.reset();
    mockAddEventListener.mockRestore();
    mockIsReduceMotionEnabled.mockRestore();
    jest.clearAllMocks();
  });

  it("creates a single native subscription for many hook consumers", async () => {
    const { rerender, unmount } = render(
      <>
        <Probe testID="probe-a" />
        <Probe testID="probe-b" />
      </>
    );

    await waitFor(() => {
      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    });

    rerender(
      <>
        <Probe testID="probe-a" />
        <Probe testID="probe-b" />
        <Probe testID="probe-c" />
      </>
    );

    await waitFor(() => {
      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    });

    unmount();
    expect(nativeListeners).toHaveLength(0);
  });

  it("propagates native reduced-motion updates to all subscribers", async () => {
    const { getByTestId } = render(
      <>
        <Probe testID="probe-a" />
        <Probe testID="probe-b" />
      </>
    );

    await waitFor(() => {
      expect(getByTestId("probe-a")).toHaveTextContent("off");
      expect(getByTestId("probe-b")).toHaveTextContent("off");
    });

    await act(async () => {
      nativeListeners.forEach((listener) => {
        listener(true);
      });
    });

    await waitFor(() => {
      expect(getByTestId("probe-a")).toHaveTextContent("on");
      expect(getByTestId("probe-b")).toHaveTextContent("on");
    });
  });
});
