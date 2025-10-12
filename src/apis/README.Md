# API PHP - Guía de Configuración

## Requisitos

- PHP 7.4 o superior
- MySQL 5.7 o superior
- Servidor web (Apache/Nginx con PHP habilitado)
- Extensiones PHP: PDO, pdo_mysql, json

## Instalación

### 1. Configurar la Base de Datos

Ejecuta el script SQL para crear la base de datos y tablas:

```bash
mysql -u root -p < schema.sql
```

### 2. Configurar Conexión

Edita el archivo `conexion.php` y actualiza las credenciales de tu base de datos:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'planillas_db');
define('DB_USER', 'tu_usuario');
define('DB_PASS', 'tu_contraseña');
```

### 3. Configurar Servidor Web

#### Apache

Coloca la carpeta `apis/` en tu directorio web (por ejemplo: `/var/www/html/apis/` o `C:\xampp\htdocs\apis\`)

Asegúrate de que el módulo `mod_rewrite` esté habilitado.

#### Nginx

Configura tu nginx para servir los archivos PHP:

```nginx
location /apis/ {
    try_files $uri $uri/ /apis/index.php?$query_string;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 4. Configurar Frontend

En tu archivo `.env` del proyecto frontend, configura la URL de la API:

```env
VITE_API_URL=http://localhost/apis
```

O si usas un dominio:

```env
VITE_API_URL=https://tudominio.com/apis
```

## Endpoints Disponibles

### Planillas (`planillas.php`)

- `GET /apis/planillas.php` - Listar todas las planillas
- `GET /apis/planillas.php?id={id}` - Obtener una planilla específica
- `POST /apis/planillas.php` - Crear nueva planilla
- `PUT /apis/planillas.php` - Actualizar planilla
- `DELETE /apis/planillas.php?id={id}` - Eliminar planilla

### Perfiles (`profiles.php`)

- `GET /apis/profiles.php` - Listar todos los perfiles (solo admin)
- `GET /apis/profiles.php?id={id}` - Obtener perfil específico
- `POST /apis/profiles.php` - Crear nuevo perfil (solo admin)
- `PUT /apis/profiles.php` - Actualizar perfil
- `DELETE /apis/profiles.php?id={id}` - Eliminar perfil (solo admin)

### Equipos (`teams.php`)

- `GET /apis/teams.php` - Listar todos los equipos
- `GET /apis/teams.php?id={id}` - Obtener equipo específico
- `POST /apis/teams.php` - Crear nuevo equipo (solo admin)
- `PUT /apis/teams.php` - Actualizar equipo (solo admin)
- `DELETE /apis/teams.php?id={id}` - Eliminar equipo (solo admin)

### Auditoría (`audit.php`)

- `GET /apis/audit.php?planilla_id={id}` - Obtener logs de auditoría de una planilla

## Autenticación

Todos los endpoints requieren autenticación mediante token JWT de Supabase en el header:

```
Authorization: Bearer {token_supabase}
```

El token se obtiene automáticamente desde el frontend después del login con Supabase Auth.

## Flujo de Autenticación

1. Usuario se autentica con Supabase Auth (email/password)
2. Supabase devuelve un token JWT (access_token)
3. El frontend envía este token en el header `Authorization` a los endpoints PHP
4. PHP extrae el user_id del token (que es el auth.uid() de Supabase)
5. PHP usa este user_id para identificar al usuario en la base de datos MySQL

## Estructura de Respuestas

### Éxito
```json
{
  "data": { ... }
}
```

### Error
```json
{
  "error": true,
  "message": "Descripción del error"
}
```

## Solución de Problemas

### Error: "Database connection failed"
- Verifica las credenciales en `conexion.php`
- Asegúrate de que MySQL esté corriendo
- Verifica que la base de datos `planillas_db` existe

### Error: "Authorization header missing"
- Verifica que el frontend esté enviando el token en el header
- Asegúrate de estar autenticado en Supabase

### Error CORS
- Los headers CORS ya están configurados en `conexion.php`
- Si usas un dominio diferente, verifica la configuración del servidor web

### Error 404
- Verifica que la ruta de la API sea correcta
- Asegúrate de que los archivos PHP estén en el directorio web correcto

## Seguridad

- Todos los endpoints validan el token de autenticación
- Las consultas SQL usan prepared statements (PDO) para prevenir SQL injection
- Los permisos se verifican según el rol del usuario (admin/user)
- Los usuarios solo pueden acceder a sus propios datos o datos de su equipo
