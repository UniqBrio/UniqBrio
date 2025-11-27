"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import KYCForm from "@/components/kyc-form"
import { AlertCircle, Clock, Shield } from "lucide-react"

export default function KYCBlockedPage() {
  const router = useRouter()
  const [showKycForm, setShowKycForm] = useState(false)
  const [kycSubmitted, setKycSubmitted] = useState(false)
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    email?: string;
    academyName?: string;
  }>({})

  useEffect(() => {
    // Fetch user info for personalization and check KYC status
    const fetchUserInfoAndKycStatus = async () => {
      try {
        // Fetch user info
        const userResponse = await fetch("/api/user-academy-info", {
          credentials: 'include',
        })
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserInfo({
            name: userData.userName,
            email: userData.email,
            academyName: userData.academyName
          })
        }

        // Check if user has already submitted KYC (for blocked users)
        const kycResponse = await fetch("/api/kyc-status", {
          credentials: 'include',
        })
        if (kycResponse.ok) {
          const kycData = await kycResponse.json()
          console.log("KYC Status for blocked user:", kycData.status)
          
          // If KYC is approved, redirect to dashboard
          if (kycData.status === "verified") {
            console.log("KYC approved - redirecting to dashboard")
            router.push('/dashboard')
            return
          }
          
          // If user already submitted KYC, show the submitted state
          if (kycData.status === "submitted") {
            console.log("User already submitted KYC - showing under review state")
            setKycSubmitted(true)
          }
        }
      } catch (error) {
        console.error("Failed to fetch user info or KYC status:", error)
      }
    }

    fetchUserInfoAndKycStatus()

    // Poll KYC status every 30 seconds to check for approval
    const pollInterval = setInterval(async () => {
      try {
        const kycResponse = await fetch("/api/kyc-status", {
          credentials: 'include',
        })
        if (kycResponse.ok) {
          const kycData = await kycResponse.json()
          if (kycData.status === "verified") {
            console.log("KYC approved during polling - redirecting to dashboard")
            clearInterval(pollInterval)
            router.push('/dashboard')
          }
        }
      } catch (error) {
        console.error("Error polling KYC status:", error)
      }
    }, 30000) // Poll every 30 seconds

    // Cleanup interval on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [])

  const handleKycSuccess = () => {
    setKycSubmitted(true)
    setShowKycForm(false)
    localStorage.setItem('kycStatus', 'submitted')
    
    // For blocked users, don't auto-redirect to dashboard
    // They should wait for admin approval before accessing dashboard
    console.log("KYC submitted successfully for blocked user - staying on blocked page until approval")
  }

  if (kycSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              KYC Documents Submitted Successfully!
            </h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Under Review</h3>
              </div>
              <p className="text-blue-700 mb-4">
                Your KYC documents are currently under review by our verification team.
              </p>
              <p className="text-blue-600 text-sm">
                <strong>Expected Review Time:</strong> Within 24 hours
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> Once your KYC is approved, your account access will be automatically restored. 
                You'll receive an email confirmation when the review is complete. Please wait for approval before accessing your dashboard.
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 dark:text-white mb-4">
                Your documents have been successfully uploaded and are being processed.
              </p>
              <p className="text-gray-500 dark:text-white text-sm">
                You'll be able to access your dashboard once the verification is approved.
              </p>
            </div>
            
            <p className="text-gray-500 dark:text-white text-sm mt-4">
              You will be redirected to the dashboard automatically in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showKycForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-red-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-700">Complete Your KYC Verification</h2>
              <button 
                className="text-red-600 hover:text-red-800 text-2xl font-bold"
                onClick={() => setShowKycForm(false)}
              >
                &times;
              </button>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">
                <strong>Note:</strong> Your account access is currently blocked. Complete KYC verification to restore access.
              </p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <KYCForm onSubmit={handleKycSuccess} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto border-2 border-red-500">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-red-700">
            Account Access Blocked
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="text-center mb-6">
            {userInfo.name && (
              <p className="text-lg text-gray-700 dark:text-white mb-2">
                Hello <strong>{userInfo.name}</strong>,
              </p>
            )}
            {userInfo.academyName && (
              <p className="text-gray-600 dark:text-white mb-4">
                Academy: <strong>{userInfo.academyName}</strong>
              </p>
            )}
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  KYC Verification Required
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Your account access has been blocked because you haven't completed your KYC (Know Your Customer) 
                    verification within the required 14-day period.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-2">To Unblock Your Account:</h4>
            <ol className="text-sm text-blue-700 space-y-1 ml-4 list-decimal">
              <li>Complete your KYC verification by uploading required documents</li>
              <li>Wait for our team to review your submission (within 24 hours)</li>
              <li>Once approved, your account access will be automatically restored</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-800 mb-2">Required Documents:</h4>
            <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
              <li>Owner/Administrator photo with academy banner</li>
              <li>Clear photo of academy banner/signboard</li>
              <li>Location verification with selfie at academy premises</li>
            </ul>
          </div>

          <div className="text-center">
            <Button 
              onClick={() => setShowKycForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold"
              size="lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              Upload KYC Now
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-white">
              Need help? Contact our support team at support@uniqbrio.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}