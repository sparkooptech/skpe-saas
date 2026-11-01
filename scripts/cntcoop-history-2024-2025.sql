begin;
set local lock_timeout = '10s';
do $guard$
begin
 if not exists(select 1 from public.skda_diagnoses where id='79f8b0dc-371e-4483-bfad-542cdbb37724' and organization_id='bd58a170-b5ef-4150-9b69-026afa138661' and reference_year=2026) then
 raise exception 'CNTCOOP 2026 journey missing'; end if;
end $guard$;
insert into public.skda_self_assessment_metrics
(organization_id,diagnosis_id,block_code,metric_kind,metric_code,metric_name,reference_year,
 comparator_code,metric_value,unit,source_label,source_reference,confidence_level,metadata)
values
('bd58a170-b5ef-4150-9b69-026afa138661','79f8b0dc-371e-4483-bfad-542cdbb37724','GOVERNANCA','history','ISGC','ISGC histórico reportado',2024,'COOPERATIVA',38.8,'percent','CNTCOOP-Diagnostico-Assistido-Governança-2024 .pdf','https://graph.microsoft.com/v1.0/drives/b!uzwN8wgDDEKA-gE9i0pV7QdtlBZO5I1CqI5a5Tbgf0Yw64svG0toS5JzLOdWgOyC/items/01MCNQKFLJFKIQAY74XVD2XDZ4RWAQA6SD','high','{"source_kind":"DA_reported","comparability":"not_yet_validated","origin":"official CNTCOOP source PDF"}'::jsonb),
('bd58a170-b5ef-4150-9b69-026afa138661','79f8b0dc-371e-4483-bfad-542cdbb37724','GESTAO','history','ISG','ISG histórico reportado',2024,'COOPERATIVA',58.01,'percent','CNTCOOP-Diagnostico-Assistido-Gestão-2024 .pdf','https://graph.microsoft.com/v1.0/drives/b!uzwN8wgDDEKA-gE9i0pV7QdtlBZO5I1CqI5a5Tbgf0Yw64svG0toS5JzLOdWgOyC/items/01MCNQKFMURY5GSTCLX5G3HQU6UUR2I62P','high','{"source_kind":"DA_reported","comparability":"not_yet_validated","origin":"official CNTCOOP source PDF"}'::jsonb),
('bd58a170-b5ef-4150-9b69-026afa138661','79f8b0dc-371e-4483-bfad-542cdbb37724','GOVERNANCA','history','ISGC','ISGC histórico reportado',2025,'COOPERATIVA',62.85,'percent','CNTCOOP-PDGC-Relatório-AutoAvaliação-Governança-Ciclo-2025.pdf','https://graph.microsoft.com/v1.0/drives/b!uzwN8wgDDEKA-gE9i0pV7QdtlBZO5I1CqI5a5Tbgf0Yw64svG0toS5JzLOdWgOyC/items/01MCNQKFIH6VIJFT6AMRAKHQQRUROTWZ5S','high','{"source_kind":"AA_reported","comparability":"not_yet_validated","origin":"official CNTCOOP source PDF"}'::jsonb),
('bd58a170-b5ef-4150-9b69-026afa138661','79f8b0dc-371e-4483-bfad-542cdbb37724','GESTAO','history','ISG','ISG histórico reportado',2025,'COOPERATIVA',65.99,'percent','CNTCOOP-Relatório-Gestão2025.pdf','https://graph.microsoft.com/v1.0/drives/b!uzwN8wgDDEKA-gE9i0pV7QdtlBZO5I1CqI5a5Tbgf0Yw64svG0toS5JzLOdWgOyC/items/01MCNQKFK5BLKIPDH6WVB24I6NPB3JNZ4Q','high','{"source_kind":"AA_reported","comparability":"not_yet_validated","origin":"official CNTCOOP source PDF"}'::jsonb)
on conflict (diagnosis_id,block_code,metric_kind,metric_code,reference_year,comparator_code) do nothing;
do $verify$
declare n integer;
begin
 select count(*) into n from public.skda_self_assessment_metrics where diagnosis_id='79f8b0dc-371e-4483-bfad-542cdbb37724' and metric_kind='history' and reference_year in (2024,2025);
 if n < 4 then raise exception 'Expected 4 reported history indices, found %',n; end if;
 raise notice 'CNTCOOP history imported: 2024 ISGC 38.8 ISG 58.01; 2025 ISGC 62.85 ISG 65.99; cross-cycle comparability pending';
end $verify$;
commit;
