-- SK-DA
-- Enriquecimento governado da Gestão das Evidências - piloto CNTCOOP
-- Distingue confiabilidade documental de validação da prática.
begin;

-- Regra transversal: quando uma versão se torna efetivamente legível,
-- a fonte deixa de ser "não avaliada" no intake documental.
create or replace function public.sparks_classify_readable_evidence_source()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  provider_name text;
  external_origin_name text;
  inferred_reliability text;
begin
  if nullif(trim(coalesce(new.extracted_text,'')),'') is null then
    return new;
  end if;

  provider_name := lower(coalesce(new.metadata->>'provider',new.metadata->'source_locator'->>'provider',''));
  external_origin_name := lower(coalesce(new.metadata->>'external_origin',''));

  inferred_reliability := case
    when provider_name in ('sharepoint','google_drive','official','sistema_ocb')
      or external_origin_name like '%sharepoint%'
      or external_origin_name like '%sistema ocb%'
      or external_origin_name like '%sescoop%'
      then 'high'
    else 'moderate'
  end;

  update public.sparks_evidence_assets a
  set
    validation_status=case when a.validation_status='pending' then 'under_review' else a.validation_status end,
    reliability_level=case when a.reliability_level='not_assessed' then inferred_reliability else a.reliability_level end,
    metadata=a.metadata || jsonb_build_object(
      'document_integrity_status','readable',
      'source_reliability_basis','successful_text_extraction',
      'practice_validation_required',true,
      'evidence_governance_version','1.1'
    ),
    updated_at=timezone('utc',now())
  where a.id=new.evidence_asset_id;

  return new;
end;
$function$;

drop trigger if exists trg_sparks_classify_readable_evidence_source
on public.sparks_evidence_versions;

create trigger trg_sparks_classify_readable_evidence_source
after insert or update of extracted_text
on public.sparks_evidence_versions
for each row
execute function public.sparks_classify_readable_evidence_source();

with target_assets as (
  select id
  from public.sparks_evidence_assets
  where organization_id='bd58a170-b5ef-4150-9b69-026afa138661'::uuid
    and archived_at is null
    and (
      metadata->>'reconciliation'='CNTCOOP pilot'
      or metadata->>'tag' in ('OQS','RELACIONAMENTO','ARQUITETURA','PROCESSOS','POPS','INDICADORES')
      or title in (
        'POL-XXX - Política de Gestão do Quadro Social.docx',
        'POL-XXX - Política Gestão de Relacionamento.docx',
        'CNTCOOP 01.04 SPARKOOP - ANEXO A – ARQUITETURA ORGANIZACIONAL.docx',
        'CNTCOOP 01.05 SPARKOOP - ANEXO B – GESTÃO POR PROCESSOS.docx',
        'CNTCOOP 01.06 SPARKOOP - ANEXO C – PROCEDIMENTOS OPERACIONAIS PADRÃO.docx',
        'CNTCOOP 01.07 SPARKOOP - ANEXO D – INDICADORES E MONITORAMENTO.docx'
      )
    )
)
update public.sparks_evidence_assets a
set
  validation_status=case
    when a.validation_status='pending' then 'under_review'
    else a.validation_status
  end,
  reliability_level=case
    when a.reliability_level='not_assessed' then 'high'
    else a.reliability_level
  end,
  metadata=a.metadata || jsonb_build_object(
    'document_integrity_status','readable_and_versioned',
    'source_reliability_basis','controlled_sharepoint_repository_and_successful_content_ingestion',
    'source_reliability_scope','Confiabilidade da fonte documental; não equivale à comprovação de implantação ou efetividade da prática.',
    'practice_validation_required',true,
    'evidence_governance_version','1.1'
  ),
  updated_at=timezone('utc',now())
where a.id in (select id from target_assets);

