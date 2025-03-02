import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-react";
import { SignUpResource } from "@clerk/types";

// Define message type
type MessageType = {
  type: "error" | "info" | "success";
  text: string;
} | null;

const AuthPage = ({ setUsername }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [view, setView] = useState("login");
  const [pendingSignUp, setPendingSignUp] = useState<SignUpResource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<MessageType>(null);
  const navigate = useNavigate();
  const { signIn, isLoaded: signInLoaded, setActive: setSignInActive } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setSignUpActive } = useSignUp();
  const { signOut } = useAuth();

  if (!signInLoaded || !signUpLoaded) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    try {
      setIsLoading(true);
      await signOut();
      const result = await signIn.create({ identifier: email.trim(), password: password.trim() });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        const username = email;
        console.log("Username:", email);
        setUsername(username);
        localStorage.setItem("username", username);
        navigate(`/dashboard`);
      }
    } catch {
      setMessage({ type: "error", text: "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match" });
      return;
    }
    try {
      setIsLoading(true);
      const signUpAttempt = await signUp.create({ emailAddress: email.trim(), password: password.trim() });
      setPendingSignUp(signUpAttempt);
      if (signUpAttempt.status === "missing_requirements") {
        const emailVerification = await signUpAttempt.prepareEmailAddressVerification({ strategy: "email_code" });
        if (emailVerification.status === "missing_requirements") {
          setView("verifyEmail");
          setMessage({ type: "info", text: "Please check your email for the verification code" });
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Error signing up" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim() || !pendingSignUp) return;
    try {
      setIsLoading(true);
      setMessage(null);
      const verification = await pendingSignUp.attemptEmailAddressVerification({ code: verificationCode.trim() });
      console.log("Verification response:", verification);
      console.log("Missing required fields:", verification.requiredFields);

      if (verification.status === "complete") {
        await setSignUpActive({ session: verification.createdSessionId });
        const username = email;
        setUsername(username);
        navigate(`/dashboard`);
      } else {
        setMessage({ type: "error", text: "Verification incomplete. Please try again." });
      }
    } catch (error){
      console.error("Verification failed:", error);
      setMessage({ type: "error", text: "Invalid verification code" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter your email" });
      return;
    }

    try {
      setIsLoading(true);
      const signInAttempt = await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });

      if (signInAttempt.status === "needs_first_factor") {
        setView("resetCode");
        setMessage({ type: "info", text: "Reset code sent to your email" });
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setMessage({ type: "error", text: "Error sending reset code" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCode = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setMessage({ type: "error", text: "Please enter the verification code" });
      return;
    }

    try {
      setIsLoading(true);
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: verificationCode.trim(),
      });

      if (result.status === "needs_new_password") {
        setView("newPassword");
      }
    } catch (error) {
      console.error("Reset code error:", error);
      setMessage({ type: "error", text: "Invalid reset code" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!password.trim() || password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match" });
      return;
    }

    try {
      setIsLoading(true);
      await signIn.resetPassword({ password: password.trim() });

      setMessage({ type: "success", text: "Password reset successful" });
      setView("login");
    } catch (error) {
      console.error("Password reset error:", error);
      setMessage({ type: "error", text: "Error resetting password" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        {message && (
          <p className={`text-center mb-4 ${
            message.type === "error" ? "text-red-500" : 
            message.type === "info" ? "text-blue-500" : 
            "text-green-500"}`}
          >
            {message.text}
          </p>
        )}

        {view === "login" && (
          <form onSubmit={handleLogin}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Log in</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors mb-4"
            >
              Log in
            </button>
            <p 
              className="text-center text-blue-500 hover:underline cursor-pointer mb-4"
              onClick={() => setView("forgotPassword")}
            >
              Forgotten password?
            </p>
            <hr className="mb-4" />
            <button
              type="button"
              onClick={() => setView("signup")}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Create new account
            </button>
          </form>
        )}

        {view === "signup" && (
          <form onSubmit={handleSignUp}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Sign Up</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors mb-4"
            >
              <div id="clerk-captcha"></div>
              Sign Up
            </button>
            <p 
              className="text-center text-blue-500 hover:underline cursor-pointer"
              onClick={() => setView("login")}
            >
              Already have an account?
            </p>
          </form>
        )}

        {view === "verifyEmail" && (
          <form onSubmit={handleVerifyEmail}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Verify Email</h2>
            <p className="text-gray-600 mb-4">
              Please enter the verification code sent to your email.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors mb-4"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        )}

        {view === "forgotPassword" && (
          <form onSubmit={handleForgotPassword}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Reset Password</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors mb-4"
            >
              Send Reset Code
            </button>
            <p 
              className="text-center text-blue-500 hover:underline cursor-pointer"
              onClick={() => setView("login")}
            >
              Back to Login
            </p>
          </form>
        )}

        {view === "resetCode" && (
          <form onSubmit={handleResetCode}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Enter Reset Code</h2>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter reset code"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Verify Code
            </button>
          </form>
        )}

        {view === "newPassword" && (
          <form onSubmit={handlePasswordReset}>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Set New Password</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
