-- SelloGo · auditoría de permisos (SOLO LECTURA)
-- Ejecutar únicamente en el proyecto Supabase de SelloGo.
-- No altera tablas, registros, roles ni políticas.

-- 1. RLS habilitado en tablas de negocio
select n.nspname as esquema, c.relname as tabla,
       c.relrowsecurity as rls_habilitado,
       c.relforcerowsecurity as rls_forzado
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
order by c.relname;

-- 2. Políticas existentes
select schemaname, tablename, policyname, permissive, roles, cmd,
       qual as condicion_lectura, with_check as condicion_escritura
from pg_policies
where schemaname='public'
order by tablename, policyname;

-- 3. Permisos EXECUTE de RPC públicas para roles de navegador
select n.nspname as esquema, p.proname as funcion,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       p.prosecdef as security_definer,
       has_function_privilege('anon',p.oid,'EXECUTE') as anon_puede_ejecutar,
       has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_puede_ejecutar
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like 'sellogo_%'
order by p.proname;

-- 4. Verificar definiciones de funciones con acceso sensible
-- Revisar manualmente comprobación auth.uid(), relación empleado-negocio,
-- validación de propietario y controles contra doble canje.
select p.proname as funcion,
       pg_get_functiondef(p.oid) as definicion
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'sellogo_guardar_diseno',
    'sellogo_cambiar_estado',
    'sellogo_asignar_empleado',
    'sellogo_asignar_propietario',
    'sellogo_retirar_propietario',
    'sellogo_editar_promocion',
    'sellogo_crear_negocio'
  )
order by p.proname;

-- 5. Privilegios sobre tablas para anon y authenticated
select table_schema,table_name,grantee,privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and grantee in ('anon','authenticated')
order by table_name,grantee,privilege_type;
