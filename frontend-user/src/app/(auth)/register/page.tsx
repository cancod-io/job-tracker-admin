import type { Metadata } from "next";
import { UserRegisterForm } from "@/components/auth/user-register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Shopify Job Tracker account.",
};

export default function UserRegisterPage() {
  return (
    <main id="main-content" tabIndex={-1} className="w-full max-w-lg outline-none">
      <UserRegisterForm />
    </main>
  );
}
