import { FATSECRET_ATTRIBUTION_TEXT, FATSECRET_ATTRIBUTION_URL } from "@shared/food";

export default function FatSecretAttribution({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="text-[10px] text-center text-gray-400 mt-6 mb-2">
      <a
        href={FATSECRET_ATTRIBUTION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-2 hover:underline"
      >
        {FATSECRET_ATTRIBUTION_TEXT}
      </a>
    </p>
  );
}
