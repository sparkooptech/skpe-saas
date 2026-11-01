begin;

insert into public.sparks_methodology_artifact_types (
  module_code,artifact_type_code,artifact_type_name,category,description,
  supports_text_content,supports_file_upload,requires_versioning,requires_validation,
  export_folder,active,sort_order,metadata
) values
  ('SK-DA','SKDA_DELIVERABLE','Entregável da Jornada DA','management_instrument',
   'Artefato produzido por uma MegaFase da Jornada de Diagnóstico Assistido.',
   true,true,true,true,'sk-da/entregaveis',true,10,
   '{"state_model":["TEMPLATE_SPARKOOP","ADAPTADO","EM_VALIDACAO","VALIDADO","APROVADO","INSTITUCIONALIZADO","EM_EXECUCAO","EVIDENCIADO","AVALIADO"]}'::jsonb),
  ('SK-DA','SKDA_VALIDATION','Artefato de validação DA','validation',
   'Registro de decisão, validação ou gate metodológico da Jornada DA.',
   true,true,true,true,'sk-da/validacoes',true,20,'{}'::jsonb),
  ('SK-DA','SKDA_EVIDENCE_PACKAGE','Pacote de evidências DA','evidence',
   'Conjunto estruturado de fontes e evidências associado a uma MegaFase do DA.',
   true,true,true,true,'sk-da/evidencias',true,30,'{}'::jsonb)
on conflict (module_code,artifact_type_code) do update set
  artifact_type_name=excluded.artifact_type_name,
  category=excluded.category,
  description=excluded.description,
  active=true,
  metadata=public.sparks_methodology_artifact_types.metadata || excluded.metadata,
  updated_at=now();

