import { render } from "@testing-library/react-native";

import { theme } from "../theme/theme";
import { PillBadge } from "./PillBadge";

describe("PillBadge", () => {
  it("renders uppercase label when requested", () => {
    const { getByText } = render(<PillBadge label="facultăți" uppercase />);
    expect(getByText("FACULTĂȚI")).toBeTruthy();
  });

  it("applies requested tone styles", () => {
    const { getByText } = render(<PillBadge label="Nou" tone="accentSoft" />);
    expect(getByText("Nou")).toHaveStyle({ color: theme.colors.accentDark });
  });
});
