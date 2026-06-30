import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import { login } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/api";
import { loginSchema, type LoginForm } from "@/lib/validation";
import { COLORS } from "@/constants";

export default function LoginScreen() {
  const { signIn }          = useAuth();
  const router              = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver:      zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      signIn(data.token, data.user);
      router.replace(
        data.user.role === "PROJECT_MANAGER" ? "/(manager)" : "/(client)"
      );
    },
  });

  // Extract a human-readable message from the Axios error
  const serverError = error ? getErrorMessage(error) : null;

  function submit(data: LoginForm) {
    reset();       // clear previous error before retrying
    mutate(data);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand ── */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>R</Text>
          </View>
          <Text style={styles.appName}>Reines Portal</Text>
          <Text style={styles.appSub}>Property Development Limited</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.cardSub}>
            Use the same email and password as the web portal.
          </Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={[styles.inputRow, errors.email && styles.inputRowError]}>
                  <Mail size={16} color={COLORS.zinc400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.zinc400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text style={styles.fieldError}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={[styles.inputRow, errors.password && styles.inputRowError]}>
                  <Lock size={16} color={COLORS.zinc400} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.zinc400}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(submit)}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                    style={styles.eyeBtn}
                  >
                    {showPassword
                      ? <EyeOff size={16} color={COLORS.zinc400} />
                      : <Eye    size={16} color={COLORS.zinc400} />
                    }
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text style={styles.fieldError}>{errors.password.message}</Text>
            )}
          </View>

          {/* Server error banner */}
          {serverError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color={COLORS.red} />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, isPending && styles.btnDisabled]}
            onPress={handleSubmit(submit)}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.btnText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © {new Date().getFullYear()} Reines Property Development Limited
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 },

  // ── Brand ──
  brand:      { alignItems: "center", marginBottom: 36 },
  logoBox:    {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  logoLetter: { fontSize: 38, fontWeight: "800", color: COLORS.primary },
  appName:    { marginTop: 16, fontSize: 26, fontWeight: "800", color: COLORS.white, letterSpacing: -0.3 },
  appSub:     { marginTop: 4, fontSize: 12, color: COLORS.accent, letterSpacing: 0.4 },

  // ── Card ──
  card: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", color: COLORS.primary, textAlign: "center" },
  cardSub:   { fontSize: 13, color: COLORS.zinc500, textAlign: "center", marginTop: 6, marginBottom: 28, lineHeight: 19 },

  // ── Fields ──
  fieldGroup:     { marginBottom: 18 },
  label:          { fontSize: 13, fontWeight: "600", color: COLORS.zinc700, marginBottom: 7 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.zinc200, borderRadius: 14,
    backgroundColor: COLORS.zinc50, paddingHorizontal: 14, paddingVertical: 0,
  },
  inputRowError:  { borderColor: COLORS.red, backgroundColor: "#fff5f5" },
  inputIcon:      { marginRight: 10 },
  textInput:      { flex: 1, fontSize: 14, color: COLORS.zinc900, paddingVertical: 13 },
  eyeBtn:         { padding: 4, marginLeft: 6 },
  fieldError:     { fontSize: 11, color: COLORS.red, marginTop: 5 },

  // ── Error banner ──
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 12, padding: 12, marginBottom: 18,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: COLORS.red, lineHeight: 18 },

  // ── Button ──
  btn:        { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  btnDisabled:{ opacity: 0.65 },
  btnText:    { color: COLORS.white, fontSize: 16, fontWeight: "700" },

  // ── Footer ──
  footer: { marginTop: 36, textAlign: "center", fontSize: 11, color: COLORS.accent },
});
