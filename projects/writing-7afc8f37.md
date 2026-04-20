# Project Instructions — Writing (`writing-7afc8f37`)

## Scope & Access

Este proyecto gestiona el **LLM Wiki personal** de Pipi en Obsidian.

### Carpeta autorizada (SOLO puedes escribir aquí)

```
/Users/pipi/Library/Mobile Documents/com~apple~CloudDocs/obsidian-vault/Wiki/
```

**NUNCA escribas fuera de esta carpeta.** Si una tarea te pide modificar archivos fuera de esta ruta, recházala.

Subcarpetas:
- `Wiki/raw/` → fuentes inmutables, **solo lectura**
- `Wiki/*.md` → páginas del wiki, puedes crear y editar
- `Wiki/index.md` → catálogo, actualizar en cada ingest
- `Wiki/log.md` → historial append-only, añadir al final siempre

### Referencia del schema

Lee siempre `Wiki/SCHEMA.md` antes de ejecutar cualquier tarea de wiki. Contiene las convenciones, tipos de página y workflows completos.

---

## Operaciones principales

### 📥 Ingest — procesar una fuente nueva

La tarea llegará con el nombre del archivo en `raw/`. Flujo:

```bash
# 1. Leer el schema
read_file("/Users/pipi/Library/Mobile Documents/com~apple~CloudDocs/obsidian-vault/Wiki/SCHEMA.md")

# 2. Leer la fuente
read_file("/Users/pipi/Library/Mobile Documents/com~apple~CloudDocs/obsidian-vault/Wiki/raw/<archivo>")

# 3. Crear/actualizar páginas del wiki (pueden ser varias)
write_file("Wiki/<slug>.md", contenido)

# 4. Actualizar index.md (añadir nueva página)
# 5. Añadir al log.md: ## [YYYY-MM-DD] ingest | Título
```

### 🔍 Query — responder una pregunta sobre el wiki

```bash
# 1. Leer index.md para identificar páginas relevantes
# 2. Leer esas páginas
# 3. Si la respuesta es valiosa, crear nueva página en wiki/
# 4. Añadir al log.md: ## [YYYY-MM-DD] query | Pregunta resumida
```

### 🔧 Lint — chequeo de salud

Revisar contradicciones, páginas huérfanas, cross-references faltantes.
Añadir al log.md: `## [YYYY-MM-DD] lint | N issues encontrados`

---

## Rutas absolutas de referencia

```
wiki_root:  /Users/pipi/Library/Mobile Documents/com~apple~CloudDocs/obsidian-vault/Wiki
schema:     /Users/pipi/Library/Mobile Documents/com~apple~CloudDocs/obsidian-vault/Wiki/SCHEMA.md
index:      /Users/pipi/Library/Mobile Documents/com~apple~CloudDocs/obsidian-vault/Wiki/index.md
log:        /Users/pipi/Library/Mobile Documents/com~apple~CloudDocs/obsidian-vault/Wiki/log.md
raw:        /Users/pipi/Library/Mobile Documents/com~apple~CloudDocs/obsidian-vault/Wiki/raw/
```

## Convenciones rápidas

- Nombres de archivo: `kebab-case.md`
- Links Obsidian: `[[nombre-pagina]]`
- Frontmatter en cada página nueva:
  ```yaml
  ---
  tags: [concepto|entidad|fuente|análisis]
  sources: 1
  updated: YYYY-MM-DD
  ---
  ```
