# Validación del análisis de semaforización de Barranquilla

*[English version](validation.en.md)*

Corte: 20 de septiembre de 2026. Este documento explica, sin tecnicismos, de dónde salen los datos del mapa,
cómo se comprobó que son fiables y hasta dónde llegan. Las cifras del mapa se reproducen sin conexión con
`pnpm data`; la evaluación y la prueba de la sección 4 se rehacen con `scorer-jev/` (ver «Reproducir los números» en
el [README](../README.md#reproducir-los-números)). Los detalles quedan en `data/out/summary.json` (bloque
`validation`), `data/out/reports/` y `scorer-jev/backtest-log.json`.

**Qué es y qué no es.** El Manual de Señalización Vial 2024 (cap. 4) exige aforos de tránsito para justificar un
semáforo. Aquí no hay aforos. El resultado es una **lista corta y ordenada de cruces para estudio técnico**, cada
uno con evidencia verificable; no es un dictamen de que un semáforo esté justificado.

**Qué es «la evaluación».** En este documento, «la evaluación» es un modelo de inteligencia artificial de decisión
(Jev, de la empresa TypeSafe, versión `jev-1.13.0`, consultado por su API de pago). A cada cruce se le hacen las
mismas tres preguntas con los datos del cruce; las preguntas exactas están en `scorer-jev/src/questions.ts`. Sus
respuestas se combinan con reglas propias y con los siniestros registrados (sección 5). Es un modelo estadístico,
no un ingeniero de tránsito.

## 1. Fuentes y fechas

| Dato | Fuente | Fecha |
| --- | --- | --- |
| Calles, cruces y semáforos mapeados | OpenStreetMap (9.272 vías, 9.658 cruces, 1.223 nodos de semáforo) | descarga sep-2026 |
| Inventario oficial de intersecciones semaforizadas | Secretaría de Tránsito, datos.gov.co `svyb-d6ts` (342 puntos) | versión sep/oct-2023 publicada por la Secretaría (las filas en datos.gov.co figuran actualizadas en sep-2022; el contenido coincide) |
| Siniestros viales | datos.gov.co `yb9r-2dsi`, informes policiales IPAT (28.523 registros) | 2018 a jun-2026 |
| Colegios, centros de salud, mercados, paraderos | OpenStreetMap, a menos de 200 m del cruce | sep-2026 |

## 2. Semáforos: comprobación contra el inventario oficial

Los nodos de semáforo de OSM a menos de 40 m entre sí se agrupan en un solo "sitio" (un cruce de doble calzada
tiene de 2 a 8 nodos) y cada punto oficial se une al sitio más cercano (hasta 80 m). Cada sitio marca **un solo
cruce** como semaforizado; los cruces pequeños pegados a él (67) quedan como *cubiertos*: no se cuentan aparte y
nunca se proponen para semáforo. Así se corrigió el sobreconteo anterior (422).

- **361 cruces semaforizados** en el mapa, frente a 342 del inventario (341 dentro del límite municipal de OSM;
  queda fuera Circunvalar × Ventana al Mundo).
- **339 de 341 puntos oficiales (99 %)** tienen semáforo en OSM a menos de 80 m. En 315 de los 317 puntos cuyo
  nombre oficial se pudo leer como "calle × carrera", el nombre coincide con las calles del cruce asignado.
- En el inventario pero no en OSM (2): Calle 30 × Carrera 21B y Calle 106 × Carrera 65A (preventivo, 2023).
  Se tratan como semaforizados.
- En OSM pero no en el inventario: 31 sitios, 25 de ellos sobre un cruce vial. Incluyen tres de los cuatro
  semáforos que el Distrito instaló en abril de 2026 (Calle 98 × Cra 57, Calle 99 × Cra 57, Calle 41 × Cra 8); el
  cuarto (Cordialidad × Cra 27) no se pudo ubicar en el mapa. El resto son instalaciones posteriores a 2023, pasos
  peatonales semaforizados a mitad de cuadra o partes de un cruce grande (p. ej. Calle 30/34 × Carrera 46) que el
  inventario cuenta de otra forma. No se verificaron en campo.
- La diferencia 361 − 341 = +25 (solo OSM) − 5 (puntos oficiales sin cruce propio en el mapa o que comparten cruce).

## 3. Siniestros: cómo se asignaron a los cruces

El conjunto de datos **no trae coordenadas, solo la dirección escrita**. Se normalizó la nomenclatura (CL/CLL/CALLE,
CR/CRA/KR/CARRERA, sufijos como 21B o "SUR", Murillo = Calle 45, Olaya Herrera = Carrera 46, Calle 110 =
Circunvalar, Vía 40, Cordialidad, Av. del Río) y un registro solo se asigna cuando la dirección nombra **exactamente
dos vías** y en el mapa existe **un único cruce** de esas dos vías (las dos calzadas de una avenida cuentan como el
mismo cruce). Direcciones de puerta ("CL 87 9H 24"), tramos ("entre… y…", "frente a…") y casos ambiguos se
descartan: es preferible un registro sin asignar que uno mal asignado.

- **18.798 de 28.523 registros asignados (65,9 %)**; entre los que tienen forma de cruce, 82,1 %.
- Sin asignar: 3.676 direcciones de puerta, 1.047 tramos, 3.243 cruces que no existen en el mapa con ese nombre
  (sobre todo intercambiadores de la Circunvalar), 841 ambiguos, 918 ilegibles. Una muestra aleatoria de 30
  asignaciones de la versión 0.1.0 se revisó a mano: las 30 son coherentes; una depende de un alias tomado de OSM
  (Carrera 6 = Cordialidad). La muestra reproducible de `data/out/reports/crash-match.json` se regenera cuando
  cambian las asignaciones.
- **Periodo usado: 2018–2022.** Desde 2023 el registro dejó de incluir choques con solo daños (4.128 en 2018, 6 en
  2023), mientras los siniestros con víctimas se mantienen (1.100–1.800 al año). Para no mezclar dos criterios de
  registro, los conteos y el ordenamiento usan 2018–2022 (15.094 registros asignados); los siniestros con víctimas
  de 2023–2025 se muestran aparte.
- Los cruces **ya semaforizados** tienen muchos más siniestros (mediana 10) que los no semaforizados (mediana 0),
  porque por ellos pasa más tránsito. Por eso los siniestros se leen como **señal de conflicto y de exposición, no
  como prueba de que falte un semáforo**.

## 4. La prueba clave: ¿el análisis habría señalado los cruces que la ciudad ya semaforizó?

**Diseño.** Se tomaron los 334 cruces semaforizados confirmados por las dos fuentes y se describió cada uno *como
si su propio semáforo no existiera* (distancia al semáforo vecino más cercano; todo lo demás igual). Se evaluaron
con las mismas tres preguntas que el resto de la ciudad. Como contraste se evaluaron 400 cruces tranquilos
(calle local × calle local, al azar) y 300 cruces sin semáforo sobre vías colectoras o arteriales. Los cruces
semaforizados se dividieron en dos mitades fijas: una para ajustar preguntas y umbrales (161) y otra, **no usada
para ajustar, para reportar resultados (173)**.

**Resultados en la mitad de verificación** (umbral 0,7, elegido en la otra mitad con una regla fijada de antemano:
el umbral más bajo que no marca ningún cruce tranquilo y que mejor separa semaforizados de no semaforizados):

| Umbral de la evaluación | Cruces ya semaforizados que señala | Cruces tranquilos que señala | Cruces sin semáforo en vías principales que señala |
| --- | --- | --- | --- |
| 0,5 | 79 % | 1,1 % | 19 % |
| 0,6 | 75 % | 0,5 % | 19 % |
| **0,7 (elegido)** | **69 %** | **0 %** | **18 %** |
| 0,8 | 56 % | 0 % | 10 % |

- La evaluación califica la necesidad como alta o crítica en el 77 % de los cruces ya semaforizados y en el 1 % de
  los tranquilos; recomienda semáforo en el 83 % y el 2 %, respectivamente.
- **En palabras simples: de cada 10 cruces que la ciudad ya semaforizó, la evaluación habría señalado 7, y de cada
  100 cruces tranquilos, ninguno.** Con las reglas completas de la lista corta (sección 5), más exigentes, 5 de cada
  10 habrían quedado en *prioritario* o *recomendado* y 7 de cada 10 con alguna alerta; de 189 cruces tranquilos,
  ninguno en la lista corta.
- Comprobación adicional, fuera de todo ajuste: de los 25 cruces con semáforo que no están en el inventario de 2023,
  la evaluación señala el 60 %, incluidos los tres instalados en 2026 (cuyos siniestros 2018–2022 son anteriores
  al semáforo).

**Qué hubo que corregir.** La primera versión de las preguntas señalaba solo entre el 1 % y el 3 % de los cruces ya semaforizados,
porque asumía que no debe haber semáforos a menos de 300 m; en Barranquilla el 58 % de los cruces semaforizados
tiene otro a menos de 150 m (esa regla del Manual solo aplica a semáforos justificados por coordinación). Se
corrigió esa premisa, se describió por separado la vía principal y la transversal, y se añadieron la distancia al
semáforo siguiente sobre la misma vía y el nivel de siniestros. Se probaron tres variantes; todas quedan
registradas.

**Advertencia de independencia.** La evaluación que ve los siniestros coincide casi siempre con "5 o más
siniestros sobre una vía colectora". Para que el acuerdo entre señales sea real, se corrió una segunda evaluación
**sin mostrarle los siniestros** (señala 51 % de los semaforizados, 0 % de los tranquilos) y los niveles altos
exigen que ambas coincidan.

## 5. Cómo se definen los niveles

| Nivel | Cruces | Condiciones |
| --- | --- | --- |
| **Prioritario** | 51 | La evaluación recomienda semáforo por encima del umbral, **también sin ver los siniestros**; hay una vía colectora o arterial; el cruce es a nivel (no glorieta, ramal, puente ni bifurcación) y no hay semáforo en la misma cuadra (< 80 m); y los siniestros 2018–2022 son ≥ 15 (más que tres de cada cuatro cruces ya semaforizados) o ≥ 9 (su mediana) con colegio o centro de salud a menos de 200 m o más de 600 m sin semáforo sobre la vía principal. Además: a no menos de 94 m de otro semáforo, vía transversal que no sea un acceso menor o industrial, y un solo cruce por cada 120 m. |
| **Recomendado** | 131 | Evaluación y reglas de jerarquía coinciden, y además coincide la evaluación sin siniestros o hay ≥ 15 siniestros. |
| **Observación** | 293 | Solo una señal: la evaluación depende únicamente de los siniestros, o no hay vía colectora, o hay muchos siniestros pero se sugiere una medida más barata (PARE, reductores, glorieta), que se muestra como recomendación. |
| Sin acción | 8.822 | Lo demás, incluidos los 67 cruces cubiertos por un semáforo contiguo. |
| Semaforizado | 361 | Inventario oficial y/o OSM. |

Las dos calzadas de un mismo cruce nunca aparecen dos veces. Se revisó a mano la lista de prioritarios: ninguno
lleva el nombre de un cruce del inventario oficial ni está en una glorieta, ramal o paso a desnivel. La evidencia
mostrada en cada cruce son hechos comprobables (siniestros, jerarquía vial, distancias, equipamientos).

## 6. Limitaciones

- **No hay aforos.** El Manual exige volúmenes de 8 horas, promediados en tres días. Nada de lo aquí mostrado los
  sustituye: es una lista para decidir **dónde aforar primero**.
- **Siniestros.** Subregistro (sobre todo choques leves, y desde 2023 no se registran); solo dirección escrita, sin
  coordenadas; un tercio de los registros no se pudo asignar, y los cruces de la Circunvalar y los intercambiadores
  quedan subrepresentados. Un conteo alto puede reflejar simplemente mucho tránsito. Alguna dirección muy repetida
  podría ser una dirección "por defecto" (p. ej. Calle 31 × Carrera 24, 62 registros en un cruce local): no verificado.
- **La prueba mide parecido con lo ya semaforizado**, no justificación técnica: si la ciudad instaló semáforos donde
  no hacían falta, el análisis hereda ese criterio. Los siniestros de los cruces semaforizados ocurrieron con el
  semáforo ya puesto, lo que puede favorecer o perjudicar la comparación.
- **OpenStreetMap.** La clase de las vías es una aproximación (casi la mitad de los cruces semaforizados tiene una
  transversal etiquetada "residencial"); carriles mapeados en el 99,6 % de los cruces sobre vías principales pero solo
  en el 73 % del total; colegios y centros de salud pueden faltar. Puede haber semáforos recientes sin mapear: todo
  candidato debe confirmarse en campo.
- **Inventario oficial con corte sep/oct-2023**; la cifra de 351 (feb-2026) no se pudo leer en la fuente.
- **La simulación de cada cruce es ilustrativa.** La geometría (accesos, carriles, sentidos) es real, pero los
  volúmenes de tránsito son valores típicos por tipo de vía y el comportamiento en el PARE está calibrado con estudios
  de otros países, no medido en Barranquilla. Ver [`simulation.md`](simulation.md).
- **Tipo de control.** La evaluación casi nunca distingue semáforo peatonal de vehicular; esa decisión corresponde
  al estudio. La evaluación es un modelo estadístico de decisión, no un ingeniero: en la prueba señala 7 de cada 10
  cruces que ya tienen semáforo, no 10 de 10.
