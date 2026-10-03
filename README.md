# Calibra

**Bitácora de pronósticos para entrenadores, instructores de gimnasio y profes de educación física.**
Anota lo que crees que va a pasar *antes* de saberlo, ciérralo después y mira qué tan calibrado está tu criterio.

> Si se anota después, ya no es un pronóstico: es una excusa.

👉 **Úsala aquí:** https://damendoza76.github.io/calibra/

Calibra es el artefacto que se llevan los asistentes de la conferencia magistral
*«Del cronómetro al algoritmo: cuando los datos empiezan a entrenar mejor que nosotros»*
(Dr. Darío Mendoza Romero · II Seminario en Prospectivas Ocupacionales en Educación Física, Recreación y Deporte ·
UPTC Chiquinquirá, 19 de septiembre de 2026).

---

## 1. Qué hace

Todos pronosticamos todo el tiempo —que este deportista cumple la carga, que esta atleta baja su marca, que este
estudiante no mejora—, pero casi nunca lo escribimos antes ni lo comparamos después. Sin ese contraste la intuición
no aprende: solo se siente cada vez más segura.

Calibra hace tres cosas:

1. **Anotar** un pronóstico con qué tan seguro estás (0 a 100 %) y cuándo vas a saber si pasó. Ese número queda
   congelado: ninguna pantalla permite cambiarlo.
2. **Cerrar** el pronóstico cuando ya sabes qué pasó: «Sí ocurrió» o «No ocurrió».
3. **Calibrar**: con 5 cierres o más, la app te dice en lenguaje llano si prometes de más o te quedas corto, y cómo
   evoluciona eso mes a mes.

Además lleva **fichas** de tus deportistas (o clientes, o grupos) con su **carga de entrenamiento** por RPE de sesión,
y muestra cómo se actualiza tu expectativa con cada sesión: *lo que esperabas → lo que pasó → tu nueva expectativa*
(el 400 → 250 → 385 de la charla).

## 2. Instalarla en el celular

No hay que descargar nada de una tienda. Abre el enlace en el navegador del teléfono y:

- **Android (Chrome):** menú ⋮ → **«Instalar aplicación»** o **«Agregar a la pantalla principal»**.
- **iPhone (Safari):** botón Compartir ⬆︎ → **«Agregar a inicio»**.

Queda un ícono como el de cualquier app. Después de abrirla una vez, **funciona sin internet**: en la cancha, en el
gimnasio o en el salón.

## 3. Tus datos

- **Todo se guarda solo en tu teléfono**, dentro del navegador. No hay cuentas, ni servidor, ni analítica, ni
  telemetría. Nadie más ve lo que anotas.
- Por eso mismo, **si cambias de teléfono o borras los datos del navegador, se pierde todo**, a menos que guardes un
  respaldo: **Ajustes → Copiar respaldo** (y pégalo en una nota o un correo para ti) o **Descargar archivo**.
- Para pasar tus datos a otro teléfono: **Ajustes → Traer un respaldo** y pega el texto o carga el archivo.
- **¿Usabas la versión de la charla (v1)?** En la v1 toca «Copiar respaldo» y pégalo en **Ajustes → Traer un
  respaldo** de esta versión. Cada nombre del campo «sobre quién» se convierte en una ficha. Si la v1 estaba abierta
  en el mismo navegador y en la misma dirección, la app migra sola al abrirse por primera vez.
- Para explorar sin tus datos: **Ajustes → Cargar deportistas de ejemplo**. Van marcados y se borran aparte.

## 4. Sobre el método (para quien quiera saber de dónde salen los números)

- **Calibración.** Los pronósticos se agrupan en cinco bandas («casi seguro que no», «poco probable», «moneda al
  aire», «probable», «casi seguro que sí»). En cada una se compara qué tan seguro decías estar con cuántas veces
  ocurrió de verdad. La franja sombreada de la curva es un intervalo de Wilson al 95 %: muestra cuánto podría moverse
  cada punto con tan pocos registros.
- **Carga de entrenamiento.** Carga de la sesión = esfuerzo percibido (0-10) × minutos: el RPE de sesión
  (Foster et al., 2001, *J Strength Cond Res*), una forma validada de medir la carga interna.
- **Expectativa.** La línea de la ficha usa la regla de la charla: `nueva = previa + (1/n) × (real − previa)`, que da
  el promedio de todas las sesiones y se puede hacer a mano. Es una simplificación pedagógica; en la práctica se usan
  promedios que pesan más lo reciente, como la variante EWMA del ACWR (Williams et al., 2017, *BJSM*).
