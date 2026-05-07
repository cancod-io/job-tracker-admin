import type { Metadata } from "next";
import { UserRegisterForm } from "@/components/auth/user-register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Shopify Job Tracker account.",
};

export default function UserRegisterPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
      <div className="container py-6 md:py-10">
        <UserRegisterForm />
      </div>
    </main>
  );
}
