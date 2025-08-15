import { useMutation } from '@tanstack/react-query';
import type { SMTPAccountPayload, SMTPAccountResponse } from '@/http/api';
import { smtpApi } from '@/http/api';

export function useSmtpCheck() {
  return useMutation<SMTPAccountResponse, unknown, SMTPAccountPayload>({
    mutationFn: (data) => smtpApi.testConnection(data).then((r) => r.data),
  });
}

