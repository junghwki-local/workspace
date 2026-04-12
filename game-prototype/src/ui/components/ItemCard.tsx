import type { Equipment } from "@/types";
import { GRADE_COLOR, GRADE_LABEL, EQUIPMENT_LABEL, ATTRIBUTE_COLOR, ATTRIBUTE_LABEL } from "@/types";

interface Props {
  item: Equipment;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

const TYPE_ICON: Record<string, string> = {
  weapon: "⚔️", armor: "🛡️", ring: "💍", necklace: "📿", earring: "✨",
};

export default function ItemCard({
  item, size = 56, selected = false, onClick,
  onDragStart, onDragOver, onDrop, draggable = false,
}: Props) {
  const gradeColor = GRADE_COLOR[item.grade];
  const attrColor = item.attribute !== "none" ? ATTRIBUTE_COLOR[item.attribute] : null;

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      title={`${item.name}\n${GRADE_LABEL[item.grade]} ${EQUIPMENT_LABEL[item.type]}\n${item.attribute !== "none" ? ATTRIBUTE_LABEL[item.attribute] + " " : ""}+${item.statBonus}`}
      style={{
        width: size,
        height: size,
        border: `2px solid ${selected ? "#fff" : gradeColor}`,
        borderRadius: 6,
        background: selected ? `${gradeColor}44` : `${gradeColor}22`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.1s",
        userSelect: "none",
        fontSize: size > 48 ? 18 : 14,
      }}
    >
      {TYPE_ICON[item.type]}
      <div style={{
        position: "absolute",
        top: 1,
        left: 2,
        fontSize: 8,
        color: gradeColor,
        fontWeight: 700,
      }}>
        {item.grade}★
      </div>
      {attrColor && (
        <div style={{
          position: "absolute",
          bottom: 2,
          right: 2,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: attrColor,
        }} />
      )}
    </div>
  );
}
