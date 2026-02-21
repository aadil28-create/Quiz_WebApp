import { lazy, Suspense, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavCard from "@/components/navigation/NavCard";


// Lazy load icons
const Users = lazy(() => import("lucide-react").then((mod) => ({ default: mod.Users })));
const Monitor = lazy(() => import("lucide-react").then((mod) => ({ default: mod.Monitor })));
const ArrowRight = lazy(() => import("lucide-react").then((mod) => ({ default: mod.ArrowRight })));


const Index: React.FC = () => {
  // Dark/light mode state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("quizlive-theme") as "light" | "dark" | null;
    if (storedTheme) setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("quizlive-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4 transition-colors duration-300">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-card text-foreground text-sm shadow hover:bg-muted transition-colors"
      >
        {theme === "light" ? "Dark Mode" : "Light Mode"}
      </button>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo & Title */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-5">
            <span className="text-4xl font-display font-bold text-primary-foreground">Q</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">QuizLive</h1>
          <p className="text-muted-foreground mt-2">Real-time interactive quizzes</p>
        </header>

        {/* Navigation Cards */}
        <section className="space-y-4" aria-label="Navigation options">
          <Suspense fallback={<div>Loading...</div>}>
            <NavCard
              to="/host"
              title="Host Dashboard"
              description="Manage questions & control the quiz"
              icon={<Monitor className="w-6 h-6 text-primary-foreground" />}
              bgColor="bg-primary"
              hoverBorderColor="secondary"
              iconColor="text-primary-foreground"
            />
            <NavCard
              to="/quiz"
              title="Join as Participant"
              description="Answer questions & compete live"
              icon={<Users className="w-6 h-6 text-accent-foreground" />}
              bgColor="bg-accent"
              hoverBorderColor="accent"
              iconColor="text-accent-foreground"
            />
          </Suspense>
        </section>
      </div>
    </main>
  );
};

export default Index;
