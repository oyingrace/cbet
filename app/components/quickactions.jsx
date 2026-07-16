'use client';

import Link from 'next/link';
import { FaBolt, FaGift } from 'react-icons/fa6';
import { FaMedal, FaClock } from 'react-icons/fa';

const quickActions = [
  { icon: FaBolt, label: 'Quick Play', href: '/games' },
  { icon: FaClock, label: 'My Bets', href: '/bets/history' },
  { icon: FaMedal, label: 'LeaderBoard', href: '/leaderboard' },
  { icon: FaGift, label: 'Rewards', href: '/rewards' },
];

const QuickActions = () => {
  return (
    <div className="grid grid-cols-4 gap-2 mb-6 px-1">
      {quickActions.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className="bg-gray-100 dark:bg-dark-bg-primary p-2 rounded-lg flex flex-col items-center justify-center transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-opacity-80 min-h-[80px]"
        >
          <div className="w-10 h-10 flex items-center justify-center mb-2 bg-blue-300 bg-opacity-10 dark:bg-blue-300 dark:bg-opacity-20 rounded-lg">
            <item.icon size={18} className="text-dream-blue dark:text-dream-blue" />
          </div>
          <span className="text-xs text-gray-800 dark:text-dark-text-primary text-center leading-tight">
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default QuickActions;
