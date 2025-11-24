import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
  icon?: React.ReactElement;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  isLoading = false,
  icon,
  className,
  ...props
}) => {
  const { t } = useLanguage();
  const baseClasses = "inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`${baseClasses} ${className || ''}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {t('actionButton.processing')}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};