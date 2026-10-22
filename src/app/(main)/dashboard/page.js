'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  BsBell,
  BsPerson,
  BsStars,
  BsJournalText,
  BsCloudUpload,
  BsFileEarmarkText,
  BsChevronDown,
  BsChevronUp,
} from 'react-icons/bs';
import { db } from '../../../lib/firebase';
import useAuth from '../../../lib/useAuth';
import Logo from '../../../components/Logo';
import FeatureCard from '../../../components/FeatureCard';
import styles from './dashboard.module.css';

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

// Turns a date into "Just now", "Today", "Yesterday" or a short date
function describeWhen(date) {
  if (!date) {
    return 'Just now';
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday - startOfDate) / 86400000);

  if (days <= 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return days + ' days ago';
  }
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(false);
  const [openId, setOpenId] = useState(null); // which summary is expanded

  // Listen to this student's latest saved summaries
  useEffect(() => {
    if (!user) {
      return;
    }

    const latest = query(
      collection(db, 'users', user.uid, 'summaries'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      latest,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          const date = data.createdAt ? data.createdAt.toDate() : null;
          return {
            id: doc.id,
            title: data.title,
            points: Array.isArray(data.points) ? data.points : [],
            detail: 'Summary \u2022 ' + describeWhen(date),
          };
        });
        setActivities(items);
        setActivitiesError(false);
        setActivitiesLoading(false);
      },
      (error) => {
        console.error('Activities error:', error);
        setActivitiesError(true);
        setActivitiesLoading(false);
      }
    );

    // Stop listening when the page is closed
    return () => unsubscribe();
  }, [user]);

  return (
    <div>
      {/* Logo space (phones only; computers show the logo in the side menu) */}
      <div className={styles.logoBar}>
        <Logo size={44} showName />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.greeting}>
            Welcome back, {getFirstName(user)} {'\uD83D\uDC4B'}
          </h1>
          <p className={styles.subGreeting}>What would you like to learn today?</p>
        </div>
        <button
          className={styles.iconButton}
          aria-label="Notifications"
          onClick={() => alert('Notifications will be added later.')}
        >
          <BsBell size={22} />
        </button>
        <button
          className={styles.iconButton}
          aria-label="Profile"
          onClick={() => router.push('/profile')}
        >
          <BsPerson size={22} />
        </button>
      </header>

      {/* Feature cards */}
      <div className={styles.cards}>
        <FeatureCard
          icon={BsStars}
          title="AI Chat"
          description="Explain difficult course topics"
          buttonTitle="Start Chat"
          onClick={() => router.push('/chat')}
        />
        <FeatureCard
          icon={BsJournalText}
          title="Summarize Notes"
          description="Turn long lecture notes into shorter summaries"
          onClick={() => router.push('/notes')}
        />
        <FeatureCard
          icon={BsCloudUpload}
          title="Upload Notes"
          description="Upload a photo, PDF or text file of your notes"
          onClick={() => router.push('/upload')}
        />
      </div>

      {/* Recent activities */}
      <h2 className={styles.sectionTitle}>Recent Activities</h2>

      {activitiesLoading && <p className={styles.emptyText}>Loading your activities...</p>}

      {!activitiesLoading && activitiesError && (
        <p className={styles.emptyText}>Could not load your activities right now.</p>
      )}

      {!activitiesLoading && !activitiesError && activities.length === 0 && (
        <p className={styles.emptyText}>
          Nothing here yet. Summarize some notes and save the result, and it will show up here.
        </p>
      )}

      {activities.map((item) => {
        const isOpen = openId === item.id;
        const Chevron = isOpen ? BsChevronUp : BsChevronDown;

        return (
          <div key={item.id} className={styles.activityCard}>
            <button
              type="button"
              className={styles.activityRow}
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <span className={styles.activityIcon}>
                <BsFileEarmarkText size={20} />
              </span>
              <span className={styles.activityText}>
                <span className={styles.activityTitle}>{item.title}</span>
                <span className={styles.activityDetail}>{item.detail}</span>
              </span>
              <Chevron size={20} />
            </button>

            {isOpen && (
              <ol className={styles.activityPoints}>
                {item.points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ol>
            )}
          </div>
        );
      })}
    </div>
  );
}