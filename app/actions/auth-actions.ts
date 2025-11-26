"use server"

import { redirect } from "next/navigation"
import mongoose from "mongoose"
import UserModel from "@/models/User"
import RegistrationModel from "@/models/Registration"
import SupportTicketModel from "@/models/SupportTicket"
import { dbConnect } from "@/lib/mongodb"
import {
  createToken,
  deleteSessionCookie,
  generateToken, // Used for verification and password reset tokens
  getSessionCookie,
  hashPassword,
  incrementFailedAttempts,
  resetFailedAttempts,
  setSessionCookie,
  verifyPassword,
  verifyToken,
} from "@/lib/auth"
import {
  generatePasswordResetEmail,
  generateVerificationEmail, // Now expects only email and token
  generateSupportTicketEmail,
  sendEmail,
} from "@/lib/email" // Assuming email functions are here
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  supportTicketSchema,
  otpSchema, // Keep schema for potential future use (e.g., 2FA)
} from "@/lib/validations/auth"
import { cookies } from "next/headers"
import { COOKIE_NAMES, COOKIE_EXPIRY } from "@/lib/cookies"

// Type for session data
type SessionData = {
  id: string
  email: string
  role: string // Add role to session data
  verified: boolean
  name?: string
  lastActivity?: number
  tenantId?: string // Add tenantId for multi-tenant isolation
}

// --- MODIFIED Signup action ---
export async function signup(formData: FormData) {
  console.log("[AuthAction] signup: Initiated"); // Log start
  const name = formData.get("name") as string
  const emailRaw = formData.get("email") as string
  const email = (emailRaw || "").toLowerCase().trim()
  const phone = formData.get("phone") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  // const role = formData.get("role") as string // Remove role
  const termsAccepted = formData.get("termsAccepted") === "true"

  // Validate form data
  console.log("[AuthAction] signup: Validating form data for", email);
  const validationResult = signupSchema.safeParse({
    name,
    email,
    phone,
    password,
    confirmPassword,
    // role, // Remove role
    termsAccepted,
  })

  if (!validationResult.success) {
    console.error("[AuthAction] signup: Validation failed:", validationResult.error.flatten());
    return { success: false, errors: validationResult.error.flatten().fieldErrors }
  }
  console.log("[AuthAction] signup: Validation successful for", email);

  try {
    // Check if user already exists
    console.log("[AuthAction] signup: Checking if user exists:", email);
    await dbConnect();
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      console.log("[AuthAction] signup: User already exists:", email);
      return { success: false, message: "Email already exists" }
    }
    console.log("[AuthAction] signup: User does not exist, proceeding:", email);

    // Hash password
    console.log("[AuthAction] signup: Hashing password for", email);
    const hashedPassword = await hashPassword(password)
    console.log("[AuthAction] signup: Password hashed for", email);

    // Generate verification token (NO OTP)
    console.log("[AuthAction] signup: Generating verification token for", email);
    const verificationToken = generateToken() // Use your existing token generation
    // Avoid logging raw tokens in production
    if (process.env.NODE_ENV !== 'production') {
      console.log("[AuthAction] signup: Verification token generated (masked):", verificationToken.slice(0,6) + "..." );
    }

    // Always assign 'super_admin' role for new users
    const userRole = "super_admin"

    // Generate a unique userId
    const userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    console.log("[AuthAction] signup: Generated userId:", userId);

    // Create user
    const newUser = await UserModel.create({
      userId,
      name,
      email,
      phone,
      password: hashedPassword,
      role: userRole,
      verified: false,
      verificationToken,
      registrationComplete: false,
      tenantId: 'default', // Will be updated to academyId during registration
    });
    console.log("[AuthAction] signup: User created successfully in DB with ID:", newUser._id);

    // Send verification email with LINK only
    try {
      console.log("[AuthAction] signup: Generating verification email data for:", email);
      const emailData = generateVerificationEmail(email, verificationToken, name)
      console.log("[AuthAction] signup: Email data generated. Attempting to send...");
      await sendEmail(emailData); // Await the result
      console.log("[AuthAction] signup: sendEmail function completed successfully for:", email);
    } catch (emailError) {
      console.error("[AuthAction] signup: !!! Error caught within email sending block:", emailError);
      // Decide recovery strategy: Delete user? Allow login attempt later?
      // For now, return specific error but user exists in DB as unverified.
      return { success: false, message: "Signup successful, but failed to send verification email. Please contact support." }
    }

    // --- MODIFICATION: Return success message, NO redirect ---
    console.log("[AuthAction] signup: Returning success message for:", email);
    return {
      success: true,
      message: "Verification mail has been sent to your mail. Click on verification link to complete account creation",
    }

  } catch (error) {
    console.error("[AuthAction] signup: !!! Error caught in main signup block:", error);
     // Handle potential database errors (e.g., unique constraint)
     if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
        console.error("[AuthAction] signup: MongoDB unique constraint violation.");
        return { success: false, message: "An account with this email or phone number already exists." };
     }
    return { success: false, message: "An unexpected error occurred during signup." }
  }
}

