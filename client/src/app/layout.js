import '../styles/globals.css';

export const metadata = {
  title: 'AI Project Workspace — Developer Multi-Agent Environment',
  description: 'Persistent, secure, scalable AI project workspace powered by a Supervisor Orchestrator and 4 specialized agents for full-stack development, architecture design, research, and code review.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
