"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function TroubleshootPage() {
  const router = useRouter();

  return (
    <div
      className="max-h-screen w-full px-6 py-12 bg-gradient-to-br from-gray-100 to-white font-[Times_New_Roman]"
      style={{ fontFamily: "'Times New Roman', serif" }}
    >
      {/* Page Header */}
      <div className="max-w-4xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-orange-400 mb-2">Troubleshoot Login Issues</h1>
    
      </div>

      {/* Accordion Section */}
      <div className="max-w-4xl mx-auto space-y-6">
        <Accordion type="single" collapsible className="w-full">
          {/* Forgot Password */}
          <AccordionItem value="forgot-password">
            <AccordionTrigger className="text-lg font-semibold text-purple-700 hover:text-orange-400">
              I forgot my password
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-white">
              <p className="mb-4">
                You can reset your password by clicking the "Forgot password?" link on the login page. We'll send a
                password reset link to your registered email address.
              </p>
              <Button
                onClick={() => router.push("/forgot-password")}
                className="bg-purple-600 hover:bg-orange-400 text-white"
              >
                Reset Password
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Didn't receive email */}
          <AccordionItem value="reset-email">
            <AccordionTrigger className="text-lg font-semibold text-purple-700 hover:text-purple-900">
              I didn&apos;t receive the password reset email
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-white">
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes as emails can sometimes be delayed</li>
                <li>Try requesting another reset email</li>
              </ul>
              <Button
                onClick={() => router.push("/forgot-password")}
                className="bg-purple-600 hover:bg-orange-400 text-white"
              >
                Try Again
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Account Locked */}
          <AccordionItem value="account-locked">
            <AccordionTrigger className="text-lg font-semibold text-purple-700 hover:text-purple-900">
              My account is locked
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-white">
              <p className="mb-4">
                Your account may be locked after multiple failed login attempts. You can unlock your account by
                resetting your password.
              </p>
              <Button
                onClick={() => router.push("/forgot-password")}
                className="bg-purple-600 hover:bg-orange-400 text-white"
              >
                Reset Password
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Invalid Credentials */}
          <AccordionItem value="invalid-credentials">
            <AccordionTrigger className="text-lg font-semibold text-purple-700 hover:text-purple-900">
              I keep getting &quot;Invalid Email or Password&quot; error
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-white">
              <ul className="list-disc pl-5 space-y-2">
                <li>Make sure you're using the correct email address</li>
                <li>Check if Caps Lock is turned on</li>
                <li>Try resetting your password</li>
                <li>Make sure you're selecting the correct role in the "Login as" dropdown</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Google Login Issues */}
          <AccordionItem value="google-login">
            <AccordionTrigger className="text-lg font-semibold text-purple-700 hover:text-purple-900">
              I&apos;m having issues logging in with Google
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-white">
              <ul className="list-disc pl-5 space-y-2">
                <li>Make sure you're using a Google account that's registered with UniqBrio</li>
                <li>Try clearing your browser cookies and cache</li>
                <li>Try using a different browser</li>
                <li>Make sure you're selecting the correct Google account</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Other Issues */}
          <AccordionItem value="other-issues">
            <AccordionTrigger className="text-lg font-semibold text-purple-700 hover:text-purple-900">
              I have another login issue
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 dark:text-white">
              <p className="mb-4">
                If you're experiencing a different login issue, please raise a support ticket and our team will assist
                you as soon as possible.
              </p>
              <Button
                onClick={() => router.push("/support")}
                className="bg-purple-600 hover:bg-orange-400 text-white"
              >
                Raise a Ticket
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer Actions */}
        <div className="pt-8 text-center space-y-4">
          <p className="text-gray-500 dark:text-white text-sm">
            Still having trouble? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => router.push("/support")}
              className="bg-orange-500 hover:bg-purple-400 text-white"
            >
              Raise a Support Ticket
            </Button>
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="bg-purple-800 text-white hover:bg-orange-400"
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
