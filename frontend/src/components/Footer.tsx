import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow ring-2 ring-primary/20">
              <GraduationCap className="h-[22px] w-[22px] text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">WeBAR</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Intelligent admission guidance for the next generation of African students.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/recommendations" className="hover:text-foreground">Recommendations</Link></li>
            {/* <li><Link to="/scholarships" className="hover:text-foreground">Scholarships</Link></li> */}
            <li><Link to="/assistant" className="hover:text-foreground">Assistant</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Account</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/register" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>About</li><li>Careers</li><li>Privacy</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} WeBAR. Built for ambitious students.
      </div>
    </footer>
  );
}
