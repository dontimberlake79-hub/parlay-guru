import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function AnimatedBackground() {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => t + 0.01);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const gradient1 = `radial-gradient(circle at ${50 + Math.sin(time) * 20}% ${50 + Math.cos(time) * 15}%, rgba(255, 215, 0, 0.15) 0%, transparent 50%)`;
  const gradient2 = `radial-gradient(circle at ${50 + Math.cos(time * 0.8) * 25}% ${50 + Math.sin(time * 0.7) * 20}%, rgba(142, 68, 173, 0.1) 0%, transparent 50%)`;
  const gradient3 = `radial-gradient(circle at ${50 + Math.sin(time * 0.5) * 15}% ${50 + Math.cos(time * 0.6) * 25}%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)`;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a1a1a]" />
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: `${gradient1}, ${gradient2}, ${gradient3}`,
          filter: 'blur(60px)',
          transition: 'background 0.1s linear'
        }}
      />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjE1LDAsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
    </div>
  );
}