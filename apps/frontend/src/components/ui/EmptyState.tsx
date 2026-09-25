import React, { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="surface-card p-8 sm:p-12 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 mb-4 bg-[#1B2332] border border-[#2A364C] text-[#94A3B8] flex items-center justify-center rounded">
        {icon}
      </div>
      <h3 className="font-display font-bold text-base sm:text-lg text-[#F8FAFC] mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#94A3B8] max-w-sm mx-auto leading-relaxed mb-6 font-sans">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
