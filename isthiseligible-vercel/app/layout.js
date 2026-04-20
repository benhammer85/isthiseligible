import './globals.css';

export const metadata = {
  title: 'Is This Eligible?',
  description: 'Receipt and purchase eligibility checker powered by Gemini',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
