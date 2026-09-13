import React from "react";
import Link from "next/link";
import { AlertCircle, ShieldAlert, FileQuestion, WifiOff } from "lucide-react";

interface ErrorStateProps {
  error: any;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className = "" }: ErrorStateProps) {
  const status = error?.status || 500;
  const message = error?.message || "An unexpected error occurred.";

  // Determine configuration based on status
  let config = {
    icon: <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />,
    title: "Something went wrong",
    description: message,
    action: (
      <button 
        onClick={onRetry} 
        className="mt-6 px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-md text-sm font-medium transition-colors"
      >
        Try Again
      </button>
    )
  };

  if (status === 403) {
    config = {
      icon: <ShieldAlert className="w-12 h-12 text-amber-500 mb-4" />,
      title: "Access Denied",
      description: "You don't have permission to view this resource. If you believe this is a mistake, please contact support.",
      action: (
        <Link 
          href="/dashboard" 
          className="mt-6 inline-flex px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-md text-sm font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      )
    };
  } else if (status === 404) {
    config = {
      icon: <FileQuestion className="w-12 h-12 text-blue-500 mb-4" />,
      title: "Not Found",
      description: "The requested resource could not be found. It may have been deleted or moved.",
      action: (
        <Link 
          href="/dashboard" 
          className="mt-6 inline-flex px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-md text-sm font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      )
    };
  } else if (status >= 500) {
    config = {
      icon: <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />,
      title: "Server Error",
      description: "Something went wrong on our side. Please try again in a moment. If the problem continues, contact support.",
      action: (
        <button 
          onClick={onRetry || (() => window.location.reload())} 
          className="mt-6 px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-md text-sm font-medium transition-colors"
        >
          {onRetry ? "Try Again" : "Refresh Page"}
        </button>
      )
    };
  } else if (!status || message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network")) {
    config = {
      icon: <WifiOff className="w-12 h-12 text-[#999] mb-4" />,
      title: "Connection Error",
      description: "We're having trouble connecting to the server. Please check your internet connection and try again.",
      action: (
        <button 
          onClick={onRetry || (() => window.location.reload())} 
          className="mt-6 px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-md text-sm font-medium transition-colors"
        >
          {onRetry ? "Try Again" : "Refresh Page"}
        </button>
      )
    };
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[50vh] ${className}`}>
      {config.icon}
      <h2 className="text-2xl font-serif font-semibold text-[#1A1A1A] mb-2">{config.title}</h2>
      <p className="text-[#666] text-sm max-w-md leading-relaxed">{config.description}</p>
      {config.action}
    </div>
  );
}
