import type { EmailData, SMTPAccount, ProxyAccount } from '@/types/compose'

interface Header {
  key: string
  value: string
}

interface Props {
  smtpAccount: SMTPAccount | null
  proxy: ProxyAccount | null
  emailData: EmailData
  attachments?: File[]
  customHeaders: Header[]
  senderName?: string | null
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default function EmailSummary({
  smtpAccount,
  proxy,
  emailData,
  attachments = [],
  customHeaders,
  senderName,
}: Props) {
  const from = senderName
    ? `${senderName} <${smtpAccount?.email ?? ''}>`
    : smtpAccount?.email ?? emailData.from

  return (
    <div className="space-y-6">
      <h4 className="text-2xl font-bold text-white">Email Summary</h4>
      <div className="grid grid-cols-2 gap-4 text-lg text-muted-foreground">
        <div className="font-semibold text-foreground">SMTP Account:</div>
        <div>
          {smtpAccount ? `${smtpAccount.email} (${smtpAccount.server})` : 'N/A'}
        </div>
        <div className="font-semibold text-foreground">Proxy:</div>
        <div>{proxy ? `${proxy.ip_address}:${proxy.port}` : 'None'}</div>
        <div className="font-semibold text-foreground">To:</div>
        <div>{emailData.to}</div>
        <div className="font-semibold text-foreground">From:</div>
        <div>{from}</div>
        <div className="font-semibold text-foreground">Subject:</div>
        <div>{emailData.subject}</div>
        {emailData.cc && (
          <>
            <div className="font-semibold text-foreground">CC:</div>
            <div>{emailData.cc}</div>
          </>
        )}
        {emailData.bcc && (
          <>
            <div className="font-semibold text-foreground">BCC:</div>
            <div>{emailData.bcc}</div>
          </>
        )}
        {emailData.reply_to && (
          <>
            <div className="font-semibold text-foreground">Reply-To:</div>
            <div>{emailData.reply_to}</div>
          </>
        )}
        <div className="font-semibold text-foreground">Priority:</div>
        <div>{emailData.priority}</div>
        {customHeaders.length > 0 && (
          <>
            <div className="font-semibold text-foreground">Custom Headers:</div>
            <div>
              <ul className="list-disc list-inside ml-4">
                {customHeaders.map((h, idx) => (
                  <li key={idx}>
                    {h.key}: {h.value}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        <div className="font-semibold text-foreground">Content Type:</div>
        <div>{emailData.html_content ? 'HTML' : 'Plain Text'}</div>
      </div>
      <div>
        <span className="font-semibold text-foreground">Content Preview:</span>
        <div className="bg-white/10 border border-white/20 rounded-md p-4 mt-2 max-h-40 overflow-y-auto text-sm text-white">
          {emailData.html_content ? (
            <div
              className="prose prose-invert text-sm"
              dangerouslySetInnerHTML={{ __html: emailData.html_content }}
            />
          ) : emailData.text_content ? (
            <pre>{emailData.text_content}</pre>
          ) : (
            <em>No content entered.</em>
          )}
        </div>
      </div>
      {attachments.length > 0 && (
        <div>
          <span className="font-semibold text-foreground">Attachments:</span>
          <ul className="list-disc list-inside ml-4">
            {attachments.map((file, idx) => (
              <li key={idx}>
                {file.name} ({formatFileSize(file.size)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
