type ErrorNoticeProps = {
  message: string;
};

export function ErrorNotice({ message }: ErrorNoticeProps) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}
