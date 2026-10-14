'use client';

import { useRouter } from 'next/navigation';
import {
  IoPersonOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoChevronForward,
} from 'react-icons/io5';
import Button from '../../../components/Button';
import styles from './profile.module.css';

// Dummy data for now. Real user details come from Firebase later.
const userName = 'Student';
const userEmail = 'student@school.edu';

const options = [
  { id: 1, title: 'Edit Profile', icon: IoPersonOutline },
  { id: 2, title: 'Notifications', icon: IoNotificationsOutline },
  { id: 3, title: 'Help & Support', icon: IoHelpCircleOutline },
];

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Profile</h1>

      {/* User info */}
      <div className={styles.userCard}>
        <div className={styles.avatar}>{userName.charAt(0)}</div>
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
        <Button title="Log Out" variant="secondary" onClick={() => router.push('/login')} />
      </div>
    </div>
  );
}