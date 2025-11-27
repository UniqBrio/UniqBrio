"use client";
import React, { useState } from "react";
import { useCustomColors } from "@/lib/use-custom-colors";
import { MessageSquare, Send, CheckCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Pages without "Coming Soon" badge (existing features)
const existingPages = [
  { id: "home", name: "Home" },
  { id: "services", name: "Services" },
  { id: "schedule", name: "Schedule" },
  { id: "courses", name: "Course Management" },
  { id: "payments", name: "Payments" },
  { id: "user", name: "User Management" },
  { id: "students", name: "Students Management" },
  { id: "staff", name: "Staff Management" },
  { id: "instructor", name: "Instructor" },
  { id: "non-instructor", name: "Non-Instructor" },
  { id: "financials", name: "Financials" },
  { id: "task-management", name: "Task Management" },
  { id: "events", name: "Events" },
  { id: "community", name: "Community" },
  { id: "settings", name: "Settings" },
  { id: "audit-logs", name: "Audit Logs" },
  { id: "help", name: "Help" },
];

// Pages with "Coming Soon" badge
const comingSoonPages = [
  { id: "parents", name: "Parent Management" },
  { id: "alumni", name: "Alumni Management" },
  { id: "enquiries", name: "Enquiries and Leads (CRM)" },
  { id: "sell-services-products", name: "Sell Products & Services" },
  { id: "promotions", name: "Promotions" },
];

export function FeedbackSection() {
  const { primaryColor } = useCustomColors();
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [newFeatureName, setNewFeatureName] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType || !remarks) return;

    if (feedbackType === "correction" && !selectedPage) return;
    if (feedbackType === "coming-soon" && !selectedPage) return;
    if (feedbackType === "new-feature" && !newFeatureName) return;

    // Here you would typically send this data to your API
    const feedbackData = {
      type: feedbackType,
      page: feedbackType === "new-feature" ? newFeatureName : selectedPage,
      remarks: remarks,
      files: uploadedFiles.map(f => f.name),
      timestamp: new Date().toISOString(),
    };

    console.log("Feedback submitted:", feedbackData);
    console.log("Uploaded files:", uploadedFiles);

    // Show success message
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFeedbackType("");
      setSelectedPage("");
      setNewFeatureName("");
      setRemarks("");
      setUploadedFiles([]);
      setIsSubmitted(false);
    }, 3000);
  };

  const getPageList = () => {
    if (feedbackType === "correction") return existingPages;
    if (feedbackType === "coming-soon") return comingSoonPages;
    return [];
  };

  const isFormValid = () => {
    if (!feedbackType || !remarks) return false;
    if (feedbackType === "correction" && !selectedPage) return false;
    if (feedbackType === "coming-soon" && !selectedPage) return false;
    if (feedbackType === "new-feature" && !newFeatureName.trim()) return false;
    return true;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader 
        className="border-b text-white" 
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg bg-white/20"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Feedback & Suggestions</CardTitle>
            <CardDescription className="mt-1 text-white/90">
              Help us improve by sharing your feedback
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="p-4 rounded-full mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle
                className="w-12 h-12"
                style={{ color: primaryColor }}
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Feedback Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                What would you like to provide feedback on?
              </Label>
              <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
                <label 
                  htmlFor="correction"
                  className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors hover:border-primary"
                >
                  <RadioGroupItem value="correction" id="correction" />
                  <div className="space-y-1 leading-none">
                    <div className="font-medium cursor-pointer">
                      Correction on existing feature
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Report issues or suggest improvements for current features
                    </p>
                  </div>
                </label>
                <label 
                  htmlFor="coming-soon"
                  className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors hover:border-primary"
                >
                  <RadioGroupItem value="coming-soon" id="coming-soon" />
                  <div className="space-y-1 leading-none">
                    <div className="font-medium cursor-pointer">
                      Expecting coming soon feature
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share your expectations for upcoming features
                    </p>
                  </div>
                </label>
                <label 
                  htmlFor="new-feature"
                  className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors hover:border-primary"
                >
                  <RadioGroupItem value="new-feature" id="new-feature" />
                  <div className="space-y-1 leading-none">
                    <div className="font-medium cursor-pointer">
                      New feature request
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Suggest a completely new feature or page
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Page/Feature Selection */}
            {feedbackType && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                {feedbackType === "new-feature" ? (
                  <div className="space-y-2">
                    <Label htmlFor="new-feature-name" className="font-medium">
                      Feature/Page Name
                    </Label>
                    <input
                      id="new-feature-name"
                      type="text"
                      value={newFeatureName}
                      onChange={(e) => setNewFeatureName(e.target.value)}
                      placeholder="Enter the name of the feature or page you need"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="page-select" className="font-medium">
                      Select Page
                    </Label>
                    <Select value={selectedPage} onValueChange={setSelectedPage}>
                      <SelectTrigger id="page-select">
                        <SelectValue placeholder="Choose a page" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {getPageList().map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Remarks + Upload side-by-side */}
            {feedbackType && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                {/* Remarks/Comments */}
                <div className="space-y-3">
                  <Label htmlFor="remarks" className="font-medium">
                    {feedbackType === "correction"
                      ? "Describe the issue or correction needed"
                      : feedbackType === "coming-soon"
                      ? "Share your expectations or requirements"
                      : "Describe the new feature"}
                  </Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      feedbackType === "correction"
                        ? "Please provide details about the correction needed..."
                        : feedbackType === "coming-soon"
                        ? "Tell us what you expect from this feature..."
                        : "Describe what this feature should do and how it would help you..."
                    }
                    rows={9}
                    className="resize-none min-h-[220px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be as detailed as possible to help us understand your needs better
                  </p>
                </div>

                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label htmlFor="file-upload-button" className="font-medium">
                    Upload Screenshots or CSV (Optional)
                  </Label>
                  <div className="space-y-3">
                    {/* Hidden file input for accessibility, triggered by button */}
                    <input
                      id="file-upload"
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.csv"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setUploadedFiles((prev) => [...prev, ...files]);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <Button
                      id="file-upload-button"
                      type="button"
                      variant="outline"
                      className="justify-center gap-2 h-9 text-sm px-3 md:w-auto hover:bg-muted hover:text-foreground"
                      onClick={() => {
                        const el = document.getElementById('file-upload') as HTMLInputElement | null;
                        el?.click();
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      Select files to upload
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG, SVG, or CSV (Max 5 files)
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Selected Files ({uploadedFiles.length})
                        </p>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-1 rounded-md bg-muted/40 border"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Upload className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                                <span className="text-xs truncate">{file.name}</span>
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
                                }}
                                className="p-1 hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                                type="button"
                              >
                                <X className="w-3.5 h-3.5 text-destructive" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {feedbackType && (
              <div className="flex justify-end pt-2 animate-in slide-in-from-top-2 duration-300">
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid()}
                  style={{
                    backgroundColor: isFormValid() ? primaryColor : undefined,
                  }}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
