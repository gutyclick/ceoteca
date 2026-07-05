import type { Book, BookCategory } from "@/types";

const defaultAnalysis = [
  {
    title: "Idea central",
    content:
      "Este análisis ofrece una interpretación editorial propia: el valor del libro está en convertir una idea amplia en decisiones pequeñas que el lector pueda probar esta semana.",
  },
  {
    title: "Aplicación práctica",
    content:
      "La experiencia propone detectar un área concreta, elegir una acción mínima y medir si esa acción reduce fricción o mejora claridad. No busca prometer resultados, sino crear un punto de partida.",
  },
  {
    title: "Limitación útil",
    content:
      "Ninguna idea funciona igual para todas las personas. El lector debe adaptar el enfoque a su contexto, energía, responsabilidades y recursos disponibles.",
  },
];

const defaultKeyPoints = [
  {
    number: 1,
    title: "Reduce la fricción",
    explanation:
      "Una acción sencilla tiene más probabilidad de repetirse que un plan perfecto pero pesado.",
    example:
      "Preparar el entorno la noche anterior puede hacer más fácil estudiar, ahorrar o entrenar.",
    action: "Elige una acción de menos de cinco minutos para comenzar hoy.",
    limitation:
      "Lo pequeño no reemplaza una estrategia completa; solo ayuda a iniciar con menos resistencia.",
  },
  {
    number: 2,
    title: "Mide lo que importa",
    explanation:
      "El progreso se vuelve visible cuando se registra una señal concreta y fácil de revisar.",
    example:
      "Marcar tres sesiones completadas puede ser más útil que esperar motivación perfecta.",
    action: "Define una métrica simple para los próximos siete días.",
    limitation:
      "Medir demasiado puede distraer; conviene elegir una sola señal principal.",
  },
  {
    number: 3,
    title: "Adapta antes de abandonar",
    explanation:
      "Cuando una práctica falla, puede necesitar ajuste de contexto, horario o dificultad.",
    example:
      "Si leer de noche no funciona, prueba diez minutos después del almuerzo.",
    action: "Cambia una variable antes de descartar el hábito o sistema.",
    limitation:
      "Algunas metas requieren apoyo externo o condiciones que no dependen solo del usuario.",
  },
];

const defaultActivities = [
  {
    title: "Pregunta de reflexión",
    prompt:
      "¿Qué acción pequeña te acercaría a este aprendizaje sin depender de motivación alta?",
    type: "reflection" as const,
  },
  {
    title: "Checklist de inicio",
    prompt: "Marca tres condiciones que puedes preparar antes de empezar.",
    type: "checklist" as const,
    options: [
      "Lugar definido",
      "Recordatorio visible",
      "Tiempo bloqueado",
      "Meta reducida",
    ],
  },
  {
    title: "Escenario práctico",
    prompt:
      "Imagina que solo tienes 12 minutos al día. ¿Qué parte del aprendizaje conservarías y qué eliminarías?",
    type: "scenario" as const,
  },
];

