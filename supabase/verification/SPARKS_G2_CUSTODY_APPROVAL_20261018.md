# G2 | Aprovacao de custodia e contingencia - 2026-10-18 22:25Z

## Decisao expressa do usuario
Aprovadas as diretrizes propostas: retencao de 30 dias; preferencia por chave privada de recuperacao e segunda copia do backup cifrado fora da Hostinger; caso inviavel, custodia e copia temporarias na propria VPS Hostinger. Sem custo adicional, sem interrupcao de servicos. A autorizacao de contingencia NAO constitui prova de redundancia geografica nem elimina risco de perda simultanea.

## Ordem obrigatoria
1. Buscar destino externo sob controle do usuario e confirmar disponibilidade, cifragem e recuperacao, sem criar servicos pagos.
2. Se inviavel, registrar contingencia Hostinger-only, riscos e plano de saida. Chave operacional deve ser protegida por controle de acesso restrito e passphrase recuperavel, sem senha em codigo, git ou logs. Uma copia na mesma VPS nao substitui backup offsite.
3. Revalidar autenticacao Supabase no exato processo que fara exportacao. A CLI retornou Invalid access token em 22:26Z; nao iniciar exportacao enquanto instavel.
4. Confirmar ferramenta e metodo consistente de extracao para public/auth/storage, incluindo 15 objetos fisicos privados; nao presumir que o dump padrao inclui todos os dados Auth/Storage.
5. Validar capacidade e isolamento; preservar integralmente sparks_homol, sparks_prd, demais bancos e containers.
6. Exportar cifrando antes de gravar em disco; verificar integridade e restaurar em destino isolado. Registrar evidencia e divergencias. Nao confundir snapshot do banco com copia fisica de objetos.
7. Nao realizar cutover, deploy, push Git ou mudanca de producao sem nova aprovacao.

## Status deste registro
Autorizacao: SIM. Custodia externa: ainda nao comprovada. Contingencia na VPS: autorizada, nao implementada. CLI autenticada no processo remoto: NAO (Invalid access token). Backup real: NAO. Restore real: NAO. Sem alteracoes nos bancos e servicos.
