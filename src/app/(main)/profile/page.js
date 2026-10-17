'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  IoPersonOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoChevronForward,
} from 'react-icons/io5';
import { auth } from '../../../lib/firebase';
import useAuth from '../../../lib/useAuth';
import Button from '../../../components/Button';
import styles from './profile.module.css';

const options = [
  { id: 1, title: 'Edit Profile', icon: IoPersonOutline },
  { id: 2, title: 'Notifications', icon: IoNotificationsOutline },
  { id: 3, title: 'Help & Support', icon: IoHelpCircleOutline },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // The saved name, or the start of the email if no name was saved
  const userName =
    (user && user.displayName) || (user && user.email ? user.email.split('@')[0] : 'Student');
  const userEmail = (user && user.email) || '';

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);

    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      setLoggingOut(false);
      alert('Could not log out. Please try again.');
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Profile</h1>

      {/* User info */}
      <div className={styles.userCard}>
        <div className={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
        <p className={styles.userName}>{userName}</p>
        <p className={styles.userEmail}>{userEmail}</p>
      </div>

      {/* Options */}
      {options.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={styles.optionRow}
            onClick={() => alert(item.title + ' will be added later.')}
          >
            <span className={styles.optionIcon}>
              <Icon size={20} />
            </span>
            <span className={styles.optionText}>{item.title}</span>
            <IoChevronForward size={20} />
          </button>
        );
      })}

      <div className={styles.logout}>
        <Button
          title={loggingOut ? 'Logging out...' : 'Log Out'}
          variant="secondary"
          onClick={handleLogout}
        />
      </div>
    </div>
  );
}