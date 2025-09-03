import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can log the error to an error reporting service
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen bg-red-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
                        <div className="bg-red-50 p-4 rounded-md mb-4">
                            <p className="text-red-800 font-medium">{this.state.error && this.state.error.toString()}</p>
                        </div>
                        <details className="mt-4 bg-gray-50 p-4 rounded-md">
                            <summary className="cursor-pointer text-gray-700 font-medium">Technical Details</summary>
                            <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600 overflow-auto max-h-48">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                        <div className="mt-6">
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.href = '/login';
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md mr-4"
                            >
                                Reset & Login
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                            >
                                Try Again
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
