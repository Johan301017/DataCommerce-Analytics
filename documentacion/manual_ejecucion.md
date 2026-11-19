# Manual de Ejecución — DataCommerce Analytics

Guía paso a paso para instalar, configurar, ejecutar y verificar el sistema completo en **Windows** (ejecución local nativa, recomendada) o mediante **Docker Compose**.

---

## 1. Requisitos del entorno

### Para ejecución local en Windows (sin Docker)
- **MySQL Server 8.0** y **MySQL Workbench 8.0** (base de datos relacional).
- **Python 3.10+** (verificado en `3.14.0`, para el **backend FastAPI** y pruebas `pytest`).
- **Node.js 18+** y **npm 9+** (verificado en Node `v24.11.1` / npm `11.6.2`, exclusivamente para el **frontend React + Vite**).
- Navegador web moderno (Chrome, Edge o Firefox).

### Alternativa con Docker
- **Docker Desktop** con **Docker Compose v2**. *(Nota: en el equipo de desarrollo Docker no estuvo instalado, por lo que las evidencias y pruebas se ejecutaron directamente en Windows nativo con MySQL Server 8.0).*

---

## 2. Configuración de variables de entorno (`.env`)

1. En la raíz del proyecto (`bigdata-datacommerce-analytics/`), copie `.env.example` como `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Edite `.env` y configure sus credenciales locales de MySQL:
   ```ini
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=su_clave_mysql
   DB_NAME=datacommerce_analytics
   FECHA_CORTE=2026-11-18
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173
   MYSQL_ROOT_PASSWORD=su_clave_mysql
   ```
   > **Importante:** Nunca guarde el archivo `.env` en el repositorio ni escriba credenciales dentro del código fuente. El archivo `.gitignore` ya lo excluye.

---

## 3. Configuración y carga de MySQL 8.0

> **Advertencia sobre `DROP DATABASE`:** El archivo [database/01_esquema.sql](../database/01_esquema.sql) ejecuta `DROP DATABASE IF EXISTS datacommerce_analytics;`. Si la base de datos ya está cargada y en funcionamiento, **no vuelva a ejecutar `01_esquema.sql`** salvo que desee reiniciar todos los datos desde cero.

### Opción A: Desde MySQL Workbench
1. Asegúrese de que el servicio **MySQL80** esté en ejecución (`Services.msc` o `Get-Service MySQL80`). *(Si tiene XAMPP instalado, no inicie el MySQL de XAMPP porque usa el mismo puerto 3306).*
2. Abra **MySQL Workbench 8.0** y conéctese a su instancia local (`Local instance MySQL80`).
3. Abra y ejecute los scripts **estrictamente en este orden** (*File → Open SQL Script → Execute ⚡*):
   1. [database/01_esquema.sql](../database/01_esquema.sql) — Crea la base `datacommerce_analytics` y las 7 tablas con restricciones e índices.
   2. [database/02_datos.sql](../database/02_datos.sql) — Inserta los `658` registros sintéticos deterministas.
   3. [database/03_consultas_analiticas.sql](../database/03_consultas_analiticas.sql) — Ejecuta las 9 consultas obligatorias y la consulta 10 (clientes premium).
   4. [database/04_validaciones.sql](../database/04_validaciones.sql) — Ejecuta las 15 validaciones de integridad y consistencia matemática (sin alterar los datos).

### Opción B: Desde la línea de comandos (PowerShell)
```powershell
$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$env:MYSQL_PWD = "su_clave_mysql"

cmd /c "`"$mysql`" -u root --default-character-set=utf8mb4 < database\01_esquema.sql"
cmd /c "`"$mysql`" -u root --default-character-set=utf8mb4 < database\02_datos.sql"
cmd /c "`"$mysql`" -u root --default-character-set=utf8mb4 --table < database\04_validaciones.sql"
cmd /c "`"$mysql`" -u root --default-character-set=utf8mb4 --table < database\03_consultas_analiticas.sql"
```

*(Opcional)* Para regenerar el script determinista `02_datos.sql` con la semilla fija `2026`:
```powershell
python database\generador\generar_datos.py
```

---

## 4. Inicio del backend (FastAPI)

Abra una terminal PowerShell en la carpeta raíz del proyecto:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verificación rápida:
- API raíz: `http://localhost:8000/`
- Documentación interactiva Swagger: `http://localhost:8000/docs`
- Estado de conexión con MySQL: `http://localhost:8000/api/health` (debe responder `{"status":"ok","database":"conectada"}`).

---

## 5. Inicio del frontend (React + Vite)

Abra una **segunda** terminal PowerShell en la carpeta raíz del proyecto:

```powershell
cd frontend
npm install
npm run dev
```

Vite iniciará el servidor de desarrollo y redirigirá automáticamente las peticiones `/api` hacia `http://localhost:8000`.

### Acceso al dashboard
Abra su navegador en:
**`http://localhost:5173`**

---

## 6. Ejecución de pruebas automatizadas (`pytest`)

Con la base de datos cargada y `.env` configurado, ejecute desde la raíz del proyecto:

```powershell
.\backend\.venv\Scripts\python.exe -m pytest tests -v
```

Las `82` pruebas verifican el esquema, restricciones `PK/FK/UNIQUE/NOT NULL/CHECK/RESTRICT`, las 10 consultas SQL, la coincidencia exacta entre API y SQL, el filtro por producto, fechas de corte RFM históricas, históricos incompletos y periodos sin ventas.

---

## 7. Ejecución con Docker Compose (opcional)

Si dispone de Docker Desktop:
1. Asegúrese de haber creado el archivo `.env` con `MYSQL_ROOT_PASSWORD`.
2. Ejecute:
   ```bash
   docker compose up --build
   ```
3. Servicios expuestos:
   - Dashboard web: `http://localhost:5173`
   - API FastAPI: `http://localhost:8000/docs`
   - MySQL 8.0: puerto `3306`

---

## 8. Solución de errores frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `No fue posible conectar a MySQL` / estado `degradado` en `/api/health` | El servicio `MySQL80` está detenido o la clave en `.env` no coincide. | Verifique `Get-Service MySQL80`, revise `DB_PASSWORD` en `.env` y reinicie `uvicorn`. |
| Error `Access denied for user 'root'@'localhost'` | Contraseña incorrecta en `.env`. | Actualice `DB_PASSWORD` en `.env` o restablezca la clave de MySQL. |
| Error `Port 3306 already in use` o conflicto con XAMPP | MariaDB de XAMPP ocupó el puerto 3306. | Detenga MySQL en el Panel de Control de XAMPP y arranque el servicio `MySQL80`. |
| Caracteres raros (`BogotÃ¡`) en consola de MySQL en Windows | Consola sin UTF-8 o falta de `--default-character-set=utf8mb4`. | Ejecute `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` en PowerShell y pase `--default-character-set=utf8mb4` a `mysql.exe`. |
| El mapa de Leaflet no carga mosaicos (*tiles*) | Sin conexión a internet para descargar mapas de OpenStreetMap. | Verifique acceso a `tile.openstreetmap.org`; los marcadores y datos de la tabla siguen funcionando sin mapa base. |
| PowerShell bloquea `Activate.ps1` (`ExecutionPolicy`) | Política de ejecución restringida en Windows. | Ejecute directamente `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --app-dir backend` o `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
