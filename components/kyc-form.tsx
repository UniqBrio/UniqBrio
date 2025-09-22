import React, { useState } from "react";
import OwnerBannerCapture from "@/components/owner-banner-capture";

interface KYCFormProps {
  onSubmit?: (data: any) => void;
}

const KYCForm: React.FC<KYCFormProps> = ({ onSubmit }) => {
  const [ownerImage, setOwnerImage] = useState<File | string | null>(null);
  const [bannerImage, setBannerImage] = useState<File | string | null>(null);
  const [ownerWithBannerImage, setOwnerWithBannerImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [dateTime, setDateTime] = useState<string>("");
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showSelfieDialog, setShowSelfieDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Capture only owner image
  const handleOwnerCaptureSubmit = (data: any) => {
    console.log("[KYC] Owner capture submitted:", { hasPhoto: !!data.photo });
    // data.photo is base64 string
    setOwnerImage(data.photo);
    setShowOwnerDialog(false);
    setIsLoading(false);
  };

  const handleBannerCaptureSubmit = (data: any) => {
    console.log("[KYC] Banner capture submitted:", { hasPhoto: !!data.photo });
    setBannerImage(data.photo);
    setShowBannerDialog(false);
    setIsLoading(false);
  };

  // Capture location, date, and time when ownerWithBannerImage is uploaded
  const handleSelfieSubmit = (data: any) => {
    console.log("[KYC] Selfie capture submitted:", { 
      hasPhoto: !!data.photo,
      hasLocation: !!data.location,
      hasTimestamp: !!data.timestamp
    });
    setOwnerWithBannerImage(data.photo);
    setLocation(`${data.location.latitude}, ${data.location.longitude} (${data.location.address || "No address"})`);
    setDateTime(data.timestamp);
    setLatitude(data.location.latitude);
    setLongitude(data.location.longitude);
    setAddress(data.location.address || "");
    setShowSelfieDialog(false);
    setIsLoading(false);
  };
  // Add state for latitude, longitude, address, userId, academyId
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");

  // Get userId and academyId from backend API
  const [userId, setUserId] = useState("");
  const [academyId, setAcademyId] = useState("");

  React.useEffect(() => {
    async function fetchUserAcademyInfo() {
      try {
        console.log("[KYC] Fetching user academy info...");
        const res = await fetch("/api/user-academy-info");
        const data = await res.json();
        console.log("[KYC] User academy info response:", data);
        
        if (data.userId) setUserId(data.userId);
        if (data.academyId) setAcademyId(data.academyId);
        
        if (!data.userId || !data.academyId) {
          console.warn("[KYC] Warning: Missing userId or academyId", data);
        }
      } catch (err) {
        console.error("[KYC] Failed to fetch user academy info:", err);
      }
    }
    fetchUserAcademyInfo();
  }, []);

  // Cleanup effect for camera when component unmounts
  React.useEffect(() => {
    return () => {
      console.log("[KYC] KYC form unmounting - ensuring all dialogs are closed");
      setShowOwnerDialog(false);
      setShowBannerDialog(false);
      setShowSelfieDialog(false);
    };
  }, []);

  // Test authentication before form submission
  const testAuthentication = async () => {
    try {
      console.log("[KYC] Testing authentication...");
      const res = await fetch("/api/test-kyc-auth");
      const data = await res.json();
      console.log("[KYC] Auth test result:", data);
      return data.authenticated;
    } catch (err) {
      console.error("[KYC] Auth test failed:", err);
      return false;
    }
  };


  const handleCapture = () => {
    setShowSelfieDialog(true);
  };

  // Helper function to check if all required images are provided
  const areAllImagesProvided = () => {
    return !!(ownerImage && bannerImage && ownerWithBannerImage);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log("[KYC] Starting form submission...", {
      hasOwnerImage: !!ownerImage,
      hasBannerImage: !!bannerImage,
      hasOwnerWithBannerImage: !!ownerWithBannerImage,
      userId,
      academyId
    });

    // Validate that all required images are provided
    if (!ownerImage) {
      alert("Please capture or upload an image of the owner before submitting.");
      setIsLoading(false);
      return;
    }

    if (!bannerImage) {
      alert("Please capture or upload an image of the academy banner before submitting.");
      setIsLoading(false);
      return;
    }

    if (!ownerWithBannerImage) {
      alert("Please capture an image of the owner standing beside the banner before submitting.");
      setIsLoading(false);
      return;
    }

    try {
      // Test authentication first
      const isAuthenticated = await testAuthentication();
      if (!isAuthenticated) {
        alert("Authentication failed. Please log out and log back in, then try again.");
        return;
      }
      
      console.log("[KYC] Authentication test passed, proceeding with submission...");
      
      const formData = new FormData();
      
      // Handle owner image - could be File or base64 string
      if (ownerImage) {
        if (typeof ownerImage === 'string') {
          // It's a base64 string from camera capture
          formData.append("ownerImage", ownerImage);
        } else {
          // It's a File from file input
          formData.append("ownerImage", ownerImage);
        }
      }
      
      // Handle banner image - could be File or base64 string
      if (bannerImage) {
        if (typeof bannerImage === 'string') {
          // It's a base64 string from camera capture
          formData.append("bannerImage", bannerImage);
        } else {
          // It's a File from file input
          formData.append("bannerImage", bannerImage);
        }
      }
      
      // Handle owner with banner image - always base64 from camera
      if (ownerWithBannerImage) {
        formData.append("ownerWithBannerImage", ownerWithBannerImage);
      }
      
      // Add metadata
      formData.append("location", location);
      formData.append("dateTime", dateTime);
      formData.append("latitude", latitude?.toString() || "");
      formData.append("longitude", longitude?.toString() || "");
      formData.append("address", address);
      formData.append("userId", userId);
      formData.append("academyId", academyId);
      
      console.log("[KYC] Sending request to /api/kyc-upload...");
      
      const response = await fetch("/api/kyc-upload", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      console.log("[KYC] Server response:", result);
      
      if (result.success) {
        console.log("[KYC] KYC submitted successfully!");
        setShowSuccessModal(true);
        
        // Update local storage for KYC status only
        localStorage.setItem('kycStatus', 'submitted');
        
        // Keep the form data for potential resubmission if needed
        // Reset will be handled when user closes the modal
        if (onSubmit) onSubmit(result);
      } else {
        let errorMessage = result.error || "Unknown error occurred";
        
        // Provide specific guidance for authentication errors
        if (errorMessage.includes("Not authenticated") || errorMessage.includes("Invalid session")) {
          errorMessage = "Authentication required. Please log out and log back in, then try again.";
        } else if (errorMessage.includes("userId") || errorMessage.includes("academyId")) {
          errorMessage = "User profile incomplete. Please complete your registration first.";
        }
        
        console.error("[KYC] Submission failed:", errorMessage);
        alert("KYC submission failed: " + errorMessage);
      }
    } catch (error) {
      console.error("[KYC] Submission error:", error);
      alert("KYC submission failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form className="bg-white rounded-xl shadow-2xl p-8 text-left max-w-lg mx-auto" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold text-purple-700 mb-4">KYC Verification</h2>
        <p className="text-md text-red-600 mb-6 font-semibold">
          No fake info should be uploaded. If done, after verification your account will be blocked.
        </p>
        {/* 1. Capture or Upload image of user/owner */}
        <div className={`mb-6 ${!ownerImage ? 'border-2 border-red-200 rounded-lg p-3 bg-red-50' : ''}`}>
          <label className="block font-semibold mb-2 text-purple-700">
            1. Capture or Upload Image of Owner
            {!ownerImage && <span className="text-red-500 text-sm ml-2">* Required</span>}
          </label>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
            <div className="flex-shrink-0 flex flex-col items-center">
                <img
                  src="/Owner.png"
                  alt="Reference Owner"
                  className="rounded-lg shadow border"
                  style={{ width: '160px', height: '200px', objectFit: 'cover', background: '#fff' }}
                />
                <span className="text-xs mt-2">Reference Owner</span>
                <button
                  type="button"
                  className="mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow-lg hover:from-orange-600 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowOwnerDialog(true)}
                >
                  <span className="font-semibold">Capture Image</span>
                </button>
            </div>
            <div className="flex-1 w-full">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="block w-full border border-gray-300 rounded px-3 py-2"
                onChange={e => setOwnerImage(e.target.files?.[0] || null)}
              />
              <span className="text-xs text-gray-500">Accepted formats: jpeg, png, jpg</span>
              {ownerImage && (
                <div className="mt-2">
                  {typeof ownerImage === 'string' ? (
                    <img src={ownerImage} alt="Owner" className="rounded shadow w-full max-w-xs" />
                  ) : (
                    <div className="text-green-600 text-sm">✓ Owner image selected: {ownerImage.name}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 2. Upload image of banner of the academy */}
        <div className={`mb-6 ${!bannerImage ? 'border-2 border-red-200 rounded-lg p-3 bg-red-50' : ''}`}>
          <label className="block font-semibold mb-2 text-purple-700">
            2. Capture or Upload Image of Academy Banner
            {!bannerImage && <span className="text-red-500 text-sm ml-2">* Required</span>}
          </label>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
            <div className="flex-shrink-0 flex flex-col items-center">
                <img
                  src="/Banner.png"
                  alt="Reference Banner"
                  className="rounded-lg shadow border"
                  style={{ width: '160px', height: '200px', objectFit: 'cover', background: '#fff' }}
                />
                <span className="text-xs mt-2">Reference Banner</span>
                <button
                  type="button"
                  className="mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow-lg hover:from-orange-600 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowBannerDialog(true)}
                >
                  <span className="font-semibold">Capture Image</span>
                </button>
            </div>
            <div className="flex-1 w-full">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="block w-full border border-gray-300 rounded px-3 py-2"
                onChange={e => setBannerImage(e.target.files?.[0] || null)}
              />
              <span className="text-xs text-gray-500">Accepted formats: jpeg, png, jpg</span>
              {bannerImage && (
                <div className="mt-2">
                  {typeof bannerImage === 'string' ? (
                    <img src={bannerImage} alt="Banner" className="rounded shadow w-full max-w-xs" />
                  ) : (
                    <div className="text-green-600 text-sm">✓ Banner image selected: {bannerImage.name}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 3. Capture image of Owner standing beside banner with location, time, date */}
        <div className={`mb-6 ${!ownerWithBannerImage ? 'border-2 border-red-200 rounded-lg p-3 bg-red-50' : ''}`}>
          <label className="block font-semibold mb-2 text-purple-700">
            3. Capture Image of Owner Beside Banner
            {!ownerWithBannerImage && <span className="text-red-500 text-sm ml-2">* Required</span>}
          </label>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
            {/* Reference image for Owner beside Banner capture, now on the left */}
            <div className="flex flex-col items-center">
              <img
                src="/Owner%20and%20Banner.png"
                alt="Reference Owner and Banner"
                className="rounded-lg shadow border"
                style={{ width: '160px', height: '200px', objectFit: 'cover', background: '#fff' }}
              />
              <span className="text-xs mt-2">Reference: Owner beside Banner</span>
            </div>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow-lg hover:from-orange-600 hover:to-purple-600 disabled:opacity-60 disabled:cursor-not-allowed`}
              onClick={handleCapture}
            >
              <span className="font-semibold">Capture Image</span>
            </button>
          </div>
          {ownerWithBannerImage && (
            <div className="mt-2">
              <img src={ownerWithBannerImage} alt="Owner with Banner" className="rounded shadow w-full max-w-xs" />
              <div className="text-xs mt-1"><b>Location:</b> {location}</div>
              <div className="text-xs"><b>Date & Time:</b> {dateTime}</div>
            </div>
          )}
          
          
        </div>
        
        {/* Validation message for missing images */}
        {!areAllImagesProvided() && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium mb-2">Please complete the following steps before submitting:</p>
            <ul className="text-red-600 text-xs space-y-1">
              {!ownerImage && <li>• Capture or upload owner image</li>}
              {!bannerImage && <li>• Capture or upload academy banner image</li>}
              {!ownerWithBannerImage && <li>• Capture image of owner beside banner</li>}
            </ul>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={isLoading || !areAllImagesProvided()}
          className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
        >
          {isLoading ? "Submitting..." : areAllImagesProvided() ? "Submit KYC" : "Complete All Steps to Submit"}
        </button>
      </form>
      {showOwnerDialog && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-2xl p-2 w-full max-w-md h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-purple-700 mb-2">Capture Owner Image</h3>
            <OwnerBannerCapture 
              captureType="owner" 
              onSubmit={handleOwnerCaptureSubmit}
              key={`owner-${showOwnerDialog}`} 
            />
            <button 
              className="mt-2 px-4 py-2 bg-gray-300 rounded" 
              onClick={() => { 
                console.log("[KYC] Closing owner dialog");
                setShowOwnerDialog(false); 
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showBannerDialog && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-2xl p-2 w-full max-w-md h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-purple-700 mb-2">Capture Banner Image</h3>
            <OwnerBannerCapture 
              captureType="banner" 
              onSubmit={handleBannerCaptureSubmit}
              key={`banner-${showBannerDialog}`}
            />
            <button 
              className="mt-2 px-4 py-2 bg-gray-300 rounded" 
              onClick={() => { 
                console.log("[KYC] Closing banner dialog");
                setShowBannerDialog(false); 
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showSelfieDialog && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-2xl p-2 w-full max-w-md h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-purple-700 mb-2">Capture Owner Beside Banner</h3>
            <OwnerBannerCapture 
              captureType="ownerWithBanner" 
              onSubmit={handleSelfieSubmit}
              key={`selfie-${showSelfieDialog}`}
            />
            <button 
              className="mt-2 px-4 py-2 bg-gray-300 rounded" 
              onClick={() => { 
                console.log("[KYC] Closing selfie dialog");
                setShowSelfieDialog(false); 
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-600 mb-4">Verification Successful!</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Thank you for completing your KYC. Our team will reach out to you once the background check is done.
                <br /><br />
                <strong>You will receive confirmation within 24 business hours.</strong>
              </p>
              <button
                onClick={() => {
                  console.log("[KYC] Success modal - Continue to Dashboard clicked");
                  setShowSuccessModal(false);
                  // Ensure all camera dialogs are closed
                  setShowOwnerDialog(false);
                  setShowBannerDialog(false);
                  setShowSelfieDialog(false);
                  // Call the onSubmit callback to update dashboard
                  if (onSubmit) onSubmit({ success: true });
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-semibold"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default KYCForm;
