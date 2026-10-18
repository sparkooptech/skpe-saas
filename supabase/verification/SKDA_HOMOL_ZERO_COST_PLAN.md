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

## Inventario local verificado em 2026-10-18 (somente leitura)
- RMKB-NTB: Docker Engine 29.6.2 e Supabase CLI 2.116.0 presentes.
- Contêiner existente supabase_db_skpe-saas: PostgreSQL 17.6.1, healthy; manter intacto.
- Supabase local: Auth, Kong, PostgREST, Studio e demais servicos parados; somente DB ativo.
- Configuracao canônica usa project_id skpe-saas, API 54321, DB 54322, shadow 54320. Nunca reutilizar estas portas ou o mesmo project_id para homologacao.
- Disco C: aproximadamente 239 GB livres.
- Memoria fisica reportada: 8.28 GB totais e apenas 1.20 GB livres no momento da verificacao. Gate de capacidade NAO aprovado para subir outra stack Supabase completa com seguranca.
- SSH para VPS Hostinger nao foi comprovado nesta sessao; consulta de configuracao SSH local nao autentica no servidor.
- Decisao: nao iniciar contêineres nem criar banco neste momento; verificar capacidade e conectividade read-only da VPS antes de escolher Hostinger ou stack local reduzida. Se nao houver folga, pedir nova decisao sobre janela operacional, sem custo extra.
## Inventario R2G2-ACER em 2026-10-18 (somente leitura)
- Equipamento remoto R2G2-ACER online, Windows 10 Pro x64, Acer Aspire M5-481PT, 4 processadores logicos.
- RAM 6.24 GB instalada, cerca de 1.65 GB livre no momento; C: aproximadamente 329 GB livres.
- Docker Desktop instalado e daemon responde, versao 29.8.1, limite de memoria Docker ~2.95 GB; nenhum container existente.
- WSL 2 presente: Ubuntu e docker-desktop parados. Node.js 24.21.0 instalado.
- Git e Supabase CLI nao encontrados no PATH. Virtualizacao reportada como desabilitada por Win32_Processor, mas Docker/WSL existentes exigem verificacao antes de concluir bloqueio de hardware.
- Decisao: nao instalar ferramentas ou iniciar stack Supabase completa ainda; limite Docker 2.95 GB e baixa RAM disponivel tornam inviavel declarar homologacao confiavel. R2G2-ACER pode servir como executor auxiliar ou para testes reduzidos, apos verificar capacidade e autorizacao.
- Nenhum comando de instalacao, criacao, limpeza ou alteracao executado no R2G2-ACER.
## Gate Hostinger: coleta de capacidade sem acesso SSH confirmado
- Script somente leitura: `deploy/hostinger/skpe-saas-homol/skda-capacity-preflight-readonly.sh`.
- Executar exclusivamente em terminal autenticado da VPS, apos identificar o servidor correto; o script nao pede senhas, nao imprime variaveis de ambiente e nao altera arquivos, contêineres ou bancos.
- Resultado necessario: CPU, RAM livre, uso real dos containers, espaco e inodes, portas e presenca de ferramentas PostgreSQL.
- SSH do RMKB-NTB: nenhuma configuracao/chave no perfil consultado; nao tentar adivinhar host, credenciais ou endereco IP.
- Sem inventario da VPS nao ha aprovacao tecnica para iniciar Supabase, criar banco ou subir container.