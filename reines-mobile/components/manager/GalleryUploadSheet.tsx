import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, Image, ScrollView, KeyboardAvoidingView,
  Platform, Animated, Alert, ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver }         from "@hookform/resolvers/zod";
import * as z                  from "zod";
import * as ImagePicker        from "expo-image-picker";
import {
  X, Camera, ImageIcon, CheckCircle,
  AlertCircle, BarChart2, Upload,
} from "lucide-react-native";
import { COLORS }            from "@/constants";
import { useGalleryUpload }  from "@/hooks/useGalleryUpload";
import type { MobileProject } from "@/types";

// ─── Form schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  note:     z.string().min(1, "Please write a note for this update.").max(1000),
  progress: z.string().refine(
    (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
    "Enter a number between 0 and 100."
  ),
});
type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GalleryUploadSheetProps {
  visible:     boolean;
  project:     MobileProject | null;
  onClose:     () => void;
  onSuccess?:  () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GalleryUploadSheet({
  visible, project, onClose, onSuccess,
}: GalleryUploadSheetProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { state, upload, reset } = useGalleryUpload();

  const { control, handleSubmit, reset: resetForm, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { note: "", progress: "" },
    });

  // Animated progress bar width
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state.stage === "uploading" || state.stage === "saving") {
      Animated.timing(progressAnim, {
        toValue:         state.uploadPct,
        duration:        200,
        useNativeDriver: false,
      }).start();
    }
  }, [state.uploadPct, state.stage, progressAnim]);

  // Close and reset when sheet becomes hidden
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setImageUri(null);
        resetForm();
        reset();
        progressAnim.setValue(0);
      }, 300);
    }
  }, [visible, resetForm, reset, progressAnim]);

  // ── Image pickers ──────────────────────────────────────────────────────────

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality:    0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    if (!project) return;
    const progressPercent = values.progress === "" ? null : Number(values.progress);
    const ok = await upload({
      projectId:       project.id,
      note:            values.note,
      localImageUri:   imageUri,
      progressPercent,
    });
    if (ok) {
      onSuccess?.();
      setTimeout(() => onClose(), 800);   // let the success state show briefly
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const isBusy    = state.stage === "uploading" || state.stage === "saving";
  const isSuccess = state.stage === "success";
  const isError   = state.stage === "error";

  const progressBarWidth = progressAnim.interpolate({
    inputRange:  [0, 100],
    outputRange: ["0%", "100%"],
  });

  const stageLabel =
    state.stage === "uploading" ? `Uploading image… ${state.uploadPct}%` :
    state.stage === "saving"    ? "Saving update…"                       :
    state.stage === "success"   ? "Update posted!"                       :
    isError                     ? state.errorMessage ?? "Upload failed."  :
    null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={isBusy ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Post Update</Text>
                {project && (
                  <Text style={styles.headerSub} numberOfLines={1}>{project.title}</Text>
                )}
              </View>
              {!isBusy && (
                <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                  <X size={18} color={COLORS.zinc500} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Image area ────────────────────────────────────────────── */}
              {imageUri ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
                  {!isBusy && (
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setImageUri(null)}
                      hitSlop={6}
                    >
                      <X size={14} color={COLORS.white} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={pickFromCamera}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    <Camera size={20} color={COLORS.primary} />
                    <Text style={styles.pickerBtnLabel}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={pickFromGallery}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    <ImageIcon size={20} color={COLORS.primary} />
                    <Text style={styles.pickerBtnLabel}>Gallery</Text>
                  </TouchableOpacity>
                  <View style={styles.pickerOptional}>
                    <Text style={styles.pickerOptionalText}>Photo is optional</Text>
                  </View>
                </View>
              )}

              {/* ── Note field ────────────────────────────────────────────── */}
              <Text style={styles.fieldLabel}>Update Note *</Text>
              <Controller
                control={control}
                name="note"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.textArea, errors.note && styles.inputError]}
                    placeholder="Describe the progress made, materials used, or any notes for the client…"
                    placeholderTextColor={COLORS.zinc400}
                    multiline
                    numberOfLines={4}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!isBusy}
                  />
                )}
              />
              {errors.note && (
                <FieldError msg={errors.note.message!} />
              )}

              {/* ── Progress % ────────────────────────────────────────────── */}
              <Text style={styles.fieldLabel}>
                <BarChart2 size={12} color={COLORS.zinc500} /> Overall Progress % (optional)
              </Text>
              <Controller
                control={control}
                name="progress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.progress && styles.inputError]}
                    placeholder="e.g. 65"
                    placeholderTextColor={COLORS.zinc400}
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!isBusy}
                  />
                )}
              />
              {errors.progress && (
                <FieldError msg={errors.progress.message!} />
              )}

              {/* ── Upload progress bar ────────────────────────────────────── */}
              {(isBusy || isSuccess || isError) && (
                <View style={styles.progressSection}>
                  <View style={styles.progressTrack}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: progressBarWidth,
                          backgroundColor: isError ? COLORS.red : isSuccess ? COLORS.green : COLORS.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressLabelRow}>
                    {isBusy && <ActivityIndicator size="small" color={COLORS.primary} />}
                    {isSuccess && <CheckCircle size={14} color={COLORS.green} />}
                    {isError   && <AlertCircle  size={14} color={COLORS.red}   />}
                    <Text style={[
                      styles.progressLabel,
                      isSuccess && { color: COLORS.green },
                      isError   && { color: COLORS.red   },
                    ]}>
                      {stageLabel}
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Submit button ──────────────────────────────────────────── */}
              {!isSuccess && (
                <TouchableOpacity
                  style={[styles.submitBtn, isBusy && styles.submitBtnBusy]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isBusy}
                  activeOpacity={0.85}
                >
                  {isBusy
                    ? <ActivityIndicator color={COLORS.white} />
                    : (
                      <>
                        <Upload size={16} color={COLORS.white} />
                        <Text style={styles.submitBtnLabel}>
                          {imageUri ? "Upload & Post Update" : "Post Update"}
                        </Text>
                      </>
                    )}
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg: string }) {
  return (
    <View style={styles.fieldError}>
      <AlertCircle size={11} color={COLORS.red} />
      <Text style={styles.fieldErrorText}>{msg}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    justifyContent:  "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetWrapper: { maxHeight: "92%" },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingBottom:        Platform.OS === "ios" ? 34 : 20,
    maxHeight:            "100%",
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: COLORS.zinc200,
    alignSelf:       "center",
    marginTop:       12,
    marginBottom:    4,
  },
  header: {
    flexDirection:     "row",
    alignItems:        "flex-start",
    justifyContent:    "space-between",
    paddingHorizontal: 20,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.zinc900 },
  headerSub:   { fontSize: 12, color: COLORS.zinc400, marginTop: 2, maxWidth: 260 },
  closeBtn: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: COLORS.zinc100,
    alignItems:      "center",
    justifyContent:  "center",
  },

  body: { padding: 20, gap: 12, paddingBottom: 8 },

  // Image picker
  previewWrap:   { borderRadius: 14, overflow: "hidden", position: "relative" },
  preview:       { width: "100%", height: 200, backgroundColor: COLORS.zinc100 },
  removeImageBtn:{
    position:          "absolute",
    top:               8,
    right:             8,
    backgroundColor:   "rgba(0,0,0,0.55)",
    borderRadius:      14,
    width:             28,
    height:            28,
    alignItems:        "center",
    justifyContent:    "center",
  },
  pickerRow: {
    flexDirection:  "row",
    gap:            10,
    alignItems:     "center",
  },
  pickerBtn: {
    flex:           1,
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    gap:            6,
    borderRadius:   12,
    borderWidth:    1.5,
    borderColor:    COLORS.primary,
    borderStyle:    "dashed",
    paddingVertical: 16,
    backgroundColor: COLORS.primary + "08",
  },
  pickerBtnLabel:   { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  pickerOptional:   { paddingHorizontal: 4 },
  pickerOptionalText:{ fontSize: 10, color: COLORS.zinc400, textAlign: "center" },

  // Form
  fieldLabel: {
    fontSize:   12,
    fontWeight: "600",
    color:      COLORS.zinc500,
    marginTop:  4,
  },
  input: {
    backgroundColor: COLORS.zinc50,
    borderRadius:    12,
    borderWidth:     1.5,
    borderColor:     COLORS.zinc200,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize:        15,
    color:           COLORS.zinc900,
  },
  textArea: {
    backgroundColor: COLORS.zinc50,
    borderRadius:    12,
    borderWidth:     1.5,
    borderColor:     COLORS.zinc200,
    paddingHorizontal: 14,
    paddingTop:      12,
    paddingBottom:   12,
    fontSize:        14,
    color:           COLORS.zinc900,
    minHeight:       100,
    textAlignVertical: "top",
  },
  inputError:    { borderColor: COLORS.red },
  fieldError:    { flexDirection: "row", alignItems: "center", gap: 5, marginTop: -6 },
  fieldErrorText:{ fontSize: 11, color: COLORS.red },

  // Progress
  progressSection: { gap: 6, marginTop: 4 },
  progressTrack:   { height: 8, borderRadius: 4, backgroundColor: COLORS.zinc100, overflow: "hidden" },
  progressFill:    { height: "100%", borderRadius: 4 },
  progressLabelRow:{ flexDirection: "row", alignItems: "center", gap: 6 },
  progressLabel:   { fontSize: 12, color: COLORS.zinc500 },

  // Submit
  submitBtn: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             8,
    backgroundColor: COLORS.primary,
    borderRadius:    14,
    paddingVertical: 16,
    marginTop:       4,
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.25,
    shadowRadius:    6,
    elevation:       4,
  },
  submitBtnBusy:  { opacity: 0.7 },
  submitBtnLabel: { fontSize: 15, fontWeight: "800", color: COLORS.white },
});
