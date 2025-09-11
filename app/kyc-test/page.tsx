"use client";

import KYCForm from "@/components/kyc-form";

export default function KYCTestPage() {
  const handleKYCSubmit = (data: any) => {
    console.log("KYC submission completed:", data);
    alert("KYC form submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-purple-700 mb-8">
          KYC Form Test
        </h1>
        <KYCForm onSubmit={handleKYCSubmit} />
      </div>
    </div>
  );
}
