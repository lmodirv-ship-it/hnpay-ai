import { Link } from "@tanstack/react-router";
import logo from "@/assets/hnpay-logo-256.png";

/** HN-Pay Live brand logo. Clicking it always returns to the public home page. */
export function Logo({ subtitle = "Google-Governed Payment Gateway", size = 36, to = "/" }: { subtitle?: string | null; size?: number; to?: string }) {
  return (
    <Link to={to as "/"} className="flex shrink-0 items-center gap-2.5" aria-label="HN-Pay Live — home">
      <img src={logo} alt="HN-Pay Live" width={size} height={size} style={{ width: size, height: size }} />
      <span className="leading-tight">
        <span className="block font-fx-latin text-base font-bold tracking-tight text-fx-text">HN-Pay Live</span>
        {subtitle && <span className="hidden text-[10px] font-medium text-fx-cyan sm:block" dir="ltr">{subtitle}</span>}
      </span>
    </Link>
  );
}
