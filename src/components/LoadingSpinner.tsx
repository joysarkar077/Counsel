import styles from './LoadingSpinner.module.css';

interface Props {
  size?: number;
  color?: string;
}

export default function LoadingSpinner({ size = 20, color = 'var(--bg-card)' }: Props) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size, borderTopColor: color }}
      aria-label="Loading"
    />
  );
}
