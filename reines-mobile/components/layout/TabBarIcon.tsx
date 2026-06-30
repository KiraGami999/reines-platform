import { type LucideIcon } from "lucide-react-native";

interface Props {
  icon:    LucideIcon;
  color:   string;
  focused: boolean;
  size?:   number;
}

export function TabBarIcon({ icon: Icon, color, focused, size = 22 }: Props) {
  return <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />;
}
