# Resumen de Cambios - Sistema de Gestión de Planillas

## Cambios Implementados

### 1. Base de Datos

**Archivo:** `src/apis/update_schema.sql`

- Agregado campo `shortname` (VARCHAR 50, UNIQUE) a la tabla `teams`
- Agregado campo `password` (VARCHAR 255) a la tabla `profiles` si no existe
- Creado índice único para `shortname`

**Ejecutar el script SQL:**
```sql
-- En el servidor MySQL/MariaDB
mysql -u infantiles -p'laquevosquieras2022' vps4_infantiles_valesanito_planilla < src/apis/update_schema.sql
```

### 2. Gestión de Usuarios

#### Frontend
- **Nuevo componente:** `src/components/base/PasswordInput.tsx`
  - Input con funcionalidad de mostrar/ocultar contraseña
  - Iconos de ojo/ojo tachado para toggle de visibilidad

- **Actualizado:** `src/pages/AdminPage.tsx`
  - Formulario de creación de usuarios muestra todos los campos: nombre, email y contraseña
  - Formulario de edición muestra y permite editar: nombre, email y contraseña
  - Contraseña es opcional al editar (si está vacía no se modifica)
  - Usa el nuevo componente `PasswordInput`

#### Backend
- **Actualizado:** `src/apis/manage_users.php`
  - Método `PUT` ahora soporta actualización de `email` y `password`
  - Validación de unicidad de email al editar
  - Validación de longitud mínima de contraseña (6 caracteres)

#### Hook
- **Actualizado:** `src/hooks/useUsers.ts`
  - Función `updateUser` ahora acepta parámetros opcionales para `email` y `password`

### 3. Carga Masiva de Planillas

#### Frontend

**Nuevo validador:** `src/utils/csvPlanillaValidator.ts`
- Valida archivos CSV para carga masiva de planillas
- Verifica que los equipos existan y tengan `shortname` configurado
- Verifica que los equipos no tengan planillas ya asignadas
- Genera automáticamente:
  - Email: `{shortname}@valesanito`
  - Contraseña: `{shortname}` + número aleatorio de 4 dígitos
  - Username: `{shortname}`

**Nuevo componente:** `src/components/BulkPlanillaUpload.tsx`
- Modal para carga masiva de planillas
- Descarga plantilla CSV con equipos disponibles
- Muestra vista previa de credenciales generadas
- Validación de archivo antes de cargar
- Muestra credenciales creadas al completar

**Nuevo hook:** `src/hooks/useBulkPlanillas.ts`
- Maneja la lógica de creación masiva de planillas

**Integración en AdminPage:**
- Botón "Carga Masiva" en sección de Planillas
- Abre modal `BulkPlanillaUpload`

#### Backend

**Actualizado:** `src/apis/planillas.php`
- Nueva función `handleBulkCreate()` para creación masiva
- Endpoint: `POST planillas.php?bulk=true`
- Para cada planilla:
  1. Valida que el equipo no tenga planilla asignada
  2. Crea un nuevo usuario con email y contraseña especificados
  3. Crea la planilla asociada al equipo
  4. Asigna el usuario a la planilla
  5. Registra en audit log
- Retorna lista de planillas creadas con credenciales generadas

**Actualizado:** `src/apis/teams.php`
- Soporte para campo `shortname` en:
  - GET: Incluye `shortname` en respuestas
  - POST: Acepta `shortname` al crear equipos
  - PUT: Permite actualizar `shortname`
  - Bulk creation: Soporta `shortname` en carga masiva

### 4. Tipos TypeScript

**Actualizado:** `src/types/index.ts`
- Interface `Team` ahora incluye campo opcional `shortname?: string | null`

### 5. Correcciones de Bugs

**Actualizado:** `src/pages/PlanillaDetailPage.tsx`
- Corregido uso de `profile` → `user` en hook `useAuth`
- Corregido `canEdit` para usar `user?.is_admin` en lugar de `profile?.is_admin`

## Flujo de Uso

### Crear Planillas Masivamente

1. **Configurar shortname en equipos:**
   - Ir a Admin → Equipos
   - Editar equipo y agregar `shortname` (nombre corto sin espacios)

2. **Carga masiva:**
   - Ir a Admin → Planillas
   - Click en "Carga Masiva"
   - Descargar plantilla CSV (solo incluye equipos sin planilla y con shortname)
   - El CSV viene pre-rellenado con IDs de equipos disponibles
   - Subir el CSV
   - Validar archivo
   - Revisar credenciales que se generarán
   - Confirmar creación

3. **Resultado:**
   - Se crean usuarios automáticamente con:
     - Email: `{shortname}@valesanito`
     - Contraseña: `{shortname}{random-4-digits}`
     - Username: `{shortname}`
   - Se crean planillas asociadas a cada equipo
   - Se asignan los usuarios a sus planillas
   - Se muestran las credenciales generadas (guardar para entregarlas)

### Editar Usuarios

1. **Ir a Admin → Usuarios**
2. **Click en botón Editar (lápiz)**
3. **Editar campos:**
   - Email (obligatorio)
   - Nombre de usuario (obligatorio)
   - Contraseña (opcional - dejar vacío para no cambiar)
   - Admin (checkbox)
4. **Guardar cambios**

## Archivos Creados

- `src/components/base/PasswordInput.tsx`
- `src/components/base/PasswordInput.css`
- `src/components/BulkPlanillaUpload.tsx`
- `src/components/BulkPlanillaUpload.css`
- `src/hooks/useBulkPlanillas.ts`
- `src/utils/csvPlanillaValidator.ts`
- `src/apis/update_schema.sql`

## Archivos Modificados

- `src/apis/manage_users.php`
- `src/apis/planillas.php`
- `src/apis/teams.php`
- `src/hooks/useUsers.ts`
- `src/pages/AdminPage.tsx`
- `src/pages/PlanillaDetailPage.tsx`
- `src/types/index.ts`

## Notas Importantes

1. **Ejecutar el script SQL** `update_schema.sql` antes de usar las nuevas funcionalidades
2. **Configurar shortname** en los equipos antes de usar la carga masiva
3. **Guardar las credenciales** mostradas al crear planillas masivamente
4. El campo `password` en la tabla `profiles` debe existir para que funcione la edición de usuarios
5. Las contraseñas se generan automáticamente con formato: `{shortname}{4-random-digits}`
6. Solo equipos con `shortname` y sin planilla asignada aparecen en la plantilla CSV

## Build

El proyecto compila exitosamente:
```
npm run build
✓ built in 8.21s
```

No hay errores de TypeScript.
