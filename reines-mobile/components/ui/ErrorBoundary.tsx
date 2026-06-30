import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants";

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <View style={styles.root}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.message}</Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, message: "" })}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root:      { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: COLORS.white },
  title:     { fontSize: 18, fontWeight: "700", color: COLORS.primary, textAlign: "center" },
  message:   { fontSize: 13, color: COLORS.zinc500, textAlign: "center", marginTop: 10, lineHeight: 19 },
  retry:     { marginTop: 24, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
});
