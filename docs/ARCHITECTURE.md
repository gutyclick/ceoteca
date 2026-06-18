# Ceoteca — Arquitectura técnica

## 1. Principios

- Monolito modular con Next.js.
- Server Components por defecto.
- Lógica sensible en servidor.
- Servicios externos desacoplados.
- Modo demo sin dependencias externas.
- Tipado de extremo a extremo.
- Configuración centralizada.
- Fácil migración de mock data a Supabase.

## 2. Estructura recomendada

```text
src/
  app/
    (marketing)/
      page.tsx
      pricing/
      biblioteca/
      registro/
      login/
      terminos/
      privacidad/
    (app)/
      home/
      libro/[slug]/
      perfil/
      planes/
    api/
      chat/
      audio/
      books/
      profile/
      subscription/
  components/
    marketing/
    app/
    books/
    chat/
    pricing/
    auth/
    ui/
  config/
    site.ts
    navigation.ts
    plans.ts
    features.ts
  data/
    books.ts
    faqs.ts
    testimonials.ts
  lib/
    auth/
    supabase/
    openai/
    payments/
    permissions/
    validation/
    utils/
  hooks/
  types/
  styles/
supabase/
  migrations/
public/
  images/
  audio/
docs/
```

## 3. Capas

### Presentación

- Pages.
- Layouts.
- Components.
- Client interactions.

### Dominio

- Books.
- Plans.
- Permissions.
- Progress.
- Chat usage.
- Subscription state.

### Datos

- Repositories.
- Supabase clients.
- Mock repositories.
- DTOs and mappers.

### Integraciones

- OpenAI.
- Payment provider.
- Storage.
- Analytics futuro.

## 4. Abstracciones

### Auth provider

```ts
interface AuthProvider {
  getCurrentUser(): Promise<AppUser | null>;
  signIn(input: SignInInput): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  signOut(): Promise<void>;
}
```

Implementaciones:

- `DemoAuthProvider`.
- `SupabaseAuthProvider`.

### Book repository

```ts
interface BookRepository {
  list(filters?: BookFilters): Promise<Book[]>;
  getBySlug(slug: string): Promise<Book | null>;
}
```

Implementaciones:

- `MockBookRepository`.
- `SupabaseBookRepository`.

### Payment provider

```ts
interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  createPortal(userId: string): Promise<PortalResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}
```

Implementación inicial:

- `DisabledPaymentProvider`.

Implementaciones futuras:

- Stripe.
- Paddle.
- Lemon Squeezy.

### AI provider

```ts
interface AIProvider {
  answerBookQuestion(input: BookChatInput): Promise<BookChatResult>;
  generateSpeech(input: SpeechInput): Promise<SpeechResult>;
}
```

Implementaciones:

- `MockAIProvider`.
- `OpenAIProvider`.

## 5. Configuración central

### `src/config/site.ts`

- Nombre.
- Descripción.
- URL.
- Redes.
- Email de soporte.
- Métricas demo.

### `src/config/plans.ts`

- Precios.
- Límites.
- Features.
- Periodicidad.
- Oferta fundador.

### `src/config/navigation.ts`

- Rutas públicas.
- Rutas privadas.
- Footer.
- Mobile nav.

### `src/config/features.ts`

Definición única de features:

- `allBooks`
- `audio`
- `chat`
- `unlimitedChat`
- `earlyAccess`
- `advancedActivities`

## 6. Permisos

Función central:

```ts
canAccessFeature(plan, feature)
```

Nunca dispersar condiciones de plan por componentes.

La UI puede ocultar o bloquear, pero el servidor debe volver a validar.

## 7. Renderizado

Usar Server Components para:

- Metadata.
- Layouts.
- Obtención inicial de libros.
- Validación de sesión.
- Datos de perfil.
- Verificación de plan.

Usar Client Components para:

- Formularios.
- Carruseles interactivos.
- Filtros en tiempo real.
- Audio player.
- Chat.
- Quizzes.
- Modales.
- Drawers.

## 8. Protección de rutas

Middleware para:

- `/home`
- `/libro/:path*`
- `/perfil`
- `/planes`

Comportamiento:

- Modo demo: permitir acceso con usuario mock.
- Modo real: verificar sesión.
- Sin sesión: redirigir a `/login`.
- Preservar `next` para redirección posterior.

## 9. Manejo de errores

- Errores de dominio tipados.
- Respuestas API consistentes.
- No devolver stack traces al cliente.
- Logging de servidor preparado.
- Error boundaries por área.
- `not-found.tsx` para libros inexistentes.
- `loading.tsx` cuando aporte valor.

Formato recomendado:

```ts
type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
```

## 10. Seguridad

- Service role key solo en servidor.
- OpenAI key solo en servidor.
- Rate limiting para chat.
- Límites de longitud.
- Zod en endpoints.
- RLS en Supabase.
- Verificación de plan y uso en servidor.
- No confiar en `bookId`, `plan` o `userId` del cliente.
- Sanitizar texto cuando se renderice como HTML.
- Preferir texto estructurado, no HTML arbitrario.

## 11. Rendimiento

- `next/image`.
- Lazy loading.
- Server Components.
- Evitar dependencias pesadas.
- Datos paginados cuando el catálogo crezca.
- Skeletons.
- Audio servido desde storage/CDN.
- No regenerar audio en cada reproducción.
- Índices en base de datos.
- Caché configurable para libros publicados.

## 12. Testing mínimo

- Tests de permisos.
- Tests de validadores.
- Tests de configuración de planes.
- Tests de mapeo de datos.
- Test de endpoint mock de chat.
- Tests de límites mensuales.
