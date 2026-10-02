# Cambios / Changelog

Aquí se anotan las versiones del proyecto y **cada corrección o actualización de datos**, con su fecha y su motivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las versiones siguen
[SemVer](https://semver.org/lang/es/).

*Entries are in Spanish. Every data correction or refresh is logged here with its date and reason.*

## [Sin publicar]

### Correcciones - 2026-10-02

- El parser de direcciones reconoce `X` como conector antes de otra vía: `CARRERA 44 X CALLE 84`
  produce `CR44 / CL84`, en lugar de `CR44X / CL84`. Conserva los sufijos `X` en nombres OSM y en
  direcciones con nomenclatura explícita, como `KR 17X CON CL 71` o `KR 17 X CON CL 71`.
- Pruebas de regresión para cruces con `X`, sufijos reales y direcciones incompletas, de predio o entre calles.
- Datos reconstruidos desde el mismo snapshot: 18.798 de 28.523 siniestros ubicados en un cruce
  (antes 18.797), con 15.094 asignados en 2018–2022 (antes 15.093). Carrera 44 × Calle 84 pasa
  de 11 a 12 registros, de dos a tres con heridos y de cero a uno peatonal. Las geometrías y categorías
  permanecen iguales: 51 prioritarios, 131 recomendados, 293 en observación y 361 semaforizados.

## [0.1.0] - 2026-10-01

Primera publicación del código, los datos y la metodología.

### Datos (corte: 20 de septiembre de 2026)

- 51 cruces prioritarios, 131 recomendados, 293 en observación y 361 con semáforo, sobre 9.658 cruces y 9.272 vías
  de OpenStreetMap (descarga del 20 de septiembre de 2026, 21 de septiembre 01:54 UTC).
- Siniestros: «Accidentalidad en Barranquilla» (datos.gov.co `yb9r-2dsi`), consultado el 20 de septiembre de 2026;
  18.797 de 28.523 registros ubicados en un cruce. Los conteos usan 2018–2022.
- Inventario oficial: «Semaforización en Barranquilla» (datos.gov.co `svyb-d6ts`), versión sep/oct 2023; 339 de
  341 puntos coinciden con OpenStreetMap.
- Evaluación con el modelo Jev de TypeSafe (`jev-1.13.0`) para 9.230 cruces sin semáforo, y una segunda evaluación
  sin siniestros para 3.260. Resultado de la prueba en la mitad de verificación: con umbral 0,7, señala el 68,8 % de
  los cruces ya semaforizados y el 0 % de los cruces tranquilos.
- Los siniestros por cruce y el inventario oficial van en archivos propios (`crashes-by-intersection.json`,
  `official-signals.geojson`) para conservar su licencia CC BY-SA 4.0.
- `data/raw/` se incluye para reproducir los números sin conexión. Los registros de siniestros se guardan solo con
  año, gravedad, clase y dirección; los puntos de interés, sin datos de contacto.
- El mapa descarga una copia reducida: solo los 836 cruces que dibuja y los campos que usa.

### Proyecto

- Código bajo Apache-2.0, datos bajo ODbL 1.0 y CC BY-SA 4.0, documentación bajo CC BY 4.0, y política de nombre y
  logo (`TRADEMARKS.md`).
- Un solo *workspace* de pnpm con `pipeline/`, `scorer-jev/` (antes `jev/`) y `web/`, sobre Node 24 LTS, y comandos
  únicos desde la raíz (`pnpm data`, `pnpm dev`, `pnpm test`…).
- Documentación en español e inglés: README, metodología y validación, arquitectura, diccionario de datos, guía para
  adaptar el proyecto a otra ciudad, simulación y el documento original con el que se coordinaron los agentes de IA
  (`docs/history/agent-contract.md`).
- Guía para contribuir con firma DCO, Código de Conducta (Contributor Covenant 2.1), política de seguridad,
  formularios para reportar errores y corregir datos, y `CITATION.cff`.

[Sin publicar]: https://github.com/Victorpay1/semaforos-barranquilla/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Victorpay1/semaforos-barranquilla/releases/tag/v0.1.0
