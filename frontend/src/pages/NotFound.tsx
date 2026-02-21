import { useLocation, Link } from "react-router-dom";
import { useEffect, FC } from "react";

interface NotFoundProps {
  path?: string; // optional prop, mainly for testing
}

const NotFound: FC<NotFoundProps> = ({ path }) => {
  const location = useLocation();

  // Determine which path to display
  const displayPath = path ?? location.pathname;

  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location.pathname]);

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-muted p-4"
      role="main"
      aria-labelledby="notfound-heading"
      data-testid="mock-notfound"
    >
      <div className="text-center max-w-md">
        <h1
          id="notfound-heading"
          className="text-6xl font-extrabold text-foreground mb-4"
          role="heading"
          aria-level={1}
          data-testid="mock-notfound-heading"
        >
          404
        </h1>
        <p
          className="text-xl text-muted-foreground mb-6"
          data-testid="mock-notfound-message"
        >
          Oops! The page{" "}
          <span
            className="font-mono"
            data-testid="mock-notfound-path"
          >
            {displayPath}
          </span>{" "}
          does not exist.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          aria-label="Return to Home Page"
          data-testid="mock-notfound-link"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
