import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Eye, EyeOff, AlertCircle } from "lucide-react-native";

import { register } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/api";
import { registerSchema, type RegisterForm } from "@/lib/validation";
import { APP_NAME, PORTAL_DARK } from "@/constants";
import { FONTS } from "@/constants/theme";
import { ReinesLogo } from "@/components/brand/ReinesLogo";
import { AuthInput } from "@/components/auth/AuthInput";
import { Button } from "@/components/ui/Button";
import { PasswordStrengthBar } from "@/components/auth/PasswordStrengthBar";

type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

function parseFieldErrors(error: unknown): FieldErrors | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) return null;
  const issues = error.response.data?.issues as Record<string, string[]> | undefined;
  if (!issues) return null;
  return {
    name:     issues.name?.[0],
    email:    issues.email?.[0],
    password: issues.password?.[0],
    confirmPassword: issues.confirmPassword?.[0],
  };
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const passwordValue = watch("password");

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: register,
    onSuccess: () => {
      router.replace("/(auth)/login?registered=1");
    },
    onError: (err) => {
      const serverFields = parseFieldErrors(err);
      if (serverFields) setFieldErrors(serverFields);
    },
  });

  const serverError = error && !parseFieldErrors(error) ? getErrorMessage(error) : null;

  function submit(data: RegisterForm) {
    reset();
    setFieldErrors({});
    mutate(data);
  }

  function fieldError(name: keyof RegisterForm): string | undefined {
    return errors[name]?.message ?? fieldErrors[name];
  }

  return (
    <View style={styles.root}>
      {/* Dark portal background top-to-bottom — needs light icons. */}
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <ReinesLogo variant="on-dark" height={40} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join {APP_NAME} to access your project portal.
            </Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <AuthInput
                label="Full name"
                placeholder="Jane Smith"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                value={value}
                onChangeText={(v) => {
                  onChange(v);
                  setFieldErrors((p) => ({ ...p, name: undefined }));
                }}
                onBlur={onBlur}
                error={fieldError("name")}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <AuthInput
                label="Email address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                value={value}
                onChangeText={(v) => {
                  onChange(v);
                  setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                onBlur={onBlur}
                error={fieldError("email")}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View>
                <View style={styles.inputRow}>
                  <AuthInput
                    label="Password"
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    value={value}
                    onChangeText={(v) => {
                      onChange(v);
                      setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    onBlur={onBlur}
                    error={fieldError("password")}
                    style={{ paddingRight: 44 }}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={PORTAL_DARK.textMuted} />
                    ) : (
                      <Eye size={18} color={PORTAL_DARK.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
                <PasswordStrengthBar password={passwordValue} />
              </View>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.inputRow}>
                <AuthInput
                  label="Confirm password"
                  placeholder="Re-enter your password"
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(submit)}
                  value={value}
                  onChangeText={(v) => {
                    onChange(v);
                    setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                  }}
                  onBlur={onBlur}
                  error={fieldError("confirmPassword")}
                  style={{ paddingRight: 44 }}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  hitSlop={10}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={PORTAL_DARK.textMuted} />
                  ) : (
                    <Eye size={18} color={PORTAL_DARK.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          />

          {serverError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color={PORTAL_DARK.blueText} />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          <Button
            fullWidth
            loading={isPending}
            onPress={handleSubmit(submit)}
            style={styles.submitBtn}
          >
            Create account
          </Button>

          <Text style={styles.signInPrompt}>
            Already have an account?{" "}
            <Text
              style={styles.signInLink}
              onPress={() => router.push("/(auth)/login")}
            >
              Sign in
            </Text>
          </Text>

          <Text style={styles.footer}>
            © {new Date().getFullYear()} {APP_NAME}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PORTAL_DARK.surfaceMuted },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  logoWrap: { marginBottom: 28 },

  header: { marginBottom: 24 },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: PORTAL_DARK.heading,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: PORTAL_DARK.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },

  inputRow: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 4,
    top: 34,
    padding: 8,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: PORTAL_DARK.blueBg,
    borderWidth: 1,
    borderColor: PORTAL_DARK.blueBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: PORTAL_DARK.blueText,
    lineHeight: 18,
  },
  submitBtn: { marginTop: 4 },
  signInPrompt: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: PORTAL_DARK.textMuted,
  },
  signInLink: {
    fontFamily: FONTS.semibold,
    color: PORTAL_DARK.heading,
  },
  footer: {
    marginTop: 32,
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: PORTAL_DARK.textMuted,
  },
});
