import React from "react"

import type { IconProps } from "types/icon"

type FlagBaseProps = IconProps & { title?: string }

const roundPx = "rounded-[2px]"

/** Cờ Việt Nam (tỉ lệ ~3:2), kích thước theo chiều cao. */
export const FlagVietnam: React.FC<FlagBaseProps> = ({
  size = 14,
  title,
  ...attributes
}) => {
  const h = typeof size === "number" ? size : Number.parseInt(String(size), 10) || 14
  const w = Math.round((h * 30) / 20)
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 30 20"
      className={roundPx}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...(title ? { "aria-label": title } : {})}
      {...attributes}
    >
      <rect width="30" height="20" fill="#DA251D" />
      <path
        fill="#FFCD00"
        d="M15 6.2l1.05 3.24h3.4l-2.75 2 1.05 3.24L15 12.68l-2.75 2 1.05-3.24-2.75-2h3.4L15 6.2z"
      />
    </svg>
  )
}

/** Cờ Mỹ (đại diện locale `en`), tỉ lệ ~1.9:1. */
export const FlagUnitedStates: React.FC<FlagBaseProps> = ({
  size = 14,
  title,
  ...attributes
}) => {
  const h = typeof size === "number" ? size : Number.parseInt(String(size), 10) || 14
  const w = Math.round((h * 19) / 10)
  const stripeH = 10 / 13
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 19 10"
      className={roundPx}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...(title ? { "aria-label": title } : {})}
      {...attributes}
    >
      {Array.from({ length: 13 }, (_, i) => (
        <rect
          key={i}
          x="0"
          y={(i * 10) / 13}
          width="19"
          height={stripeH + 0.02}
          fill={i % 2 === 0 ? "#B22234" : "#FFFFFF"}
        />
      ))}
      {/* Canton only — sao quá nhỏ ở ~14px nên bỏ để icon vẫn nhận ra */}
      <rect x="0" y="0" width="7.6" height={(7 * 10) / 13} fill="#3C3B6E" />
    </svg>
  )
}

/** Cờ Nhật Bản (locale `ja`). */
export const FlagJapan: React.FC<FlagBaseProps> = ({
  size = 14,
  title,
  ...attributes
}) => {
  const h = typeof size === "number" ? size : Number.parseInt(String(size), 10) || 14
  const w = Math.round((h * 30) / 20)
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 30 20"
      className={roundPx}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...(title ? { "aria-label": title } : {})}
      {...attributes}
    >
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
  )
}

/** Fallback: không có cờ cho mã lạ. */
export const FlagPlaceholder: React.FC<FlagBaseProps> = ({
  size = 14,
  color = "currentColor",
  ...attributes
}) => {
  const s = typeof size === "number" ? size : Number.parseInt(String(size), 10) || 14
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={roundPx}
      aria-hidden
      {...attributes}
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path
        d="M2 12h20M12 2a15 15 0 0 1 0 20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function resolveLocaleFlag(
  localeCode: string
): React.FC<FlagBaseProps> {
  switch (localeCode) {
    case "vi":
      return FlagVietnam
    case "en":
      return FlagUnitedStates
    case "ja":
      return FlagJapan
    default:
      return FlagPlaceholder
  }
}
