# Habilidades

Cada habilidad pertenece a una categoría y puede precisar subcategoría. El contrato nuevo usa `difficulty_start` y `difficulty_max` con `fundamentals`, `application`, `advanced` y `expert`. Los campos heredados `difficulty` y `maximum_difficulty` se conservan temporalmente para el motor actual.

Una habilidad publicada debe tener conceptos, objetivos de aprendizaje y un plan válido. Los prerrequisitos usan mastery `0..1` y no admiten autorreferencia ni ciclos.

Una habilidad describe lo que el usuario será capaz de hacer, por ejemplo, “Responder objeciones”. Incluye objetivos de aprendizaje, dificultad inicial y máxima, formatos compatibles y plan mínimo.

Para crear una habilidad: selecciona categoría y subcategoría, escribe objetivos observables, añade al menos tres conceptos y relaciona ejercicios publicados. El dominio continúa en `user_skill_mastery`; la nueva tabla cognitiva solo aporta desglose por nivel.
