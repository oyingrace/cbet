import Link from 'next/link';
import { FaHome, FaTicketAlt, FaWallet, FaUser, FaClock } from 'react-icons/fa';

export const Navigation = ({ activePage }) => {
  const navItems = [
    { name: 'Home', href: '/home', icon: <FaHome size={20} /> },
    { name: 'Play', href: '/games', icon: <FaTicketAlt size={20} /> },
    { name: 'My Bets', href: '/bets/history', icon: <FaClock size={20} /> },
    { name: 'Wallet', href: '/wallet', icon: <FaWallet size={20} /> },
    { name: 'Me', href: '/profile', icon: <FaUser size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-dark-bg-primary border-t dark:border-dark-bg-secondary flex justify-around py-2 shadow-lg transition-colors duration-200">
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex flex-col items-center p-2 transition-colors duration-200 ${
            activePage === item.name.toLowerCase().replace(' ', '')
              ? 'text-dream-yellow-dark dark:text-dream-yellow'
              : 'text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary'
          }`}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default Navigation;
