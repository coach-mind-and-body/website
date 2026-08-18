export function channelLabel(platform?: string | null) {
  switch (platform) {
    case "webchat":
      return "Habit Tracker";
    case "whatsapp":
      return "WhatsApp";
    case "facebook":
      return "Messenger";
    case "instagram":
      return "Instagram";
    case "sms":
      return "SMS";
    default:
      return "SMS";
  }
}

/** iMessage convention: blue = in-app data, green = carrier SMS. */
export function channelColors(platform?: string | null) {
  switch (platform) {
    case "webchat":
      return {
        bg: "#D6E9FF",
        fg: "#0A5BD3",
        bubble: "#0A84FF",
      };
    case "whatsapp":
      return {
        bg: "#D8F5E6",
        fg: "#128C7E",
        bubble: "#25D366",
      };
    case "facebook":
      return {
        bg: "#E0E7FF",
        fg: "#3B5998",
        bubble: "#0084FF",
      };
    case "instagram":
      return {
        bg: "#FCE7F3",
        fg: "#C13584",
        bubble: "#E1306C",
      };
    default:
      return {
        bg: "#D8F8D4",
        fg: "#1B7A2F",
        bubble: "#34C759",
      };
  }
}

export default function ChannelBadge({ platform }: { platform?: string | null }) {
  const label = channelLabel(platform);
  const colors = channelColors(platform);
  return (
    <span
      className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
      style={{ background: colors.bg, color: colors.fg }}
    >
      {label}
    </span>
  );
}
