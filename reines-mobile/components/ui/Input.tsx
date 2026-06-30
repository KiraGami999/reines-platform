import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { COLORS } from "@/constants";

interface Props extends TextInputProps {
  label?:   string;
  error?:   string;
  hint?:    string;
}

export function Input({ label, error, hint, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        placeholderTextColor={COLORS.zinc400}
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { marginBottom: 16 },
  label:      { fontSize: 13, fontWeight: "600", color: COLORS.zinc700, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.zinc200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.zinc900, backgroundColor: COLORS.white,
  },
  inputError: { borderColor: COLORS.red },
  error:      { fontSize: 11, color: COLORS.red,     marginTop: 4 },
  hint:       { fontSize: 11, color: COLORS.zinc400, marginTop: 4 },
});
