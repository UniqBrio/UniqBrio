"use client"

export function FormValidation({ isValid, isInvalid, message }: { isValid: boolean; isInvalid: boolean; message: string }) {
  if (!message) return null;
  return (
    <div className={`text-xs mt-1 ${isInvalid ? "text-red-500" : isValid ? "text-green-600" : "text-muted-foreground"}`}>
      {message}
    </div>
  );
}
