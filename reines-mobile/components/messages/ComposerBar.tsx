import React, { useState, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Send } from "lucide-react-native";
import { COLORS } from "@/constants";

interface ComposerBarProps {
  onSend:    (text: string) => void;
  isSending: boolean;
  disabled?: boolean;
}

/**
 * ComposerBar — the message input and send button at the bottom of a chat.
 *
 * Features:
 *   - Auto-expands up to 5 lines
 *   - Clears after send (before server confirms, to feel instant)
 *   - Send button hidden when input is empty
 *   - Disabled state while a send is in flight
 */
export function ComposerBar({ onSend, isSending, disabled = false }: ComposerBarProps) {
  const [text, setText] = useState("");
  const inputRef        = useRef<TextInput>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setText("");
    onSend(trimmed);
    // Keep keyboard open
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [text, isSending, onSend]);

  const canSend = text.trim().length > 0 && !isSending && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.bar}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          placeholderTextColor={COLORS.zinc400}
          multiline
          maxLength={2000}
          returnKeyType="default"
          editable={!disabled}
          scrollEnabled
        />

        <TouchableOpacity
          style={[styles.sendBtn, canSend && styles.sendBtnActive]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Send
              size={17}
              color={canSend ? COLORS.white : COLORS.zinc400}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection:     "row",
    alignItems:        "flex-end",
    paddingHorizontal: 12,
    paddingVertical:   10,
    backgroundColor:   COLORS.white,
    borderTopWidth:    1,
    borderTopColor:    COLORS.zinc200,
    gap:               8,
  },
  input: {
    flex:              1,
    minHeight:         40,
    maxHeight:         120,
    backgroundColor:   COLORS.zinc100,
    borderRadius:      20,
    paddingHorizontal: 16,
    paddingVertical:   Platform.OS === "ios" ? 10 : 8,
    fontSize:          15,
    color:             COLORS.zinc900,
    lineHeight:        20,
  },
  sendBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: COLORS.zinc200,
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
});
