import React from "react"

import { IconProps } from "types/icon"

export const SocialGlobe: React.FC<IconProps> = ({
  size = "18",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M2 12h20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 2c2.9 2.74 4.5 6.22 4.5 10S14.9 19.26 12 22c-2.9-2.74-4.5-6.22-4.5-10S9.1 4.74 12 2Z"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  )
}

export const SocialFacebook: React.FC<IconProps> = ({
  size = "18",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M14 8.5V7c0-1.657 1.343-3 3-3h1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 22V12H10V9h2.5V7.5C12.5 5.015 14.515 3 17 3h1v3h-1c-.828 0-1.5.672-1.5 1.5V9H18l-.5 3h-2v10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const SocialInstagram: React.FC<IconProps> = ({
  size = "18",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="M17.5 6.5h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export const SocialYoutube: React.FC<IconProps> = ({
  size = "18",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M20.5 7.5c.2.8.3 1.7.3 2.8v3.4c0 1.1-.1 2-.3 2.8-.2.8-.9 1.5-1.7 1.7-1.5.4-5 .4-6.8.4s-5.3 0-6.8-.4c-.8-.2-1.5-.9-1.7-1.7C3.3 15.7 3.2 14.8 3.2 13.7v-3.4c0-1.1.1-2 .3-2.8.2-.8.9-1.5 1.7-1.7C6.7 5.4 10.2 5.4 12 5.4s5.3 0 6.8.4c.8.2 1.5.9 1.7 1.7Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11 10.2v3.6l3.2-1.8L11 10.2Z"
        fill={color}
      />
    </svg>
  )
}

export const SocialTiktok: React.FC<IconProps> = ({
  size = "18",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M14 3v10.3a3.7 3.7 0 1 1-3-3.6V7.2c-.5-.1-1-.2-1.5-.2A6.5 6.5 0 1 0 16 13.5V7.7c1.2 1 2.7 1.6 4.3 1.6V6.1c-1.8 0-3.4-1.2-4-3.1H14Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const SocialZalo: React.FC<IconProps> = ({
  size = "18",
  color = "currentColor",
  ...attributes
}) => {
  // Simplified "chat bubble + Z" mark (not official logo).
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M7 19l-3 2V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H7Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 9h6l-6 6h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function resolveSocialIcon(hostname: string): React.FC<IconProps> {
  const h = (hostname || "").toLowerCase()
  if (h.includes("facebook.com") || h.includes("fb.com")) {
    return SocialFacebook
  }
  if (h.includes("zalo.me")) {
    return SocialZalo
  }
  if (h.includes("instagram.com")) {
    return SocialInstagram
  }
  if (h.includes("tiktok.com")) {
    return SocialTiktok
  }
  if (h.includes("youtube.com") || h.includes("youtu.be")) {
    return SocialYoutube
  }
  return SocialGlobe
}

