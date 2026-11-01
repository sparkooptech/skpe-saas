begin;

-- A Jornada nasce liderada por quem a inicia. A liderança continua editável
-- pela governança da Jornada, portanto a sugestão inicial não vira trava.
create or replace function public.skda_default_diagnosis_lead()
returns trigger
language plpgsql
security invoker
set search_path=''
as $function$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  if new.lead_user_id is null then
    new.lead_user_id := coalesce(new.created_by, auth.uid());
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_skda_default_diagnosis_lead on public.skda_diagnoses;
create trigger trg_skda_default_diagnosis_lead
before insert on public.skda_diagnoses
for each row execute function public.skda_default_diagnosis_lead();

-- Reconcilia Jornadas existentes sem líder com o usuário que efetivamente
-- iniciou o registro. Não altera Jornadas que já possuem liderança definida.
update public.skda_diagnoses
set lead_user_id=created_by,
    updated_at=timezone('utc',now())
where lead_user_id is null
  and created_by is not null
  and archived_at is null;

-- O score genérico permanece no esquema para modelos que realmente o utilizem,
-- mas o PDGC deve usar as alternativas canônicas do instrumento
-- (declared/evidenced/validated_alternative_id), sem conversão artificial.
comment on column public.skda_responses.score is
'Pontuação numérica opcional para modelos cuja escala oficial seja numérica. No PDGC, usar alternativas canônicas A-D; não converter A-D artificialmente para 0-100.';

commit;
