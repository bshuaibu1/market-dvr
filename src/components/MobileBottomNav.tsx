import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'Live', path: '/live' },
  { label: 'Replay', path: '/replay' },
  { label: 'Heatmap', path: '/heatmap' },
  { label: 'Events', path: '/events' },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around"
      style={{
        height: 52,
        background: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {tabs.map(tab => {
        const active = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className="flex-1 flex items-center justify-center h-full text-[13px] apple-transition"
            style={{
              color: active ? '#e6007a' : 'rgba(255,255,255,0.5)',
              fontWeight: active ? 600 : 400,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
