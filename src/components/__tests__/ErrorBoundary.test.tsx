import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Suppress React's console.error for expected thrown errors in these tests
beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('test explosion');
  return null;
}

describe('ErrorBoundary', () => {
  test('renders children normally when no error is thrown', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    // If this doesn't throw, children rendered without triggering boundary
    expect(() => getByText('Something went wrong')).toThrow();
  });

  test('shows error UI when a child throws during render', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Please restart the app.')).toBeTruthy();
    expect(queryByText('Try again')).toBeNull();
  });
});
