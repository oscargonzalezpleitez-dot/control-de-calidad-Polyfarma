# Guía de Instalación — PharmaQMS v1.0.0

## Prerrequisitos
- Node.js v20+
- Docker Desktop
- Git

## Pasos de Instalación

### 1. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con valores seguros de producción
# OBLIGATORIO cambiar: JWT_SECRET, ENCRYPTION_KEY, POSTGRES_PASSWORD
```

### 2. Levantar infraestructura (Docker)
```bash
docker-compose up -d postgres redis
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Generar cliente Prisma y migrar BD
```bash
npm run db:generate
npm run db:migrate
```

### 5. Cargar datos iniciales (seed)
```bash
npm run db:seed
```

### 6. Iniciar en desarrollo
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs (Swagger): http://localhost:3001/api/docs

## Credenciales iniciales (CAMBIAR INMEDIATAMENTE)
- Admin: admin@pharma.com / Admin@PharmaQMS2024!
- Calidad: calidad@pharma.com / User@PharmaQMS2024!

## Despliegue en producción (Docker Compose)
```bash
docker-compose up -d
```

## Cumplimiento Regulatorio
Sistema diseñado para cumplir:
- FDA 21 CFR Part 11
- EU GMP Annex 11
- GAMP 5 Segunda Edición
- ALCOA+ (Data Integrity)
- ISO 9001 / ISO 27001

## Documentación de Validación
Ver: docs/validation/VMP-PharmaQMS-001.md
