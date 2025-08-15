import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingIndicator({ 
  message = "Loading...", 
  size = "md",
  className 
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-4", 
    lg: "w-8 h-8 border-4"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin border-barn-navy border-t-transparent rounded-full",
        sizeClasses[size]
      )} />
      {message && (
        <span className="ml-3 text-gray-600">{message}</span>
      )}
    </div>
  );
}

export function FullPageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingIndicator message={message} size="lg" />
    </div>
  );
}