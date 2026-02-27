import './globals.css';

export const metadata = {
  title: 'YouTube Summarizer - Local AI',
  description: 'Summarize YouTube videos using local LLMs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