const disciplinedEntrepreneurshipAnalysis = [
  {
    title: "El emprendimiento como proceso aprendible",
    content:
      "Disciplined Entrepreneurship desmonta la idea de que los grandes emprendedores simplemente nacen. El enfoque de Bill Aulet, desde el MIT, es que emprender puede aprenderse como un conjunto de habilidades observables: elegir un mercado, entender al cliente, cuantificar valor, diseñar adquisición, validar supuestos y construir un producto que pueda convertirse en negocio.",
  },
  {
    title: "Innovación exige invención y comercialización",
    content:
      "La fórmula central del análisis es clara: Innovación = Invención × Comercialización. Una invención sin comercialización no crea impacto, y una buena comercialización sin una propuesta diferencial tampoco sostiene una ventaja. La pregunta deja de ser solo qué queremos construir y pasa a ser quién pagaría, por qué, cuánto valor recibe y cómo llegamos a esa persona.",
  },
  {
    title: "No todo emprendimiento funciona igual",
    content:
      "Antes de explicar los 24 pasos, Aulet diferencia dos caminos: pequeñas empresas orientadas a independencia, mercados locales y crecimiento lineal, frente a empresas impulsadas por innovación que buscan escala, mercados amplios, capital externo y ventajas difíciles de copiar. Ninguna es superior por defecto, pero confundirlas puede llevar a decisiones equivocadas de producto, financiamiento, equipo y crecimiento.",
  },
  {
    title: "Los 24 pasos como sistema iterativo",
    content:
      "Los pasos se agrupan en seis preguntas: quién es el cliente, qué puedes hacer por él, cómo lo adquieres, si el negocio es rentable, qué debes construir y cómo pruebas que funciona en el mercado real. Aunque la secuencia importa, el proceso no es rígido: cada aprendizaje puede obligarte a volver y mejorar una respuesta anterior.",
  },
  {
    title: "Aplicación Ceoteca",
    content:
      "Este análisis convierte el framework en acciones concretas: definir un beachhead market, elegir un Persona real, cuantificar el valor, mapear ventas, estimar LTV y COCA, declarar la ventaja central, diseñar el MVBP y probar el supuesto más riesgoso antes de escalar.",
  },
];

const disciplinedEntrepreneurshipKeyPoints = [
  {
    number: 1,
    title: "Elige un mercado de entrada",
    explanation:
      "Intentar servir a todos desde el inicio diluye el mensaje, el producto y los canales. El beachhead market es el primer segmento donde puedes concentrarte hasta aprender, vender y dominar una necesidad específica.",
    example:
      "En vez de vender software de logística a cualquier empresa, empiezas con gerentes de logística de pymes manufactureras de una región concreta.",
    action:
      "Define un segmento con dolor similar, canal de venta identificable y clientes que puedan recomendarte entre sí.",
    limitation:
      "Un mercado pequeño ayuda a enfocar, pero debe ser suficiente para validar un negocio real y abrir mercados posteriores.",
  },
  {
    number: 2,
    title: "Convierte el cliente ideal en una persona real",
    explanation:
      "Un perfil genérico permite discusiones interminables. Un Persona real obliga a observar comportamientos concretos, prioridades, restricciones y decisiones de compra verificables.",
    example:
      "No basta con decir 'directores financieros'. Mejor: una persona específica, con cargo, empresa, problema actual, presupuesto y forma real de resolverlo hoy.",
    action:
      "Elige una persona que puedas entrevistar esta semana y documenta su trabajo, dolor principal, solución actual y costo del problema.",
    limitation:
      "Un solo Persona no representa todo el mercado; sirve como punto de partida para validar patrones con más clientes.",
  },
  {
    number: 3,
    title: "Cuantifica la propuesta de valor",
    explanation:
      "Una propuesta de valor débil usa palabras como rápido, fácil o mejor. Una propuesta fuerte traduce el beneficio a dinero, tiempo, riesgo reducido o ingresos nuevos.",
    example:
      "Ahorrar 8 horas semanales por empleado comunica mejor el valor que decir 'mejora la productividad del equipo'.",
    action:
      "Escribe cuánto gana, ahorra o evita perder tu cliente si tu solución funciona.",
    limitation:
      "La cuantificación inicial será una hipótesis; debe confirmarse con clientes y datos reales.",
  },
  {
    number: 4,
    title: "Diseña adquisición y ventas temprano",
    explanation:
      "El producto no vive separado del proceso comercial. Necesitas saber quién decide, quién influye, cómo se compra, cuánto tarda la decisión y qué objeciones aparecen.",
    example:
      "En B2B, el usuario puede amar el producto, pero compras, finanzas o dirección pueden bloquear la adopción.",
    action:
      "Mapa la unidad de decisión: usuario final, comprador económico, influenciadores, aprobadores y bloqueadores.",
    limitation:
      "El mapa de ventas cambia cuando sales al mercado; úsalo como hipótesis viva, no como documento fijo.",
  },
  {
    number: 5,
    title: "Valida la economía del cliente",
    explanation:
      "Un negocio necesita que el valor de vida del cliente sea superior al costo de adquirirlo. Si cada venta cuesta más de lo que deja, el problema no es solo de marketing: es estructural.",
    example:
      "Una suscripción de bajo precio puede parecer atractiva, pero si requiere ventas consultivas largas, el costo comercial puede destruir el margen.",
    action:
      "Estima LTV, COCA, precio, margen y tiempo de recuperación antes de comprometerte con un modelo.",
    limitation:
      "Las cifras tempranas son aproximadas; su valor está en revelar supuestos críticos para probar.",
  },
  {
    number: 6,
    title: "Prueba que el mercado lo acepta",
    explanation:
      "La validación más fuerte no es una encuesta positiva, sino comportamiento real: clientes que pagan, usan el producto, vuelven o recomiendan.",
    example:
      "Una carta de intención, una preventa o un piloto pagado dice más que cien comentarios de 'me parece interesante'.",
    action:
      "Define el supuesto más riesgoso y diseña una prueba que produzca evidencia observable en los próximos 7 días.",
    limitation:
      "No toda industria permite transacciones rápidas; aun así, busca señales más fuertes que opiniones.",
  },
];

