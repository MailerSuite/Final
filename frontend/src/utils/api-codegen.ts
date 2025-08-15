export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiSpec {
    name: string // e.g. "CampaignsList"
    path: string // e.g. "/api/v1/campaigns"
    method: HttpMethod
    description?: string
    responseTypeName?: string // e.g. "Campaign[]"
}

export function toCamelCase(name: string): string {
    return name
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .split(' ')
        .map((s, i) => (i === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()))
        .join('')
}

export function toKebabCase(name: string): string {
    return name
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .toLowerCase()
}

export function generateApiFunctionCode(spec: ApiSpec): string {
    const funcName = `call${spec.name}`
    const responseType = spec.responseTypeName || 'any'
    const method = spec.method.toLowerCase()
    const params = spec.method === 'GET' ? 'params?: Record<string, any>' : 'body: Record<string, any>'
    const arg = spec.method === 'GET' ? 'params' : 'body'
    return `import { apiClient, StandardAPIResponse } from '@/http/stable-api-client'

/**
 * ${spec.description || spec.name}
 * ${spec.method} ${spec.path}
 */
export async function ${funcName}(${params}): Promise<StandardAPIResponse<${responseType}>> {
  return apiClient.${method}('${spec.path}', ${arg})
}`
}

export function generateReactHookCode(spec: ApiSpec): string {
    const hookName = `use${spec.name}`
    const funcName = `call${spec.name}`
    const params = spec.method === 'GET' ? 'initialParams?: Record<string, any>' : 'initialBody?: Record<string, any>'
    const state = spec.method === 'GET' ? 'params' : 'body'
    return `import { useState, useCallback } from 'react'
import type { StandardAPIResponse } from '@/http/stable-api-client'
import { ${funcName} } from './${toKebabCase(spec.name)}'

export function ${hookName}(${params}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StandardAPIResponse | null>(null)
  const [${state}, set${state.charAt(0).toUpperCase() + state.slice(1)}] = useState(initial${state.charAt(0).toUpperCase() + state.slice(1)} || {})

  const call = useCallback(async (override?: Record<string, any>) => {
    setLoading(true)
    setError(null)
    try {
      const res = await ${funcName}(override || ${state})
      setData(res)
      return res
    } catch (e: any) {
      setError(e?.message || 'Unknown error')
      throw e
    } finally {
      setLoading(false)
    }
  }, [${state}])

  return { data, loading, error, ${state}, set${state.charAt(0).toUpperCase() + state.slice(1)}, call }
}`
}

export function generateZodSchemaCode(spec: ApiSpec): string {
    return `import { z } from 'zod'

export const ${toCamelCase(spec.name)}ResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  errors: z.record(z.array(z.string())).optional(),
  meta: z.object({ total: z.number().optional(), page: z.number().optional(), limit: z.number().optional(), pages: z.number().optional() }).optional()
})
`
}

export function generateTestCode(spec: ApiSpec): string {
    return `import { describe, it, expect } from 'vitest'
import { ${'call' + spec.name} } from './${toKebabCase(spec.name)}'

describe('${spec.method} ${spec.path}', () => {
  it('should return standard response', async () => {
    const res = await ${'call' + spec.name}(${spec.method === 'GET' ? '{}' : '{}'})
    expect(typeof res.success).toBe('boolean')
  })
})
`
}

