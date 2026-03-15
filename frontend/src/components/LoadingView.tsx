type LoadingViewProps = {
  label?: string;
};

export function LoadingView({ label = "Loading..." }: LoadingViewProps) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}
