import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";

import { shadows } from "../theme/shadows";
import { theme } from "../theme/theme";
import { typography } from "../theme/typography";
import type { AppIconName } from "../utils/icons";
import { usePressFeedback } from "../utils/press-feedback";
import { normalizeRomanianText } from "../utils/text";

export type SearchBarVariant = "explore" | "filter";

const SEARCH_INNER_CONTROL_SIZE = theme.sizes.input - theme.spacing.sm;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  variant?: SearchBarVariant;
  onPressFilter?: () => void | Promise<void>;
  filterIcon?: AppIconName;
  editable?: boolean;
  autoFocus?: boolean;
  testID?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  variant = "explore",
  onPressFilter,
  filterIcon = "tune",
  editable = true,
  autoFocus = false,
  testID,
}: SearchBarProps): React.JSX.Element {
  const showFilter = variant === "explore";
  const placeholderLabel = normalizeRomanianText(placeholder);
  const filterDisabled = !onPressFilter;
  const { animatedStyle, handlePressIn, handlePressOut } = usePressFeedback({
    disabled: filterDisabled,
    pressedScale: 0.97,
    pressedOpacity: 0.94,
    pressInDuration: 70,
    pressOutDuration: 130,
  });

  const handleFilterPress = (): void => {
    if (!onPressFilter) {
      return;
    }
    void onPressFilter();
  };

  return (
    <View style={[styles.wrapper, variant === "explore" ? styles.wrapperExplore : styles.wrapperFilter]}>
      <View style={styles.leadingIcon}>
        <MaterialIcons color={theme.colors.textPrimary40} name="search" size={theme.sizes.iconLg} />
      </View>
      <TextInput
        autoFocus={autoFocus}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholderLabel}
        placeholderTextColor={theme.colors.textPlaceholder}
        style={[styles.input, showFilter ? styles.inputWithFilter : styles.inputWithoutFilter]}
        testID={testID}
        value={value}
      />
      {showFilter ? (
        <AnimatedPressable
          accessibilityLabel="Open filters"
          accessibilityRole="button"
          disabled={filterDisabled}
          hitSlop={theme.spacing.xs}
          onPress={handleFilterPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.filterButton,
            {
              opacity: filterDisabled ? theme.opacity.disabled : 1,
              backgroundColor: theme.colors.olive,
            },
            animatedStyle,
          ]}
        >
          <MaterialIcons color={theme.colors.textOnAccent} name={filterIcon} size={theme.sizes.iconXl} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: theme.sizes.input,
    borderRadius: theme.radii.xxl,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: theme.borderWidths.regular,
    paddingRight: theme.spacing.xs,
  },
  wrapperExplore: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.surface,
    ...shadows.card,
  },
  wrapperFilter: {
    backgroundColor: theme.colors.sand,
    borderColor: theme.colors.sand,
  },
  leadingIcon: {
    width: SEARCH_INNER_CONTROL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: typography.family.medium,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    paddingVertical: 0,
  },
  inputWithFilter: {
    paddingRight: theme.spacing.sm,
  },
  inputWithoutFilter: {
    paddingRight: theme.spacing.xl,
  },
  filterButton: {
    width: SEARCH_INNER_CONTROL_SIZE,
    height: SEARCH_INNER_CONTROL_SIZE,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.olive,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});

