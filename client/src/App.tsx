import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";
import ChatWidget from "./components/ChatWidget";

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
import FinancialPeace from "./pages/FinancialPeace";
import FinancialPeaceThankYou from "./pages/FinancialPeaceThankYou";
import FPULandingPage from "./pages/FPULandingPage";
import Podcast from "./pages/Podcast";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Glp1Recovery from "./pages/Glp1Recovery";
import HolisticHealth from "./pages/HolisticHealth";
import SnackHackLeadGen from "./pages/SnackHackLeadGen";

// Enrollment & client portal
import Enroll from "./pages/Enroll";
import MyProgram from "./pages/MyProgram";
import Portal from "./pages/Portal";
import ReclaimHub from "./pages/ReclaimHub";

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
      <Route path="/unicity" component={FeelGreat} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/disclaimer" component={Disclaimer} />
      <Route path="/join" component={JoinLanding} />
      <Route path="/join-thank-you" component={JoinThankYou} />
      <Route path="/financial-peace-university" component={FinancialPeace} />
      <Route path="/financial-peace" component={FinancialPeace} />
      <Route path="/fpu" component={FinancialPeace} />
      <Route path="/financial-peace/thank-you" component={FinancialPeaceThankYou} />
      <Route path="/fpu-may-12" component={FPULandingPage} />
      <Route path="/midlife-health-podcast" component={Podcast} />
      <Route path="/login" component={Login} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/snack-hack" component={SnackHackLeadGen} />
      <Route path="/free-guide" component={SnackHackLeadGen} />
      
      {/* SEO Pillar Pages */}
      <Route path="/life-after-glp-1" component={Glp1Recovery} />
      <Route path="/holistic-health-and-wellness" component={HolisticHealth} />

      {/* Enrollment & client portal */}
      <Route path="/enroll" component={Enroll} />
      <Route path="/my-program" component={MyProgram} />
      <Route path="/portal" component={Portal} />
      <Route path="/portal/hub" component={ReclaimHub} />

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

function ScrollToTop() {
  const [pathname] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ChatProvider>
          <TooltipProvider>
            <Toaster />
            <ScrollToTop />
            <Router />
            <ChatWidget />
          </TooltipProvider>
        </ChatProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
