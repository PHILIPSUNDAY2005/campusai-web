'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BsHouseFill,
  BsHouse,
  BsChatDotsFill,
  BsChatDots,
  BsFileEarmarkTextFill,
  BsFileEarmarkText,
  BsPersonFill,
  BsPerson,
} from 'react-icons/bs';
import Logo from './Logo';
import styles from './MainNav.module.css';

const tabs = [
  { label: 'Home', href: '/dashboard', icon: BsHouse, activeIcon: BsHouseFill },
  { label: 'Chat', href: '/chat', icon: BsChatDots, activeIcon: BsChatDotsFill },
  { label: 'Notes', href: '/notes', icon: BsFileEarmarkText, activeIcon: BsFileEarmarkTextFill },
  { label: 'Profile', href: '/profile', icon: BsPerson, activeIcon: BsPersonFill },
];

export default function MainNav() {
  const pathname = usePathname(); // the current page address, like "/dashboard"

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <Logo size={40} showName />
      </div>
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