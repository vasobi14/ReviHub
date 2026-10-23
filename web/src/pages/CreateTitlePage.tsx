import { useNavigate } from 'react-router-dom';
import { createTitle } from '../api';
import { Header } from '../components/Header';
import TitleForm from '../components/TitleForm';
import styles from './CreateTitlePage.module.css';

export default function CreateTitlePage() {
  const navigate = useNavigate();

  return (
    <main>
      <Header />
      <div className={styles.page}>
        <h1>Add title</h1>
        <TitleForm
          submitLabel="Add title"
          onSubmit={async (data) => {
            const title = await createTitle(data);
            navigate(`/titles/${title.id}`);
          }}
          onCancel={() => navigate('/')}
        />
      </div>
    </main>
  );
}
