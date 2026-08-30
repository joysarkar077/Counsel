interface Props {
  size?: number;
  color?: string;
}

export default function LoadingSpinner({ size = 20, color = 'white' }: Props) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, borderTopColor: color }}
      aria-label="Loading"
    />
  );
}
