import React from "react"

import { IconProps } from "types/icon"

// Brand icon paths extracted from `simple-icons` (CC0-1.0).
// We inline only the needed paths to avoid bundling the whole icon pack.
const SI_PATH_FACEBOOK =
  "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"

const SI_PATH_ZALO =
  "M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z"

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
      <path d={SI_PATH_FACEBOOK} fill={color} />
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
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path d={SI_PATH_ZALO} fill={color} />
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

