import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, CalendarDays, AlignLeft, Type } from "lucide-react-native";
import { COLORS } from "@/constants";
import type { Milestone } from "@/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters.")
    .max(200, "Title must be at most 200 characters."),
  description: z.string().max(1000, "Description too long."),
  dueDate: z
    .string()
    .refine(
      (v) => v === "" || !isNaN(Date.parse(v)),
      "Enter a valid date (YYYY-MM-DD)."
    ),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  visible:    boolean;
  onClose:    () => void;
  onSubmit:   (values: FormValues) => void;
  isLoading?: boolean;
  /** Pass a milestone to pre-fill the form for editing. */
  editTarget?: Milestone | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MilestoneFormSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  editTarget,
}: Props) {
  const isEdit = !!editTarget;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", dueDate: "" },
  });

  useEffect(() => {
    if (visible) {
      reset({
        title:       editTarget?.title ?? "",
        description: editTarget?.description ?? "",
        dueDate:     editTarget?.dueDate
          ? editTarget.dueDate.slice(0, 10)
          : "",
      });
    }
  }, [visible, editTarget, reset]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isEdit ? "Edit Milestone" : "New Milestone"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={COLORS.zinc500} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <Type size={13} color={COLORS.zinc500} />
                <Text style={styles.label}>Title *</Text>
              </View>
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.title && styles.inputError]}
                    placeholder="e.g. Foundation Completion"
                    placeholderTextColor={COLORS.zinc400}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    returnKeyType="next"
                  />
                )}
              />
              {errors.title ? (
                <Text style={styles.errorText}>{errors.title.message}</Text>
              ) : null}
            </View>

            {/* Description */}
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <AlignLeft size={13} color={COLORS.zinc500} />
                <Text style={styles.label}>Description</Text>
              </View>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, styles.textarea, errors.description && styles.inputError]}
                    placeholder="Optional details about this milestone…"
                    placeholderTextColor={COLORS.zinc400}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                )}
              />
              {errors.description ? (
                <Text style={styles.errorText}>{errors.description.message}</Text>
              ) : null}
            </View>

            {/* Due Date */}
            <View style={styles.field}>
              <View style={styles.fieldLabel}>
                <CalendarDays size={13} color={COLORS.zinc500} />
                <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
              </View>
              <Controller
                control={control}
                name="dueDate"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.dueDate && styles.inputError]}
                    placeholder="2026-12-31"
                    placeholderTextColor={COLORS.zinc400}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numbers-and-punctuation"
                  />
                )}
              />
              {errors.dueDate ? (
                <Text style={styles.errorText}>{errors.dueDate.message}</Text>
              ) : null}
            </View>
          </ScrollView>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>
                {isEdit ? "Save Changes" : "Create Milestone"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent:  "flex-end",
  },
  sheet: {
    backgroundColor:  COLORS.white,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    padding:          24,
    maxHeight:        "85%",
  },
  header: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    marginBottom:    20,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.zinc800 },
  closeBtn:    { padding: 4 },

  field:      { marginBottom: 16 },
  fieldLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  label:      { fontSize: 12, fontWeight: "600", color: COLORS.zinc500 },

  input: {
    borderWidth:     1,
    borderColor:     COLORS.zinc200,
    borderRadius:    10,
    paddingHorizontal: 12,
    paddingVertical:   10,
    fontSize:        14,
    color:           COLORS.zinc800,
    backgroundColor: COLORS.zinc50,
  },
  textarea:   { minHeight: 80 },
  inputError: { borderColor: COLORS.red },
  errorText:  { fontSize: 11, color: COLORS.red, marginTop: 4 },

  submitBtn: {
    backgroundColor:  COLORS.primary,
    borderRadius:     12,
    paddingVertical:  14,
    alignItems:       "center",
    marginTop:        8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
});