// --- MODIFIED Login action ---
export async function login(formData: FormData) {
  console.log("[AuthAction] login: Initiated");
  const emailOrPhoneRaw = formData.get("emailOrPhone") as string
  const emailOrPhone = (emailOrPhoneRaw || "").toLowerCase().trim()
  const password = formData.get("password") as string
  // const role = formData.get("role") as string // Remove role

  // Validate form data
  console.log("[AuthAction] login: Validating form data for", emailOrPhone);
  const validationResult = loginSchema.safeParse({ emailOrPhone, password })

  if (!validationResult.success) {
    console.error("[AuthAction] login: Validation failed:", validationResult.error.flatten());
    return { success: false, errors: validationResult.error.flatten().fieldErrors }
  }
  console.log("[AuthAction] login: Validation successful for", emailOrPhone);

  try {
    // Find user by email or phone
    console.log("[AuthAction] login: Attempting to find user:", emailOrPhone);
    await dbConnect();
    console.log("[AuthAction] login: Connected to database:", mongoose.connection.name);
    console.log("[AuthAction] login: Database ready state:", mongoose.connection.readyState);
    
    const user = await UserModel.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });
    console.log("[AuthAction] login: Query executed, result:", user ? "User found" : "No user");

    // User not found
    if (!user) {
      console.log("[AuthAction] login: User not found:", emailOrPhone);
      return { success: false, message: "Login failed. Please check your credentials." }
    }
    console.log("[AuthAction] login: User found:", user.id, user.email);

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.log("[AuthAction] login: Account locked for user:", user.email);
      return { success: false, message: "Account locked due to too many failed attempts." }
    }

    // --- MODIFICATION: Check if account is verified ---
    if (!user.verified) {
      console.log("[AuthAction] login: Account not verified for user:", user.email);
      return { success: false, message: "Account not verified. Please check your email for the verification link." }
    }
    console.log("[AuthAction] login: Account is verified for user:", user.email);

    // Verify password
    console.log("[AuthAction] login: Verifying password for user:", user.email);
    const isValid = await verifyPassword(password, user.password || "")

    if (!isValid) {
      console.log("[AuthAction] login: Invalid password for user:", user.email);
      // Increment failed attempts
      const attempts = await incrementFailedAttempts(user.email) // Assumes email is unique identifier for attempts
      console.log("[AuthAction] login: Failed attempts incremented to:", attempts, "for user:", user.email);

      if (attempts >= 5) { // Assuming 5 attempts lock the account
        console.log("[AuthAction] login: Locking account due to max failed attempts for user:", user.email);
        return { success: false, message: "Account locked due to too many failed attempts." }
      }

      return { success: false, message: "Login failed. Please check your credentials." }
    }
    console.log("[AuthAction] login: Password verified successfully for user:", user.email);

    // Reset failed attempts on successful login
    console.log("[AuthAction] login: Resetting failed attempts for user:", user.email);
    await resetFailedAttempts(user.email)

    // Create session
    console.log("[AuthAction] login: Creating session token for user:", user.email);
    console.log("[AuthAction] login: User academyId:", user.academyId);
    console.log("[AuthAction] login: User tenantId:", user.tenantId);
    console.log("[AuthAction] login: User object keys:", Object.keys(user.toObject ? user.toObject() : user));
    
    const sessionData: SessionData = {
      id: user.id,
      email: user.email,
      role: user.role ?? "", // Ensure role is always a string
      verified: user.verified,
      name: user.name,
      lastActivity: Date.now(),
      tenantId: user.academyId || user.tenantId || 'default', // Add tenantId from academyId for multi-tenant isolation
    };
    
    console.log("[AuthAction] login: SessionData created:", { ...sessionData, tenantId: sessionData.tenantId });
    
    const token = await createToken(sessionData)
    console.log("[AuthAction] login: Session token created.");

    // Set session cookie
    console.log("[AuthAction] login: Setting session cookie for user:", user.email);
    await setSessionCookie(token)

    // Set last activity cookie (for middleware checks)
    console.log("[AuthAction] login: Setting activity cookie for user:", user.email);
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.LAST_ACTIVITY, Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_EXPIRY.LAST_ACTIVITY * 24 * 60 * 60, // Use defined expiry
      path: "/",
    })

    // --- MODIFIED: Redirect based on registration completion ---
    // Check registration status (assume user has a 'registrationComplete' boolean field)
    if (!user.registrationComplete) {
      // First time user, not completed registration
      const redirectPath = "/register";
      console.log("[AuthAction] login: First time user, redirecting to registration form.");
      return { success: true, redirect: redirectPath };
    } else {
      // Registration complete, redirect to dashboard
      const redirectPath = "/dashboard";
      console.log("[AuthAction] login: Registration complete, redirecting to dashboard.");
      return { success: true, redirect: redirectPath };
    }

  } catch (error) {
    console.error("[AuthAction] login: !!! Error caught in main login block:", error);
    return { success: false, message: "An unexpected error occurred during login." }
  }
}

