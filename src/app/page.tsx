import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to dashboard - in production, check auth first
  redirect("/dashboard")
}

