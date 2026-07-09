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
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Eye, EyeOff, AlertCircle, ShieldCheck, MessageSquare } from "lucide-react-native";

import { register } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/api";
import { registerSchema, type RegisterForm } from "@/lib/validation";
import { COLORS } from "@/constants";
import { FONTS } from "@/constants/theme";
import { ReinesLogo } from "@/components/brand/ReinesLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordStrengthBar } from "@/components/auth/PasswordStrengthBar";

const BENEFITS = [
  { icon: Eye,            text: "Real-time project progress visibility" },
  { icon: MessageSquare, text: "Direct messaging with your project manager" },
  { icon: ShieldCheck,    text: "Secure, role-based access to your data" },
] as const;

type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

function parseFieldErrors(error: unknown): FieldErrors | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) return null;
  const issues = error.response.data?.issues as Record<string, string[]> | undefined;
  if (!issues) return null;
  return {
    name:     issues.name?.[0],
    email:    issues.email?.[0],
    password: issues.password?.[0],
  };
}

export default function RegisterScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand panel — mirrors web register left panel */}
        <View style={styles.brandPanel}>
          <ReinesLogo variant="on-dark" height={40} />

          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>Your project. Your portal.</Text>
            <Text style={styles.brandSub}>
              The Reines portal gives you full visibility into your work — from foundation to finish.
            </Text>
          </View>

          <View style={styles.benefits}>
            {BENEFITS.map(({ icon: Icon, text }) => (
              <View key={text} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Icon size={16} color={COLORS.accent} />
                </View>
                <Text style={styles.benefitText}>{text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.brandFooter}>
            Already have an account?{" "}
            <Text
              style={styles.brandFooterLink}
              onPress={() => router.push("/(auth)/login")}
            >
              Sign in here.
            </Text>
          </Text>
        </View>

        {/* Form panel */}
        <View style={styles.formPanel}>
          <ReinesLogo variant="on-light" height={32} style={styles.mobileLogo} />

          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Create your account</Text>
            <Text style={styles.formSub}>
              Create your Reines account to access your project portal.
            </Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
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
              <Input
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
                <Input
                  label="Password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(submit)}
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
                    <EyeOff size={18} color={COLORS.zinc400} />
                  ) : (
                    <Eye size={18} color={COLORS.zinc400} />
                  )}
                </TouchableOpacity>
                <PasswordStrengthBar password={passwordValue} />
              </View>
            )}
          />

          {serverError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={15} color={COLORS.blueText} />
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
            © {new Date().getFullYear()} Reines Property Development Limited
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
    paddingTop: 48,
    paddingBottom: 32,
    gap: 24,
  },
  brandCopy: { gap: 8 },
  brandTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.white,
  },
  brandSub: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.zinc400,
    lineHeight: 20,
  },
  benefits: { gap: 14 },
  benefitRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           12,
  },
  benefitIcon: {
    width:           32,
    height:          32,
    borderRadius:    8,
    backgroundColor: COLORS.accentMuted,
    alignItems:      "center",
    justifyContent:  "center",
  },
  benefitText: {
    flex:       1,
    fontFamily: FONTS.regular,
    fontSize:   14,
    color:      COLORS.zinc300,
    lineHeight: 20,
  },
  brandFooter: {
    fontFamily: FONTS.regular,
    fontSize:   12,
    color:      COLORS.zinc500,
    marginTop:  4,
  },
  brandFooterLink: {
    fontFamily: FONTS.semibold,
    color:      COLORS.accent,
  },

  formPanel: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    backgroundColor: COLORS.zinc50,
  },
  mobileLogo: { marginBottom: 20 },
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
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.blueBg,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.blueText,
    lineHeight: 18,
  },
  submitBtn: { marginTop: 4 },
  signInPrompt: {
    marginTop: 20,
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.zinc500,
  },
  signInLink: {
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
