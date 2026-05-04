import { useEffect, useRef, useState } from "react";
import {
  Pencil, Camera, Lock, Mail, Bell, Shield, ChevronRight, CreditCard, Plus,
  Wallet, CalendarCheck, CheckCircle2, Clock, ArrowRight, HelpCircle, MoreVertical,
  Upload, BadgeCheck, FileImage, X, ShieldCheck, Loader2,
} from "lucide-react";
import { StudentSidebarLayout } from "@/components/StudentSidebarLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSession, updateSession, type Session } from "@/lib/auth";
import { toast } from "sonner";

const Settings = () => {
  const [session, setSession] = useState<Session | null>(() => getSession());

  useEffect(() => {
    const refresh = () => setSession(getSession());
    window.addEventListener("canteen.session.update", refresh);
    return () => window.removeEventListener("canteen.session.update", refresh);
  }, []);

  if (!session || (session.role !== "student" && session.role !== "teacher")) return null;

  const isTeacher = session.role === "teacher";
  const verification = session.verification ?? { status: "unverified" as const };

  // Profile fields (controlled)
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({
    name: session.name,
    email: session.email,
    phone: session.phone,
    grade: session.grade,
    section: session.section,
  });

  useEffect(() => {
    setFields({
      name: session.name,
      email: session.email,
      phone: session.phone,
      grade: session.grade,
      section: session.section,
    });
  }, [session]);

  const initials = session.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const avatarInput = useRef<HTMLInputElement>(null);
  const idInput = useRef<HTMLInputElement>(null);

  const onAvatarPick = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large", { description: "Max size is 4 MB." });
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    updateSession({ avatarDataUrl: dataUrl });
    toast.success("Profile photo updated");
  };

  const removeAvatar = () => {
    updateSession({ avatarDataUrl: undefined });
    toast.success("Profile photo removed");
  };

  const [submittingId, setSubmittingId] = useState(false);
  const onIdPick = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Upload an image or PDF of your ID.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("File too large", { description: "Max size is 6 MB." });
      return;
    }
    setSubmittingId(true);
    const dataUrl = await fileToDataUrl(file);
    updateSession({
      verification: {
        status: "pending",
        idDataUrl: dataUrl,
        submittedAt: new Date().toISOString(),
      },
    });
    // Simulate review delay; in a real app this would be admin-approved.
    setTimeout(() => {
      updateSession({
        verification: {
          status: "verified",
          idDataUrl: dataUrl,
          submittedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        },
      });
      toast.success("Account verified", { description: "Your ID has been approved." });
      setSubmittingId(false);
    }, 2200);
    toast.success("ID submitted", { description: "We're reviewing your verification." });
  };

  const cancelVerification = () => {
    updateSession({ verification: { status: "unverified" } });
    toast.message("Verification removed");
  };

  const saveProfile = () => {
    if (!fields.name.trim()) return toast.error("Name cannot be empty.");
    updateSession({
      name: fields.name.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      grade: fields.grade.trim(),
      section: fields.section.trim(),
    });
    setEditing(false);
    toast.success("Profile saved");
  };

  const settingsRows = [
    { icon: Lock, title: "Change Password", desc: "Update your password regularly to keep your account secure.", onClick: () => toast.info("Password change coming soon") },
    { icon: Mail, title: "Email Preferences", desc: "Choose how you want to receive emails from us.", onClick: () => toast.info("Email preferences coming soon") },
    { icon: Bell, title: "Notification Preferences", desc: "Manage your notification settings and preferences.", onClick: () => toast.info("Notification preferences coming soon") },
    { icon: Shield, title: "Privacy Settings", desc: "Manage your privacy and data settings.", onClick: () => toast.info("Privacy settings coming soon") },
  ];

  const summary = [
    { icon: CalendarCheck, tint: "success", label: "Total Reservations", value: "5" },
    { icon: CheckCircle2, tint: "info", label: "Completed Reservations", value: "2" },
    { icon: Clock, tint: "warning", label: "Upcoming Reservations", value: "2" },
  ];

  const activity = [
    { icon: CheckCircle2, tint: "success", title: "Reservation Confirmed", desc: "Iced Milo on May 18, 2026", time: "May 18, 1:15 PM" },
    { icon: Clock, tint: "warning", title: "Reservation Pending", desc: "Chicken Burger on May 19, 2026", time: "May 18, 12:05 PM" },
    { icon: Wallet, tint: "primary", title: "Funds Added", desc: "₱200.00 added to wallet", time: "May 17, 10:30 AM" },
    { icon: Bell, tint: "info", title: "Profile Updated", desc: "You updated your phone number", time: "May 15, 3:20 PM" },
  ];

  const tints: Record<string, { bg: string; fg: string }> = {
    primary: { bg: "bg-primary/10", fg: "text-primary" },
    success: { bg: "bg-[hsl(var(--success))]/15", fg: "text-[hsl(var(--success))]" },
    warning: { bg: "bg-[hsl(var(--warning))]/15", fg: "text-[hsl(var(--warning))]" },
    info: { bg: "bg-sky-500/10", fg: "text-sky-600" },
  };

  return (
    <StudentSidebarLayout title="Settings" subtitle="Manage your personal information and account settings.">
      <div className="grid xl:grid-cols-[1fr_340px] gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          {/* Profile Information */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold">Profile Information</h3>
              {editing ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button variant="gradient" size="sm" onClick={saveProfile}>Save</Button>
                </div>
              ) : (
                <Button variant="gradient" size="sm" className="gap-2" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" /> Edit Profile
                </Button>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative">
                  {session.avatarDataUrl ? (
                    <img
                      src={session.avatarDataUrl}
                      alt={session.name}
                      className="h-28 w-28 rounded-full object-cover border-4 border-card shadow-sm"
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => avatarInput.current?.click()}
                    className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card hover:opacity-90 transition-opacity"
                    aria-label="Change photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onAvatarPick(e.target.files?.[0] ?? null)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => avatarInput.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Upload
                  </Button>
                  {session.avatarDataUrl && (
                    <Button variant="ghost" size="sm" onClick={removeAvatar}>
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 flex-1">
                <Field label="Full Name" value={fields.name} editing={editing} onChange={(v) => setFields((f) => ({ ...f, name: v }))} />
                <Field label="Email" value={fields.email} editing={editing} onChange={(v) => setFields((f) => ({ ...f, email: v }))} />
                <Field label={isTeacher ? "Employee ID" : "Student ID"} value={session.studentId} editing={false} />
                <Field label="Phone Number" value={fields.phone} editing={editing} onChange={(v) => setFields((f) => ({ ...f, phone: v }))} />
                <Field label={isTeacher ? "Department" : "Grade & Section"} value={isTeacher ? fields.grade : `${fields.grade}${fields.section ? ` - ${fields.section}` : ""}`} editing={editing && isTeacher} onChange={(v) => setFields((f) => ({ ...f, grade: v }))} />
                <Field label={isTeacher ? "Subject" : "Date of Birth"} value={isTeacher ? (fields.section || "—") : "March 15, 2008"} editing={editing && isTeacher} onChange={(v) => setFields((f) => ({ ...f, section: v }))} />
              </div>
            </div>
          </section>

          {/* Account Settings */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold">Account Settings</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Manage your account preferences and security.</p>
            <ul className="divide-y divide-border border border-border rounded-xl">
              {/* Verification row */}
              <li>
                <VerificationRow
                  verification={verification}
                  submitting={submittingId}
                  onPick={() => idInput.current?.click()}
                  onCancel={cancelVerification}
                />
                <input
                  ref={idInput}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => onIdPick(e.target.files?.[0] ?? null)}
                />
              </li>
              {settingsRows.map(({ icon: Icon, title, desc, onClick }) => (
                <li key={title}>
                  <button
                    onClick={onClick}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Payment Methods */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">Payment Methods</h3>
                <p className="text-sm text-muted-foreground mt-1">Manage your saved payment methods.</p>
              </div>
              <button onClick={() => toast.info("Add payment method coming soon")} className="text-sm font-medium text-primary inline-flex items-center gap-1.5 hover:underline">
                <Plus className="h-4 w-4" /> Add Payment Method
              </button>
            </div>

            <div className="mt-5 border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium tracking-wider">•••• •••• •••• 1234</p>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 font-bold">VISA</Badge>
              <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/15 border-0">Default</Badge>
              <p className="text-xs text-muted-foreground ml-auto">Expires 12/26</p>
              <button className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary flex items-center justify-center" aria-label="More">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => toast.info("Add payment method coming soon")}
              className="mt-3 w-full border border-dashed border-border rounded-xl py-3.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add New Payment Method
            </button>
          </section>
        </div>

        {/* RIGHT */}
        <aside className="space-y-4">
          {/* Account Summary */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-4">Account Summary</h3>
            <ul className="space-y-3">
              {summary.map(({ icon: Icon, tint, label, value }) => {
                const t = tints[tint];
                return (
                  <li key={label}>
                    <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors text-left">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${t.bg} ${t.fg}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-base font-bold">{value}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <button className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2 transition-all">
              View all activity <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Recent Activity</h3>
              <button className="text-sm font-medium text-primary hover:underline">View all</button>
            </div>
            <ul className="space-y-4">
              {activity.map(({ icon: Icon, tint, title, desc, time }) => {
                const t = tints[tint];
                return (
                  <li key={title} className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${t.bg} ${t.fg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap self-center">{time}</p>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Need Help */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <HelpCircle className="h-4 w-4" />
              </div>
              <h3 className="font-bold">Need Help?</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">If you need any assistance, our support team is here to help.</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Help center coming soon")}>
              Go to Help Center <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </aside>
      </div>
    </StudentSidebarLayout>
  );
};

const VerificationRow = ({
  verification,
  submitting,
  onPick,
  onCancel,
}: {
  verification: { status: "unverified" | "pending" | "verified"; idDataUrl?: string; submittedAt?: string; verifiedAt?: string };
  submitting: boolean;
  onPick: () => void;
  onCancel: () => void;
}) => {
  const status = verification.status;

  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
        status === "verified"
          ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
          : status === "pending"
          ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]"
          : "bg-primary/10 text-primary"
      }`}>
        {status === "verified" ? <BadgeCheck className="h-4 w-4" /> : status === "pending" ? <Clock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">Account Verification</p>
          {status === "verified" && (
            <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/15 border-0">Verified</Badge>
          )}
          {status === "pending" && (
            <Badge className="bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/15 border-0">Pending review</Badge>
          )}
          {status === "unverified" && (
            <Badge variant="outline">Not verified</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {status === "verified"
            ? "Your identity has been confirmed."
            : status === "pending"
            ? "We're reviewing the ID you submitted."
            : "Upload a photo of your school ID to unlock verified status."}
        </p>
        {verification.idDataUrl && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
            <FileImage className="h-3.5 w-3.5" />
            ID file on record
          </div>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        {status !== "verified" && (
          <Button size="sm" variant="gradient" onClick={onPick} disabled={submitting}>
            {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting</> : <><Upload className="h-3.5 w-3.5" /> {status === "pending" ? "Replace ID" : "Upload ID"}</>}
          </Button>
        )}
        {status !== "unverified" && (
          <Button size="sm" variant="outline" onClick={onCancel}>Reset</Button>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange?: (v: string) => void }) => (
  <div>
    <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
    {editing ? (
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full text-sm font-semibold bg-transparent border-b border-border focus:border-primary outline-none py-1"
      />
    ) : (
      <p className="text-sm font-semibold">{value}</p>
    )}
  </div>
);

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default Settings;
