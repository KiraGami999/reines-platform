import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import { login } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/api";
import { loginSchema, type LoginForm } from "@/lib/validation";
import { APP_NAME, WEB_BASE_URL, PORTAL_DARK } from "@/constants";
import { FONTS } from "@/constants/theme";
import { ReinesLogo } from "@/components/brand/ReinesLogo";
import { AuthInput } from "@/components/auth/AuthInput";
import { Button } from "@/components/ui/Button";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const justRegistered = registered === "1";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      signIn(data.token, data.user);
      const dest =
        data.user.role === "ADMIN"
          ? "/(admin)"
          : data.user.role === "PROJECT_MANAGER"
            ? "/(manager)"
            : "/(client)";
      router.replace(dest);
    },
  });

  const serverError = error ? getErrorMessage(error) : null;

  function submit(data: LoginForm) {
    reset();
    mutate(data);
  }

  function openForgotPassword() {
    Linking.openURL(`${WEB_BASE_URL}/forgot-password`).catch(() => {});
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to access {APP_NAME}.
            </Text>
          </View>

          {justRegistered && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={15} color={PORTAL_DARK.greenText} />
              <Text style={styles.successBannerText}>
                Account created successfully. Sign in with your email and password.
              </Text>
            </View>
          )}

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
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TouchableOpacity onPress={openForgotPassword} hitSlop={8}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.inputRow}>
                <AuthInput
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(submit)}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
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
            )}
          />

          {serverError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color={PORTAL_DARK.redText} />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          <Button
            fullWidth
            loading={isPending}
            onPress={handleSubmit(submit)}
            style={styles.submitBtn}
          >
            Sign in
          </Button>

          <Text style={styles.registerPrompt}>
            Don&apos;t have an account?{" "}
            <Text
              style={styles.registerLink}
              onPress={() => router.push("/(auth)/register")}
            >
              Create one
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

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: PORTAL_DARK.textSecondary,
  },
  forgotLink: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: PORTAL_DARK.heading,
  },

  inputRow: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: PORTAL_DARK.redBg,
    borderWidth: 1,
    borderColor: PORTAL_DARK.redBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: PORTAL_DARK.redText,
    lineHeight: 18,
  },
  submitBtn: { marginTop: 4 },
  successBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: PORTAL_DARK.greenBg,
    borderWidth: 1,
    borderColor: PORTAL_DARK.greenBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: PORTAL_DARK.greenText,
    lineHeight: 18,
  },
  registerPrompt: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: PORTAL_DARK.textMuted,
  },
  registerLink: {
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
