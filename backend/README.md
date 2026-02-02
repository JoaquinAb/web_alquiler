# Django Backend - Alquiler de Vajillas

## Configuración

1. Crear entorno virtual:
```bash
python -m venv venv
source venv/bin/activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar PostgreSQL:
- Crear base de datos `alquiler_vajillas`
- Copiar `.env.example` a `.env` y completar credenciales

4. Ejecutar migraciones:
```bash
python manage.py migrate
```

5. Crear superusuario:
```bash
python manage.py createsuperuser
```

6. Iniciar servidor:
```bash
python manage.py runserver
```
