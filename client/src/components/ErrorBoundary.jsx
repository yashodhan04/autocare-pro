import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary — Catches React component tree errors and displays a recovery screen
 * instead of a blank white screen.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AutoCare Pro ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1A1D23',
            color: '#F4F5F7',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              maxWidth: '36rem',
              width: '100%',
              backgroundColor: '#22262F',
              borderRadius: '1rem',
              border: '1px solid #2C3140',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '1rem',
                backgroundColor: 'rgba(239,68,68,0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#FFFFFF' }}>
              Application Render Error
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#9BA3AF', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              AutoCare Pro encountered a runtime issue while rendering this page.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: '#18191F',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  margin: '0 0 1.5rem',
                  textAlign: 'left',
                  border: '1px solid #2C3140',
                  overflowX: 'auto',
                }}
              >
                <div style={{ color: '#EF4444', fontSize: '0.8125rem', fontFamily: 'monospace', fontWeight: 600 }}>
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <pre
                    style={{
                      color: '#9BA3AF',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      marginTop: '0.5rem',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '12rem',
                      overflowY: 'auto',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#C6F135',
                  color: '#1A1D23',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <RefreshCw size={15} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleHome}
                style={{
                  backgroundColor: 'transparent',
                  color: '#F4F5F7',
                  border: '1px solid #2C3140',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Home size={15} />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
