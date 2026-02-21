import { Link } from "react-router-dom";
import { Suspense, lazy } from "react";

const ArrowRight = lazy(() =>
  import("lucide-react").then((mod) => ({ default: mod.ArrowRight }))
);

export interface NavCardProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  hoverBorderColor: string;
  iconColor: string;
}

const NavCard = ({
  to,
  title,
  description,
  icon,
  bgColor,
  hoverBorderColor,
}: NavCardProps) => (
  <Link
    to={to}
    className={`group flex items-center gap-4 p-5 rounded-xl bg-card shadow-card border border-border hover:shadow-elevated hover:border-${hoverBorderColor} transition-all duration-200`}
    aria-label={title}
  >
    <div
      className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}
    >
      {icon}
    </div>

    <div className="flex-1">
      <h2 className="font-display font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>

    <Suspense fallback={<span className="w-5 h-5" />}>
      <ArrowRight
        className={`w-5 h-5 text-muted-foreground group-hover:text-${hoverBorderColor} transition-colors`}
      />
    </Suspense>
  </Link>
);

export default NavCard;
