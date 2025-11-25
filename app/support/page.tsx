"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { submitSupportTicket } from "../actions/auth-actions"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, X, AlertCircle, CheckCircle } from "lucide-react"

const supportTicketSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  shortDescription: z.string().min(5, "Please provide a brief description"),
  detailedDescription: z.string().min(10, "Please provide more details"),
})

type FormData = z.infer<typeof supportTicketSchema>

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [ticketNumber, setTicketNumber] = useState("")
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(supportTicketSchema),
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("email", data.email)
      formData.append("issueType", data.shortDescription)
      formData.append("description", data.detailedDescription)

      if (file) {
        formData.append("attachment", file)
      }

      const result = await submitSupportTicket(formData)

      if (result.success) {
        setTicketNumber(result.ticketNumber || "UB-" + Math.floor(Math.random() * 1000000).toString());
        setIsSuccess(true);
        toast({
          title: "Support ticket submitted",
          description: `Your ticket number is ${result.ticketNumber}. We'll get back to you as soon as possible.`,
        });
      } else {
        const fallbackError = "Failed to submit ticket. Please try again.";
      
        const errorMessage =
          result.message || // general error message
          result.errors?.description?.[0] ||
          result.errors?.email?.[0] ||
          result.errors?.issueType?.[0] ||
          fallbackError;
      
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Support ticket error:", error)
      setError("There was a problem submitting your support ticket. Please try again.")
      toast({
        title: "Error",
        description: "There was a problem submitting your support ticket. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Generate your support ticket</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4 flex items-start">
              <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-sm">
                Your support ticket has been submitted successfully. Our team will review your issue and get back to you
                as soon as possible.
              </p>
            </div>
            <p className="text-gray-600 dark:text-white mb-4">
              Ticket reference: <span className="font-bold">{ticketNumber}</span>
            </p>
            <p className="text-gray-600 dark:text-white mb-4">
              A confirmation email has been sent to your email address with your ticket details.
            </p>
            <Link href="/login" className="text-[#fd9c2d] hover:underline">
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-purple-700">
                Enter your email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="abc@abc.com"
                className={`w-full p-3 bg-gray-200 rounded-lg ${errors.email ? "border-2 border-red-500" : ""}`}
                {...register("email")}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="shortDescription" className="block text-purple-700">
                Short description of the issue
              </label>
              <input
                id="shortDescription"
                type="text"
                placeholder="Example: Couldn't login"
                className={`w-full p-3 bg-gray-200 rounded-lg ${errors.shortDescription ? "border-2 border-red-500" : ""}`}
                {...register("shortDescription")}
              />
              {errors.shortDescription && <p className="text-red-500 text-sm">{errors.shortDescription.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="detailedDescription" className="block text-purple-700">
                Detailed description
              </label>
              <textarea
                id="detailedDescription"
                placeholder="Enter your detailed issue to resolve"
                className={`w-full p-3 bg-gray-200 rounded-lg min-h-[100px] ${errors.detailedDescription ? "border-2 border-red-500" : ""}`}
                {...register("detailedDescription")}
              />
              {errors.detailedDescription && (
                <p className="text-red-500 text-sm">{errors.detailedDescription.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="attachment" className="block text-purple-700">
                Attachment (Optional)
              </label>

              {file ? (
                <div className="flex items-center justify-between p-3 bg-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Upload size={18} className="mr-2 text-gray-600 dark:text-white" />
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <button type="button" onClick={removeFile} className="text-red-500 hover:text-red-700">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div
                    className="w-full p-3 bg-gray-200 rounded-lg flex items-center justify-between cursor-pointer"
                    onClick={() => document.getElementById("fileInput")?.click()}
                  >
                    <span className="text-gray-500 dark:text-white">Choose</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="#39006f"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-white">Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 5MB)</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Submitting...
                </>
              ) : (
                "Raise a case"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[#fd9c2d] hover:underline">
            Login
          </Link>
          <span className="text-gray-400 dark:text-white mx-1">/</span>
          <Link href="/signup" className="text-purple-700 hover:underline">
            Signup
          </Link>
        </div>
      </div>
    </div>
  )
}