- **Lo que Calibra no hace.** No predice lesiones —esa capacidad del ACWR está cuestionada por acoplamiento matemático
  (Impellizzeri et al., 2020, *IJSPP*)— y no pronostica por ti: no hay algoritmo ni «recomendaciones inteligentes». El
  valor está en la disciplina de anotar y contrastar.

---

## 5. Para quien quiera modificarla o publicar su propia copia

No hace falta saber programar para seguir estos pasos, pero sí instalar una herramienta.

### 5.1 Preparar el computador (una sola vez)

1. Instala **Node.js** (versión 22 o más nueva) desde https://nodejs.org — elige el botón «LTS» y sigue el instalador.
2. Descarga el proyecto: en https://github.com/damendoza76/calibra toca **Code → Download ZIP** y descomprímelo.
   (Si usas git: `git clone https://github.com/damendoza76/calibra.git`.)
3. Abre una terminal **dentro de la carpeta** del proyecto (en Mac: clic derecho sobre la carpeta → «Nuevo terminal
   en la carpeta»; en Windows: dentro de la carpeta, escribe `cmd` en la barra de direcciones y presiona Enter).
4. Escribe y presiona Enter:

   ```bash
   npm install
   ```

   Descarga lo que la app necesita. Tarda uno o dos minutos.

### 5.2 Verla en tu computador

```bash
npm run dev
```

Abre en el navegador la dirección que aparece (normalmente http://localhost:5173). Cada cambio que hagas en el
código se ve al instante. Para detenerla: `Ctrl + C` en la terminal.

### 5.3 Comprobar que todo está bien

```bash
npm run test
```

Corre las pruebas automáticas: la lógica de calibración, la carga de entrenamiento, la migración desde la v1, el
respaldo de ida y vuelta, y la regla de que **ninguna pantalla puede cambiar la confianza de una predicción cerrada**.
Deben salir todas en verde.

### 5.4 Compilarla

```bash
npm run build
```

Crea la carpeta **`dist`**: esa carpeta *es* la app lista para publicar (con su modo sin conexión).
Para probar esa versión exacta: `npm run preview`.

### 5.5 Publicarla gratis

**Opción A — GitHub Pages (la que usa este proyecto, automática).**

1. Crea una cuenta gratuita en https://github.com y un repositorio **público** con el código (o haz un *fork* de este).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: «GitHub Actions»**.
3. Cada vez que subas un cambio a la rama `main`, GitHub prueba, compila y publica solo (el procedimiento está en
   `.github/workflows/publicar.yml`). En 1-2 minutos queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.
   El avance se ve en la pestaña **Actions**.

**Opción B — Netlify (sin GitHub, arrastrando una carpeta).**

1. Compila la app (`npm run build`).
2. Entra a https://app.netlify.com/drop, crea una cuenta gratuita y **arrastra la carpeta `dist`** a la página.
3. Netlify te da una dirección pública al instante. Para actualizarla, vuelve a compilar y arrastra `dist` de nuevo.

En ambos casos la app funciona igual: se instala en el celular y abre sin conexión.

### 5.6 Cómo está organizado el código

```
src/
  domain/      la lógica pura: bandas, calibración, sesgo, carga RPE, la regla (con pruebas)
  db/          base de datos del teléfono (IndexedDB con Dexie), migración desde la v1, respaldo
  components/  piezas visuales: sellos, deslizadores, tarjetas, gráficos
  screens/     las pantallas: Hoy, Fichas, Ficha, Anotar, Pendientes, Calibración, Ajustes
  theme/       colores, tipografías, tema claro y oscuro
docs/
  calibra-v1.html   la versión de la charla, como referencia
  capturas/         capturas de cada pantalla en tema claro y oscuro
```

Tecnologías: React, TypeScript y Vite; Dexie (IndexedDB); visx para los gráficos; framer-motion para las animaciones;
vite-plugin-pwa para el modo sin conexión; Vitest para las pruebas. Fuentes: Big Shoulders Display, Source Serif 4 e
IBM Plex Mono, incluidas dentro de la app.

---

## Licencia

Código abierto con licencia [MIT](LICENSE): puedes usarlo, adaptarlo para tu equipo, tu gimnasio o tu colegio, y
publicar tu propia versión, siempre que conserves el aviso de autoría del archivo `LICENSE`.

Dr. Darío Mendoza Romero · UPTC Chiquinquirá, 2026