// --- Verify OTP Action (No longer used for initial signup verification) ---
// This function should likely be removed or repurposed if OTP is fully removed.
export async function verifyOtp(formData: FormData) {
  console.warn("[AuthAction] verifyOtp: Called - this is no longer used for initial signup verification.");
  const email = formData.get("email") as string
  const otp = formData.get("otp") as string

  const validationResult = otpSchema.safeParse({ email, otp })
  if (!validationResult.success) {
    console.error("[AuthAction] verifyOtp: Validation failed:", validationResult.error.flatten());
    return { success: false, message: "Invalid input data", errors: validationResult.error.flatten().fieldErrors }
  }

  try {
    console.log("[AuthAction] verifyOtp: Finding user:", email);
    await dbConnect();
    const user = await UserModel.findOne({ email });
    if (!user) {
        console.log("[AuthAction] verifyOtp: User not found:", email);
        return { success: false, message: "User not found" };
    }

    // Check OTP fields (assuming they still exist in the schema, otherwise this fails)
    // @ts-ignore - If otp field removed from schema, this will error
    if (user.otp !== otp) {
      console.log("[AuthAction] verifyOtp: Invalid OTP for user:", email);
      return { success: false, message: "Invalid OTP" };
    }
    // @ts-ignore - If otpExpiry field removed from schema, this will error
    if (user.otpExpiry && user.otpExpiry < new Date()) {
      console.log("[AuthAction] verifyOtp: OTP expired for user:", email);
      return { success: false, message: "OTP has expired" };
    }
    console.log("[AuthAction] verifyOtp: OTP is valid for user:", email);

    // Update user - Remove OTP fields, ensure 'verified' is handled correctly
    console.log("[AuthAction] verifyOtp: Updating user (clearing OTP fields):", email);
    await UserModel.updateOne(
      { _id: user._id },
      {
        $unset: {
          // otp: "",
          // otpExpiry: ""
        }
      }
    );
    console.log("[AuthAction] verifyOtp: User updated successfully:", email);
    return { success: true, message: "OTP verified successfully.", redirect: "/login" }; // Adjust redirect/message
  } catch (error) {
    console.error("[AuthAction] verifyOtp: !!! Error caught:", error);
    return { success: false, message: "An error occurred during OTP verification." };
  }
}

