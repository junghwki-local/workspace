import type { Equipment, EquipmentType } from "@/types";
import { EQUIPMENT_LABEL, GRADE_COLOR, ATTRIBUTE_COLOR } from "@/types";

interface Props {
  slot: EquipmentType;
  item: Equipment | null;
  onClick?: () => void;
  size?: number;
}

const SLOT_ICON: Record<EquipmentType, string> = {
  weapon: "⚔️", armor: "🛡️", ring: "💍", necklace: "📿", earring: "✨",
};

export default function EquipmentSlot({ slot, item, onClick, size = 60 }: Props) {
  const borderColor = item ? GRADE_COLOR[item.grade] : "#374151";

  return (
    <div
      onClick={onClick}
      title={item ? `${item.name} (${EQUIPMENT_LABEL[item.type]})` : EQUIPMENT_LABEL[slot]}
      style={{
        width: size,
        height: size,
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        background: item ? `${borderColor}22` : "#111827",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        transition: "all 0.15s",
        fontSize: size > 50 ? 20 : 14,
      }}
    >
      {SLOT_ICON[slot]}
      {item && item.attribute !== "none" && (
        <div style={{
          position: "absolute",
          bottom: 2,
          right: 2,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: ATTRIBUTE_COLOR[item.attribute],
        }} />
      )}
      {!item && (
        <div style={{ fontSize: 9, color: "#4b5563", marginTop: 2 }}>{EQUIPMENT_LABEL[slot]}</div>
      )}
    </div>
  );
}