const disciplinedEntrepreneurshipActivities = [
  {
    title: "Test del Persona en 5 minutos",
    prompt:
      "Piensa en tu idea actual y escribe el nombre real de una persona que podría ser tu cliente. Describe su cargo, empresa, preocupación principal, solución actual y costo del problema en tiempo o dinero.",
    type: "reflection" as const,
    options: [
      "Nombre real del cliente",
      "Cargo y contexto laboral",
      "Problema que no lo deja avanzar",
      "Solución actual",
      "Costo actual del problema",
    ],
  },
  {
    title: "Canvas de Startup Disciplinado",
    prompt:
      "Completa una hoja con tu proyecto, beachhead market, Persona, problema central, propuesta de valor cuantificada, modelo de negocio, LTV, COCA, ventaja central, MVBP y supuesto más riesgoso.",
    type: "checklist" as const,
    options: [
      "Mercado de entrada",
      "Persona real",
      "Valor en números",
      "Modelo de negocio",
      "Supuesto más riesgoso",
    ],
  },
  {
    title: "Ruta de validación de 7 días",
    prompt:
      "Durante una semana, valida una sola hipótesis: habla con clientes, documenta patrones, ajusta la propuesta de valor y decide si avanzas, cambias de segmento o replanteas el problema.",
    type: "scenario" as const,
    options: [
      "Día 1: hipótesis",
      "Días 2-4: entrevistas",
      "Día 5: patrones",
      "Día 6: ajuste",
      "Día 7: decisión",
    ],
  },
];

export const bookCategories: Array<"Todos" | BookCategory> = [
  "Todos",
  "Emprendimiento",
  "Ventas",
  "Marketing",
  "Finanzas personales",
  "Inversiones",
  "Ingresos y riqueza",
  "Desarrollo personal",
  "Liderazgo",
  "Productividad",
  "Psicología y comportamiento",
  "Estrategia empresarial",
  "Comunicación",
  "Negociación",
  "Innovación y tecnología",
  "Biografías y casos de éxito",
];