with target_assets as (
  select id
  from public.sparks_evidence_assets
  where organization_id='bd58a170-b5ef-4150-9b69-026afa138661'::uuid
    and archived_at is null
    and (
      metadata->>'reconciliation'='CNTCOOP pilot'
      or metadata->>'tag' in ('OQS','RELACIONAMENTO','ARQUITETURA','PROCESSOS','POPS','INDICADORES')
      or title in (
        'POL-XXX - Política de Gestão do Quadro Social.docx',
        'POL-XXX - Política Gestão de Relacionamento.docx',
        'CNTCOOP 01.04 SPARKOOP - ANEXO A – ARQUITETURA ORGANIZACIONAL.docx',
        'CNTCOOP 01.05 SPARKOOP - ANEXO B – GESTÃO POR PROCESSOS.docx',
        'CNTCOOP 01.06 SPARKOOP - ANEXO C – PROCEDIMENTOS OPERACIONAIS PADRÃO.docx',
        'CNTCOOP 01.07 SPARKOOP - ANEXO D – INDICADORES E MONITORAMENTO.docx'
      )
    )
)
update public.skda_evidence_correlations c
set
  validation_status=case when c.validation_status='pending' then 'under_review' else c.validation_status end,
  analyst_interpretation=case
    when c.target_type='question'
      then 'Fonte documental íntegra, recente e pré-localizada na Autoavaliação. Aderência preliminar reconhecida; confirmar suficiência, implantação, recorrência e resultados no DA.'
    else 'Fonte documental íntegra e disponível no Core transversal. Utilizar como insumo de diagnóstico; a existência do artefato não comprova, por si só, a efetividade da prática.'
  end,
  metadata=c.metadata || jsonb_build_object(
    'source_integrity','confirmed',
    'coverage_assessment','preliminary',
    'practice_validation_required',true
  )
where c.diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'::uuid
  and c.evidence_asset_id in (select id from target_assets);

with target_assets as (
  select id
  from public.sparks_evidence_assets
  where organization_id='bd58a170-b5ef-4150-9b69-026afa138661'::uuid
    and archived_at is null
    and (
      metadata->>'reconciliation'='CNTCOOP pilot'
      or metadata->>'tag' in ('OQS','RELACIONAMENTO','ARQUITETURA','PROCESSOS','POPS','INDICADORES')
      or title in (
        'POL-XXX - Política de Gestão do Quadro Social.docx',
        'POL-XXX - Política Gestão de Relacionamento.docx',
        'CNTCOOP 01.04 SPARKOOP - ANEXO A – ARQUITETURA ORGANIZACIONAL.docx',
        'CNTCOOP 01.05 SPARKOOP - ANEXO B – GESTÃO POR PROCESSOS.docx',
        'CNTCOOP 01.06 SPARKOOP - ANEXO C – PROCEDIMENTOS OPERACIONAIS PADRÃO.docx',
        'CNTCOOP 01.07 SPARKOOP - ANEXO D – INDICADORES E MONITORAMENTO.docx'
      )
    )
)
update public.skda_evidence_question_intelligence i
set
  evidence_coverage_status=case
    when i.evidence_coverage_status='under_analysis' then 'partially_covers'
    else i.evidence_coverage_status
  end,
  relevance_score=coalesce(i.relevance_score,85),
  adequacy_score=coalesce(i.adequacy_score,65),
  sufficiency_score=coalesce(i.sufficiency_score,50),
  reliability_score=coalesce(i.reliability_score,85),
  actuality_score=coalesce(i.actuality_score,90),
  coverage_score=coalesce(i.coverage_score,60),
  confidence_score=greatest(coalesce(i.confidence_score,0),70),
  metadata=i.metadata || jsonb_build_object(
    'assessment_nature','system_estimate_pre_interview',
    'assessment_basis','document_read_plus_aa_prelocated_source',
    'source_integrity','confirmed',
    'source_reliability','high',
    'coverage_interpretation','Aderência preliminar parcial ao requisito; validar suficiência e maturidade da prática nas entrevistas.',
    'human_validation_required',true,
    'evidence_governance_version','1.1'
  ),
  updated_at=timezone('utc',now())
where i.diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724'::uuid
  and i.evidence_asset_id in (select id from target_assets)
  and i.analysis_status not in ('rejected');

commit;
