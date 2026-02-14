import { fireEvent, render } from "@testing-library/react-native";

import { SegmentedTabs } from "./SegmentedTabs";

jest.mock("../utils/motion", () => ({
  useReducedMotionEnabled: () => true,
  getMotionDistance: () => 0,
  getMotionDuration: () => 0,
  getMotionEasing: () => (value: number) => value,
}));

describe("SegmentedTabs", () => {
  it("renders tab labels and triggers onChange", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SegmentedTabs
        activeKey="universities"
        items={[
          { key: "universities", label: "Universități" },
          { key: "faculties", label: "Facultăți" },
        ]}
        onChange={onChange}
      />
    );

    fireEvent.press(getByText("Facultăți"));
    expect(onChange).toHaveBeenCalledWith("faculties");
  });

  it("renders badges for tab counts", () => {
    const { getByText } = render(
      <SegmentedTabs
        activeKey="universities"
        items={[
          { key: "universities", label: "Universități", badgeLabel: 2 },
          { key: "faculties", label: "Facultăți", badgeLabel: 0 },
        ]}
        onChange={() => undefined}
      />
    );

    expect(getByText("2")).toBeTruthy();
    expect(getByText("0")).toBeTruthy();
  });
});