// --- Resend OTP Action (No longer used for initial signup verification) ---
// This function should be removed or repurposed to resend the *verification link* email.
export async function resendOtp(email: string) {
   console.warn("[AuthAction] resendOtp: Called - this is no longer used for initial signup verification.");
   // To resend verification *link*, find user, check !verified, generate NEW token,
   // update user's token, call generateVerificationEmail(email, newToken).
  try {
    console.log("[AuthAction] resendOtp: Finding user:", email);
    await dbConnect();
    const user = await UserModel.findOne({ email });
    if (!user) {
        console.log("[AuthAction] resendOtp: User not found:", email);
        return { success: false, message: "User not found" };
    }

    // --- This section needs replacement if resending verification link ---
    console.warn("[AuthAction] resendOtp: Current logic sends OTP, not verification link. Needs update.");
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiry: new Date(Date.now() + 15 * 60 * 1000) } });
    // const emailData = generateVerificationEmail(email, user.verificationToken || "", otp); // Incorrect call now
    // await sendEmail(emailData);
    // --- End section to replace ---

    // Placeholder for correct logic (implement if needed):
    // console.log("[AuthAction] resendOtp: Checking if user is verified:", email);
    // if (!user.verified) {
    //   console.log("[AuthAction] resendOtp: User not verified. Generating new token.");
    //   const newToken = generateToken();
    //   console.log("[AuthAction] resendOtp: Updating user with new token:", newToken);
    //   await prisma.user.update({ where: { id: user.id }, data: { verificationToken: newToken } });
    //   console.log("[AuthAction] resendOtp: Generating verification email with new token.");
    //   const emailData = generateVerificationEmail(email, newToken);
    //   console.log("[AuthAction] resendOtp: Sending verification email.");
    //   await sendEmail(emailData);
    //   console.log("[AuthAction] resendOtp: Verification email resent successfully.");
    //   return { success: true, message: "Verification email resent." };
    // } else {
    //   console.log("[AuthAction] resendOtp: Account already verified:", email);
    //   return { success: false, message: "Account already verified." };
    // }

    return { success: false, message: "Functionality not implemented for link resend." }; // Default if not implemented
  } catch (error) {
    console.error("[AuthAction] resendOtp: !!! Error caught:", error);
    return { success: false, message: "An error occurred." };
  }
}


// --- MODIFIED Verify Email action ---
// This action is called when the user clicks the link in their email
export async function verifyEmail(token: string) {
  // Avoid logging raw tokens in production
  if (process.env.NODE_ENV !== 'production') {
    console.log("[AuthAction] verifyEmail: Initiated with token (masked):", token.slice(0,6) + "...");
  }
  if (!token || typeof token !== 'string') {
      console.error("[AuthAction] verifyEmail: Invalid or missing token.");
      return { success: false, message: "Invalid verification request." };
  }

  try {
    // Find user with the verification token
    console.log("[AuthAction] verifyEmail: Finding user by token:", token);
    await dbConnect();
    const user = await UserModel.findOne({ verificationToken: token });

    // No user found for this token (maybe expired, invalid, or already used)
    if (!user) {
      console.log("[AuthAction] verifyEmail: No user found for token:", token);
      return { success: false, message: "Invalid or expired verification link." }
    }
    console.log("[AuthAction] verifyEmail: User found:", user.id, user.email);

     // Check if already verified
     if (user.verified) {
       console.log("[AuthAction] verifyEmail: User already verified:", user.email);
       return { success: true, redirect: "/login?alreadyVerified=true" }
     }
     console.log("[AuthAction] verifyEmail: User not verified, proceeding with verification:", user.email);

    // Update user: Mark as verified and clear the token (do NOT mark registrationComplete here)
    console.log("[AuthAction] verifyEmail: Updating user as verified and clearing token:", user.email);
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: { verified: true },
        $unset: { verificationToken: "" }
      }
    );
    console.log("[AuthAction] verifyEmail: User updated successfully:", user.email);

    // --- MODIFICATION: Return success and redirect instruction ---
    console.log("[AuthAction] verifyEmail: Verification successful, returning redirect instruction to /login?verified=true");
    return { success: true, redirect: "/login?verified=true" }

  } catch (error) {
    console.error("[AuthAction] verifyEmail: !!! Error caught:", error);
    return { success: false, message: "An error occurred during email verification." }
  }
}




