# Preparación Laboral G1b

Simulador educativo **no oficial** para el cargo Asistente Técnico – División Fiscalización y Cumplimiento (G1b).

## Funcionalidades
- Simulación de 76 minutos distribuida en tres módulos de 30, 26 y 20 minutos.
- Práctica libre, preguntas aleatorizadas, corrección y revisión de errores.
- Dashboard con promedios, evolución, tiempo de estudio, calendario y resultados por área.
- Inicio de sesión por correo/contraseña y sincronización de historial y respuestas en curso mediante Supabase.
- **Modo demostración local** hasta configurar Supabase (el progreso local NO se sincroniza entre dispositivos).
- Las preguntas son originales, no oficiales de Test Kokoro, y el resultado es orientativo.

## Configurar autenticación y base de datos
1. Crear proyecto gratuito en https://supabase.com/dashboard.
2. En el SQL Editor del proyecto ejecutar `supabase/schema.sql` íntegramente.
3. En **Authentication > Providers > Email** revisar la confirmación de correo y seguridad de contraseñas.
4. En **Authentication > URL Configuration**, establecer Site URL `https://darkcaruz.github.io/Preparacion-Laboral/` y agregar esa misma URL a Redirect URLs.
5. Copiar **Project URL** y la **publishable key / anon key** de Supabase, y completar `src/config.js`. **Jamás publicar una service_role key ni secret key.**
6. Abrir el sitio e iniciar sesión o registrarse. Los resultados se sincronizan por cuenta y quedan separados con RLS.
7. Si se hicieron intentos antes en modo local, permanecen en ese navegador; no se importan automáticamente a la nube.

## Publicar GitHub Pages
En GitHub: **Settings > Pages > Build and deployment > Deploy from a branch**, elegir `main` y `/ (root)`. Después consultar https://darkcaruz.github.io/Preparacion-Laboral/.

## Seguridad y limitaciones
- GitHub Pages es un servidor estático. GitHub NO almacena datos privados de usuarios ni sustituye una base de datos.
- Supabase Auth realiza el login; PostgreSQL almacena progreso, intentos, resultados y revisión de respuestas.
- RLS restringe cada usuario a sus propios datos; antes de abrir el registro públicamente, conviene deshabilitar altas si será solo para una usuaria.
- Respuestas correctas se incluyen en el cliente: el simulador es **entrenamiento**, no un examen seguro o invulnerable a manipulación.
- No se exige RUT ni datos sensibles. Evitar compartir credenciales.
- El cronómetro se basa en el reloj del dispositivo y no es antifraude.
- Con conexión intermitente pueden quedar cambios pendientes; el estado local del navegador sirve de respaldo.
