import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../elements/Button';
import { cn } from '../../../logic/utils/cn';

interface ErrorUIProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorUI: React.FC<ErrorUIProps> = ({ error, onReset }) => {
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      id="error-boundary-overlay" 
      className="min-h-screen flex items-center justify-center p-SpacingLarge bg-ColorBg transition-colors duration-DurationMid"
    >
      <div 
        id="error-boundary-container" 
        className={cn(
          "max-w-ContainerSm w-full text-center space-y-SpacingLarge animate-in fade-in zoom-in-layout-TransformShort duration-DurationMid",
          isMobile && "px-SpacingSmall"
        )}
      >
        <div 
          id="error-boundary-icon-wrapper" 
          className="w-20 h-20 bg-FeedbackColorError/opacity-OpacityMuted rounded-RadiusFull flex items-center justify-center mx-auto shadow-ElevationSm"
        >
          <AlertTriangle id="error-boundary-icon" size="2.5rem" className="text-FeedbackColorError" />
        </div>
        
        <div id="error-boundary-text" className="space-y-SpacingSmall">
          <h2 id="error-boundary-title" className="text-FontSizeH3 font-bold text-TextColorBase leading-LineHeightTight">
            Ups, Terjadi Kesalahan
          </h2>
          <p id="error-boundary-description" className="text-FontSizeSm text-TextColorMuted leading-LineHeightRelaxed">
            Tampaknya terjadi kegagalan sistem yang tidak terduga. Silakan coba muat ulang halaman atau hubungi dukungan jika masalah ini berlanjut.
          </p>
        </div>

        {error && (
          <div 
            id="error-boundary-stack" 
            className="p-SpacingMedium bg-ColorTertiary/opacity-OpacityMuted border border-ColorTertiary/opacity-OpacitySubtle rounded-RadiusMedium text-left overflow-auto max-h-32 shadow-inner"
          >
            <code className="text-FontSizeNano text-FeedbackColorError block break-all font-mono">
              {error.toString()}
            </code>
          </div>
        )}

        <Button
          id="error-boundary-reset-btn"
          onClick={onReset}
          className="bg-ColorPrimary text-White w-full py-SpacingBase shadow-ElevationNormal hover:shadow-ElevationMid transition-all"
        >
          <RefreshCw size="1.125rem" className="mr-SpacingSmall animate-spin-slow" />
          Muat Ulang Halaman
        </Button>
      </div>
    </div>
  );
};

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (Component as any)<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    const { hasError, error } = (this as any).state;
    const { fallback, children } = (this as any).props;

    if (hasError) {
      if (fallback) return fallback;
      return <ErrorUI error={error} onReset={this.handleReset} />;
    }

    return children;
  }
}
