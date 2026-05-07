import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create an account for the Shopify Job Tracker admin console.",
};

export default function AdminRegisterPage() {
  return (
    <main id="main-content" tabIndex={-1} className="w-full max-w-lg outline-none">
      <RegisterForm />
    </main>
  );
}
