import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders VanLoka home page', () => {
  render(<App />);
  expect(screen.getByText(/VanLoka MDS Mock Test Portal/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Confirm \/ Login/i })).toBeInTheDocument();
});
