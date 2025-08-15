export function isValidDomainOrIp(value: string): boolean {
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/
  const ipv6 = /^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$/
  const domain = /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  return ipv4.test(value) || ipv6.test(value) || domain.test(value)
}
