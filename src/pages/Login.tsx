import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Mail, ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { setSession } from "@/lib/auth";
import studentImg from "@/assets/student-illustration.png";
import adminImg from "@/assets/admin-illustration.png";

const ADMIN_KEY = "VENDOR-2026";

const Index = () => {
  const [tab, setTab] = useState<"student" | "admin">("student");
  const [portalRole, setPortalRole] = useState<"student" | "teacher">("student");
  const [studentLoading, setStudentLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [adminKey, setAdminKey] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email address.";
    if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStudentLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setStudentLoading(false);
    const namePart = email.split("@")[0] || (portalRole === "teacher" ? "Teacher" : "Student");
    const niceName = namePart
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    if (portalRole === "teacher") {
      setSession({
        role: "teacher",
        email,
        name: niceName,
        studentId: "EMP-1042",
        grade: "Mathematics Dept.",
        section: "Algebra II",
        phone: "0917 555 0142",
      });
      toast.success("Welcome back!", { description: "Logged in as teacher." });
    } else {
      setSession({
        role: "student",
        email,
        name: niceName,
        studentId: "20231001",
        grade: "Grade 11",
        section: "STEM - A",
        phone: "0917 123 4567",
      });
      toast.success("Welcome back!", { description: "Logged in as student." });
    }
    navigate("/dashboard");
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!adminKey.trim()) errs.adminKey = "Admin key is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setAdminLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setAdminLoading(false);
    if (adminKey !== ADMIN_KEY) {
      setErrors({ adminKey: "Invalid admin key. Access denied." });
      toast.error("Access denied", { description: "Invalid admin key." });
      return;
    }
    setSession({ role: "admin", name: "Vendor" });
    toast.success("Welcome, Vendor");
    navigate("/dashboard");
  };

  const illustration = tab === "student" ? studentImg : adminImg;
  const alt = tab === "student" ? "Student illustration" : "Administrator illustration";

  return (
    <AuthLayout illustration={illustration} illustrationAlt={alt}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "student" | "admin")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary/60 p-1 h-11 rounded-xl mb-6">
          <TabsTrigger value="student" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-semibold">Customer Login</TabsTrigger>
          <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-semibold">Vendor Login</TabsTrigger>
        </TabsList>

        <div className={tab === "student" ? "mb-5 grid grid-cols-2 gap-2" : "hidden"}>
          <button
            type="button"
            onClick={() => setPortalRole("student")}
            className={`h-11 rounded-xl text-sm font-semibold border transition-colors ${
              portalRole === "student"
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => setPortalRole("teacher")}
            className={`h-11 rounded-xl text-sm font-semibold border transition-colors ${
              portalRole === "teacher"
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            🧑‍🏫 Teacher
          </button>
        </div>

        <TabsContent value="student" className="space-y-5 mt-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">Welcome Back! <span aria-hidden>👋</span></h2>
            <p className="text-sm text-muted-foreground mt-1">Login to continue to your account</p>
          </div>
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-sm"><Mail className="h-3.5 w-3.5 text-primary" /> Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" autoComplete="email" />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <PasswordInput id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                <Checkbox checked={remember} onCheckedChange={(c) => setRemember(!!c)} />
                Remember me
              </label>
              <button type="button" className="text-sm font-medium text-primary hover:underline">Forgot Password?</button>
            </div>
            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={studentLoading}>
              {studentLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging in...</> : "Login"}
            </Button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
            </p>
          </form>
        </TabsContent>

        <TabsContent value="admin" className="space-y-5 mt-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /> Vendor Login</h2>
            <p className="text-sm text-muted-foreground mt-1">Authorized canteen vendors only</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="adminKey" className="text-sm">Vendor Key</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="adminKey" placeholder="Enter vendor key" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="pl-10 h-11" />
              </div>
              {errors.adminKey && <p className="text-xs text-destructive">{errors.adminKey}</p>}
              <p className="text-[11px] text-muted-foreground">Demo key: <code className="px-1 py-0.5 bg-muted rounded">VENDOR-2026</code></p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adminPassword" className="text-sm">Password <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <PasswordInput id="adminPassword" placeholder="Enter vendor password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/60 border border-border">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-accent-foreground">This area is restricted to authorized canteen vendors only.</p>
            </div>
            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={adminLoading}>
              {adminLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : "Login as Vendor"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
};

export default Index;