// --- Other Actions (Largely Unchanged, but reviewed for consistency) ---

export async function logout() {
  console.log("[AuthAction] logout: Initiated");
  await deleteSessionCookie()
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAMES.LAST_ACTIVITY)
  console.log("[AuthAction] logout: Cookies cleared, redirecting to /login");
  redirect("/login") // Use Next.js redirect
}

export async function getSession(): Promise<SessionData | null> {
  // console.log("[AuthAction] getSession: Attempting to get session cookie"); // Can be noisy
  const token = await getSessionCookie()
  if (!token) {
    // console.log("[AuthAction] getSession: No session cookie found");
    return null
  }

  try {
    // console.log("[AuthAction] getSession: Verifying session token"); // Can be noisy
    const payload = await verifyToken(token) as SessionData | null // Add await and keep type assertion
    if (!payload) {
      console.warn("[AuthAction] getSession: Invalid token payload, deleting cookie");
      await deleteSessionCookie() // Clean up invalid cookie
      return null
    }
    // console.log("[AuthAction] getSession: Session token verified for user:", payload.email); // Can be noisy
    return payload
  } catch (error) {
    console.error("[AuthAction] getSession: !!! Error verifying session token:", error);
    await deleteSessionCookie() // Clean up potentially malformed cookie
    return null
  }
}

export async function checkSessionActivity(): Promise<boolean> {
  // console.log("[AuthAction] checkSessionActivity: Checking session activity"); // Can be noisy
  const session = await getSession()
  if (!session) {
    // console.log("[AuthAction] checkSessionActivity: No active session found"); // Can be noisy
    return false
  }

  const cookieStore = await cookies()
  const lastActivityCookie = cookieStore.get(COOKIE_NAMES.LAST_ACTIVITY)
  const now = Date.now()

  if (!lastActivityCookie) {
    console.log("[AuthAction] checkSessionActivity: No activity cookie found for active session, setting one for user:", session.email);
    cookieStore.set(COOKIE_NAMES.LAST_ACTIVITY, now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_EXPIRY.LAST_ACTIVITY * 24 * 60 * 60,
      path: "/",
    })
    return true;
  }

  const lastActivity = Number.parseInt(lastActivityCookie.value, 10)
  const inactiveTime = now - lastActivity
  const maxInactiveTime = 30 * 60 * 1000 // 30 minutes

  if (inactiveTime > maxInactiveTime) {
    console.log("[AuthAction] checkSessionActivity: Session inactive for user:", session.email, "- logging out.");
    await logout() // logout handles redirect
    return false
  }

  // Update last activity timestamp in the cookie
  // console.log("[AuthAction] checkSessionActivity: Updating activity cookie for user:", session.email); // Can be noisy
  cookieStore.set(COOKIE_NAMES.LAST_ACTIVITY, now.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_EXPIRY.LAST_ACTIVITY * 24 * 60 * 60,
    path: "/",
  })

  return true
}

export async function requestPasswordReset(formData: FormData) {
  console.log("[AuthAction] requestPasswordReset: Initiated");
  const email = formData.get("email") as string
  console.log("[AuthAction] requestPasswordReset: Validating email:", email);
  const validationResult = forgotPasswordSchema.safeParse({ email })

  if (!validationResult.success) {
    console.error("[AuthAction] requestPasswordReset: Validation failed:", validationResult.error.flatten());
    return { success: false, errors: validationResult.error.flatten().fieldErrors }
  }

  const successMessage = "If an account with that email exists, a password reset link has been sent."

  try {
    console.log("[AuthAction] requestPasswordReset: Finding user:", email);
    await dbConnect();
    const user = await UserModel.findOne({ email });

    if (user) {
      console.log("[AuthAction] requestPasswordReset: User found:", user.id);
      console.log("[AuthAction] requestPasswordReset: Generating reset token for user:", user.email);
      const resetToken = generateToken()
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      console.log("[AuthAction] requestPasswordReset: Updating user with reset token:", resetToken);
      await UserModel.updateOne(
        { _id: user._id },
        {
          $set: {
            resetToken,
            resetTokenExpiry
          }
        }
      );
      console.log("[AuthAction] requestPasswordReset: Generating password reset email data for:", user.email);
      const emailData = generatePasswordResetEmail(email, resetToken)
      console.log("[AuthAction] requestPasswordReset: Sending password reset email...");
      await sendEmail(emailData)
      console.log("[AuthAction] requestPasswordReset: Password reset email sent successfully for:", email)
    } else {
       console.log("[AuthAction] requestPasswordReset: User not found for email:", email, "- still returning success message.");
    }

    console.log("[AuthAction] requestPasswordReset: Returning success message.");
    return { success: true, message: successMessage }
  } catch (error) {
    console.error("[AuthAction] requestPasswordReset: !!! Error caught:", error);
    // Still return success message to the user for security
    return { success: true, message: successMessage }
  }
}

