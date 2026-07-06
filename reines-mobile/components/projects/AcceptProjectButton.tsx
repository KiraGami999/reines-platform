import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { COLORS } from "@/constants";
import { acceptProject } from "@/services/projects.service";
import { useInvalidateProjects } from "@/hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/api";

interface Props {
  projectId: string;
  onAccepted?: () => void;
  compact?: boolean;
}

export function AcceptProjectButton({ projectId, onAccepted, compact }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const invalidateProjects    = useInvalidateProjects();
  const qc                      = useQueryClient();

  async function handleAccept() {
    setLoading(true);
    setError("");
    try {
      await acceptProject(projectId);
      invalidateProjects();
      qc.invalidateQueries({ queryKey: ["manager-dashboard"] });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      onAccepted?.();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.btn, compact && styles.btnCompact]}
        onPress={handleAccept}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <CheckCircle2 size={compact ? 14 : 16} color={COLORS.white} />
        )}
        <Text style={[styles.label, compact && styles.labelCompact]}>
          {loading ? "Accepting…" : "Accept project"}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection:     "row",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             8,
    backgroundColor: COLORS.primary,
    borderRadius:    12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  btnCompact: {
    paddingVertical: 10,
    borderRadius:    10,
  },
  label: {
    color:      COLORS.white,
    fontWeight: "700",
    fontSize:   14,
  },
  labelCompact: {
    fontSize: 13,
  },
  error: {
    marginTop: 6,
    fontSize:  12,
    color:     COLORS.red,
  },
});
