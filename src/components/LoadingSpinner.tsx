export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-tertiary">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
    </div>
  )
}
