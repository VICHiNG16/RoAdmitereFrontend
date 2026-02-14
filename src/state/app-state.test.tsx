import { fireEvent, render } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";

import { AppStateProvider, useAppState } from "./app-state";

const UNIVERSITY_ID = "university-universitatea-babes-bolyai";

function AppStateHarness() {
  const state = useAppState();
  const appliedUniversitiesCities = state.getAppliedFilterOptionIds("filter-universities", "cities");

  return (
    <View>
      <Text testID="data-source">{state.dataSource}</Text>
      <Text testID="universities-count">{state.universities.length.toString()}</Text>
      <Text testID="is-favorite">{state.isFavorite(UNIVERSITY_ID) ? "yes" : "no"}</Text>
      <Text testID="favorites-universities">{state.favoriteIdsByKind.universities.join(",")}</Text>
      <Text testID="applied-university-city-count">{appliedUniversitiesCities.length.toString()}</Text>
      <Pressable
        onPress={() => {
          state.toggleDataSource();
        }}
        testID="toggle-data-source"
      >
        <Text>toggle data source</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          state.toggleFavorite(UNIVERSITY_ID);
        }}
        testID="toggle-favorite"
      >
        <Text>toggle favorite</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          state.setFavorite(UNIVERSITY_ID, true);
        }}
        testID="set-favorite-true"
      >
        <Text>set favorite true</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          state.beginFilterDraft("filter-universities");
          state.toggleFilterOption("filter-universities", "cities", "option-bucuresti");
          state.applyFilterDraft("filter-universities");
        }}
        testID="apply-filter"
      >
        <Text>apply filter</Text>
      </Pressable>
    </View>
  );
}

describe("AppStateProvider", () => {
  it("defaults to mock data source", () => {
    const { getByTestId } = render(
      <AppStateProvider>
        <AppStateHarness />
      </AppStateProvider>
    );

    expect(getByTestId("data-source").props.children).toBe("mock");
  });

  it("toggles source and swaps active dataset", () => {
    const { getByTestId } = render(
      <AppStateProvider>
        <AppStateHarness />
      </AppStateProvider>
    );

    const mockCount = Number(getByTestId("universities-count").props.children);
    fireEvent.press(getByTestId("toggle-data-source"));
    const realCount = Number(getByTestId("universities-count").props.children);

    expect(getByTestId("data-source").props.children).toBe("real");
    expect(mockCount).toBeGreaterThan(realCount);
  });

  it("toggles favorites deterministically", () => {
    const { getByTestId } = render(
      <AppStateProvider>
        <AppStateHarness />
      </AppStateProvider>
    );

    const before = getByTestId("is-favorite").props.children;
    fireEvent.press(getByTestId("toggle-favorite"));
    const after = getByTestId("is-favorite").props.children;

    expect(before).not.toBe(after);
  });

  it("applies filter drafts and exposes selected option ids", () => {
    const { getByTestId } = render(
      <AppStateProvider>
        <AppStateHarness />
      </AppStateProvider>
    );

    expect(getByTestId("applied-university-city-count").props.children).toBe("0");
    fireEvent.press(getByTestId("apply-filter"));
    expect(getByTestId("applied-university-city-count").props.children).toBe("1");
  });

  it("resets favorites and filters when source changes", () => {
    const { getByTestId } = render(
      <AppStateProvider>
        <AppStateHarness />
      </AppStateProvider>
    );

    fireEvent.press(getByTestId("set-favorite-true"));
    expect(getByTestId("is-favorite").props.children).toBe("yes");
    fireEvent.press(getByTestId("apply-filter"));
    expect(getByTestId("applied-university-city-count").props.children).toBe("1");

    fireEvent.press(getByTestId("toggle-data-source"));

    expect(getByTestId("data-source").props.children).toBe("real");
    expect(getByTestId("is-favorite").props.children).toBe("no");
    expect(getByTestId("applied-university-city-count").props.children).toBe("0");
  });
});
