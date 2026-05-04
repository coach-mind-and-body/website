import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public pages
import Home from "./pages/Home";
import About from "./pages/About";
import Reclaim from "./pages/Reclaim";
import Book from "./pages/Book";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import FoodQuiz from "./pages/FoodQuiz";
import FoodQuizThankYou from "./pages/FoodQuizThankYou";
import FeelGreat from "./pages/FeelGreat";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Disclaimer from "./pages/Disclaimer";
import JoinLanding from "./pages/JoinLanding";
import JoinThankYou from "./pages/JoinThankYou";

// Enrollment & client portal
import Enroll from "./pages/Enroll";
import MyProgram from "./pages/MyProgram";
import Portal from "./pages/Portal";

// Admin
import Admin from "./pages/Admin";
import BlogEditor from "./pages/BlogEditor";

function Router() {
  return (
    <Switch>
      {/* Public marketing site */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/reclaim" component={Reclaim} />
      <Route path="/book" component={Book} />
      <Route path="/health-wellness-blog" component={Blog} />
      <Route path="/health-wellness-blog/:slug" component={BlogPost} />
      <Route path="/food-quiz" component={FoodQuiz} />
      <Route path="/food-quiz-thank-you" component={FoodQuizThankYou} />
      <Route path="/feel-great-system" component={FeelGreat} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/join" component={JoinLanding} />
      <Route path="/join-thank-you" component={JoinThankYou} />

      {/* Enrollment & client portal */}
      <Route path="/enroll" component={Enroll} />
      <Route path="/my-program" component={MyProgram} />
      <Route path="/portal" component={Portal} />

      {/* Admin */}
      <Route path="/admin" component={Admin} />
      <Route path="/admin/blog/new" component={BlogEditor} />
      <Route path="/admin/blog/:id" component={BlogEditor} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
