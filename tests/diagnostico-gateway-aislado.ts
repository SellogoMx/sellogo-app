// Diagnóstico AISLADO: no desplegar sobre sellogo-tarjetas.
// No utiliza Supabase, secretos, datos de clientes ni escribe registros.
// Ejecutar localmente o en un entorno temporal independiente.
// POST JSON: {"candidate":"198.51.100.77"} con cabecera x-forwarded-for de prueba.
// La respuesta nunca devuelve la IP real del visitante.
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }
  try {
    const body = await req.json();
    const candidate = body?.candidate;
    if (typeof candidate !== "string" ||
        !/^[0-9a-fA-F:.]{3,45}$/.test(candidate)) {
      return Response.json({ error: "Candidato inválido" }, { status: 400 });
    }
    const forwarded = req.headers.get("x-forwarded-for");
    const first = forwarded?.split(",")[0]?.trim() ?? null;
    return Response.json({
      observedCandidateAsFirst: first === candidate,
      forwardedPresent: forwarded !== null,
      forwardedEntries: forwarded ? forwarded.split(",").length : 0,
      cfConnectingIpPresent: req.headers.has("cf-connecting-ip"),
      note: "Este diagnóstico no prueba por sí solo la identidad del visitante."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }
});
