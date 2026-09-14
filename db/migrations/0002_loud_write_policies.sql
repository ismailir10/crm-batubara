-- 0002_loud_write_policies.sql
--
-- Problem found by tests/integration.test.ts:
--
-- The contract-side tables used a single `for all` policy whose USING clause
-- required the sales_manager or management role. For UPDATE, USING acts as a
-- row *filter*, so an unauthorised update matched no rows and returned
-- "UPDATE 0" — no error. The write was correctly prevented, but silently.
--
-- A silent no-op is the wrong failure mode: caller code that checks for an
-- exception sees success, and a future bug in the application-layer guard would
-- be invisible. Splitting the policy so UPDATE's USING admits the row and the
-- WITH CHECK rejects it makes the refusal raise 42501 instead.
--
-- SELECT policies are untouched; reads stay open to any authenticated user.

do $$
declare t text;
begin
  foreach t in array array['contracts','contract_delivery_stages','delivery_orders']
  loop
    execute format('drop policy if exists %I_write on %I', t, t);

    execute format(
      'create policy %I_insert on %I for insert
         with check (app_user_role() in (''sales_manager'',''management''))', t, t);

    -- USING admits the row so the refusal surfaces as an error, not a no-op.
    execute format(
      'create policy %I_update on %I for update
         using (app_user_id() is not null)
         with check (app_user_role() in (''sales_manager'',''management''))', t, t);

    execute format(
      'create policy %I_delete on %I for delete
         using (app_user_role() in (''sales_manager'',''management''))', t, t);
  end loop;
end $$;

-- Same treatment for the sales-side tables. All three roles may write them, so
-- there is no silent-refusal path today, but the shape should not differ between
-- tables for no reason.
do $$
declare t text;
begin
  foreach t in array array['prospects','opportunities','opportunity_status_history','meeting_notes']
  loop
    execute format('drop policy if exists %I_write on %I', t, t);

    execute format(
      'create policy %I_insert on %I for insert
         with check (app_user_role() in (''marketing'',''sales_manager'',''management''))', t, t);

    execute format(
      'create policy %I_update on %I for update
         using (app_user_id() is not null)
         with check (app_user_role() in (''marketing'',''sales_manager'',''management''))', t, t);

    execute format(
      'create policy %I_delete on %I for delete
         using (app_user_role() in (''marketing'',''sales_manager'',''management''))', t, t);
  end loop;
end $$;