export const catalogBooks: Book[] = [
  {
    id: "disciplined-entrepreneurship",
    slug: "disciplined-entrepreneurship",
    title: "La disciplina de emprender",
    author: "Bill Aulet",
    category: "Emprendimiento",
    description:
      "Análisis de Disciplined Entrepreneurship: la metodología del MIT para convertir una idea de startup en un proceso disciplinado de mercado, cliente, valor, producto y validación.",
    readingTime: 10,
    difficulty: "Intermedio",
    tags: [
      "startup",
      "validación",
      "cliente",
      "innovación",
      "modelo de negocio",
      "MIT",
    ],
    cover: {
      variant: "growth",
      gradient: "from-indigo-400 via-brand-purple to-brand-pink",
      accent: "text-brand-purple",
      imagePath: "/images/PORTADAS%20EN%20PNG/LA%20DISCIPLINA%20DE%20EMPRENDER.png",
    },
    isFeatured: true,
    isPublished: true,
    isDemoContent: false,
    progress: 0,
    purchaseUrl:
      "https://www.wiley.com/en-us/Disciplined+Entrepreneurship%3A+24+Steps+to+a+Successful+Startup-p-9781118692288",
    analysis: disciplinedEntrepreneurshipAnalysis,
    keyPoints: disciplinedEntrepreneurshipKeyPoints,
    activities: disciplinedEntrepreneurshipActivities,
    conclusion:
      "Conclusión editorial: Disciplined Entrepreneurship es más útil para emprendedores que ya tienen una idea o tecnología y necesitan convertirla en un sistema de validación. Su fortaleza está en la especificidad; su riesgo es sentirse rígido si se usa como checklist ciego. El mejor uso es iterativo: avanzar con disciplina, aprender del mercado y volver a ajustar las respuestas críticas.",
  },
  {
    id: "hábitos-atomicos",
    slug: "hábitos-atomicos",
    title: "Hábitos Atómicos",
    author: "James Clear",
    category: "Desarrollo personal",
    description:
      "Análisis editorial sobre cómo diseñar sistemas simples para sostener pequeñas mejoras diarias.",
    readingTime: 12,
    difficulty: "Inicial",
    tags: ["hábitos", "disciplina", "sistemas"],
    cover: {
      variant: "orb",
      gradient: "from-brand-blue via-brand-purple to-brand-pink",
      accent: "text-brand-pink",
      imagePath: "/images/PORTADAS%20EN%20PNG/HABITOS%20ATOMICOS.png",
    },
    isFeatured: true,
    isPublished: true,
    isDemoContent: false,
    progress: 38,
    purchaseUrl: "https://www.google.com/search?q=Hábitos+Atómicos+James+Clear",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: el aprendizaje más útil no es acumular ideas, sino diseñar una acción pequeña que pueda repetirse hasta volverse parte del entorno.",
  },
  {
    id: "padre-rico-padre-pobre",
    slug: "padre-rico-padre-pobre",
    title: "Padre Rico, Padre Pobre",
    author: "Robert Kiyosaki",
    category: "Finanzas personales",
    description:
      "Análisis editorial sobre mentalidad financiera, activos, pasivos y decisiones de dinero más conscientes.",
    readingTime: 14,
    difficulty: "Inicial",
    tags: ["finanzas", "dinero", "activos"],
    cover: {
      variant: "steps",
      gradient: "from-emerald-300 to-cyan-400",
      accent: "text-emerald-200",
      imagePath: "/images/PORTADAS%20EN%20PNG/043_PADRE_RICO_PADRE_POBRE.png",
    },
    isPublished: true,
    isDemoContent: false,
    progress: 68,
    purchaseUrl:
      "https://www.google.com/search?q=Padre+Rico+Padre+Pobre+Robert+Kiyosaki",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: pensar mejor sobre dinero empieza por distinguir entre consumo inmediato, activos posibles y hábitos de decisión más conscientes.",
  },
  {
    id: "startup-100",
    slug: "startup-100",
    title: "La Startup de $100",
    author: "Chris Guillebeau",
    category: "Emprendimiento",
    description:
      "Análisis editorial sobre validar ofertas pequeñas, vender pronto y construir negocios livianos.",
    readingTime: 11,
    difficulty: "Inicial",
    tags: ["negocios", "ventas", "validación"],
    cover: {
      variant: "growth",
      gradient: "from-orange-300 to-rose-400",
      accent: "text-orange-200",
      imagePath: "/images/PORTADAS%20EN%20PNG/EL%20EMPRENDIMIENTO%20DE%20LOS%20100.png",
    },
    isPublished: true,
    isDemoContent: false,
    progress: 0,
    purchaseUrl: "https://www.google.com/search?q=La+Startup+de+100+Chris+Guillebeau",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: una idea de negocio gana claridad cuando se convierte rápido en oferta, conversación con clientes y aprendizaje medible.",
  },
  {
    id: "hombre-rico-babilonia",
    slug: "hombre-rico-babilonia",
    title: "El Hombre Más Rico de Babilonia",
    author: "George S. Clason",
    category: "Ingresos y riqueza",
    description:
      "Análisis editorial sobre ahorro, disciplina y construcción gradual de patrimonio personal.",
    readingTime: 10,
    difficulty: "Inicial",
    tags: ["ahorro", "patrimonio", "finanzas"],
    cover: {
      variant: "steps",
      gradient: "from-amber-300 to-yellow-500",
      accent: "text-yellow-200",
      imagePath: "/images/PORTADAS%20EN%20PNG/048_EL_HOMBRE_M%C3%81S_RICO_DE_BABILONIA.png",
    },
    isPublished: true,
    isDemoContent: false,
    purchaseUrl:
      "https://www.google.com/search?q=El+Hombre+Mas+Rico+de+Babilonia",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: la estabilidad financiera suele comenzar con reglas simples, repetidas con paciencia y revisadas con honestidad.",
  },
  {
    id: "pensar-rapido-pensar-despacio",
    slug: "pensar-rapido-pensar-despacio",
    title: "Pensar Rápido, Pensar Despacio",
    author: "Daniel Kahneman",
    category: "Psicología y comportamiento",
    description:
      "Análisis editorial para reconocer sesgos, intuición y decisiones que merecen más pausa.",
    readingTime: 15,
    difficulty: "Avanzado",
    tags: ["decisiones", "sesgos", "mente"],
    cover: {
      variant: "grid",
      gradient: "from-indigo-300 to-violet-500",
      accent: "text-indigo-200",
    },
    isPublished: true,
    isDemoContent: false,
    purchaseUrl:
      "https://www.google.com/search?q=Pensar+Rapido+Pensar+Despacio+Daniel+Kahneman",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: tomar mejores decisiones exige reconocer cuándo la intuición ayuda y cuándo conviene detenerse a revisar supuestos.",
  },
  {
    id: "poder-del-ahora",
    slug: "poder-del-ahora",
    title: "El Poder del Ahora",
    author: "Eckhart Tolle",
    category: "Desarrollo personal",
    description:
      "Análisis editorial sobre presencia, atención y reducción de ruido mental en la vida diaria.",
    readingTime: 13,
    difficulty: "Intermedio",
    tags: ["presencia", "atención", "calma"],
    cover: {
      variant: "orb",
      gradient: "from-sky-300 to-blue-500",
      accent: "text-sky-200",
      imagePath: "/images/PORTADAS%20EN%20PNG/088_EL_PODER_DEL_AHORA.png",
    },
    isPublished: true,
    isDemoContent: false,
    purchaseUrl: "https://www.google.com/search?q=El+Poder+del+Ahora+Eckhart+Tolle",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: practicar presencia no elimina los problemas, pero puede cambiar la relación que tenemos con ellos.",
  },
  {
    id: "como-ganar-amigos",
    slug: "como-ganar-amigos",
    title: "Cómo Ganar Amigos e Influir Sobre las Personas",
    author: "Dale Carnegie",
    category: "Comunicación",
    description:
      "Análisis editorial sobre escucha, empatía y relaciones profesionales más cuidadosas.",
    readingTime: 12,
    difficulty: "Inicial",
    tags: ["comúnicación", "relaciones", "influencia"],
    cover: {
      variant: "people",
      gradient: "from-cyan-300 to-blue-600",
      accent: "text-cyan-200",
    },
    isPublished: true,
    isDemoContent: false,
    purchaseUrl:
      "https://www.google.com/search?q=Como+Ganar+Amigos+e+Influir+Sobre+las+Personas",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: las relaciones mejoran cuando la atención deja de estar solo en convencer y empieza a incluir escucha real.",
  },
  {
    id: "semana-laboral-4-horas",
    slug: "semana-laboral-4-horas",
    title: "La Semana Laboral de 4 Horas",
    author: "Tim Ferriss",
    category: "Productividad",
    description:
      "Análisis editorial sobre foco, delegación, automatización y diseño de tiempo.",
    readingTime: 13,
    difficulty: "Intermedio",
    tags: ["tiempo", "foco", "automatización"],
    cover: {
      variant: "bolt",
      gradient: "from-violet-300 to-fuchsia-500",
      accent: "text-fuchsia-200",
      imagePath: "/images/PORTADAS%20EN%20PNG/071_LA_SEMANA_LABORAL_DE_4_HORAS.png",
    },
    isPublished: true,
    isDemoContent: false,
    purchaseUrl:
      "https://www.google.com/search?q=La+Semana+Laboral+de+4+Horas+Tim+Ferriss",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: optimizar el tiempo exige elegir qué eliminar, qué delegar y qué merece atención profunda.",
  },
  {
    id: "mindset",
    slug: "mindset",
    title: "Mindset",
    author: "Carol S. Dweck",
    category: "Desarrollo personal",
    description:
      "Análisis editorial sobre mentalidad de crecimiento, aprendizaje y respuesta al error.",
    readingTime: 11,
    difficulty: "Inicial",
    tags: ["aprendizaje", "mentalidad", "crecimiento"],
    cover: {
      variant: "growth",
      gradient: "from-lime-300 to-emerald-500",
      accent: "text-lime-200",
      imagePath: "/images/PORTADAS%20EN%20PNG/087_MENTALIDAD.png",
    },
    isPublished: true,
    isDemoContent: false,
    purchaseUrl: "https://www.google.com/search?q=Mindset+Carol+Dweck",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: una mentalidad de aprendizaje se nota menos en lo que decimos creer y más en cómo respondemos al error.",
  },
  {
    id: "inversor-inteligente",
    slug: "inversor-inteligente",
    title: "El Inversor Inteligente",
    author: "Benjamin Graham",
    category: "Inversiones",
    description:
      "Análisis editorial sobre prudencia, margen de seguridad y disciplina al invertir.",
    readingTime: 15,
    difficulty: "Avanzado",
    tags: ["inversión", "riesgo", "valor"],
    cover: {
      variant: "grid",
      gradient: "from-slate-300 to-emerald-500",
      accent: "text-emerald-200",
      imagePath: "/images/PORTADAS%20EN%20PNG/EL%20INVERSOR%20INTELIGENTE.png",
    },
    isPublished: true,
    isDemoContent: false,
    purchaseUrl:
      "https://www.google.com/search?q=El+Inversor+Inteligente+Benjamin+Graham",
    analysis: defaultAnalysis,
    keyPoints: defaultKeyPoints,
    activities: defaultActivities,
    conclusion:
      "Conclusión editorial: invertir con prudencia requiere reglas, margen de seguridad y una relación madura con la incertidumbre.",
  },
];

export function filterBooks(
  books: Book[],
  query: string,
  category: "Todos" | BookCategory,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return books.filter((book) => {
    const matchesCategory = category === "Todos" || book.category === category;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [book.title, book.author, book.category, ...book.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}

export function getBooksByCategory(category: BookCategory) {
  return catalogBooks.filter((book) => book.category === category);
}

export function getBookBySlug(slug: string) {
  return catalogBooks.find((book) => book.slug === slug) ?? null;
}
