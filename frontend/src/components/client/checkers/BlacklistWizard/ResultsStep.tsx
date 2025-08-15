import SummaryBar from '@/components/BlacklistChecker/SummaryBar'
import ResultTable from '@/components/BlacklistChecker/ResultTable'
import { useBlacklistWizard } from '@/hooks/useBlacklistWizard'

export default function ResultsStep() {
  const { data } = useBlacklistWizard()
  if (!data) return null
  return (
    <div className="space-y-6">
      <SummaryBar results={data.results} />
      <ResultTable results={data.results} />
    </div>
  )
}
