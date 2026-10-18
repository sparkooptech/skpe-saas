# SK-DA | Homologacao isolada sem nova contratacao

Data: 2026-10-18. Situacao: proposta tecnica, nao provisionada.

## Decisao e limites
- Nao criar Supabase branch/projeto cobrado; cotacao de USD 0.01344/h recusada.
- Priorizar VPS Hostinger ja contratada, sem upgrade, volume ou servico faturavel adicional.
- Nao tocar no banco existente do SPARKs, nem no ambiente de producao.
- Se a VPS nao comportar isolamento e recuperacao testada sem impacto, suspender provisionamento e propor homologacao local no RMKB-NTB.

## Topologia candidata
1. PostgreSQL: database dedicado `sparks_da_homol` no servidor PostgreSQL existente, com role owner e role app proprias, sem privilegios sobre outros bancos. Nao compartilhar schema public de outro database.
2. Dados: somente fixtures sinteticas. Nao clonar dados pessoais/operacionais de DEV/PRD. Restaurar estrutura canonica e dependencias necessarias a partir das migracoes versionadas; aplicar depois as 11 migracoes DA/CORE na ordem do gate.
3. Web: container de preview isolado, sem publicar dominio nem substituir `sparks-homol`; bind exclusivamente localhost ou rede privada. VITE_SUPABASE_URL deve apontar para backend de homologacao efetivamente compativel, NAO para Supabase DEV por engano.
4. Auth/API: o frontend atual utiliza supabase-js e funcoes auth.uid(), RLS e RPC. PostgreSQL puro NAO substitui Supabase Auth/PostgREST. Necessario validar stack Supabase local (CLI/Docker) ou backend de homologacao equivalente antes de declarar ambiente funcional.
5. Backup: dump consistente de banco dedicado, checksum, retencao identificada, restore em outro database temporario isolado e verificacao de tabelas/roles/contagens. Nao usar rollback de container como substituto de restauracao de banco.

## Gates de leitura antes de qualquer criacao
- Identificar VPS, versao e capacidade real de CPU/RAM/disco e margens operacionais.
- Inventariar Docker, PostgreSQL, redes, portas, volumes, banco atual, ferramentas de backup e politica de retencao, sem expor segredos em logs.
- Verificar se stack local Supabase pode rodar sem conflito e sem consumo relevante; autenticar usuario teste, acessar RPC, confirmar isolamento.
- Confirmar que operacoes sao limitadas a recursos ja contratados, sem ampliacao de plano ou cobranca adicional.
- Executar preflight readonly e reconciliar historico de 308 migracoes. A branch Supabase main apresenta MIGRATIONS_FAILED; nao supor que clonagem da estrutura sera bem sucedida.

## Ordem de execucao quando os gates forem aprovados
1. Criar infraestrutura isolada e banco vazio, nunca reutilizar banco de outro modulo.
2. Aplicar schema base e fixtures sinteticas; validar Auth/PostgREST/RLS.
3. Produzir dump e ensaiar restauracao em banco temporario; registrar evidencias.
4. Aplicar migracoes DA/CORE em ordem; rodar verificacoes e testes negativos cross-tenant.
5. Testar jornada, papel tecnico SPARKOOP, lider provisoria, transferencia auditada e lista de membros ativos.
6. Somente apos resultados, disponibilizar preview privado para validacao do usuario. Nenhum deploy de producao implicito.

## Estado real
- Nao provisionado; nenhuma migracao executada.
- Sem prova de capacidade livre, backup restauravel, backend Supabase compativel ou SSH para VPS nesta etapa.
- Proximo passo seguro: inventario somente leitura da VPS com conexao autenticada ja configurada e verificacao do runtime local.
