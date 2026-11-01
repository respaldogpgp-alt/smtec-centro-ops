# Центр операций СМТЕК — web completa (versión 2)

Esta carpeta contiene **los ocho archivos** necesarios para publicar la web estática en GitHub Pages. No hace falta instalar Node, Python ni saber programar.

## Comprobar que no falta nada

En la misma carpeta deben aparecer:

- `index.html` — portada y vistas.
- `styles.css` — diseño de la web.
- `app.js` — navegación, buscador, chatbot y bóveda.
- `knowledge.js` — procedimientos y actividades públicas.
- `data_private.js` — **archivo de seguridad vacío** en esta edición pública. Es intencional: los chats y PDF privados NO están aquí.
- `robots.txt` — solicitud de no indexación a buscadores.
- `README.md` — estas instrucciones.
- `.nojekyll` — archivo de GitHub Pages (sin contenido; puede ocultarse en Windows).

## Subir al repositorio GitHub

1. Entra a `https://github.com/new`. Crea repositorio `smtec-centro-ops` de visibilidad Public. Es **publicación pública** aunque se solicite no indexar.
2. Descomprime el ZIP en Windows (clic derecho → Extraer todo).
3. Abre el repositorio y utiliza `Add file → Upload files` (o `uploading an existing file` cuando está vacío).
4. **Selecciona los archivos de esta carpeta**, NO el ZIP ni la carpeta envolvente. `index.html` debe estar directamente al abrir tu repositorio, no escondido dentro de otro directorio.
5. Pulsa `Commit changes`. Luego `Settings → Pages → Build and deployment`: `Deploy from a branch`, `main`, `/(root)`, `Save`.
6. Comprueba la dirección `https://TU-USUARIO.github.io/smtec-centro-ops/` o el botón `Visit site` en la configuración de Pages.

## Chatbot mejorado

El asistente no depende de una API ni exige cuentas adicionales. Reconoce variaciones, conceptos relacionados y errores tipográficos como **«giua» → «guía»**, **«resrva» → «reserva»** y **«audtiorio» → «auditorio»**. Reordena términos y presenta procedimientos de forma escalonada, citando la guía. No es ChatGPT ni responde con información de internet en tiempo real.

Prueba estas preguntas:

- `Me dices los pasos para la resrva de un espcaio`
- `Qué dice la giua sobre reservar el audtiorio`
- `Necesito promocionar una charla, qué hago con el flyer`
- `Cuántos días antes debo pedir el Aula Magna`
- `Qué hago con los datos de invitados externos`
- `Qué sabemos de Nexa para noviembre`

## Historial privado

El material sensible NO debe publicarse sin protección. Para consultar el PDF de 179 páginas, la guía y correspondencia privada, usa el **paquete privado separado**; allí se incluye `crear_boveda.html`, que permite generar un archivo cifrado con una contraseña que elijas.

**Nunca** subas a un repositorio público los PDF originales, los chats sin cifrar ni el `data_private.js` del paquete privado. El `data_private.js` de **este ZIP público** es solo `window.OPS_PRIVATE = null`.

Si generas `vault.enc.json`, puedes subir SOLO ese archivo cifrado. Aunque el cifrado protege su contenido sin la contraseña, cualquiera podrá descargarlo, así que usa una contraseña larga y única. Para acceso verdaderamente privado por usuarios se necesita un alojamiento con autenticación.

## Notas

- `robots.txt` y `noindex` **no garantizan** que nadie encuentre la página.
- La información refleja documentos y gestiones hasta el **1 de noviembre de 2026**; los estados de eventos y plazos deben actualizarse si cambian.
- El historial completo no puede actualizarse automáticamente desde ChatGPT: para agregar información hay que editar la base o volver a generar una bóveda.