export async function resetPassword(token: string, formData: FormData) {
  console.log("[AuthAction] resetPassword: Initiated with token:", token);
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || typeof token !== "string") {
    console.error("[AuthAction] resetPassword: Invalid or missing token.");
    return { success: false, message: "Invalid password reset request.", redirect:"/forgot-password" }; // if token is invalid, redirect to forgot-password page
  }

  console.log("[AuthAction] resetPassword: Validating password inputs.");
  const validationResult = resetPasswordSchema.safeParse({
    password,
    confirmPassword,
  });

  if (!validationResult.success) {
    console.error(
      "[AuthAction] resetPassword: Validation failed:",
      validationResult.error.flatten()
    );
    return {
      success: false,
      message: "Validation failed.",
      errors: validationResult.error.flatten().fieldErrors,
      redirect:"/forgot-password" // if validation fails redirect to forgot-password
    };
  }
  console.log("[AuthAction] resetPassword: Validation successful.");

  try {
    console.log(
      "[AuthAction] resetPassword: Finding user by valid token:",
      token
    );
    await dbConnect();
    const user = await UserModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      console.log(
        "[AuthAction] resetPassword: No user found for valid token:",
        token
      );
      return {
        success: false,
        message: "Invalid or expired password reset token.",
        redirect: "/forgot-password" // redirect to forgot password page to request new email
      };
    }
    console.log("[AuthAction] resetPassword: User found:", user.id, user.email);

    console.log(
      "[AuthAction] resetPassword: Hashing new password for user:",
      user.email
    );
    const hashedPassword = await hashPassword(password);
    console.log("[AuthAction] resetPassword: New password hashed.");

    console.log(
      "[AuthAction] resetPassword: Updating user password and clearing token/attempts for:",
      user.email
    );
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          failedAttempts: 0,
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: "",
          lockedUntil: ""
        }
      }
    );
    console.log("[AuthAction] resetPassword: User password updated successfully.");

    console.log(
      "[AuthAction] resetPassword: Returning success message and redirect instruction."
    );
    return {
      success: true,
      message: "Password has been reset successfully.",
      redirect: "/login?reset=success",
    };
  } catch (error) {
    console.error("[AuthAction] resetPassword: !!! Error caught:", error);
    return {
      success: false,
      message: "An error occurred while resetting the password.",
    };
  }
}

