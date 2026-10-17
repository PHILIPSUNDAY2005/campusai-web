'use client';

import { useRouter } from 'next/navigation';
import {
  IoNotificationsOutline,
  IoPersonOutline,
  IoSparklesOutline,
  IoReaderOutline,
  IoCloudUploadOutline,
  IoChatbubbleEllipsesOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5';
import useAuth from '../../../lib/useAuth';
import FeatureCard from '../../../components/FeatureCard';
import styles from './dashboard.module.css';

// Dummy data for now. Real activities will come from Firestore later.
const recentActivities = [
  { id: 1, title: 'Database Normalization', detail: 'AI Chat • Today', icon: IoChatbubbleEllipsesOutline },
  { id: 2, title: 'Operating Systems Notes', detail: 'Summary • Yesterday', icon: IoDocumentTextOutline },
  { id: 3, title: 'Data Structures', detail: 'AI Chat • 2 days ago', icon: IoChatbubbleEllipsesOutline },
];

// Gets a first name to greet. Uses the saved name, or the start of the email.
function getFirstName(user) {
  if (user && user.displayName) {
    return user.displayName.trim().split(' ')[0];
  }
  if (user && user.email) {
    return user.email.split('@')[0];
  }
  return 'Student';
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.greeting}>Welcome back, {getFirstName(user)} 👋</h1>
          <p className={styles.subGreeting}>What would you like to learn today?</p>
        </div>
        <button
          className={styles.iconButton}
          aria-label="Notifications"
          onClick={() => alert('Notifications will be added later.')}
        >
          <IoNotificationsOutline size={22} />
        </button>
        <button
          className={styles.iconButton}
          aria-label="Profile"
          onClick={() => router.push('/profile')}
        >
          <IoPersonOutline size={22} />
        </button>
      </header>

      {/* Feature cards */}
      <div className={styles.cards}>
        <FeatureCard
          icon={IoSparklesOutline}
          title="AI Chat"
          description="Explain difficult course topics"
          buttonTitle="Start Chat"
          onClick={() => router.push('/chat')}
        />
        <FeatureCard
          icon={IoReaderOutline}
          title="Summarize Notes"
          description="Turn long lecture notes into shorter summaries"
          onClick={() => router.push('/notes')}
        />
        <FeatureCard
          icon={IoCloudUploadOutline}
          title="Upload Notes"
          description="Upload a document later"
          onClick={() => alert('Upload Notes will be added in a later phase.')}
        />
      </div>

      {/* Recent activities */}
      <h2 className={styles.sectionTitle}>Recent Activities</h2>
      {recentActivities.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className={styles.activityRow}>
            <div className={styles.activityIcon}>
              <Icon size={20} />
            </div>
            <div>
              <p className={styles.activityTitle}>{item.title}</p>
              <p className={styles.activityDetail}>{item.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}