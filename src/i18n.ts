import type { Language } from './types'

export const labels = {
  es: {
    brand: 'Daniel Almazán',
    title: '¿Dónde\nencajas\nen España?',
    dek: '¿Eres la norma, o la excepción? Descubre cuántas personas comparten un perfil parecido al tuyo',
    privacy: 'Todo ocurre en tu navegador. No guardamos ni enviamos tus respuestas.',
    dataTag: 'INE · ECV 2025',
    formTitle: 'Construye tu perfil',
    formHint: 'Puedes excluir cualquier rasgo del cálculo combinado.',
    age: 'Edad',
    ageHelp: 'Años cumplidos',
    region: 'Comunidad autónoma',
    regionHelp: 'Se usa como contexto. Añadirla al perfil reduce mucho la muestra.',
    activity: 'Situación laboral actual',
    education: 'Estudios terminados',
    household: 'Con quién vives',
    householdHelp: '“Hijos” significa menores o jóvenes económicamente dependientes que viven en el hogar.',
    income: 'Salario bruto recibido en 2024',
    incomeHelp: 'Lo que cobraste como asalariado durante 2024 (antes de impuestos), aunque no trabajaras todo el año.',
    optional: 'Opcional',
    includeProfile: 'Incluir en “Personas como tú”',
    calculate: 'Ver mi posición',
    loading: 'Preparando las comparaciones…',
    error: 'No se pudieron cargar los datos. Inténtalo de nuevo.',
    peopleLike: 'Personas como tú',
    estimated: 'personas aproximadamente',
    oneIn: 'alrededor de 1 de cada {value} adultos en España ({percentage}%)',
    universe: 'Adultos de 18 o más años que viven en hogares privados.',
    exact: 'Coincidencia exacta',
    broadened: 'Perfil ampliado por muestra pequeña',
    broadenedText: 'La combinación exacta tiene poca muestra. {detail}; el resto coincide exactamente.',
    broadenedAge: 'Hemos ampliado solo la edad (grupo de {range})',
    broadenedIncome: 'Hemos ampliado solo el salario ({range})',
    broadenedBoth: 'Hemos ampliado la edad (grupo de {ageRange}) y el salario ({incomeRange})',
    unavailable: 'No hay muestra suficiente',
    unavailableText: 'Ni siquiera ampliando edad o salario podemos publicar una estimación responsable. Quita una característica para recuperar el último grupo fiable.',
    regionWarning: 'La comunidad está incluida. En perfiles detallados puede impedir una estimación.',
    position: 'Tu posición en España',
    younger: 'de la población es más joven que tú',
    older: 'es mayor que tú',
    sameActivity: 'de los adultos de tu grupo de edad comparte tu situación laboral',
    sameEducation: 'tiene el mismo nivel de estudios que tú',
    sameHousehold: 'vive en un hogar parecido al tuyo',
    salaryPercentile: 'Ganaste más que aproximadamente el',
    salaryComparator: 'de las personas asalariadas con ingresos en 2024',
    salaryNoValue: 'Añade tu salario de 2024 para ver esta comparación.',
    progression: 'Cómo se reduce tu grupo',
    progressionHint: 'Añadimos tus características una a una. Cada paso conserva las anteriores; el porcentaje muestra qué parte del grupo inicial permanece.',
    people: 'personas',
    method: 'Cómo está calculado',
    methodIntro: 'Contamos combinaciones observadas en una encuesta oficial; no multiplicamos probabilidades independientes.',
    methodPoints: [
      'Fuente principal: microdatos transversales de la ECV 2025. Los ingresos se refieren a 2024.',
      'Cada persona representa a otras mediante el factor oficial de ponderación PB040.',
      'Publicamos el dato exacto solo con al menos 50 casos y una muestra efectiva de 30.',
      'Si falta muestra, ampliamos de forma determinista edad y/o salario. Nunca cambiamos silenciosamente los demás rasgos.',
      'La estimación representa adultos en hogares privados; no incluye residencias colectivas.'
    ],
    sources: 'Fuentes y límites',
    sourceLink: 'Ver microdatos del INE',
    censusLink: 'Ver Censo Anual 2025',
    methodology: 'Metodología completa',
    footer: 'Un proyecto de Daniel Almazán con datos del Instituto Nacional de Estadística.',
    activityLabels: {
      employee: 'Asalariado/a', self_employed: 'Autónomo/a o empleador/a', unemployed: 'En paro', retired: 'Jubilado/a', student: 'Estudiante', other_inactive: 'Otra inactividad'
    },
    educationLabels: {
      primary: 'Primaria o menos', lower_secondary: 'Primera etapa de secundaria', upper_secondary: 'Bachillerato, FP o similar', tertiary: 'Educación superior'
    },
    householdLabels: {
      alone: 'Vivo solo/a', two_no_children: 'Dos adultos, sin hijos dependientes', one_parent: 'Un adulto con hijos dependientes', two_with_children: 'Dos adultos con hijos dependientes', other_no_children: 'Otro hogar sin hijos dependientes', other_with_children: 'Otro hogar con hijos dependientes'
    },
    regionLabels: {
      ES61: 'Andalucía', ES24: 'Aragón', ES12: 'Principado de Asturias', ES53: 'Illes Balears', ES70: 'Canarias', ES13: 'Cantabria', ES41: 'Castilla y León', ES42: 'Castilla-La Mancha', ES51: 'Cataluña', ES52: 'Comunitat Valenciana', ES43: 'Extremadura', ES11: 'Galicia', ES30: 'Comunidad de Madrid', ES62: 'Región de Murcia', ES22: 'Comunidad Foral de Navarra', ES21: 'País Vasco', ES23: 'La Rioja', ES63: 'Ceuta', ES64: 'Melilla'
    }
  },
  en: {
    brand: 'Daniel Almazán',
    title: 'Where do you\nfit in Spain?',
    dek: 'Are you the norm, or the exception? Discover how many people share a profile similar to yours',
    privacy: 'Everything happens in your browser. Your answers are never stored or sent.',
    dataTag: 'INE · ECV 2025',
    formTitle: 'Build your profile',
    formHint: 'You can exclude any characteristic from the combined estimate.',
    age: 'Age', ageHelp: 'Completed years', region: 'Autonomous Community',
    regionHelp: 'Used for context. Adding it to your profile greatly reduces the sample.',
    activity: 'Current employment status', education: 'Highest completed education', household: 'Who you live with',
    householdHelp: '“Children” means economically dependent children or young people living in the household.',
    income: 'Gross employee pay received in 2024',
    incomeHelp: 'What you received as an employee during 2024, before tax, even if you did not work the full year.',
    optional: 'Optional', includeProfile: 'Include in “People like you”', calculate: 'See my position',
    loading: 'Preparing comparisons…', error: 'The data could not be loaded. Please try again.', peopleLike: 'People like you',
    estimated: 'people, approximately', oneIn: 'around 1 in {value} adults in Spain ({percentage}%)',
    universe: 'Adults aged 18+ living in private households.', exact: 'Exact match', broadened: 'Broader profile due to small sample',
    broadenedText: 'The exact combination has too little support. {detail}; every other characteristic still matches exactly.',
    broadenedAge: 'We broadened only age ({range})',
    broadenedIncome: 'We broadened only pay ({range})',
    broadenedBoth: 'We broadened age ({ageRange}) and pay ({incomeRange})',
    unavailable: 'Not enough sample', unavailableText: 'Even after broadening age or pay, a responsible estimate cannot be published. Remove one characteristic to return to the last reliable group.',
    regionWarning: 'Region is included. For detailed profiles it may prevent an estimate.', position: 'Your position in Spain',
    younger: 'of the population is younger than you', older: 'is older than you',
    sameActivity: 'of adults in your age group share your employment status', sameEducation: 'have the same education level as you',
    sameHousehold: 'live in a household like yours', salaryPercentile: 'You earned more than approximately',
    salaryComparator: 'of employees with income in 2024', salaryNoValue: 'Add your 2024 pay to see this comparison.',
    progression: 'How your group narrows', progressionHint: 'We add your characteristics one by one. Each step keeps the previous ones; the percentage shows how much of the initial group remains.',
    people: 'people', method: 'How it is calculated',
    methodIntro: 'We count combinations observed in an official survey; we do not multiply independent probabilities.',
    methodPoints: [
      'Primary source: ECV 2025 cross-sectional microdata. Income refers to 2024.',
      'Each respondent represents others through the official PB040 survey weight.',
      'We publish an exact result only with at least 50 records and an effective sample of 30.',
      'When support is low, age and/or pay are broadened deterministically. Other characteristics are never silently changed.',
      'The estimate represents adults in private households and excludes collective residences.'
    ],
    sources: 'Sources and limitations', sourceLink: 'View INE microdata', censusLink: 'View 2025 Annual Census', methodology: 'Full methodology',
    footer: 'A project by Daniel Almazán using data from Spain’s National Statistics Institute.',
    activityLabels: {
      employee: 'Employee', self_employed: 'Self-employed or employer', unemployed: 'Unemployed', retired: 'Retired', student: 'Student', other_inactive: 'Other inactivity'
    },
    educationLabels: {
      primary: 'Primary or less', lower_secondary: 'Lower secondary', upper_secondary: 'Upper secondary or vocational', tertiary: 'Higher education'
    },
    householdLabels: {
      alone: 'I live alone', two_no_children: 'Two adults, no dependent children', one_parent: 'One adult with dependent children', two_with_children: 'Two adults with dependent children', other_no_children: 'Other household without dependent children', other_with_children: 'Other household with dependent children'
    },
    regionLabels: {
      ES61: 'Andalusia', ES24: 'Aragon', ES12: 'Asturias', ES53: 'Balearic Islands', ES70: 'Canary Islands', ES13: 'Cantabria', ES41: 'Castile and León', ES42: 'Castilla-La Mancha', ES51: 'Catalonia', ES52: 'Valencian Community', ES43: 'Extremadura', ES11: 'Galicia', ES30: 'Community of Madrid', ES62: 'Region of Murcia', ES22: 'Navarre', ES21: 'Basque Country', ES23: 'La Rioja', ES63: 'Ceuta', ES64: 'Melilla'
    }
  }
} as const

export type Copy = (typeof labels)[Language]
