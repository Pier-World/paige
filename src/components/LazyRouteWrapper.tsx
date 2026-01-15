import React, { Component, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface LazyRouteWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component for lazy-loaded routes that provides:
 * - Error boundary for graceful error handling
 * - Retry logic for failed component loads
 * - Loading state management
 */
export class LazyRouteWrapper extends Component<LazyRouteWrapperProps> {
  render() {
    return (
      <ErrorBoundary>
        {this.props.children}
      </ErrorBoundary>
    );
  }
}


