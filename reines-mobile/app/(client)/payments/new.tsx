import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft, CreditCard, Banknote, Camera, CheckCircle, AlertCircle } from "lucide-react-native";
import { COLORS } from "@/constants";
import { useProjects } from "@/hooks/useProjects";
import { useInitiatePayment, useSubmitCashPayment, useInvalidatePayments } from "@/hooks/usePayments";
import { uploadReceipt } from "@/services/payments.service";

type Method = "PAYCHANGU" | "CASH";

const schema = z.object({
  projectId:   z.string().min(1, "Please select a project."),
  amount:      z.string().min(1, "Amount is required.").refine(
    (v) => !isNaN(Number(v)) && Number(v) > 0,
    "Enter a valid amount greater than 0."
  ),
  description: z.string().min(3, "Description must be at least 3 characters."),
});

type FormValues = z.infer<typeof schema>;

export default function NewPaymentScreen() {
  const router            = useRouter();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const initiatePayment   = useInitiatePayment();
  const submitCash        = useSubmitCashPayment();
  const invalidate        = useInvalidatePayments();

  const [method,     setMethod]     = useState<Method>("PAYCHANGU");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [success,    setSuccess]    = useState(false);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectId: "", amount: "", description: "" },
  });

  const selectedProjectId = watch("projectId");

  /* ── Receipt picker ── */
  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed to take a receipt photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  /* ── Submit ── */
  async function onSubmit(values: FormValues) {
    const amount = Number(values.amount);

    if (method === "PAYCHANGU") {
      try {
        const res = await initiatePayment.mutateAsync({
          projectId:   values.projectId,
          amount,
          description: values.description,
        });

        const browserRes = await WebBrowser.openBrowserAsync(res.checkoutUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });

        // Whether the user completes or dismisses, refresh the payment list
        invalidate();
        router.back();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Payment initiation failed.";
        Alert.alert("Payment Error", msg);
      }
      return;
    }

    // Cash payment
    let receiptUrl: string | undefined;
    if (receiptUri) {
      setUploading(true);
      try {
        receiptUrl = await uploadReceipt(receiptUri);
      } catch {
        Alert.alert("Upload failed", "Could not upload receipt. You can still submit without it.");
      } finally {
        setUploading(false);
      }
    }

    try {
      await submitCash.mutateAsync({
        projectId:   values.projectId,
        amount,
        description: values.description,
        receiptUrl,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit cash payment.";
      Alert.alert("Error", msg);
    }
  }

  /* ── Success state ── */
  if (success) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.successScreen}>
          <CheckCircle size={64} color={COLORS.green} />
          <Text style={styles.successTitle}>Payment Submitted!</Text>
          <Text style={styles.successBody}>
            Your cash payment is pending admin review. You will be notified once it is approved.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnLabel}>Back to Payments</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPending = initiatePayment.isPending || submitCash.isPending || uploading;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={22} color={COLORS.zinc900} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>New Payment</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Payment method selector */}
          <Text style={styles.sectionLabel}>Payment Method</Text>
          <View style={styles.methodRow}>
            <MethodCard
              icon={<CreditCard size={22} color={method === "PAYCHANGU" ? COLORS.white : COLORS.primary} />}
              label="Online"
              sublabel="via PayChangu"
              active={method === "PAYCHANGU"}
              onPress={() => setMethod("PAYCHANGU")}
            />
            <MethodCard
              icon={<Banknote size={22} color={method === "CASH" ? COLORS.white : COLORS.primary} />}
              label="Cash"
              sublabel="Upload receipt"
              active={method === "CASH"}
              onPress={() => setMethod("CASH")}
            />
          </View>

          {/* Project picker */}
          <Text style={styles.sectionLabel}>Project</Text>
          {loadingProjects ? (
            <View style={styles.skInput} />
          ) : (
            <Controller
              control={control}
              name="projectId"
              render={({ field: { onChange, value } }) => (
                <View style={styles.projectScroll}>
                  {(projects ?? []).map((proj) => {
                    const active = proj.id === value;
                    return (
                      <TouchableOpacity
                        key={proj.id}
                        style={[styles.projectChip, active && styles.projectChipActive]}
                        onPress={() => onChange(proj.id)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.projectChipText, active && styles.projectChipTextActive]} numberOfLines={1}>
                          {proj.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          )}
          {errors.projectId && <FieldError msg={errors.projectId.message!} />}

          {/* Amount */}
          <Text style={styles.sectionLabel}>Amount (MWK)</Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.amount && styles.inputError]}
                placeholder="e.g. 500000"
                placeholderTextColor={COLORS.zinc400}
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          {errors.amount && <FieldError msg={errors.amount.message!} />}

          {/* Description */}
          <Text style={styles.sectionLabel}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                placeholder="e.g. Foundation work – Phase 1"
                placeholderTextColor={COLORS.zinc400}
                multiline
                numberOfLines={3}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          {errors.description && <FieldError msg={errors.description.message!} />}

          {/* Receipt upload (cash only) */}
          {method === "CASH" && (
            <>
              <Text style={styles.sectionLabel}>Receipt (optional)</Text>
              {receiptUri ? (
                <View style={styles.receiptPreviewWrap}>
                  <Image source={{ uri: receiptUri }} style={styles.receiptPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.changeReceiptBtn}
                    onPress={pickReceipt}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.changeReceiptLabel}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.receiptBtns}>
                  <TouchableOpacity style={styles.receiptBtn} onPress={takePhoto} activeOpacity={0.8}>
                    <Camera size={18} color={COLORS.primary} />
                    <Text style={styles.receiptBtnLabel}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.receiptBtn} onPress={pickReceipt} activeOpacity={0.8}>
                    <Text style={styles.receiptBtnLabel}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.hint}>
                Upload a photo or scan of your bank deposit slip or cash receipt.
              </Text>
            </>
          )}

          {/* Info banner for PayChangu */}
          {method === "PAYCHANGU" && (
            <View style={styles.infoBanner}>
              <AlertCircle size={14} color={COLORS.primary} />
              <Text style={styles.infoText}>
                You will be redirected to PayChangu secure checkout. Return to the app after payment.
              </Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.primaryBtn, isPending && styles.primaryBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.primaryBtnLabel}>
                  {method === "PAYCHANGU" ? "Proceed to Checkout" : "Submit Cash Payment"}
                </Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Sub-components ── */

function MethodCard({
  icon, label, sublabel, active, onPress,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.methodCard, active && styles.methodCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.methodIconWrap, { backgroundColor: active ? "rgba(255,255,255,0.2)" : COLORS.primary + "10" }]}>
        {icon}
      </View>
      <Text style={[styles.methodLabel,    active && styles.methodLabelActive]}>{label}</Text>
      <Text style={[styles.methodSublabel, active && styles.methodSublabelActive]}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <View style={styles.fieldError}>
      <AlertCircle size={12} color={COLORS.red} />
      <Text style={styles.fieldErrorText}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: COLORS.zinc50 },
  topBar: {
    flexDirection:    "row",
    alignItems:       "center",
    justifyContent:   "space-between",
    paddingHorizontal: 20,
    paddingVertical:  14,
    backgroundColor:  COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  topBarTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  scroll: { padding: 20, paddingBottom: 48, gap: 10 },

  sectionLabel: {
    fontSize:     13,
    fontWeight:   "600",
    color:        COLORS.zinc500,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop:    8,
    marginBottom: 4,
  },

  methodRow: { flexDirection: "row", gap: 12 },
  methodCard: {
    flex:           1,
    alignItems:     "center",
    backgroundColor: COLORS.white,
    borderRadius:   14,
    padding:        16,
    gap:            6,
    borderWidth:    2,
    borderColor:    COLORS.zinc200,
  },
  methodCardActive: {
    backgroundColor: COLORS.primary,
    borderColor:     COLORS.primary,
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.3,
    shadowRadius:    8,
    elevation:       5,
  },
  methodIconWrap: { borderRadius: 22, padding: 10, marginBottom: 2 },
  methodLabel:   { fontSize: 15, fontWeight: "800", color: COLORS.zinc900 },
  methodSublabel:{ fontSize: 11, color: COLORS.zinc400 },
  methodLabelActive:   { color: COLORS.white },
  methodSublabelActive:{ color: "rgba(255,255,255,0.7)" },

  projectScroll: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  projectChip: {
    borderRadius:      20,
    borderWidth:       1.5,
    borderColor:       COLORS.zinc200,
    paddingHorizontal: 12,
    paddingVertical:   7,
    backgroundColor:   COLORS.white,
  },
  projectChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  projectChipText:   { fontSize: 13, fontWeight: "600", color: COLORS.zinc700 },
  projectChipTextActive: { color: COLORS.white },

  input: {
    backgroundColor: COLORS.white,
    borderRadius:    12,
    borderWidth:     1.5,
    borderColor:     COLORS.zinc200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize:        15,
    color:           COLORS.zinc900,
  },
  textArea:   { minHeight: 80, textAlignVertical: "top", paddingTop: 12 },
  inputError: { borderColor: COLORS.red },

  fieldError: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: -4 },
  fieldErrorText: { fontSize: 12, color: COLORS.red },

  receiptPreviewWrap: { borderRadius: 12, overflow: "hidden", position: "relative" },
  receiptPreview:     { width: "100%", height: 200, backgroundColor: COLORS.zinc100 },
  changeReceiptBtn: {
    position:          "absolute",
    bottom:            10,
    right:             10,
    backgroundColor:   "rgba(0,0,0,0.55)",
    borderRadius:      16,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  changeReceiptLabel: { color: COLORS.white, fontSize: 12, fontWeight: "700" },

  receiptBtns: { flexDirection: "row", gap: 10 },
  receiptBtn: {
    flex:           1,
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    gap:            6,
    borderRadius:   12,
    borderWidth:    1.5,
    borderColor:    COLORS.primary,
    borderStyle:    "dashed",
    paddingVertical: 14,
    backgroundColor: COLORS.primary + "08",
  },
  receiptBtnLabel: { fontSize: 13, fontWeight: "600", color: COLORS.primary },

  hint: { fontSize: 12, color: COLORS.zinc400, lineHeight: 17, marginTop: -4 },

  infoBanner: {
    flexDirection:   "row",
    alignItems:      "flex-start",
    gap:             8,
    backgroundColor: COLORS.primary + "0c",
    borderRadius:    10,
    padding:         12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 17 },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      "center",
    justifyContent:  "center",
    marginTop:       8,
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.25,
    shadowRadius:    8,
    elevation:       5,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnLabel:    { color: COLORS.white, fontWeight: "800", fontSize: 15 },

  successScreen: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap:            16,
    backgroundColor: COLORS.white,
  },
  successTitle: { fontSize: 24, fontWeight: "900", color: COLORS.zinc900, textAlign: "center" },
  successBody:  { fontSize: 14, color: COLORS.zinc500, textAlign: "center", lineHeight: 20 },

  skInput: { height: 48, backgroundColor: COLORS.zinc100, borderRadius: 12 },
});
