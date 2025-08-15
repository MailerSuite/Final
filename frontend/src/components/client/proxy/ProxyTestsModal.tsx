import UniversalModal from '@/components/modals/UniversalModal'
import { useProxy } from '@/hooks/use-proxy'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ProxyTestsModal({ isOpen, onClose }: Props) {
  const { activeProxy } = useProxy()
  const noSocks5 = !activeProxy || (activeProxy as any).proxy_type !== 'socks5'

  return (
    <UniversalModal title="Proxy Tests" isOpen={isOpen} onClose={onClose}>
      <>
        {noSocks5 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-500 rounded text-red-800">
            <p>No proxy configured</p>
            <p>Please add a SOCKS5 proxy before running tests.</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">Proxy testing interface</p>
        {noSocks5 && (
          <button
            className="mt-2 px-4 py-2 font-medium rounded bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              window.location.href = 'http://78.159.131.121/proxies/checker'
            }}
          >
            + Add SOCKS5 Proxy
          </button>
        )}
      </>
    </UniversalModal>
  )
}
