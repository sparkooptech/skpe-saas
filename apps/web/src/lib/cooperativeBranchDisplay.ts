/** Short presentation label for organization cards. Official branch names remain unchanged. */
export function cooperativeBranchCardLabel(branch: string | null | undefined): string {
  if (!branch?.trim()) return 'Ramo n\u00e3o informado'

  const normalized = branch
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('pt-BR')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()

  if (
    normalized === 'TRABALHO PRODUCAO DE BENS E SERVICOS' ||
    normalized === 'TRABALHO PRODUCAO BENS SERVICOS' ||
    normalized === 'TRABALHO PRODUCAO DE BENS SERVICOS' ||
    normalized === 'TPBS'
  ) return 'TPBS'

  return branch.trim()
}
