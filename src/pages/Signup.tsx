import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { User, Mail, IdCard, Phone, GraduationCap, Users, UserPlus, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { setSession } from "@/lib/auth";
import studentImg from "@/assets/student-signup-illustration.png";

const grades = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const sections = ["A", "B", "C", "D", "E"];

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [form, setForm] = useState({
    fullName: "", email: "", studentId: "", phone: "", grade: "", section: "",
    password: "", confirmPassword: "", terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.fullName.trim().length < 2) errs.fullName = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address.";
    if (role === "student") {
      if (!/^\d{6,12}$/.test(form.studentId)) errs.studentId = "Student ID must be 6-12 digits.";
    } else {
      if (form.studentId.trim().length < 3) errs.studentId = "Employee ID is required.";
    }
    if (!/^[\d+\-\s]{7,15}$/.test(form.phone)) errs.phone = "Enter a valid phone number.";
    if (!form.grade) errs.grade = role === "teacher" ? "Select your department." : "Select your grade.";
    if (role === "student" && !form.section) errs.section = "Select your section.";
    if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (!form.terms) errs.terms = "You must accept the terms.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSession({
      role,
      email: form.email,
      name: form.fullName,
      studentId: form.studentId,
      grade: form.grade,
      section: form.section || (role === "teacher" ? "" : ""),
      phone: form.phone,
    });
    toast.success("Account created!", { description: "You can now log in." });
    navigate("/dashboard");
  };

  return (
    <AuthLayout illustration={studentImg} illustrationAlt="Student signup illustration">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary" /> Create Your Account</h2>
          <p className="text-sm text-muted-foreground mt-1">Fill in your details to get started</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["student", "teacher"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`h-11 rounded-xl text-sm font-semibold border transition-colors ${
                role === r
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {r === "student" ? "🎓 Student" : "🧑‍🏫 Teacher"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name" icon={<User className="h-4 w-4" />} error={errors.fullName}>
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full name" className="pl-10 h-11" />
            </Field>
            <Field label="Email Address" icon={<Mail className="h-4 w-4" />} error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@school.edu" className="pl-10 h-11" />
            </Field>
            <Field label={role === "teacher" ? "Employee ID" : "Student ID"} icon={<IdCard className="h-4 w-4" />} error={errors.studentId}>
              <Input value={form.studentId} onChange={(e) => set("studentId", e.target.value)} placeholder={role === "teacher" ? "e.g. EMP-1042" : "e.g. 20231001"} className="pl-10 h-11" />
            </Field>
            <Field label="Phone Number" icon={<Phone className="h-4 w-4" />} error={errors.phone}>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0917 123 4567" className="pl-10 h-11" />
            </Field>
            {role === "student" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm">Grade</Label>
                  <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
                    <SelectTrigger className="h-11"><GraduationCap className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Select your grade" /></SelectTrigger>
                    <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.grade && <p className="text-xs text-destructive">{errors.grade}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Section</Label>
                  <Select value={form.section} onValueChange={(v) => set("section", v)}>
                    <SelectTrigger className="h-11"><Users className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Select your section" /></SelectTrigger>
                    <SelectContent>{sections.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.section && <p className="text-xs text-destructive">{errors.section}</p>}
                </div>
              </>
            ) : (
              <>
                <Field label="Department" icon={<GraduationCap className="h-4 w-4" />} error={errors.grade}>
                  <Input value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. Mathematics" className="pl-10 h-11" />
                </Field>
                <Field label="Subject (optional)" icon={<Users className="h-4 w-4" />}>
                  <Input value={form.section} onChange={(e) => set("section", e.target.value)} placeholder="e.g. Algebra II" className="pl-10 h-11" />
                </Field>
              </>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm">Password</Label>
              <PasswordInput value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Create a password" />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Confirm Password</Label>
              <PasswordInput value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Confirm your password" />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer text-sm text-muted-foreground">
            <Checkbox checked={form.terms} onCheckedChange={(c) => set("terms", !!c)} className="mt-0.5" />
            <span>I agree to the <a className="text-primary font-medium hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-medium hover:underline" href="#">Privacy Policy</a></span>
          </label>
          {errors.terms && <p className="text-xs text-destructive -mt-2">{errors.terms}</p>}

          <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : "Sign Up"}
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="text-primary font-semibold hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

const Field = ({ label, icon, error, children }: { label: string; icon: React.ReactNode; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      {children}
    </div>
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default Signup;