export async function submitSupportTicket(formData: FormData) {
  console.log("[AuthAction] submitSupportTicket: Initiated");
  const email = formData.get("email") as string
  const issueType = formData.get("issueType") as string
  const description = formData.get("description") as string

  console.log("[AuthAction] submitSupportTicket: Validating form data for:", email);
  const validationResult = supportTicketSchema.safeParse({ email, issueType, description })
  if (!validationResult.success) {
    console.error("[AuthAction] submitSupportTicket: Validation failed:", validationResult.error.flatten());
    return { success: false, errors: validationResult.error.flatten().fieldErrors }
  }
  console.log("[AuthAction] submitSupportTicket: Validation successful.");

  try {
    console.log("[AuthAction] submitSupportTicket: Generating ticket number.");
    const ticketNumber = `UB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`
    console.log("[AuthAction] submitSupportTicket: Ticket number generated:", ticketNumber);

    console.log("[AuthAction] submitSupportTicket: Creating ticket in DB for:", email);
    await dbConnect();
    await SupportTicketModel.create({ email, issueType, description, ticketNumber });
    console.log("[AuthAction] submitSupportTicket: Ticket created successfully in DB.");

    console.log("[AuthAction] submitSupportTicket: Generating support ticket email data.");
    const emailData = generateSupportTicketEmail(email, ticketNumber, issueType)
    console.log("[AuthAction] submitSupportTicket: Sending support ticket email...");
    await sendEmail(emailData)
    console.log("[AuthAction] submitSupportTicket: Support ticket email sent successfully.");

    console.log("[AuthAction] submitSupportTicket: Returning success message.");
    return { success: true, ticketNumber, message: `Support ticket #${ticketNumber} created successfully.` }
  } catch (error) {
    console.error("[AuthAction] submitSupportTicket: !!! Error caught:", error);
    return { success: false, message: "An error occurred while submitting the support ticket." }
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; redirectUrl?: string }> {
  try {
    // You can make this dynamic or context-aware if needed
    const redirectUrl = "/api/auth/signin/google?callbackUrl=/api/auth/google-redirect"

    return {
      success: true,
      redirectUrl,
    }
  } catch (error) {
    console.error("Google sign-in error:", error)
    return {
      success: false,
    }
  }
}
export async function createBusinessProfile(formData: FormData) {
  console.log("[AuthAction] createBusinessProfile: Initiated.");
  console.log("[AuthAction] createBusinessProfile: Checking session activity.");
  const isActive = await checkSessionActivity()
  if (!isActive) {
     console.log("[AuthAction] createBusinessProfile: Session inactive or expired.");
     // checkSessionActivity handles logout/redirect
     return { success: false, message: "Session expired. Please log in again.", redirect: "/login?sessionExpired=true" };
  }

  console.log("[AuthAction] createBusinessProfile: Session active. Getting session data.");
  const session = await getSession();
  if (!session) {
       console.error("[AuthAction] createBusinessProfile: !!! Session not found despite active check.");
       return { success: false, message: "Session not found.", redirect: "/login" };
  }
  console.log("[AuthAction] createBusinessProfile: Session found for user:", session.email);

  console.log(`[AuthAction] createBusinessProfile: User ${session.email} creating profile with data:`, Object.fromEntries(formData))
  // TODO: Implement actual profile creation logic
  console.warn("[AuthAction] createBusinessProfile: TODO - Implement actual profile creation logic here.");

  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate async work

  let redirectPath = "/dashboard";
  switch (session.role) {
    case "super_admin": redirectPath = "/dashboard"; break; // Super admin uses main dashboard
    case "admin": redirectPath = "/admin/dashboard"; break;
    // Add other roles
    default: redirectPath = `/${session.role}/dashboard`;
  }
  console.log("[AuthAction] createBusinessProfile: Profile creation simulated. Redirecting user", session.email, "to", redirectPath);

  return { success: true, message: "Business profile created successfully.", redirect: redirectPath }
}

export async function refreshSessionToken(): Promise<boolean> {
  console.log("[AuthAction] refreshSessionToken: Initiated.");
  try {
    console.log("[AuthAction] refreshSessionToken: Getting current session.");
    const session = await getSession()
    if (!session) {
        console.log("[AuthAction] refreshSessionToken: No active session found to refresh.");
        return false
    }
    console.log("[AuthAction] refreshSessionToken: Session found for user:", session.email);

    console.log("[AuthAction] refreshSessionToken: Creating refreshed token.");
    const refreshedSessionData: SessionData = {
        ...session,
        lastActivity: Date.now(),
    }
    const token = await createToken(refreshedSessionData); // Add await

    console.log("[AuthAction] refreshSessionToken: Setting new session cookie.");
    await setSessionCookie(token)

    console.log("[AuthAction] refreshSessionToken: Setting new activity cookie.");
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.LAST_ACTIVITY, Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_EXPIRY.LAST_ACTIVITY * 24 * 60 * 60,
      path: "/",
    })

    console.log("[AuthAction] refreshSessionToken: Session token refreshed successfully for:", session.email);
    return true
  } catch (error) {
    console.error("[AuthAction] refreshSessionToken: !!! Error caught:", error);
    return false
  }
}
