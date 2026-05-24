import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = (this as any).props as ErrorBoundaryProps;

    if (hasError) {
      if (fallback) return fallback;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
            </p>
            <div className="text-xs text-slate-400 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 max-h-24 overflow-y-auto font-mono">
              {error?.message || 'Lỗi không xác định'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-slate-800 transition-all shadow-lg"
            >
              <RefreshCw size={16} />
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
