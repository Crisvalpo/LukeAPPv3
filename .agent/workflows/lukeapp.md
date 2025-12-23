---
description: WORKSPACE RULES (LukeAPP)
---

7️⃣ Separación Online vs Field (CRÍTICA)

Treat### 7. Lenguaje Técnico

| Capa | Idioma |
|------|--------|
| Base de datos | Inglés |
| Tablas/Columnas | Inglés |
| Funciones/APIs | Inglés |
| Código | Inglés |
| UI/Labels | Español |

---

## 🏨 LOBBY: "HALL DEL PROYECTO"

### Definición Formal

El Lobby es el espacio común del proyecto donde el usuario:
- Confirma su contexto (Proyecto + Rol)
- Completa su identidad profesional
- Se informa del estado general del proyecto
- Recibe comunicación oficial
- Se prepara para la operación

⚠️ **El Lobby NO es un dashboard operativo**
⚠️ **El Lobby NO ejecuta acciones críticas**

**Regla:** El Lobby informa, orienta y motiva. Los Dashboards ejecutan.

### Modelo Invite-Only

- Los usuarios **NO eligen** proyectos libremente
- Cada usuario pertenece a **UN ÚNICO** proyecto, asignado mediante invitación
- Sin proyecto → **Empty Lobby State** (contactar admin)
- Con proyecto → **Hall del Proyecto** (acceso a las 6 funcionalidades)

### Funcionalidades del Lobby (Fase 1 - Placeholder)

1. **Perfil del Usuario**: Foto, cargo, skills, experiencia, completitud %
2. **Estado Macro del Proyecto**: Semana actual, % avance, fase, próximo hito
3. **Galería de Avance**: Fotos destacadas, videos (curado, sin comentarios)
4. **Comunicaciones Oficiales**: Avisos, campañas de seguridad, comunicados
5. **Tareas Futuras**: Asignaciones próximas, inducciones (solo lectura)
6. **Social Light**: Intereses del usuario (capacitación, horas extra) - controlado, sin chat

### Ruta del Usuario (LEY DEL SISTEMA)

```
Landing → Auth → Lobby → Dashboard según Rol
```

- El Lobby es **obligatorio** antes de cualquier feature operativa
- Sin contexto (empresa + proyecto + rol) → Sin aplicación

--- Web Core (online) and Field Apps (offline-first) as separate worlds.
Do not share execution logic between them.
Only shared domain models and types are allowed.

8️⃣ Offline-first real (no simulación)

Field applications must be designed as offline-first.
Never block a field action due to missing connectivity.
All actions must be stored locally and synchronized later.

9️⃣ Event-based thinking

Field apps must emit events, not directly mutate global state.
Synchronization must be based on ordered events and eventual consistency.

🔟 No sync assumptions

Never assume immediate synchronization.
Code must tolerate delayed, partial, or failed sync attempts.

1️⃣1️⃣ Lobby obligatorio

No user may access operational features without passing through the Lobby and selecting a context (company, project, role).

1️⃣2️⃣ Roles are scoped

Roles are always scoped to a project context.
Never treat roles as global permissions.

1️⃣3️⃣ No hidden coupling

Do not introduce hidden dependencies between apps or modules.
All communication must happen through explicit contracts.

1️⃣4️⃣ Avoid premature optimization

Do not optimize for performance at the cost of clarity or correctness.
Optimize only when a real bottleneck is identified.

1️⃣5️⃣ If unclear, stop

If a requirement or decision is unclear or missing, do not assume.
Ask for clarification before implementing.

🧾 REGLA FINAL (MUY IMPORTANTE)

LukeAPP is a long-term enterprise platform.
Any solution that cannot scale to multiple companies, projects, and teams is invalid.