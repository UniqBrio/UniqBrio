"use client"

import { useState, useEffect } from "react"
import KYCForm from "./kyc-form"
import { 
  HomeMetrics, 
  FinancialSnapshot, 
  Announcements,
  PerformanceAnalytics,
  FavoritesBar,
  FeedbackSection
} from "@/components/dashboard/home"
import { SelfieAttendanceButton } from "@/components/dashboard/home/SelfieAttendanceButton"

const Dashboard = () => {
  const [showKycPopup, setShowKycPopup] = useState(false);
  const [showKycRejectedPopup, setShowKycRejectedPopup] = useState(false);
  const [kycDaysLeft, setKycDaysLeft] = useState(14);
  const [showKycForm, setShowKycForm] = useState(false);
  const [academyName, setAcademyName] = useState("");
  const [userName, setUserName] = useState("");
  const [academyId, setAcademyId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [registrationRecords, setRegistrationRecords] = useState<number>(0);
  const [kycStatus, setKycStatus] = useState<"pending" | "submitted" | "verified" | "expired" | "rejected" | null>(null);
  const [showKycSuccessNotification, setShowKycSuccessNotification] = useState(false);
  const [showKycVerifiedBanner, setShowKycVerifiedBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Immediately check KYC status to prevent dashboard flash
    const checkKycStatusImmediately = async () => {
      try {
        console.log("[Dashboard] Fetching KYC status from /api/kyc-status");
        const response = await fetch("/api/kyc-status", {
          credentials: 'include',
        });
        console.log("[Dashboard] KYC status response:", response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log("KYC Status API Response:", data);
          
          // Track previous KYC status to detect status changes
          const previousKycStatus = sessionStorage.getItem('previousKycStatus');
          
          // If KYC is expired, immediately redirect without showing dashboard
          if (data.status === "expired") {
            window.location.href = "/kyc-blocked";
            return; // Don't set loading to false, keep showing loading until redirect
          }
          
          // Check if KYC just got verified (status changed from non-verified to verified)
          if (data.status === "verified" && previousKycStatus && previousKycStatus !== "verified") {
            console.log("[Dashboard] KYC status changed to verified, setting flag");
            sessionStorage.setItem('kycJustVerified', '1');
          }
          
          // Store current status for next comparison
          sessionStorage.setItem('previousKycStatus', data.status);
          
          // Set KYC status and days left from API response (accurate calculation)
          setKycStatus(data.status);
          if (data.daysLeft !== undefined) {
            setKycDaysLeft(data.daysLeft);
            console.log("Days left calculated from API:", data.daysLeft);
          }
        } else {
          console.error("[Dashboard] KYC status API returned error:", response.status);
          // Set a default status to allow dashboard to load
          setKycStatus("pending");
        }
      } catch (error) {
        console.error("[Dashboard] Error checking KYC status:", error);
        // Set a default status to allow dashboard to load even on error
        setKycStatus("pending");
      } finally {
        // Always set loading to false after KYC check completes
        setIsLoading(false);
      }
    };

    // Check KYC status first before setting up other dashboard logic
    checkKycStatusImmediately();

    // Clear any old localStorage flags that might cause issues
    localStorage.removeItem('kycSuccessShown');

    // Fetch academy/user info (scoped by session cookie)
    const fetchAcademyInfo = async () => {
      try {
        console.log("[Dashboard] Fetching academy info from /api/user-academy-info");
        const response = await fetch("/api/user-academy-info", {
          credentials: 'include',
        });
        console.log("[Dashboard] Academy info response:", response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Academy Info API Response:", data); // Debug log
          setAcademyName(data.academyName || "");
          setUserName(data.userName || "");
          setAcademyId(data.academyId || "");
          setUserId(data.userId || "");
        } else {
          // Handle specific error cases
          if (response.status === 404) {
            console.warn("User not found or no registration - setting defaults");
            setAcademyName("Academy Setup Required");
            setUserName("User");
            setAcademyId("N/A");
            setUserId("N/A");
          } else {
            console.error("Failed to fetch academy info:", response.status, response.statusText);
            // Set fallback values
            setAcademyName("Academy");
            setUserName("User");
          }
        }
      } catch (error) {
        console.error("[Dashboard] Error fetching academy info:", error);
        // Set fallback values on network error
        setAcademyName("Academy");
        setUserName("User");
        setAcademyId("N/A");
        setUserId("N/A");
      }
    };

    // Fetch dashboard summary (server filters by academyId/userId)
    const fetchDashboardSummary = async () => {
      try {
        console.log("[Dashboard] Fetching dashboard summary from /api/dashboard/summary");
        const res = await fetch("/api/dashboard/summary", {
          credentials: 'include',
        });
        console.log("[Dashboard] Dashboard summary response:", res.status, res.statusText);
        if (res.ok) {
          const data = await res.json();
          console.log("[Dashboard] Dashboard summary data:", data);
          setRegistrationRecords(data.registrationRecords || 0);
          if (data.academyId) setAcademyId(data.academyId);
          if (data.userId) setUserId(data.userId);
        }
      } catch (e) {
        console.error("[Dashboard] Error fetching dashboard summary:", e);
      }
    };

    fetchAcademyInfo();
    fetchDashboardSummary();
  }, []); // Run only once on mount

  // Separate useEffect to handle KYC status changes
  useEffect(() => {
    if (!kycStatus || isLoading) return;
    
    // Only show KYC popup if KYC is not submitted or verified
    if (kycStatus === "pending") {
      setShowKycPopup(true);
    } else if (kycStatus === "rejected") {
      // Show rejection popup for rejected KYCs
      setShowKycRejectedPopup(true);
      setShowKycPopup(false);
    } else if (kycStatus === "verified") {
      // Clear any pending banners and show a one-time congrats
      setShowKycPopup(false);
      setShowKycRejectedPopup(false);
      setShowKycForm(false);
      
      // Check if we should show the verification banner
      // Show only if the user just logged in after verification (not on every page load)
      const kycJustVerified = sessionStorage.getItem('kycJustVerified');
      const kycVerifiedShownThisSession = sessionStorage.getItem('kycVerifiedShownThisSession');
      
      console.log("KYC Status is verified. kycJustVerified:", kycJustVerified, "kycVerifiedShownThisSession:", kycVerifiedShownThisSession);
      
      if (kycJustVerified === '1' && !kycVerifiedShownThisSession) {
        console.log("Showing congratulations banner for just-verified KYC");
        setShowKycVerifiedBanner(true);
        sessionStorage.setItem('kycVerifiedShownThisSession', '1');
        sessionStorage.removeItem('kycJustVerified'); // Clear the flag
        
        // Auto-hide the banner after 8 seconds
        setTimeout(() => {
          setShowKycVerifiedBanner(false);
        }, 8000);
      } else {
        console.log("KYC verification congratulations already shown this session, not showing banner");
        setShowKycVerifiedBanner(false);
      }
    } else if (kycStatus === 'submitted') {
      // Don't show any popup for submitted status
      setShowKycPopup(false);
      setShowKycRejectedPopup(false);
      setShowKycForm(false);
    }
  }, [kycStatus, isLoading]); // Watch kycStatus changes

  const handleKycSuccess = () => {
    setKycStatus("submitted");
    localStorage.setItem('kycStatus', 'submitted');
    setShowKycForm(false);
    setShowKycPopup(false);
    setShowKycSuccessNotification(true);
    
    // Auto-hide the success notification after 5 seconds
    setTimeout(() => {
      setShowKycSuccessNotification(false);
    }, 5000);
  };

  // Show loading state while checking KYC status to prevent dashboard flash
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-white">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 responsive-dashboard-container">
      {/* KYC Success Notification - Temporary toast-style popup */}
      {showKycSuccessNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 dark:bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold">KYC Submitted Successfully!</h3>
              <p className="text-sm mt-1">Your documents are under review. You'll receive confirmation within 24 hours.</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowKycSuccessNotification(false)}
                className="text-green-300 hover:text-white"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Single KYC Status Banner - Consolidated notification logic */}
      {!showKycSuccessNotification && (
        <>
          {/* Pending KYC - Show warning with days left (only if NOT rejected) */}
          {kycDaysLeft > 0 && kycStatus !== "submitted" && kycStatus !== "verified" && kycStatus !== "rejected" && (
            <div className="w-full bg-orange-100 dark:bg-orange-900/30 border-b-2 border-orange-400 dark:border-orange-600 text-orange-800 dark:text-orange-200 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              Please complete verification to continue using the amazing features of UniqBrio —
              <span className="ml-2 font-bold">{kycDaysLeft} days</span> of verification pending.
            </div>
          )}
          
          {/* Submitted KYC - Show under review message */}
          {kycStatus === 'submitted' && (
            <div className="w-full bg-blue-100 dark:bg-blue-900/30 border-b-2 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              ✅ KYC Submitted Successfully! Your documents are under review. You'll receive confirmation within 24 hours.
            </div>
          )}
          
          {/* Verified KYC - Show success message (only once) */}
          {showKycVerifiedBanner && (
            <div className="w-full bg-green-100 dark:bg-green-900/30 border-b-2 border-green-400 dark:border-green-600 text-green-800 dark:text-green-200 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              <div className="flex items-center justify-center relative">
                <span>🎉 Congratulations! Your KYC is verified.</span>
                <button
                  onClick={() => setShowKycVerifiedBanner(false)}
                  className="absolute right-0 text-green-600 hover:text-green-800 ml-4"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Rejected KYC - Show rejection message with action button */}
          {kycStatus === 'rejected' && (
            <div className="w-full bg-red-100 dark:bg-red-900/30 border-b-2 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              <div className="flex items-center justify-center gap-4">
                <span>❌ KYC Rejected. Please re-upload your documents to proceed.</span>
                <button
                  onClick={() => setShowKycForm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
                >
                  Upload KYC Again
                </button>
              </div>
            </div>
          )}
          
          {/* Expired KYC - Show expiration message */}
          {kycStatus === 'expired' && (
            <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 py-3 px-4 text-center font-semibold sticky top-0 z-40">
              ⌛ Your KYC window has expired. Please submit your KYC to regain access.
            </div>
          )}
        </>
      )}
      
      {/* KYC Popup - only show if KYC status is pending */}
      {showKycPopup && kycStatus !== "submitted" && kycStatus !== "verified" && kycStatus !== "rejected" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-orange-400 dark:border-orange-600 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowKycPopup(false)}
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <h2 className="text-2xl font-extrabold mb-3 text-purple-700">Continue using UniqBrio uninterrupted!</h2>
            <p className="mb-6 text-gray-700 dark:text-white">
              <span className="inline-block px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-bold mr-1">{kycDaysLeft} days</span>
              left to upload your KYC and avoid service interruption.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                className="bg-gradient-to-r from-orange-400 to-purple-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:scale-105 transition-transform"
                onClick={() => { setShowKycPopup(false); setShowKycForm(true); }}
              >
                <span className="mr-2">&#x2714;</span> Verify
              </button>
              <button
                className="bg-gradient-to-r from-gray-400 to-gray-600 text-white px-6 py-2 rounded-full font-semibold shadow hover:scale-105 transition-transform"
                onClick={() => setShowKycPopup(false)}
              >
                I will do it in a while
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Rejected Popup */}
      {showKycRejectedPopup && kycStatus === "rejected" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-red-500 dark:border-red-600">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-extrabold mb-3 text-red-700">KYC Rejected</h2>
            <p className="mb-6 text-gray-700 dark:text-white">
              Your KYC documents have been rejected. Please review the feedback and upload corrected documents to continue using UniqBrio.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setShowKycRejectedPopup(false)}
              >
                Close
              </button>
              <button
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform"
                onClick={() => { setShowKycRejectedPopup(false); setShowKycForm(true); }}
              >
                <span className="mr-2">📄</span> Upload KYC Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Button - show for pending, rejected, or expired KYCs */}
      {!showKycForm && (kycStatus === "pending" || kycStatus === "rejected" || kycStatus === "expired" || (!kycStatus && kycStatus !== "submitted" && kycStatus !== "verified")) && (
        <div className="flex justify-end mb-4">
          <button
            className={`px-4 py-2 rounded font-medium transition-colors ${
              kycStatus === "rejected" 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
            onClick={() => setShowKycForm(true)}
          >
            {kycStatus === "rejected" ? "Upload KYC Again" : "Verification"}
          </button>
        </div>
      )}

      {/* KYC Form Modal */}
      {showKycForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-40 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 max-w-lg w-full border-2 border-purple-600 dark:border-purple-500 h-[90vh] overflow-y-auto">
            <button 
              className="float-right text-purple-600 dark:text-purple-400 hover:text-orange-500 dark:hover:text-orange-400 text-2xl font-bold" 
              onClick={() => {
                console.log("[Dashboard] Closing KYC form");
                setShowKycForm(false);
              }}
            >
              &times;
            </button>
            <h2 className="text-xl font-extrabold mb-4 text-orange-500 dark:text-orange-400">KYC Upload</h2>
            <KYCForm 
              onSubmit={handleKycSuccess} 
              key={`kyc-form-${showKycForm}-${Date.now()}`} 
            />
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-orange-500 rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 responsive-text-xl">
              Welcome{userName && userName !== "User" ? `, ${userName}` : ''}!
            </h1>
            {academyName && academyName !== "Academy" && academyName !== "Academy Setup Required" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white dark:bg-gray-300 rounded-full"></div>
                <p className="text-sm sm:text-base lg:text-lg font-medium responsive-text-base">
                  {academyName} Dashboard
                </p>
              </div>
            )}
            {academyName === "Academy Setup Required" && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                <p className="text-sm sm:text-base lg:text-lg font-medium text-yellow-100 responsive-text-base">
                  Academy Registration Required
                </p>
              </div>
            )}
            {(!academyName || academyName === "Academy") && (
              <p className="text-sm sm:text-base lg:text-lg opacity-90 responsive-text-base">
                {userName && userName !== "User" ? "Your Academy Dashboard" : "Academy Dashboard"}
              </p>
            )}
          </div>
          <div className="flex flex-col items-start sm:items-end text-left sm:text-right gap-1 sm:gap-2 w-full sm:w-auto">
            {academyId && academyId !== "N/A" && (
              <div className="bg-white bg-opacity-20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                Academy ID: {academyId}
              </div>
            )}
            {userId && userId !== "N/A" && (
              <div className="bg-white bg-opacity-20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                User ID: {userId}
              </div>
            )}
            {(academyId === "N/A" || userId === "N/A") && (
              <div className="bg-yellow-500 bg-opacity-80 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                Setup Required
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <SelfieAttendanceButton />
          <FavoritesBar />
        </div>
        <Announcements />
      </div>

      <HomeMetrics />
        
      {/* Main Dashboard Content */}
      <div className="space-y-4 sm:space-y-6">
        <FinancialSnapshot />
        <PerformanceAnalytics />
        <FeedbackSection />
      </div>
    </div>
  );
}

export default Dashboard
