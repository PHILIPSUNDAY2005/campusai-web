'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IoHome,
  IoHomeOutline,
  IoChatbubbleEllipses,
  IoChatbubbleEllipsesOutline,
  IoDocumentText,
  IoDocumentTextOutline,
  IoPerson,
  IoPersonOutline,
} from 'react-icons/io5';
import styles from './MainNav.module.css';

const tabs = [
  { label: 'Home', href: '/dashboard', icon: IoHomeOutline, activeIcon: IoHome },
  { label: 'Chat', href: '/chat', icon: IoChatbubbleEllipsesOutline, activeIcon: IoChatbubbleEllipses },
  { label: 'Notes', href: '/notes', icon: IoDocumentTextOutline, activeIcon: IoDocumentText },
  { label: 'Profile', href: '/profile', icon: IoPersonOutline, activeIcon: IoPerson },
];

export default function MainNav() {
  const pathname = usePathname(); // the current page address, like "/dashboard"

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>CampusAI</div>
      <div className={styles.links}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = isActive ? tab.activeIcon : tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.link} ${isActive ? styles.active : ''}`}
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}