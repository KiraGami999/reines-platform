import { View, Text, TextInput, StyleSheet, type TextInputProps } from "react-native";
import { PORTAL_DARK } from "@/constants";
import { FONTS } from "@/constants/theme";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

/**
 * Dark "portal" styled text input for the Login/Register screens — mirrors
 * the website's dark-mode form fields (see reines-web `components/ui/Input.tsx`
 * + globals.css `.dark [data-portal]` remaps). Kept separate from the shared
 * `components/ui/Input`, which the rest of the (light-only) native app still
 * uses, so this restyle stays scoped to auth.
 */
export function AuthInput({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        placeholderTextColor={PORTAL_DARK.textMuted}
        style={[styles.input, error && styles.inputError, style]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize:     14,
    fontFamily:   FONTS.medium,
    color:        PORTAL_DARK.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth:       1,
    borderColor:       PORTAL_DARK.border,
    borderRadius:      10,
    paddingHorizontal: 14,
    paddingVertical:   12,
    fontSize:          14,
    fontFamily:        FONTS.regular,
    color:             PORTAL_DARK.foreground,
    backgroundColor:   PORTAL_DARK.surface,
  },
  inputError: { borderColor: PORTAL_DARK.redText },
  error:      { fontSize: 11, fontFamily: FONTS.regular, color: PORTAL_DARK.redText, marginTop: 4 },
});
