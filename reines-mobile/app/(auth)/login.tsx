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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react-native";

import { useAuth } from "@/hooks/useAuth";
import { login } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/api";
import { loginSchema, type LoginForm } from "@/lib/validation";
import { APP_NAME, COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";
import { ReinesLogo } from "@/components/brand/ReinesLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
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
        <View style={styles.brandPanel}>
          <ReinesLogo variant="on-dark" height={56} />
        </View>

        <View style={styles.formPanel}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSub}>
              Sign in to access {APP_NAME}.
            </Text>
          </View>

          {justRegistered && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={15} color={COLORS.greenText} />
              <Text style={styles.successBannerText}>
                Account created successfully. Sign in with your email and password.
              </Text>
            </View>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View>
                <Input
                  label="Password"
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
                    <EyeOff size={18} color={COLORS.zinc400} />
                  ) : (
                    <Eye size={18} color={COLORS.zinc400} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          />

          {serverError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color={COLORS.redText} />
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.zinc50 },
  scroll: { flexGrow: 1 },

  brandPanel: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  formPanel: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    backgroundColor: COLORS.zinc50,
  },
  formHeader: { marginBottom: 24 },
  formTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.primary,
  },
  formSub: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.zinc500,
    marginTop: 4,
    lineHeight: 20,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 38,
    padding: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.redBg,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.redText,
    lineHeight: 18,
  },
  submitBtn: { marginTop: 4 },
  successBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.greenBg,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.greenText,
    lineHeight: 18,
  },
  registerPrompt: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.zinc500,
  },
  registerLink: {
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
  },
  footer: {
    marginTop: 32,
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.zinc400,
  },
});
