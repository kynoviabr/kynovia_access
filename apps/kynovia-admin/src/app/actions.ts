"use server";

import { canAccessApp, getDeniedRedirectPath } from "@kynovia/auth";
import { redirect } from "next/navigation";
import { appSurface, authenticatedHomePath } from "../lib/auth/config";
import { getCurrentProfile } from "../lib/auth/session";
import { createServerSupabaseClient } from "../lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signInAction(formData: FormData) {
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  if (!email || !password) {
    redirect("/login?error=missing_credentials");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/access-denied?reason=missing_profile");
  }

  if (!canAccessApp(profile.role, appSurface)) {
    redirect(getDeniedRedirectPath(appSurface, profile.role));
  }

  redirect(authenticatedHomePath);
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPasswordAction(formData: FormData) {
  const email = formValue(formData, "email");

  if (!email) {
    redirect("/reset-password?error=missing_email");
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(email);
  redirect("/reset-password?sent=1");
}
