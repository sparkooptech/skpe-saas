# ADR-002 — Hostinger como ambiente canônico e eliminação progressiva do Supabase

## Status

Aprovado e canônico.

## Vigência

2026-11-01.

## Contexto

A plataforma SPARKs encontra-se em transição de uma arquitetura fortemente dependente do Supabase para uma arquitetura operada na infraestrutura da Hostinger. O uso simultâneo de ambos os ambientes gerou risco de regressão, divergência de dados, fallback indevido e comportamento inconsistente entre desenvolvimento, homologação e produção.

## Decisão canônica

Todo desenvolvimento novo, correção, teste funcional, integração, migração, automação e evolução arquitetural do SPARKs deve ser concebido, implementado e validado apontando para o ambiente da Hostinger como referência operacional.

A Hostinger passa a ser o ambiente-alvo obrigatório da arquitetura do SPARKs.

O Supabase deixa de ser ambiente canônico de desenvolvimento e passa a ser tratado somente como dependência legada ou camada temporária de compatibilidade enquanto ainda houver componentes não migrados.

## Regra de evolução

Sempre que uma implementação tocar em componente que ainda dependa do Supabase, deve-se avaliar e, quando tecnicamente viável e seguro dentro do mesmo escopo, realizar a adequação necessária para reduzir ou eliminar essa dependência.

A eliminação do Supabase deve ser progressiva, governada e sem regressão funcional, de dados, autenticação, autorização, Storage, Edge Functions ou integrações existentes.

## Regras obrigatórias

- Hostinger é o destino padrão de banco, serviços, APIs, autenticação, Storage e demais serviços de runtime do SPARKs.
- Novos componentes não devem criar dependência adicional do Supabase quando existir alternativa viável na arquitetura Hostinger.
- Fallback silencioso para Supabase é proibido quando a intenção operacional for Hostinger.
- Configurações, variáveis de ambiente e pipelines devem deixar explícito qual backend está sendo utilizado.
- Testes de desenvolvimento e homologação devem validar o caminho Hostinger de ponta a ponta.
- Dependências Supabase remanescentes devem ser identificáveis, documentadas e tratadas como dívida técnica de migração.
- Migrações devem preservar integridade, rastreabilidade, segurança, isolamento entre organizações e reversibilidade quando aplicável.
- Nenhuma remoção de dependência Supabase pode causar perda de dados ou quebra de funcionalidades já homologadas.

## Diretriz de implementação

Ao alterar qualquer fluxo existente, a ordem preferencial é:

1. verificar se o fluxo ainda usa Supabase direta ou indiretamente;
2. identificar o equivalente ou destino arquitetural na Hostinger;
3. migrar a dependência quando isso puder ser feito com segurança no mesmo ciclo;
4. manter compatibilidade transitória apenas quando necessária;
5. registrar a dependência remanescente e seu plano de retirada;
6. validar o fluxo contra a Hostinger antes de considerar a implementação concluída.

## Consequências

- A arquitetura passa a ter um único destino operacional preferencial.
- Reduz-se o risco de divergência entre ambientes e bancos.
- O código deverá ser progressivamente desacoplado do SDK, endpoints, Auth, Storage e Edge Functions do Supabase.
- Componentes legados podem coexistir temporariamente, mas não constituem precedente para novos desenvolvimentos.
- O backlog técnico deve priorizar a remoção de dependências Supabase sempre que houver oportunidade segura durante evoluções funcionais.

## Supersessão

Esta decisão substitui o ADR-001 — Uso do Supabase Web no Desenvolvimento, que passa a ter caráter exclusivamente histórico.

Em caso de conflito entre documentação anterior e esta decisão, prevalece o ADR-002.

`CANONICAL_RUNTIME_TARGET=HOSTINGER`

`SUPABASE_ROLE=LEGACY_TRANSITIONAL_DEPENDENCY`

`NEW_SUPABASE_DEPENDENCIES=PROHIBITED_WHEN_HOSTINGER_ALTERNATIVE_EXISTS`

`SILENT_FALLBACK_TO_SUPABASE=PROHIBITED`
