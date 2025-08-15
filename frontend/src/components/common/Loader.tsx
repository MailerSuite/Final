export default function Loader() {
  return (
    <div className="flex justify-center p-4" data-testid="loader">
      <span className="animate-spin border-4 border-t-transparent rounded-full w-6 h-6 border-muted" />
    </div>
  )
}
