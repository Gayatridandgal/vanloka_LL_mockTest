import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders VanLoka home page', () => {
  render(<App />);
  expect(screen.getByText(/Karnataka RTO Learner License Mock Test/i)).toBeInTheDocument();
});