create or replace function public.ensure_skda_journey_detail(target_diagnosis_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  diagnosis_row public.skda_diagnoses%rowtype;
  stage_row record;
  artifact_row record;
  parent_id uuid;
  stage_id uuid;
  artifact_type_id uuid;
begin
  select *
    into diagnosis_row
  from public.skda_diagnoses
  where id=target_diagnosis_id
    and archived_at is null;

  if diagnosis_row.id is null or diagnosis_row.execution_initiative_id is null then
    return;
  end if;

  for stage_row in
    select *
    from (
      values
      ('MF0','MF0-E1','Preparar abertura e governança',
       '["Confirmar autorização e escopo","Identificar interlocutores e papéis","Registrar premissas e restrições"]'::jsonb,1),
      ('MF0','MF0-E2','Realizar kickoff e validar abertura',
       '["Conduzir kickoff","Validar escopo e papéis","Registrar decisões de abertura"]'::jsonb,2),

      ('MF1','MF1-E1','Receber e inventariar fontes',
       '["Receber Autoavaliações e documentos","Classificar disponibilidade e qualidade","Registrar lacunas documentais"]'::jsonb,1),
      ('MF1','MF1-E2','Estruturar dossier de entrada',
       '["Consolidar fatos conhecidos","Registrar fonte, data e confiabilidade","Definir próxima ação para reduzir incerteza"]'::jsonb,2),

      ('MF2','MF2-E1','Classificar autoridade documental',
       '["Identificar versões vigentes","Distinguir fonte oficial de material de apoio","Registrar conflitos e desatualizações"]'::jsonb,1),
      ('MF2','MF2-E2','Relacionar questão e evidência',
       '["Mapear evidências por requisito","Avaliar suficiência inicial","Registrar pendências de comprovação"]'::jsonb,2),

      ('MF3','MF3-E1','Construir linha histórica',
       '["Recuperar ciclos anteriores","Comparar respostas e resultados","Identificar recorrências e mudanças"]'::jsonb,1),
      ('MF3','MF3-E2','Preparar pré-diagnóstico',
       '["Formular hipóteses","Priorizar pontos a aprofundar","Preparar roteiro de entrevistas"]'::jsonb,2),

      ('MF4','MF4-E1','Planejar entrevistas de Governança',
       '["Definir participantes","Organizar agenda e roteiro","Selecionar hipóteses de Governança"]'::jsonb,1),
      ('MF4','MF4-E2','Executar e consolidar entrevistas',
       '["Registrar falas relevantes","Capturar evidências citadas","Atualizar hipóteses e lacunas"]'::jsonb,2),

      ('MF5','MF5-E1','Planejar entrevistas de Gestão',
       '["Definir participantes","Organizar agenda e roteiro","Selecionar hipóteses de Gestão"]'::jsonb,1),
      ('MF5','MF5-E2','Executar e consolidar entrevistas',
       '["Registrar falas relevantes","Capturar evidências citadas","Atualizar hipóteses e lacunas"]'::jsonb,2),

      ('MF6','MF6-E1','Avaliar evidências e prática gerencial',
       '["Avaliar existência e institucionalização","Avaliar execução, continuidade e abrangência","Confrontar declarado e evidenciado"]'::jsonb,1),
      ('MF6','MF6-E2','Avaliar PDCL e maturidade',
       '["Classificar estágio PDCL","Estimar maturidade observada","Registrar confiança e limitações"]'::jsonb,2),

      ('MF7','MF7-E1','Consolidar diagnóstico',
       '["Integrar fatos e evidências","Consolidar forças, lacunas, riscos e oportunidades","Resolver divergências relevantes"]'::jsonb,1),
      ('MF7','MF7-E2','Preparar leitura executiva',
       '["Sintetizar causas e efeitos","Relacionar capacidades organizacionais","Preparar mensagens executivas"]'::jsonb,2),

      ('MF8','MF8-E1','Priorizar oportunidades',
       '["Aplicar criticidade e impacto","Avaliar esforço e dependências","Selecionar foco 80/20"]'::jsonb,1),
      ('MF8','MF8-E2','Estimar impacto potencial',
       '["Relacionar requisitos impactados","Estimar impacto potencial sem prometer pontuação","Registrar condições e confiança"]'::jsonb,2),

      ('MF9','MF9-E1','Estruturar ações por ciclos',
       '["Definir ações prioritárias","Distribuir Ciclos 1, 2 e 3","Vincular fato gerador e responsáveis"]'::jsonb,1),
      ('MF9','MF9-E2','Pactuar execução e acompanhamento',
       '["Definir prazos e indicadores","Associar iniciativas táticas","Definir governança de follow-up"]'::jsonb,2),

      ('MF10','MF10-E1','Preparar devolutiva executiva',
       '["Consolidar narrativa de evolução","Preparar artefatos de decisão","Registrar pontos para validação"]'::jsonb,1),
      ('MF10','MF10-E2','Validar e integrar próximos passos',
       '["Realizar devolutiva","Registrar decisões e ressalvas","Integrar ações aos módulos SPARKs"]'::jsonb,2)
    ) as x(parent_code,code,name,activities,display_order)
  loop
    select a.id into parent_id
    from public.sparks_initiative_actions a
    where a.initiative_id=diagnosis_row.execution_initiative_id
      and a.code=stage_row.parent_code
      and a.archived_at is null
    limit 1;

    if parent_id is null then
      continue;
    end if;

    insert into public.sparks_initiative_actions (
      organization_id,initiative_id,parent_action_id,code,name,description,action_type,
      source_module_code,source_reference,how_text,started_at,status,priority,progress,
      metadata,created_by,updated_by
    ) values (
      diagnosis_row.organization_id,
      diagnosis_row.execution_initiative_id,
      parent_id,
      stage_row.code,
      stage_row.name,
      'Etapa operacional da Jornada DA.',
      'action',
      'SK-DA',
      'skda_diagnosis:'||diagnosis_row.id::text||':'||stage_row.code,
      'Executar as atividades previstas preservando evidências, decisões e rastreabilidade.',
      case
        when diagnosis_row.current_megaphase_code=stage_row.parent_code and stage_row.display_order=1 then timezone('utc',now())
        else null
      end,
      case
        when diagnosis_row.current_megaphase_code=stage_row.parent_code and stage_row.display_order=1 then 'in_progress'
        else 'planned'
      end,
      case when diagnosis_row.current_megaphase_code=stage_row.parent_code then 'high' else 'medium' end,
      0,
      jsonb_build_object(
        'execution_structure','skda_stage',
        'diagnosis_id',diagnosis_row.id,
        'parent_megaphase_code',stage_row.parent_code,
        'display_order',stage_row.display_order,
        'activities',stage_row.activities
      ),
      coalesce(auth.uid(),diagnosis_row.created_by),
      coalesce(auth.uid(),diagnosis_row.updated_by,diagnosis_row.created_by)
    )
    on conflict (initiative_id,code) do update set
      parent_action_id=excluded.parent_action_id,
      name=excluded.name,
      description=excluded.description,
      metadata=public.sparks_initiative_actions.metadata || excluded.metadata,
      updated_at=timezone('utc',now())
    returning id into stage_id;

    if diagnosis_row.current_megaphase_code=stage_row.parent_code and stage_row.display_order=1 then
      update public.sparks_initiative_actions
      set started_at=coalesce(started_at,timezone('utc',now()))
      where id=stage_id and status='in_progress';
    end if;
  end loop;

  for artifact_row in
    select *
    from (
      values
      ('MF0','SKDA_VALIDATION','MF0-A01','Termo de abertura da Jornada','Formalizar autorização, escopo, papéis e premissas.','gate'),
      ('MF0','SKDA_DELIVERABLE','MF0-A02','Mapa de governança da Jornada','Registrar interlocutores, responsabilidades e governança do trabalho.','output'),
      ('MF0','SKDA_VALIDATION','MF0-A03','Registro de kickoff e decisões','Preservar decisões, ressalvas e próximos passos do kickoff.','output'),

      ('MF1','SKDA_DELIVERABLE','MF1-A01','Dossiê de entrada','Consolidar fatos conhecidos, fontes, confiabilidade, lacunas e próxima ação.','output'),
      ('MF1','SKDA_EVIDENCE_PACKAGE','MF1-A02','Inventário de fontes e evidências','Inventariar fontes disponíveis, ausentes, desatualizadas e a validar.','output'),
      ('MF1','SKDA_DELIVERABLE','MF1-A03','Mapa de lacunas documentais','Evidenciar o que falta e o impacto de cada lacuna.','output'),

      ('MF2','SKDA_DELIVERABLE','MF2-A01','Matriz de autoridade documental','Classificar fontes por autoridade, versão e vigência.','output'),
      ('MF2','SKDA_EVIDENCE_PACKAGE','MF2-A02','Matriz questão × evidência','Relacionar requisitos, questões, evidências e status de comprovação.','output'),
      ('MF2','SKDA_DELIVERABLE','MF2-A03','Registro de pendências de comprovação','Organizar pendências e próxima melhor evidência.','output'),

      ('MF3','SKDA_DELIVERABLE','MF3-A01','Linha histórica de maturidade','Consolidar ciclos anteriores, resultados, mudanças e recorrências.','output'),
      ('MF3','SKDA_DELIVERABLE','MF3-A02','Matriz de hipóteses e evidências','Registrar hipóteses, sinais, fontes e confiança.','output'),
      ('MF3','SKDA_DELIVERABLE','MF3-A03','Roteiro de aprofundamento','Preparar temas, perguntas e públicos das entrevistas.','output'),

      ('MF4','SKDA_DELIVERABLE','MF4-A01','Roteiro de entrevistas de Governança','Orientar a escuta por hipóteses e lacunas de Governança.','input_output'),
      ('MF4','SKDA_EVIDENCE_PACKAGE','MF4-A02','Registros de entrevistas de Governança','Preservar falas, evidências citadas e confirmações.','output'),
      ('MF4','SKDA_DELIVERABLE','MF4-A03','Mapa de questões a validar em Governança','Consolidar pontos que ainda exigem comprovação.','output'),

      ('MF5','SKDA_DELIVERABLE','MF5-A01','Roteiro de entrevistas de Gestão','Orientar a escuta por hipóteses e lacunas de Gestão.','input_output'),
      ('MF5','SKDA_EVIDENCE_PACKAGE','MF5-A02','Registros de entrevistas de Gestão','Preservar falas, evidências citadas e confirmações.','output'),
      ('MF5','SKDA_DELIVERABLE','MF5-A03','Mapa de questões a validar em Gestão','Consolidar pontos que ainda exigem comprovação.','output'),

      ('MF6','SKDA_EVIDENCE_PACKAGE','MF6-A01','Matriz de suficiência das evidências','Avaliar qualidade, confiabilidade, abrangência e continuidade.','output'),
      ('MF6','SKDA_DELIVERABLE','MF6-A02','Matriz de práticas e padrões de trabalho','Registrar prática, institucionalização, execução e aprendizado.','output'),
      ('MF6','SKDA_DELIVERABLE','MF6-A03','Matriz PDCL e maturidade evidenciada','Consolidar PDCL, maturidade, confiança e limitações.','output'),

      ('MF7','SKDA_DELIVERABLE','MF7-A01','Diagnóstico integrado','Consolidar fatos, evidências, divergências e leitura organizacional.','output'),
      ('MF7','SKDA_DELIVERABLE','MF7-A02','Mapa de forças, lacunas, riscos e oportunidades','Apresentar achados classificados e rastreáveis.','output'),
      ('MF7','SKDA_DELIVERABLE','MF7-A03','Mapa de capacidades organizacionais','Relacionar achados às capacidades que precisam existir e funcionar.','output'),

      ('MF8','SKDA_DELIVERABLE','MF8-A01','Matriz de priorização 80/20','Priorizar ações por impacto, criticidade, esforço, dependências e capacidade de execução.','output'),
      ('MF8','SKDA_DELIVERABLE','MF8-A02','Mapa de impacto PDGC','Relacionar ações, requisitos e impacto potencial estimado.','output'),
      ('MF8','SKDA_VALIDATION','MF8-A03','Registro de priorização validada','Preservar decisões, critérios e eventuais antecipações deliberadas.','gate'),

      ('MF9','SKDA_DELIVERABLE','MF9-A01','Plano de Ação por ciclos','Organizar ações aprovadas nos Ciclos 1, 2 e 3.','output'),
      ('MF9','SKDA_DELIVERABLE','MF9-A02','Matriz de responsáveis, prazos e indicadores','Definir governança e mensuração da execução.','output'),
      ('MF9','SKDA_DELIVERABLE','MF9-A03','Mapa de fatos geradores e iniciativas','Preservar origem e integração com a Gestão Tática.','output'),

      ('MF10','SKDA_DELIVERABLE','MF10-A01','Devolutiva executiva','Comunicar diagnóstico, evolução, prioridades e próximos passos.','output'),
      ('MF10','SKDA_VALIDATION','MF10-A02','Registro de decisões e validações','Preservar deliberações, ressalvas e aprovações.','gate'),
      ('MF10','SKDA_DELIVERABLE','MF10-A03','Plano de integração e continuidade','Integrar ações aos módulos SPARKs e ao próximo ciclo.','output')
    ) as a(macrophase_code,type_code,artifact_code,title,purpose,artifact_role)
  loop
    select id into artifact_type_id
    from public.sparks_methodology_artifact_types
    where module_code='SK-DA'
      and artifact_type_code=artifact_row.type_code
      and active
    limit 1;

    if artifact_type_id is null then
      continue;
    end if;

    insert into public.sparks_methodology_artifacts (
      organization_id,project_id,module_code,artifact_type_id,artifact_code,title,purpose,
      macrophase_code,status,confidentiality_level,responsible_user_id,current_version_number,
      planned_due_date,source,metadata,created_by,updated_by
    ) values (
      diagnosis_row.organization_id,
      diagnosis_row.execution_initiative_id,
      'SK-DA',
      artifact_type_id,
      artifact_row.artifact_code,
      artifact_row.title,
      artifact_row.purpose,
      artifact_row.macrophase_code,
      'planned',
      1,
      diagnosis_row.lead_user_id,
      0,
      (
        select planned_due_date
        from public.sparks_initiative_actions
        where initiative_id=diagnosis_row.execution_initiative_id
          and code=artifact_row.macrophase_code
        limit 1
      ),
      'SPARKs SaaS',
      jsonb_build_object(
        'diagnosis_id',diagnosis_row.id,
        'diagnosis_code',diagnosis_row.code,
        'artifact_role',artifact_row.artifact_role,
        'state_model','TEMPLATE_SPARKOOP -> ADAPTADO -> EM_VALIDACAO -> VALIDADO -> APROVADO -> INSTITUCIONALIZADO -> EM_EXECUCAO -> EVIDENCIADO -> AVALIADO'
      ),
      coalesce(auth.uid(),diagnosis_row.created_by),
      coalesce(auth.uid(),diagnosis_row.updated_by,diagnosis_row.created_by)
    )
    on conflict (organization_id,project_id,artifact_code) do update set
      title=excluded.title,
      purpose=excluded.purpose,
      artifact_type_id=excluded.artifact_type_id,
      macrophase_code=excluded.macrophase_code,
      responsible_user_id=coalesce(public.sparks_methodology_artifacts.responsible_user_id,excluded.responsible_user_id),
      planned_due_date=coalesce(public.sparks_methodology_artifacts.planned_due_date,excluded.planned_due_date),
      metadata=public.sparks_methodology_artifacts.metadata || excluded.metadata,
      updated_at=now();
  end loop;
end;
$function$;

revoke all on function public.ensure_skda_journey_detail(uuid) from public,anon,authenticated;
grant execute on function public.ensure_skda_journey_detail(uuid) to service_role;

create or replace function public.sync_skda_journey_eap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.execution_initiative_id is not null then
    perform public.ensure_skda_journey_eap(new.id);
    perform public.ensure_skda_journey_detail(new.id);
  end if;
  return new;
end;
$function$;

select public.ensure_skda_journey_detail(id)
from public.skda_diagnoses
where archived_at is null
  and execution_initiative_id is not null;

commit;
