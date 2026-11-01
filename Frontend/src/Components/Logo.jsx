
import { Link } from "react-router";
import { Heart } from "lucide-react";

const Logo = ({ onClick }) => {
  return (
    <Link
      to="/"
      className="flex shrink-0 items-center gap-2"
      onClick={onClick}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
        <Heart size={23} fill="currentColor" />
      </span>

      <span className="text-xl font-bold tracking-tight text-gray-900">
        Life<span className="text-rose-600">Drop</span>
      </span>
    </Link>
  );
};

export default Logo;
