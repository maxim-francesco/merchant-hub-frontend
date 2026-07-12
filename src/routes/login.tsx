import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck, Eye, EyeOff, AlertCircle, Zap } from "lucide-react";

import { login } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Commerce OS" },
      {
        name: "description",
        content: "Securely sign in to your Commerce OS merchant dashboard.",
      },
    ],
  }),
  component: LoginPage,
});

// ─── Validation schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate({ to: "/" });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Invalid credentials. Please try again.";
      setServerError(message);
    }
  }

  function handleDemoLogin() {
    form.setValue("email", "admin@merchanthub.com");
    form.setValue("password", "password123");
    form.handleSubmit(onSubmit)();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* ── Ambient background gradient ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.85 0.06 265 / 0.18) 0%, transparent 70%)",
        }}
      />

      {/* ── Decorative corner marks ── */}
      <span
        aria-hidden="true"
        className="absolute left-8 top-8 h-px w-8 bg-border opacity-60"
      />
      <span
        aria-hidden="true"
        className="absolute left-8 top-8 h-8 w-px bg-border opacity-60"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-8 right-8 h-px w-8 bg-border opacity-60"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-8 right-8 h-8 w-px bg-border opacity-60"
      />

      {/* ── Auth card ── */}
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Wordmark / logo area */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <ShieldCheck className="h-5 w-5 text-foreground" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
              Commerce OS
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Merchant dashboard — sign in to continue
            </p>
          </div>
        </div>

        {/* Card surface */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Server-level error banner */}
          {serverError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
              {/* Email field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="gap-1.5">
                    <FormLabel className="text-[13px] font-medium text-foreground">
                      Email address
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        className="h-11 rounded-lg border-border bg-background text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Password field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="gap-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[13px] font-medium text-foreground">
                        Password
                      </FormLabel>
                      <button
                        type="button"
                        className="text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
                        tabIndex={-1}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="h-11 rounded-lg border-border bg-background pr-10 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring"
                          {...field}
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button
                id="login-submit"
                type="submit"
                disabled={isSubmitting}
                className="mt-1 h-11 w-full rounded-lg text-[13px] font-medium tracking-wide"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-card px-3 text-muted-foreground/70">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="h-11 w-full rounded-lg text-[13px] font-medium transition-all hover:bg-accent/50"
                type="button"
                onClick={handleDemoLogin}
                disabled={isSubmitting}
              >
                <Zap className="mr-2 h-3.5 w-3.5 text-amber-500 fill-amber-500/10" />
                Login as Demo Admin
              </Button>
            </form>
          </Form>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Protected by industry-standard TLS encryption.
        </p>
      </div>
    </div>
  );
}
