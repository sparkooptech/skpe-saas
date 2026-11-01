begin;

-- Reconciliação piloto CNTCOOP: documentos recentes já localizados no SharePoint
-- Entram no Core transversal, são vinculados ao SK-DA e geram apenas hipóteses propostas.
do $$
declare
  org_id constant uuid := 'bd58a170-b5ef-4150-9b69-026afa138661';
  diag_id constant uuid := '79f8b0dc-371e-4483-bfad-542cdbb37724';
  rec record;
  asset_id uuid;
  version_id uuid;
begin
  for rec in
    select * from (values
      (
        'sharepoint:01MCNQKFK3WZCWFBJ275A2M6IHDZ2F6AUM',
        'POL-XXX - Política de Gestão do Quadro Social.docx',
        'Política de Gestão do Quadro Social localizada no acervo da CNTCOOP; aprovação, vigência, implantação e efetividade a validar.',
        '2026-10-08'::date,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        555584::bigint,
        'https://sparkoop.sharepoint.com/Clientes e Projetos/Clientes Ativos/OCB-DF/06 PDGC - 2026/03-CNTCOOP/98-REFERENCIAS/POL-XXX - Política de Gestão do Quadro Social.docx?web=1',
        '01MCNQKFK3WZCWFBJ275A2M6IHDZ2F6AUM',
        'OQS',
        'A existência de uma política recente de Gestão do Quadro Social indica uma capacidade organizacional estruturada, cuja aprovação, implantação, recorrência, medição e efetividade precisam ser confirmadas.',
        'A Política de Gestão do Quadro Social já foi aprovada e comunicada? Quais práticas estão efetivamente em execução, com responsáveis, periodicidade, indicadores e resultados observáveis?'
      ),
      (
        'sharepoint:01MCNQKFM4BAFYRAIOF5B334A4PDBVCRXP',
        'POL-XXX - Política Gestão de Relacionamento.docx',
        'Política de Gestão de Relacionamento localizada na área de implantação da CNTCOOP; aprovação, vigência, execução e resultados a validar.',
        '2026-09-30'::date,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        537294::bigint,
        'https://sparkoop.sharepoint.com/Clientes e Projetos/Clientes Ativos/OCB-DF/06 PDGC - 2026/03-CNTCOOP/03-RELACIONAMENTO-COM-COOPERADOS/02-Produção/03 - IMPLANTAÇÃO/POL-XXX - Política Gestão de Relacionamento.docx?web=1',
        '01MCNQKFM4BAFYRAIOF5B334A4PDBVCRXP',
        'RELACIONAMENTO',
        'A política recente de Relacionamento sinaliza estruturação de uma capacidade, mas ainda é necessário confirmar institucionalização, execução consistente, tratamento das manifestações, uso das percepções e resultados.',
        'Quais dispositivos da Política de Relacionamento já estão em operação? Como necessidades, manifestações e satisfação retroalimentam processos, decisões e melhoria dos serviços?'
      ),
      (
        'sharepoint:01MCNQKFLOPVNQTAAL4JFK53CDGMBSTNSH',
        'CNTCOOP 01.04 SPARKOOP - ANEXO A – ARQUITETURA ORGANIZACIONAL.docx',
        'Arquitetura organizacional construída no projeto de Cadeia de Valor; adoção institucional e uso na gestão a validar.',
        '2026-06-12'::date,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        2205627::bigint,
        'https://sparkoop.sharepoint.com/Clientes e Projetos/Clientes Ativos/OCB-DF/06 PDGC - 2026/03-CNTCOOP/01-CADEIA-DE-VALOR/05-PC/CNTCOOP 01.04 SPARKOOP - ANEXO A – ARQUITETURA ORGANIZACIONAL.docx?web=1',
        '01MCNQKFLOPVNQTAAL4JFK53CDGMBSTNSH',
        'ARQUITETURA',
        'A arquitetura organizacional foi estruturada recentemente e pode representar avanço de capacidade; é necessário verificar se papéis, responsabilidades e interfaces estão institucionalizados e sendo utilizados.',
        'A arquitetura organizacional já é referência para papéis, responsabilidades e interfaces? Onde há evidências de aplicação prática e quais ajustes ainda estão pendentes?'
      ),
      (
        'sharepoint:01MCNQKFLHC2MLC4DNKFAKSOAW5ZZLM6V2',
        'CNTCOOP 01.05 SPARKOOP - ANEXO B – GESTÃO POR PROCESSOS.docx',
        'Modelo de Gestão por Processos construído no projeto de Cadeia de Valor; implantação, governança e medição dos processos a validar.',
        '2026-06-12'::date,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        954987::bigint,
        'https://sparkoop.sharepoint.com/Clientes e Projetos/Clientes Ativos/OCB-DF/06 PDGC - 2026/03-CNTCOOP/01-CADEIA-DE-VALOR/05-PC/CNTCOOP 01.05 SPARKOOP - ANEXO B – GESTÃO POR PROCESSOS.docx?web=1',
        '01MCNQKFLHC2MLC4DNKFAKSOAW5ZZLM6V2',
        'PROCESSOS',
        'A Gestão por Processos foi desenhada recentemente, mas o DA precisa confirmar quais processos estão implantados, possuem responsáveis, padrões, controles, indicadores, ciclos de melhoria e resultados.',
        'Quais processos mapeados já estão efetivamente implantados? Quem responde por eles, quais indicadores são acompanhados e que melhorias ou resultados já podem ser demonstrados?'
      ),
      (
        'sharepoint:01MCNQKFJWI7JT6IYMDFFIR4YDLIXR3FR4',
        'CNTCOOP 01.06 SPARKOOP - ANEXO C – PROCEDIMENTOS OPERACIONAIS PADRÃO.docx',
        'Conjunto de procedimentos operacionais padrão produzido no projeto; utilização recorrente e registros de execução a validar.',
        '2026-06-12'::date,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        222051::bigint,
        'https://sparkoop.sharepoint.com/Clientes e Projetos/Clientes Ativos/OCB-DF/06 PDGC - 2026/03-CNTCOOP/01-CADEIA-DE-VALOR/05-PC/CNTCOOP 01.06 SPARKOOP - ANEXO C – PROCEDIMENTOS OPERACIONAIS PADRÃO.docx?web=1',
        '01MCNQKFJWI7JT6IYMDFFIR4YDLIXR3FR4',
        'POPS',
        'A existência de POPs recentes demonstra estruturação de padrões, mas a maturidade depende de utilização recorrente, registros, controle de versão, aderência e melhoria.',
        'Quais POPs já estão em uso rotineiro? Há registros de execução, responsáveis, controle de versão, verificação de aderência e revisão decorrente de problemas ou aprendizado?'
      ),
      (
        'sharepoint:01MCNQKFM5N2QO7HVH7JFKNS6CBUQ3P37L',
        'CNTCOOP 01.07 SPARKOOP - ANEXO D – INDICADORES E MONITORAMENTO.docx',
        'Estrutura de indicadores e monitoramento produzida no projeto; baselines, metas, periodicidade, uso decisório e resultados a validar.',
        '2026-06-16'::date,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        1264770::bigint,
        'https://sparkoop.sharepoint.com/Clientes e Projetos/Clientes Ativos/OCB-DF/06 PDGC - 2026/03-CNTCOOP/01-CADEIA-DE-VALOR/05-PC/CNTCOOP 01.07 SPARKOOP - ANEXO D – INDICADORES E MONITORAMENTO.docx?web=1',
        '01MCNQKFM5N2QO7HVH7JFKNS6CBUQ3P37L',
        'INDICADORES',
        'A estrutura de indicadores foi construída, mas o DA precisa confirmar indicadores ativos, baselines, metas, frequência, responsáveis, análise crítica e decisões decorrentes.',
        'Quais indicadores desta estrutura já estão ativos? Quais possuem baseline, meta, periodicidade, responsável, histórico e evidência de decisões tomadas a partir dos resultados?'
      )
    ) as t(external_key,title,description,reference_date,mime_type,file_size,web_url,item_id,tag,hypothesis,interview_prompt)
  loop
    select id into asset_id
    from public.sparks_evidence_assets
    where organization_id=org_id and source_external_key=rec.external_key and archived_at is null
    limit 1;

    if asset_id is null then
      insert into public.sparks_evidence_assets(
        organization_id,title,description,evidence_type,source_type,origin_module_code,external_origin,
        reference_date,confidentiality_level,validation_status,reliability_level,source_locator,
        source_external_key,metadata
      ) values (
        org_id,rec.title,rec.description,'document','external',null,'SharePoint SPARKOOP',
        rec.reference_date,'internal','pending','not_assessed',
        jsonb_build_object('provider','sharepoint','web_url',rec.web_url,'item_id',rec.item_id),
        rec.external_key,
        jsonb_build_object('reconciliation','CNTCOOP pilot','tag',rec.tag,'human_validation_required',true)
      ) returning id into asset_id;

      insert into public.sparks_evidence_versions(
        evidence_asset_id,version_number,version_label,file_name,mime_type,file_size_bytes,
        change_summary,metadata
      ) values (
        asset_id,1,'sharepoint-current',rec.title,rec.mime_type,rec.file_size,
        'Reconciliação do ativo localizado no SharePoint com o Core transversal de Evidências.',
        jsonb_build_object('source_external_key',rec.external_key,'web_url',rec.web_url,'item_id',rec.item_id)
      ) returning id into version_id;

      update public.sparks_evidence_assets set current_version_id=version_id where id=asset_id;
    end if;

    insert into public.skda_evidence_correlations(
      organization_id,diagnosis_id,evidence_asset_id,target_type,target_id,usage_type,relevance_level,
      analyst_interpretation,validation_status,metadata
    ) values (
      org_id,diag_id,asset_id,'diagnosis',diag_id,'context','important',
      'Ativo recente da CNTCOOP reconciliado ao DA como fonte transversal. Sua existência não comprova implantação nem efetividade.',
      'pending',jsonb_build_object('origin','sharepoint_reconciliation','tag',rec.tag)
    )
    on conflict (diagnosis_id,evidence_asset_id,target_type,target_id) do nothing;

    insert into public.sparks_evidence_links(
      organization_id,evidence_asset_id,module_code,target_type,target_id,usage_purpose,
      usage_status,relevance_level,is_primary,notes,metadata
    ) values (
      org_id,asset_id,'SK-DA','diagnosis',diag_id,
      'Inteligência organizacional e preparação das entrevistas do Diagnóstico Assistido.',
      'active','important',false,
      'Ativo transversal: pertence à Organização; o SK-DA apenas o consome.',
      jsonb_build_object('origin','sharepoint_reconciliation','tag',rec.tag)
    )
    on conflict (evidence_asset_id,module_code,target_type,target_id) do nothing;

    -- Liga às questões em que a própria AA importada já havia pré-localizado esta fonte.
    insert into public.skda_evidence_correlations(
      organization_id,diagnosis_id,evidence_asset_id,target_type,target_id,usage_type,relevance_level,
      analyst_interpretation,validation_status,metadata
    )
    select
      org_id,diag_id,asset_id,'question',a.question_id,'context','important',
      'Fonte pré-localizada na AA 2026 e reconciliada ao Core; cobertura e suficiência precisam de validação pelo DA.',
      'pending',jsonb_build_object('origin','aa_prelocated_source','tag',rec.tag)
    from public.skda_self_assessment_answers a
    join public.skda_self_assessment_snapshots s on s.id=a.snapshot_id and s.diagnosis_id=diag_id
    where (
      coalesce(a.metadata->>'prelocated_sources','') ilike '%'||rec.title||'%'
      or (rec.tag='OQS' and coalesce(a.metadata->>'prelocated_sources','') ilike '%Quadro Social%')
      or (rec.tag='RELACIONAMENTO' and coalesce(a.metadata->>'prelocated_sources','') ilike '%Relacionamento%')
      or (rec.tag='ARQUITETURA' and coalesce(a.metadata->>'prelocated_sources','') ilike '%ARQUITETURA ORGANIZACIONAL%')
      or (rec.tag='PROCESSOS' and coalesce(a.metadata->>'prelocated_sources','') ilike '%GESTÃO POR PROCESSOS%')
      or (rec.tag='POPS' and coalesce(a.metadata->>'prelocated_sources','') ilike '%PROCEDIMENTOS OPERACIONAIS PADRÃO%')
      or (rec.tag='INDICADORES' and coalesce(a.metadata->>'prelocated_sources','') ilike '%INDICADORES E MONITORAMENTO%')
    )
    on conflict (diagnosis_id,evidence_asset_id,target_type,target_id) do nothing;

    insert into public.skda_evidence_question_intelligence(
      organization_id,diagnosis_id,evidence_asset_id,question_id,correlation_id,
      document_intake_status,evidence_coverage_status,practice_state,analysis_mode,analysis_status,
      diagnostic_hypothesis,interview_question_suggestion,complement_needed,improvement_suggestion,
      confidence_score,engine_name,engine_version,metadata
    )
    select
      org_id,diag_id,asset_id,c.target_id,c.id,
      'available','under_analysis','exists','assisted','proposed',
      rec.hypothesis,rec.interview_prompt,
      'Confirmar aprovação/vigência quando aplicável, implantação, recorrência, responsáveis, indicadores, registros e resultados.',
      'Usar a entrevista para distinguir artefato produzido de prática institucionalizada e efetiva.',
      65,'SPARKs-DA-Reconciliation','1.0',
      jsonb_build_object(
        'origin','aa_prelocated_source',
        'tag',rec.tag,
        'human_validation_required',true,
        'do_not_treat_as_finding_before_validation',true
      )
    from public.skda_evidence_correlations c
    where c.diagnosis_id=diag_id and c.evidence_asset_id=asset_id and c.target_type='question'
    on conflict (diagnosis_id,evidence_asset_id,question_id)
    do update set
      correlation_id=excluded.correlation_id,
      document_intake_status='available',
      analysis_status=case when public.skda_evidence_question_intelligence.analysis_status in ('validated','rejected') then public.skda_evidence_question_intelligence.analysis_status else 'proposed' end,
      diagnostic_hypothesis=coalesce(public.skda_evidence_question_intelligence.diagnostic_hypothesis,excluded.diagnostic_hypothesis),
      interview_question_suggestion=coalesce(public.skda_evidence_question_intelligence.interview_question_suggestion,excluded.interview_question_suggestion),
      complement_needed=coalesce(public.skda_evidence_question_intelligence.complement_needed,excluded.complement_needed),
      improvement_suggestion=coalesce(public.skda_evidence_question_intelligence.improvement_suggestion,excluded.improvement_suggestion),
      metadata=public.skda_evidence_question_intelligence.metadata || excluded.metadata,
      updated_at=timezone('utc',now());
  end loop;
end $$;

commit;
