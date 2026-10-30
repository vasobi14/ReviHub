import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Header } from '../components/layout/Header';
import styles from './LegalPage.module.css';

const CONTACT_EMAIL = 'vasobi14@gmail.com';

export default function LegalPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <main>
      <Header />
      <article className={styles.page}>
        <h1>Terms & Privacy</h1>
        <p className={styles.updated}>Last updated: October 24, 2026</p>
        <nav className={styles.toc} aria-label="On this page">
          <a href="#terms">Terms of use</a>
          <a href="#privacy">Privacy</a>
          <a href="#cookies">Cookies</a>
        </nav>

        <section id="terms">
          <h2>Terms of use</h2>
          <p>ReviHub is a non-commercial portfolio project, provided as is.</p>
          <p>
            You are responsible for the titles, covers and reviews you post.
            Only share text and images you have the right to use: covers should
            be the official artwork of the title. Do not upload stock photos,
            other people\'s photos or fan art, or images with watermarks.
          </p>
          <p>Content or accounts that break these rules may be removed.</p>
          <p>
            If you own the rights to something posted here and want it taken
            down, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
            with a link to the page. It will be removed promptly.
          </p>
        </section>

        <section id="privacy">
          <h2>Privacy</h2>
          <p>
            When you register, ReviHub stores your email, an optional display
            name and your password.
          </p>
          <p>
            Your reviews and the titles you add are public and shown with your
            display name. Your email is never shown to other users.
          </p>
          <p>
            Your email is used only to send the account verification code,
            through the Resend email service. There is no newsletter or
            marketing email.
          </p>
          <p>
            Requests to the site are logged for 90 days for security and usage
            statistics: the time, page path, your
            browser and your IP address, which is stored encrypted and is
            visible only to the site administrator.
          </p>
          <p>
            To delete your account and everything you posted, email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section id="cookies">
          <h2>Cookies</h2>
          <p>
            ReviHub sets one strictly necessary cookie,{' '}
            <code>refreshToken</code>. It keeps you signed in for up to 7 days,
            cannot be read by scripts on the page and is removed when you log
            out.
          </p>
          <p>
            Your browser also remembers display preferences, such as the light
            or dark theme, in local storage. They never leave your device.
          </p>
          <p>There are no analytics, advertising or tracking cookies.</p>
        </section>
      </article>
    </main>
  );
}
