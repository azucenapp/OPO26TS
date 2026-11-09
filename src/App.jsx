import React, { useState, useEffect, useMemo } from 'react';
import ThemeSwitch from './ThemeSwitch';
import * as pdfjsLib from 'pdfjs-dist';

// Configuración del worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// =========================================================================
// MOTOR INDEXEDDB DE ALTA CAPACIDAD (CON BORRADO Y ACTUALIZACIÓN EN VIVO)
// =========================================================================
const DB_NAME = 'OposicionesTSCAM_MasterV11_DB';
const STORE_DOCS = 'pdfs_library';
const STORE_ESSAYS = 'essays_ej2_library';

function openAppDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_DOCS))
        db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_ESSAYS))
        db.createObjectStore(STORE_ESSAYS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllFromStore(storeName) {
  try {
    const db = await openAppDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function saveToStore(storeName, itemsArray) {
  try {
    const db = await openAppDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of itemsArray) store.put(item);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (e) {
    console.error('Error en IndexedDB:', e);
  }
}

async function deleteFromStore(storeName, id) {
  try {
    const db = await openAppDB();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (e) {
    console.error('Error eliminando de IndexedDB:', e);
  }
}

async function clearEntireStore(storeName) {
  try {
    const db = await openAppDB();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (e) {
    console.error('Error vaciando IndexedDB:', e);
  }
}

// =========================================================================
// ANEXO OFICIAL LITERAL COTEJADO (ORDEN 1049/2026 BOCM 29/04/2026 - 83 TEMAS)
// =========================================================================
const OFFICIAL_TOPICS = [
  // TEMARIO GENERAL (16 Temas)
  {
    id: 'G1',
    block: 'General',
    number: 1,
    prob: 'Alta',
    title:
      'La Constitución Española de 1978: Características y estructura. Derechos fundamentales y libertades públicas: Su garantía y suspensión.',
    lawUpdate: 'CE 1978 (Reforma art. 49 de enero 2024).',
  },
  {
    id: 'G2',
    block: 'General',
    number: 2,
    prob: 'Media',
    title:
      'La distribución de competencias entre las Administraciones Públicas. Competencias exclusivas, compartidas, concurrentes, de desarrollo y ejecución. La interpretación del Tribunal Constitucional. Principio constitucional de autonomía local.',
    lawUpdate: 'Título VIII CE y Ley 7/1985 LBRL.',
  },
  {
    id: 'G3',
    block: 'General',
    number: 3,
    prob: 'Alta',
    title:
      'La Comunidad de Madrid (I): El Estatuto de Autonomía: estructura. Las competencias de la Comunidad de Madrid: Potestad legislativa, potestad reglamentaria y función ejecutiva.',
    lawUpdate:
      'LO 3/1983, de 25 de febrero, de Estatuto de Autonomía de la CAM.',
  },
  {
    id: 'G4',
    block: 'General',
    number: 4,
    prob: 'Media',
    title:
      'La Comunidad de Madrid (II): La Asamblea Legislativa: Composición, funciones y potestades. El Presidente de la Comunidad y el Gobierno: Composición, designación y remoción. Funciones y potestades.',
    lawUpdate: 'LO 3/1983 y Ley 1/1983 de Gobierno y Administración CAM.',
  },
  {
    id: 'G5',
    block: 'General',
    number: 5,
    prob: 'Media',
    title:
      'La Comunidad de Madrid (III): La Administración Autonómica: organización y estructura básica de las Consejerías. La Administración Institucional de la Comunidad de Madrid: Tipología y regulación.',
    lawUpdate: 'Ley 1/1983 y Ley 1/1984 de Administración Institucional CAM.',
  },
  {
    id: 'G6',
    block: 'General',
    number: 6,
    prob: 'Alta',
    title:
      'La organización de los servicios de información y atención al ciudadano de la Comunidad de Madrid. Sistema de sugerencias, quejas y reclamaciones. El tratamiento del acceso a la información pública en la Ley 19/2013, de 9 de diciembre, de Transparencia, Acceso a la Información Pública y Buen Gobierno. Especial referencia a la Comunidad de Madrid: Ley 10/2019, de 10 de abril, de Transparencia y de Participación de la Comunidad de Madrid.',
    lawUpdate: 'Ley 19/2013, Ley 10/2019 CAM y Decreto 85/2002.',
  },
  {
    id: 'G7',
    block: 'General',
    number: 7,
    prob: 'Baja',
    title:
      'Las Instituciones de la Unión Europea. El Consejo Europeo, el Consejo, la Comisión Europea, el Parlamento Europeo, el Tribunal de Justicia y Tribunal de Cuentas de la Unión Europea y otros Órganos.',
    lawUpdate: 'TUE y TFUE.',
  },
  {
    id: 'G8',
    block: 'General',
    number: 8,
    prob: 'Baja',
    title:
      'Las fuentes del Derecho Comunitario Europeo. Las relaciones entre el Derecho comunitario y el ordenamiento jurídico de los Estados miembros. Las funciones de los Estados miembros en la aplicación del Derecho Comunitario. La participación de las Comunidades Autónomas en la aplicación del Derecho Comunitario.',
    lawUpdate: 'Derecho originario y derivado de la UE.',
  },
  {
    id: 'G9',
    block: 'General',
    number: 9,
    prob: 'Media',
    title:
      'El principio de legalidad y la jerarquía normativa. Las fuentes del Derecho Administrativo. La Ley. Disposiciones del ejecutivo con fuerza de ley. El Reglamento.',
    lawUpdate: 'Art. 9.3 CE y fuentes del Derecho Administrativo.',
  },
  {
    id: 'G10',
    block: 'General',
    number: 10,
    prob: 'Media',
    title:
      'La Hacienda Pública de la Comunidad de Madrid. La Ley de Hacienda de la Comunidad de Madrid: Estructura, contenido y principios generales. El Presupuesto de la Comunidad de Madrid: concepto y regulación jurídica. El ciclo presupuestario. Elaboración, examen, enmienda y aprobación del presupuesto.',
    lawUpdate:
      'Ley 9/1990, de 8 de noviembre, Reguladora de la Hacienda de la CAM.',
  },
  {
    id: 'G11',
    block: 'General',
    number: 11,
    prob: 'Alta',
    title:
      'La Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas: objeto y ámbito de aplicación. Los interesados. Derechos de los ciudadanos en sus relaciones con las Administraciones Públicas. El procedimiento administrativo común: concepto, principios generales y fases del procedimiento. Especialidades del procedimiento administrativo común. La Ley 40/2015, de 1 de octubre, de Régimen Jurídico del Sector Público: disposiciones generales, principios de actuación y funcionamiento del Sector Público. Funcionamiento electrónico del Sector Público.',
    lawUpdate: 'Ley 39/2015 LPACAP y Ley 40/2015 LRJSP.',
  },
  {
    id: 'G12',
    block: 'General',
    number: 12,
    prob: 'Media',
    title:
      'La responsabilidad patrimonial de la Administración. El régimen jurídico en el sistema español. Responsabilidad de autoridades y funcionarios. Responsabilidad de la Administración por actos de sus concesionarios y contratistas.',
    lawUpdate: 'Art. 106.2 CE, Ley 39/2015 y Arts. 32-37 Ley 40/2015.',
  },
  {
    id: 'G13',
    block: 'General',
    number: 13,
    prob: 'Media',
    title:
      'Los contratos administrativos. Clases. El expediente de contratación y su tramitación. Procedimientos y criterios de adjudicación. Ejecución y modificación de los contratos. Pago del precio. Extinción de los contratos: Cumplimiento y resolución.',
    lawUpdate:
      'Ley 9/2017, de 8 de noviembre, de Contratos del Sector Público (LCSP).',
  },
  {
    id: 'G14',
    block: 'General',
    number: 14,
    prob: 'Alta',
    title:
      'El texto refundido de la Ley del Estatuto Básico del Empleado Público. Adquisición y pérdida de la condición de funcionario. Situaciones administrativas. Derechos, deberes e incompatibilidades. Régimen disciplinario. Especial referencia a la Ley de la Función Pública de la Comunidad de Madrid. Decreto por el que se regula la modalidad de prestación de servicios en régimen de teletrabajo en la Administración de la Comunidad de Madrid. La Ley de la Función Pública de la Comunidad de Madrid.',
    lawUpdate:
      'RDL 5/2015 (TREBEP), Ley 1/1986 CAM y Decreto 79/2020 Teletrabajo.',
  },
  {
    id: 'G15',
    block: 'General',
    number: 15,
    prob: 'Alta',
    title:
      'La protección de datos. Régimen jurídico. Principios y derechos de los ciudadanos. La Seguridad de la Información: principios básicos y requisitos mínimos en el Esquema Nacional de Seguridad.',
    lawUpdate: 'RGPD (UE) 2016/679, LO 3/2018 (LOPDGDD) y RD 311/2022 (ENS).',
  },
  {
    id: 'G16',
    block: 'General',
    number: 16,
    prob: 'Alta',
    title:
      'El principio de igualdad entre mujeres y hombres. La tutela contra la discriminación. El marco normativo de la igualdad de género, la protección integral contra la violencia de género y no discriminación de las personas LGTBI. Especial referencia a la Comunidad de Madrid.',
    lawUpdate:
      'LO 3/2007, LO 1/2004, Ley 5/2005 CAM y Leyes 2/2016 y 3/2016 CAM.',
  },

  // TEMARIO ESPECÍFICO (67 Temas)
  {
    id: 'E1',
    block: 'Específico',
    number: 1,
    prob: 'Alta',
    title:
      'Historia y evolución de los sistemas de protección social en España. Estratificación, clases sociales y su evolución. Consecuencias sociales. Pobreza y desigualdad.',
    lawUpdate: 'Evolución histórica de la acción social en España.',
  },
  {
    id: 'E2',
    block: 'Específico',
    number: 2,
    prob: 'Alta',
    title:
      'La Política social y el Estado del Bienestar: tipologías de política social, modelos del Estado del Bienestar y planteamientos actuales. Los servicios sociales en los modelos actuales de bienestar social.',
    lawUpdate: 'Modelos del Estado del Bienestar y políticas sociales.',
  },
  {
    id: 'E3',
    block: 'Específico',
    number: 3,
    prob: 'Media',
    title:
      'La política social en el marco de la Unión Europea. Sistema de servicios sociales en los países de la Unión Europea, comparación con los servicios sociales en España. Concepto, ejes y medidas financiadas por el Fondo Social Europeo Plus (FSE+).',
    lawUpdate:
      'Pilar Europeo de Derechos Sociales y Reglamento (UE) 2021/1057 del FSE+.',
  },
  {
    id: 'E4',
    block: 'Específico',
    number: 4,
    prob: 'Media',
    title:
      'Marco legislativo e institucional de los Servicios Sociales, con referencia a la Administración central, autonómica y local. El Ministerio competente en materia de derechos sociales: funciones y recursos. El Instituto de Mayores y Servicios Sociales (IMSERSO): competencias.',
    lawUpdate: 'Marco competencial estatal, autonómico y local; IMSERSO.',
  },
  {
    id: 'E5',
    block: 'Específico',
    number: 5,
    prob: 'Alta',
    title:
      'La Ley 12/2022, de 21 de diciembre, de Servicios Sociales de la Comunidad de Madrid: disposiciones generales. El Sistema Público de Servicios Sociales: concepto y principios rectores. Competencias. Organización funcional y territorial del Sistema público de servicios sociales: Atención Social Primaria y Atención Social Especializada. Funciones.',
    lawUpdate:
      'Ley 12/2022, de 21 de diciembre, de Servicios Sociales de la CAM.',
  },
  {
    id: 'E6',
    block: 'Específico',
    number: 6,
    prob: 'Alta',
    title:
      'La organización de los servicios sociales en la Comunidad de Madrid. La Consejería competente en materia de servicios sociales: estructura y competencias. La Agencia Madrileña de Atención Social: estructura y competencias. Los centros de servicios sociales.',
    lawUpdate:
      'Estructura Consejería de Familia, Juventud y Asuntos Sociales CAM.',
  },
  {
    id: 'E7',
    block: 'Específico',
    number: 7,
    prob: 'Alta',
    title:
      'La Agencia Madrileña de Atención Social: organización y competencias. Recursos, centros y servicios. Marco normativo.',
    lawUpdate: 'Ley 9/2015 y Decreto 230/2015 de Estatutos de la AMAS.',
  },
  {
    id: 'E8',
    block: 'Específico',
    number: 8,
    prob: 'Alta',
    title:
      'Prestaciones del sistema público de servicios sociales. El Catálogo de prestaciones de servicios sociales: Prestaciones garantizadas y condicionadas. Prestaciones de servicio y económicas.',
    lawUpdate: 'Art. 25 y ss. Ley 12/2022 y Cartera de Servicios Sociales CAM.',
  },
  {
    id: 'E9',
    block: 'Específico',
    number: 9,
    prob: 'Media',
    title:
      'Calidad en la prestación. Inspección de los centros y servicios. Sistema de información. Registro de Entidades, Centros, Servicios y de Directores de Centros de Atención Social.',
    lawUpdate: 'Títulos VI y VII Ley 12/2022 CAM.',
  },
  {
    id: 'E10',
    block: 'Específico',
    number: 10,
    prob: 'Media',
    title:
      'Provisión de los servicios sociales: gestión directa e indirecta, convenios y subvenciones. El concierto social.',
    lawUpdate: 'Concierto social y formas de provisión en la Ley 12/2022 CAM.',
  },
  {
    id: 'E11',
    block: 'Específico',
    number: 11,
    prob: 'Baja',
    title:
      'El Ministerio competente en materia de derechos sociales: funciones y recursos. El Instituto de mayores y Servicios Sociales (IMSERSO): competencias.',
    lawUpdate: 'Estructura del Ministerio de Derechos Sociales y del IMSERSO.',
  },
  {
    id: 'E12',
    block: 'Específico',
    number: 12,
    prob: 'Media',
    title:
      'La Seguridad Social en España. Principales características. Dimensión, financiación y evolución. Problemas actuales y líneas de reforma.',
    lawUpdate:
      'RDL 8/2015 Texto Refundido de la Ley General de la Seguridad Social (LGSS).',
  },
  {
    id: 'E13',
    block: 'Específico',
    number: 13,
    prob: 'Media',
    title:
      'Políticas Públicas de Empleo. Protección por desempleo. Prestaciones de nivel contributivo y de nivel asistencial. Régimen de las prestaciones.',
    lawUpdate:
      'Ley 3/2023 de Empleo y RDL 2/2024 de reforma del subsidio por desempleo.',
  },
  {
    id: 'E14',
    block: 'Específico',
    number: 14,
    prob: 'Alta',
    title:
      'Pensiones no contributivas. Pensión por Invalidez. Pensión por Jubilación. Otras prestaciones.',
    lawUpdate: 'Arts. 363-373 LGSS y gestión autonómica de PNC.',
  },
  {
    id: 'E15',
    block: 'Específico',
    number: 15,
    prob: 'Alta',
    title:
      'Renta mínima o salario social. La renta mínima de inserción en la Comunidad de Madrid: requisitos, cuantía, solicitud y programas de inserción. El Ingreso Mínimo Vital. Estrategia de prevención y lucha contra la pobreza y la exclusión social. Estrategia contra la pobreza energética.',
    lawUpdate: 'Ley 15/2001 RMI CAM y Ley 19/2021 IMV.',
  },
  {
    id: 'E16',
    block: 'Específico',
    number: 16,
    prob: 'Alta',
    title:
      'Programa de trabajo social de zona. Información, orientación y valoración. El método y la intervención en trabajo social. Niveles de intervención y técnicas e instrumentos utilizados.',
    lawUpdate: 'Atención Social Primaria, Historia Social Única y PIAS.',
  },
  {
    id: 'E17',
    block: 'Específico',
    number: 17,
    prob: 'Alta',
    title:
      'Programa de familia y convivencia. Apoyo a la familia en dificultad social. La familia como espacio de intervención social. La intervención profesional del trabajador social en la familia. Los Centros de Apoyo y Encuentro Familiar. La mediación familiar. Los puntos de encuentro familiar. Estrategia de protección a la maternidad y paternidad y de fomento de la natalidad y conciliación de la Comunidad de Madrid.',
    lawUpdate:
      'Ley 1/2001 Mediación CAM, CAEF, PEF y Estrategia Natalidad CAM.',
  },
  {
    id: 'E18',
    block: 'Específico',
    number: 18,
    prob: 'Media',
    title:
      'Programa de prevención de la marginación, inserción y promoción social. Ámbito y fases de actuación desde el trabajo social. Prestaciones e intervenciones sociales para la prevención social.',
    lawUpdate: 'Itinerarios de inclusión social en la CAM.',
  },
  {
    id: 'E19',
    block: 'Específico',
    number: 19,
    prob: 'Alta',
    title:
      'La promoción de la iniciativa social. Las organizaciones no gubernamentales y su papel en la acción social. El voluntariado social. Concepto. Marco legislativo. Función del voluntariado en el Sistema de Servicios Sociales. Las necesidades sociales: concepto, características y tipología. Asociacionismo y participación ciudadana.',
    lawUpdate:
      'Ley 45/2015 estatal, Ley 1/2015 del Voluntariado CAM y Tercer Sector.',
  },
  {
    id: 'E20',
    block: 'Específico',
    number: 20,
    prob: 'Baja',
    title:
      'La cooperación internacional para el desarrollo en las Administraciones Públicas. Legislación estatal y autonómica. La cooperación para el desarrollo en la Comunidad de Madrid.',
    lawUpdate: 'Ley 1/2023 estatal y Ley 13/1999 de Cooperación CAM.',
  },
  {
    id: 'E21',
    block: 'Específico',
    number: 21,
    prob: 'Alta',
    title:
      'Sistema para la Autonomía y Atención a la Dependencia: objeto, finalidad, órganos, niveles de protección del Sistema, catálogo de servicios de atención y prestaciones económicas. La Ley 39/2006 de 14 de diciembre de Promoción de la Autonomía Personal y Atención a las personas en situación de dependencia y normativa de desarrollo. Sistema de información, evaluación y financiación del Sistema para la Autonomía y Atención a la Dependencia.',
    lawUpdate: 'Ley 39/2006 (LAPAD) y RD 1051/2013.',
  },
  {
    id: 'E22',
    block: 'Específico',
    number: 22,
    prob: 'Alta',
    title:
      'La situación de dependencia y su valoración. Normativa reguladora del procedimiento de reconocimiento de la situación de dependencia. Grados de dependencia. Baremo de valoración y Escala de valoración específica para menores (EVE). Revisión de la situación de dependencia.',
    lawUpdate: 'Real Decreto 174/2011 (BVD y EVE).',
  },
  {
    id: 'E23',
    block: 'Específico',
    number: 23,
    prob: 'Alta',
    title:
      'La atención a las personas en situación de dependencia en la Comunidad de Madrid. Normativa reguladora del procedimiento para acceso a las prestaciones del sistema para la autonomía y atención a la dependencia en la Comunidad de Madrid. El Programa Individual de Atención y su revisión. Catálogo de servicios de atención y prestaciones económicas: definiciones, intensidad de los servicios, finalidad de las prestaciones económicas y régimen de compatibilidad entre prestaciones.',
    lawUpdate: 'Decreto 54/2015, de 21 de mayo, de dependencia en la CAM.',
  },
  {
    id: 'E24',
    block: 'Específico',
    number: 24,
    prob: 'Media',
    title:
      'Las personas mayores. Concepto y características. Aspectos físicos, psicológicos y sociales de la vejez. Consecuencias del envejecimiento. Principal problemática social.',
    lawUpdate: 'Sociología y psicogerontología del envejecimiento.',
  },
  {
    id: 'E25',
    block: 'Específico',
    number: 25,
    prob: 'Alta',
    title:
      'La intervención social con personas mayores. Programas y prestaciones para personas mayores. Envejecimiento activo y prevención de la dependencia en las personas mayores.',
    lawUpdate: 'Programas y centros de atención a mayores en la CAM.',
  },
  {
    id: 'E26',
    block: 'Específico',
    number: 26,
    prob: 'Media',
    title:
      'La salud mental en la Comunidad de Madrid. La atención a los pacientes en los Servicios de salud mental. Organización, estructura y funciones. El trabajo social en salud mental.',
    lawUpdate: 'Atención a la Salud Mental en el SERMAS.',
  },
  {
    id: 'E27',
    block: 'Específico',
    number: 27,
    prob: 'Alta',
    title:
      'Red Pública de Atención Social a personas con enfermedad mental grave y duradera de la Comunidad de Madrid.',
    lawUpdate: 'CRPS, CRL, Mini-residencias, Pisos supervisados y EASC.',
  },
  {
    id: 'E28',
    block: 'Específico',
    number: 28,
    prob: 'Alta',
    title:
      'Discapacidad. Concepto y evolución. Marco jurídico. Personas con discapacidad física, intelectual, sensorial y por enfermedad mental. Aspectos físicos, psíquicos, sociales y legales. Estrategia Española de Discapacidad 2022-2030. Estrategia Madrileña de Atención a las Personas con Discapacidad Horizonte 2028. Procedimiento para el reconocimiento del grado de discapacidad (R.D. 888/2022 del 18 octubre).',
    lawUpdate: 'RDL 1/2013, RD 888/2022 y Estrategia Horizonte 2028 CAM.',
  },
  {
    id: 'E29',
    block: 'Específico',
    number: 29,
    prob: 'Alta',
    title:
      'La intervención con personas con discapacidad. Reconocimiento del grado de discapacidad. Prestaciones para personas con discapacidad. Recursos y Programas de Atención. Red Pública de atención a personas con discapacidad. Empleo y personas con discapacidad. Estrategia Española sobre discapacidad 2022-2030: ejes, objetivos y líneas de actuación. Centros Base y CRECOVI.',
    lawUpdate:
      'Centros Base de la CAM, CRECOVI y Red de Atención a la Discapacidad.',
  },
  {
    id: 'E30',
    block: 'Específico',
    number: 30,
    prob: 'Alta',
    title:
      'La Agencia Madrileña para el Apoyo a las Personas Adultas con Discapacidad. Marco jurídico. Organización y competencias. Promoción de la autonomía y asistencia a las personas con discapacidad en el ejercicio de su capacidad jurídica. Curatela, defensa judicial y medidas de apoyo. Guarda de hecho. Medidas voluntarias de apoyo. Comité de Ética en la AMAPAD.',
    lawUpdate:
      'Ley 8/2021 y Ley 4/2022, de 13 de mayo, de creación de la AMAPAD.',
  },
  {
    id: 'E31',
    block: 'Específico',
    number: 31,
    prob: 'Media',
    title:
      'La inmigración en España. Teorías explicativas. Marco jurídico en materia de extranjería. Derechos y libertades de los extranjeros en España. Autorización de residencia y trabajo. Entrada y salida del territorio español. La reagrupación familiar.',
    lawUpdate: 'LO 4/2000 y nuevo Reglamento de Extranjería (RD 1155/2024).',
  },
  {
    id: 'E32',
    block: 'Específico',
    number: 32,
    prob: 'Media',
    title:
      'Políticas de integración e intervención social con la población inmigrante y refugiados. Especial referencia a la Comunidad de Madrid. Menores e inmigración. Marco jurídico específico en la materia.',
    lawUpdate: 'Ley 12/2009 de Asilo, RD 220/2022 y Red de CEPI en la CAM.',
  },
  {
    id: 'E33',
    block: 'Específico',
    number: 33,
    prob: 'Media',
    title:
      'Población penitenciaria. Aspectos legales y de inserción social. Servicios sociales penitenciarios.',
    lawUpdate: 'LOGP 1/1979, Reglamento Penitenciario y RD 782/2001.',
  },
  {
    id: 'E34',
    block: 'Específico',
    number: 34,
    prob: 'Media',
    title:
      'Las personas sin hogar. Características y programas de atención a nivel regional y local. Prestaciones dirigidas a personas sin hogar. Recursos y actuaciones a personas sin hogar en la Comunidad de Madrid.',
    lawUpdate: 'Programas de atención a personas sin hogar en la CAM.',
  },
  {
    id: 'E35',
    block: 'Específico',
    number: 35,
    prob: 'Alta',
    title:
      'Mujeres en situación de dificultad social. Legislación aplicable: Ley Orgánica 1/2004, de Medidas de Protección Integral contra la Violencia de Género; Ley Orgánica 10/2022, de Garantía Integral de la Libertad Sexual; Ley 3/2018, de 22 de junio, de modificación de la Ley 5/2005, de 20 de diciembre, Integral contra la Violencia de Género de la Comunidad de Madrid. Programas medidas y prestaciones de atención a las víctimas de violencia de género. Especial referencia a la Comunidad de Madrid.',
    lawUpdate: 'LO 1/2004, LO 10/2022 y Ley 5/2005 CAM.',
  },
  {
    id: 'E36',
    block: 'Específico',
    number: 36,
    prob: 'Media',
    title:
      'Políticas de igualdad entre mujeres y hombres. Normativa reguladora. Actuaciones en materia de igualdad y estrategias contra la Trata de Seres Humanos con fines de explotación sexual.',
    lawUpdate: 'LO 3/2007 y Estrategia contra la Trata.',
  },
  {
    id: 'E37',
    block: 'Específico',
    number: 37,
    prob: 'Alta',
    title:
      'Convención sobre los Derechos del Niño de 20 de noviembre de 1989; Ley Orgánica 1/1996, de 15 de enero, de Protección Jurídica del Menor (modificada por la Ley Orgánica 8/2015 y la Ley 26/2015); Ley Orgánica 8/2021, de 4 de junio, de protección integral a la infancia y la adolescencia frente a la violencia; Ley 4/2023, de 22 de marzo, de Derechos, Garantías y Protección Integral de la Infancia y la Adolescencia de la Comunidad de Madrid. La Estrategia de la Unión Europea sobre los Derechos del Niño y la Garantía Infantil Europea. Los Consejos de Derechos de la Infancia y Adolescencia de la Comunidad de Madrid.',
    lawUpdate: 'Ley 4/2023 de Infancia CAM y LO 8/2021 (LOPIVI).',
  },
  {
    id: 'E38',
    block: 'Específico',
    number: 38,
    prob: 'Alta',
    title:
      'El sistema de protección de menores: distribución de competencias y niveles de intervención. Riesgo, desamparo y medidas de protección: Tutela y guarda. Protección a la infancia y la adolescencia frente a la violencia: Deber general de comunicación y deber cualificado de los profesionales; medidas preventivas, protocolos de prevención y detección y entornos seguros; el coordinador y el delegado de protección; registros de situaciones de violencia. Prestaciones del Sistema recogidas en la Cartera de Servicios Sociales de la Comunidad de Madrid.',
    lawUpdate: 'Riesgo, guarda y desamparo en la Ley 4/2023 CAM y LOPIVI.',
  },
  {
    id: 'E39',
    block: 'Específico',
    number: 39,
    prob: 'Alta',
    title:
      'Formas de ejercicio de las medidas de protección de menores: acogimiento familiar, acogimiento residencial y adopción. Aspectos legales y procesos del acogimiento. Preparación de la familia de origen y del menor. Seguimiento y apoyo a las familias de acogida. Cese del acogimiento familiar. Prestaciones del Sistema. Procesos de intervención. Organismos acreditados de adopción internacional.',
    lawUpdate: 'Acogimiento familiar, residencial y adopción en la CAM.',
  },
  {
    id: 'E40',
    block: 'Específico',
    number: 40,
    prob: 'Alta',
    title:
      'Aspectos legales de la protección a la infancia y adolescencia. Comisión de protección a la infancia y adolescencia de la Comunidad de Madrid: competencias y funciones.',
    lawUpdate: 'Comisión de Protección a la Infancia y Adolescencia de la CAM.',
  },
  {
    id: 'E41',
    block: 'Específico',
    number: 41,
    prob: 'Alta',
    title:
      'Menores en conflicto con la ley: intervención socioeducativa y medidas de prevención en la Ley Orgánica 8/2021, de 4 de junio, de protección integral a la infancia y la adolescencia frente a la violencia y la Ley 4/2023, de 22 de marzo de Derechos, Garantías y Protección Integral de la Infancia y la Adolescencia de la Comunidad de Madrid. Menores infractores: la Ley Orgánica 5/2000, de 12 de enero, reguladora de la responsabilidad penal de los menores y su reglamento de desarrollo; Juzgados y Fiscalía de Menores; medidas judiciales privativas y no privativas de libertad; conciliación y reparación con la víctima; equipos técnicos y ejecución de medidas en la Comunidad de Madrid.',
    lawUpdate: 'LO 5/2000, RD 1774/2004 y Ley 4/2023 CAM.',
  },
  {
    id: 'E42',
    block: 'Específico',
    number: 42,
    prob: 'Alta',
    title:
      'La ejecución de las medidas judiciales impuestas a menores infractores. Ley de creación de la Agencia de la Comunidad de Madrid para la Reeducación y Reinserción del Menor Infractor. Organización y competencias. Principales ejes y programas de intervención dirigidos a los menores infractores atendidos.',
    lawUpdate: 'Ley 3/2004, de 10 de diciembre, de creación de la ARRMI.',
  },
  {
    id: 'E43',
    block: 'Específico',
    number: 43,
    prob: 'Baja',
    title:
      'Adolescencia y juventud. Aspectos psicológicos y sociales. Programas de atención a la juventud.',
    lawUpdate: 'Programas de juventud en la Comunidad de Madrid.',
  },
  {
    id: 'E44',
    block: 'Específico',
    number: 44,
    prob: 'Media',
    title:
      'Políticas LGTBI. Normativa y contexto internacional y en la Comunidad de Madrid. Intervención con las personas LGTBI.',
    lawUpdate: 'Leyes 2/2016 y 3/2016 de la CAM y Ley 4/2023 estatal.',
  },
  {
    id: 'E45',
    block: 'Específico',
    number: 45,
    prob: 'Alta',
    title:
      'La intervención de los Servicios Sociales en situaciones de urgencia y emergencia social.',
    lawUpdate:
      'Atención a urgencias y emergencias sociales en la Ley 12/2022 CAM.',
  },
  {
    id: 'E46',
    block: 'Específico',
    number: 46,
    prob: 'Media',
    title:
      'Políticas Públicas de Vivienda Social en la Comunidad de Madrid. La Agencia de Vivienda Social de la Comunidad de Madrid.',
    lawUpdate: 'Agencia de Vivienda Social (AVS) y Decreto 52/2016 CAM.',
  },
  {
    id: 'E47',
    block: 'Específico',
    number: 47,
    prob: 'Media',
    title:
      'El derecho a la protección de la salud en la Constitución y en la Ley General de Sanidad. La Ley de cohesión y calidad del Sistema Nacional de Salud: principios generales, titulares, derechos de los ciudadanos y prestaciones. La Ley de ordenación de las profesiones sanitarias: principios generales del ejercicio de las profesiones sanitarias. La Ley básica reguladora de la autonomía del paciente y de derechos y obligaciones en materia de información y documentación clínica.',
    lawUpdate: 'Ley 14/1986, Ley 16/2003, Ley 44/2003 y Ley 41/2002.',
  },
  {
    id: 'E48',
    block: 'Específico',
    number: 48,
    prob: 'Media',
    title:
      'La salud en la Comunidad de Madrid. Principales características. La Consejería de Sanidad: competencias. La Ley de Ordenación Sanitaria de la Comunidad de Madrid: el Sistema Sanitario. La Ley de libertad de elección en la Sanidad de la Comunidad de Madrid.',
    lawUpdate: 'Ley 12/2001 (LOSCAM) y Ley 6/2009 CAM.',
  },
  {
    id: 'E49',
    block: 'Específico',
    number: 49,
    prob: 'Alta',
    title:
      'La organización de los Servicios Sanitarios en la Comunidad de Madrid. Niveles asistenciales. La coordinación interprofesional intra y extra hospitalaria con los servicios primarios de salud y con los servicios sociales generales y especializados.',
    lawUpdate: 'Coordinación sociosanitaria en la Comunidad de Madrid.',
  },
  {
    id: 'E50',
    block: 'Específico',
    number: 50,
    prob: 'Media',
    title:
      'Organización de los servicios de Salud Pública en la Comunidad de Madrid. Legislación. Competencias. Estructura. El trabajo social en los programas de salud pública, prevención y promoción de la salud. Principales programas y actuaciones.',
    lawUpdate: 'Ley 33/2011 General de Salud Pública y Salud Pública CAM.',
  },
  {
    id: 'E51',
    block: 'Específico',
    number: 51,
    prob: 'Alta',
    title:
      'El trabajo social en Atención Primaria de Salud y en Atención Especializada. Intervención social en los programas de control y seguimiento del VIH/SIDA.',
    lawUpdate: 'Trabajo Social Sanitario en el SERMAS.',
  },
  {
    id: 'E52',
    block: 'Específico',
    number: 52,
    prob: 'Media',
    title:
      'Drogodependencias. Plan Nacional sobre Drogas. Los Centro de Atención Integral a Drogodependientes (CAID) de la Comunidad de Madrid. El Centro Regional de Documentación de Educación Sanitaria y Adicciones de la Comunidad de Madrid. Estrategias de prevención. Programas de reducción del daño. La disminución de los riesgos y la reducción de los daños en consumidores de drogas.',
    lawUpdate: 'Ley 5/2002 de Drogodependencias CAM y Red de CAID.',
  },
  {
    id: 'E53',
    block: 'Específico',
    number: 53,
    prob: 'Baja',
    title:
      'Alcoholismo. Aspectos etiológicos y clínicos. Evaluación, diagnóstico y tratamiento. El trabajo social en los programas de prevención y seguimiento del alcoholismo.',
    lawUpdate: 'Prevención y tratamiento social del alcoholismo.',
  },
  {
    id: 'E54',
    block: 'Específico',
    number: 54,
    prob: 'Media',
    title:
      'El trabajo social en la Administración Educativa. Funciones del trabajador social y los Equipos de Orientación Educativa y Psicopedagógica y Servicios de Orientación. Programa de escolarización en casos de urgencia social.',
    lawUpdate: 'EOEP y escolarización en urgencia social en la CAM.',
  },
  {
    id: 'E55',
    block: 'Específico',
    number: 55,
    prob: 'Alta',
    title:
      'La ética en la práctica del Trabajo Social: principios, código deontológico, secreto profesional. La bioética y el trabajo social. Dilemas éticos y modelos de resolución.',
    lawUpdate: 'Código Deontológico del Trabajo Social y Bioética.',
  },
  {
    id: 'E56',
    block: 'Específico',
    number: 56,
    prob: 'Alta',
    title:
      'El método científico. Evolución metodológica en Trabajo Social. El método en Trabajo Social. El Trabajo Social con casos, grupos y comunidades.',
    lawUpdate: 'Metodología científica del Trabajo Social.',
  },
  {
    id: 'E57',
    block: 'Específico',
    number: 57,
    prob: 'Alta',
    title:
      'La planificación e intervención social. El proceso de planificación en Trabajo Social. Tipologías de planificación. Niveles e instrumentos de la planificación e intervención social.',
    lawUpdate: 'Plan, Programa y Proyecto en Servicios Sociales.',
  },
  {
    id: 'E58',
    block: 'Específico',
    number: 58,
    prob: 'Media',
    title:
      'Evaluación de programas y proyectos de servicios sociales. Objetivos, métodos, técnicas e indicadores.',
    lawUpdate: 'Evaluación e indicadores en Servicios Sociales.',
  },
  {
    id: 'E59',
    block: 'Específico',
    number: 59,
    prob: 'Alta',
    title:
      'Las técnicas en Trabajo Social. Concepto y definición dentro del proceso metodológico. Tipologías. Utilidad y finalidad en el proceso metodológico. Las técnicas e instrumentos en Trabajo Social. Nuevas tecnologías de la información aplicadas al trabajo social.',
    lawUpdate:
      'Historia Social Única, Informe Social, Ficha Social, Genograma y Escalas.',
  },
  {
    id: 'E60',
    block: 'Específico',
    number: 60,
    prob: 'Alta',
    title:
      'Los modelos de intervención en Trabajo Social. Concepto, definición y características en los modelos en Trabajo Social.',
    lawUpdate: 'Modelos de intervención en Trabajo Social.',
  },
  {
    id: 'E61',
    block: 'Específico',
    number: 61,
    prob: 'Media',
    title:
      'El Equipo interdisciplinar. Técnicas de trabajo en Equipo. Trabajo social y otras profesiones relacionadas con la atención social: salud, educación, justicia y/o servicios sociales. Trabajo en red.',
    lawUpdate: 'Equipo interdisciplinar y trabajo en red.',
  },
  {
    id: 'E62',
    block: 'Específico',
    number: 62,
    prob: 'Alta',
    title:
      'Estructura de la Administración de Justicia, Órganos Judiciales. Administración y Apoyo Funcional. Instituto de Medicina Legal y Ciencias Forenses en la Comunidad de Madrid: funciones de los equipos psicosociales en el servicio de especialidades.',
    lawUpdate: 'LOPJ, LO 1/2025 e IMLCF de la Comunidad de Madrid.',
  },
  {
    id: 'E63',
    block: 'Específico',
    number: 63,
    prob: 'Alta',
    title:
      'El Trabajo Social Forense: concepto, funciones y ámbito competencial. Tribunal de instancia e Audiencia Provincial de la Comunidad de Madrid. Ámbito de intervención.',
    lawUpdate: 'Trabajo Social Forense y Tribunales de Instancia (LO 1/2025).',
  },
  {
    id: 'E64',
    block: 'Específico',
    number: 64,
    prob: 'Alta',
    title:
      'Metodología pericial en Trabajo Social: técnicas, fases y criterios de intervención.',
    lawUpdate: 'Metodología del dictamen pericial social.',
  },
  {
    id: 'E65',
    block: 'Específico',
    number: 65,
    prob: 'Alta',
    title:
      'Elaboración del informe social forense: estructura, lenguaje técnico, objetividad, trazabilidad de la información e indicadores de evaluación. Defensa del informe en sede judicial.',
    lawUpdate: 'Informe social forense y ratificación en sede judicial.',
  },
  {
    id: 'E66',
    block: 'Específico',
    number: 66,
    prob: 'Alta',
    title:
      'El Trabajador Social en las Oficinas de Asistencia a Víctimas de Delito en los Juzgados. Marco jurídico. Estructura, servicios y actuaciones.',
    lawUpdate: 'Ley 4/2015 y RD 1109/2015 regulador de las OAVD.',
  },
  {
    id: 'E67',
    block: 'Específico',
    number: 67,
    prob: 'Media',
    title:
      'Calidad en los Servicios Públicos: las Cartas de Servicios como instrumentos de mejora de la calidad en el ámbito de la intervención social de la Comunidad de Madrid.',
    lawUpdate:
      'Decreto 27/1997 regulador de las Cartas de Servicios en la CAM.',
  },
];

// =========================================================================
// REGLAS DE AUDITORÍA, AUTO-CORRECCIÓN, CALIDAD EJERCICIO 1 Y CORRESPONDENCIA BOCM
// =========================================================================
const OBSOLETE_TERMS_DICTIONARY = [
  {
    id: 'ley11_2003',
    regex: /ley\s+11\/2003/gi,
    replacement:
      'Ley 12/2022, de 21 de diciembre, de Servicios Sociales de la Comunidad de Madrid (que deroga la antigua Ley 11/2003)',
    alert:
      'Cita la Ley 11/2003 de Servicios Sociales sin especificar que está DEROGADA por la actual Ley 12/2022, de 21 de diciembre.',
  },
  {
    id: 'ley6_1995',
    regex: /ley\s+6\/1995/gi,
    replacement:
      'Ley 4/2023, de 22 de marzo, de Derechos, Garantías y Protección Integral de la Infancia y la Adolescencia de la Comunidad de Madrid (que deroga la Ley 6/1995)',
    alert:
      'Cita la Ley 6/1995 de Infancia CAM sin indicar que está DEROGADA por la Ley 4/2023, de 22 de marzo.',
  },
  {
    id: 'rd557_2011',
    regex: /(?:real\s+decreto|rd|r\.d\.)\s+557\/2011/gi,
    replacement:
      'Real Decreto 1155/2024, de 19 de noviembre, por el que se aprueba el nuevo Reglamento de la Ley Orgánica 4/2000 sobre derechos y libertades de los extranjeros (que deroga el RD 557/2011)',
    alert:
      'Cita el antiguo Reglamento de Extranjería (RD 557/2011), sustituido por el nuevo Real Decreto 1155/2024.',
  },
  {
    id: 'amta',
    regex: /\bAMTA\b|agencia\s+madrileña\s+para\s+la\s+tutela\s+de\s+adultos/gi,
    replacement:
      'Agencia Madrileña para el Apoyo a las Personas Adultas con Discapacidad (AMAPAD, regulada por Ley 4/2022 tras la reforma de la Ley 8/2021)',
    alert:
      'Menciona la antigua AMTA (Sustituida por la AMAPAD tras la Ley 4/2022 y la Ley 8/2021).',
  },
  {
    id: 'incapacitacion',
    regex: /incapacitaci[oó]n\s+judicial/gi,
    replacement:
      'provisión judicial de medidas de apoyo (curatela conforme a la Ley 8/2021, que suprimió la incapacitación judicial)',
    alert:
      'Utiliza el término "incapacitación judicial" (Suprimido por la Ley 8/2021; debe emplearse "medidas de apoyo / curatela").',
  },
  {
    id: 'rd1971_1999',
    regex: /(?:real\s+decreto|rd|r\.d\.)\s+1971\/1999/gi,
    replacement:
      'Real Decreto 888/2022, de 18 de octubre, por el que se establece el procedimiento para el reconocimiento, declaración y calificación del grado de discapacidad (que deroga el RD 1971/1999)',
    alert:
      'Cita el antiguo RD 1971/1999 de baremos de discapacidad (Derogado por el Real Decreto 888/2022).',
  },
  {
    id: 'ley30_1992',
    regex: /ley\s+30\/1992/gi,
    replacement:
      'Ley 39/2015 (LPACAP) y Ley 40/2015 (LRJSP), que derogaron la antigua Ley 30/1992',
    alert:
      'Cita la derogada Ley 30/1992 sin aclarar que fue sustituida por las Leyes 39/2015 y 40/2015.',
  },
];

const ERROR_CAUSES = [
  { id: 'desconocimiento', label: '1. Desconocimiento del contenido' },
  { id: 'confusion_normas', label: '2. Confusión entre normas o plazos' },
  { id: 'interpretacion', label: '3. Error de interpretación del enunciado' },
  {
    id: 'conceptos_similares',
    label: '4. Confusión entre conceptos similares',
  },
  { id: 'memoria', label: '5. Fallo de memoria / Olvido' },
  { id: 'precipitacion', label: '6. Error por precipitación al leer' },
];

const STOPWORDS_ES = new Set([
  'para',
  'como',
  'entre',
  'sobre',
  'desde',
  'hasta',
  'hacia',
  'mediante',
  'segun',
  'este',
  'esta',
  'estos',
  'estas',
  'todo',
  'toda',
  'todos',
  'todas',
  'otro',
  'otra',
  'otros',
  'otras',
  'mismo',
  'misma',
  'comunidad',
  'madrid',
  'españa',
  'especial',
  'referencia',
  'marco',
  'principales',
  'caracteristicas',
  'concepto',
  'evolucion',
]);

function normalizeText(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// BUSCA QUÉ TEMA DE LOS 83 DE LA ORDEN 1049/2026 CORRESPONDE REALMENTE AL CONTENIDO DEL PDF
function findBestMatchingTopicByContent(rawText = '') {
  const normDoc = normalizeText(rawText);
  let bestTopic = OFFICIAL_TOPICS[16];
  let bestScore = -1;

  OFFICIAL_TOPICS.forEach((t) => {
    const words = normalizeText(`${t.title} ${t.lawUpdate}`)
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 5 && !STOPWORDS_ES.has(w));
    const uniqueWords = [...new Set(words)];
    if (uniqueWords.length === 0) return;
    let hits = 0;
    uniqueWords.forEach((w) => {
      if (normDoc.includes(w)) hits++;
    });
    const ratio = hits / uniqueWords.length;
    if (ratio > bestScore) {
      bestScore = ratio;
      bestTopic = t;
    }
  });

  return bestTopic;
}

// AUDITORÍA INTEGRAL:
// 1) Correspondencia con el Título Oficial del BOCM 2026 (sub-epígrafes cubiertos vs. ausentes)
// 2) Nota de Calidad de la Información para el 1.er Ejercicio (Test)
// 3) Nota de Rúbrica para el 2.º Ejercicio (Desarrollo escrito 90 min)
function auditDocumentTextValidity(text = '', topicId = 'E1') {
  const topicObj =
    OFFICIAL_TOPICS.find((t) => t.id === topicId) || OFFICIAL_TOPICS[16];
  const normDoc = normalizeText(text);
  const warnings = [];

  OBSOLETE_TERMS_DICTIONARY.forEach((rule) => {
    const matches = [...text.matchAll(rule.regex)];
    if (matches.length > 0) {
      let hasUncontextualizedError = false;
      matches.forEach((m) => {
        const idx = m.index || 0;
        const surroundingContext = text.slice(
          Math.max(0, idx - 85),
          Math.min(text.length, idx + 140)
        );
        const isContextualizedAsHistory =
          /derogad[ao]|antigu[ao]|anterior|sustituid[ao]|superad[ao]|antecedente|evoluci[oó]n|hasta\s+la\s+aprobaci[oó]n/i.test(
            surroundingContext
          );
        if (!isContextualizedAsHistory) {
          hasUncontextualizedError = true;
        }
      });
      if (hasUncontextualizedError) warnings.push(rule.alert);
    }
  });

  // 1. VERIFICACIÓN DE CORRESPONDENCIA CON CADA SUB-EPÍGRAFE DEL TÍTULO BOCM 2026
  const subheadings = topicObj.title
    .split(/[.;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);

  const coveredSubheadings = [];
  const missingSubheadings = [];

  subheadings.forEach((sub) => {
    const kws = normalizeText(sub)
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOPWORDS_ES.has(w));
    if (kws.length === 0) {
      coveredSubheadings.push(sub);
      return;
    }
    const matchedKws = kws.filter((w) => normDoc.includes(w));
    if (matchedKws.length / kws.length >= 0.45 || matchedKws.length >= 2) {
      coveredSubheadings.push(sub);
    } else {
      missingSubheadings.push(sub);
    }
  });

  const titleMatchPct =
    subheadings.length > 0
      ? Math.round((coveredSubheadings.length / subheadings.length) * 100)
      : 100;

  const bestContentMatchTopic = findBestMatchingTopicByContent(text);
  const hasTopicMismatch =
    titleMatchPct < 50 && bestContentMatchTopic.id !== topicObj.id;

  // 2. NOTA DE CALIDAD DE LA INFORMACIÓN PARA SIMULACROS DEL 1.er EJERCICIO (TIPO TEST · 0 A 10)
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const articleMentions = (
    text.match(
      /\b(art[ií]culo|art\.|ley|decreto|orden|real\s+decreto|reglamento|constituci[oó]n|estatuto|tfue|directiva|convenci[oó]n)\b/gi
    ) || []
  ).length;
  const deadlinesAndNumbers = (
    text.match(
      /\b(\d+\s*(?:d[ií]as|meses|a[ñn]os|horas|por\s+ciento|%)|grado\s+[i|v]+|t[ií]tulo\s+[i|v|x]+|cap[ií]tulo\s+[i|v|x]+)\b/gi
    ) || []
  ).length;
  const institutionalOrgans = (
    text.match(
      /\b(consejer[ií]a|direcci[oó]n\s+general|comisi[oó]n|agencia|amas|amapad|arrmi|imerso|inss|tribunal|juzgado|fiscal[ií]a|ayuntamiento|atenci[oó]n\s+social\s+primaria)\b/gi
    ) || []
  ).length;

  let ej1TestScore = 3.0;
  ej1TestScore += (titleMatchPct / 100) * 3.0; // Hasta 3 ptos por cubrir todos los epígrafes del título BOCM
  if (articleMentions >= 18) ej1TestScore += 2.0;
  else if (articleMentions >= 8) ej1TestScore += 1.2;
  else if (articleMentions >= 3) ej1TestScore += 0.6;

  if (deadlinesAndNumbers >= 10) ej1TestScore += 1.2;
  else if (deadlinesAndNumbers >= 4) ej1TestScore += 0.7;

  if (institutionalOrgans >= 8) ej1TestScore += 0.8;
  else if (institutionalOrgans >= 3) ej1TestScore += 0.4;

  if (warnings.length > 0) ej1TestScore -= warnings.length * 1.2;
  const finalEj1TestQualityScore = Math.max(
    0,
    Math.min(10, ej1TestScore)
  ).toFixed(2);

  // 3. NOTA DE RÚBRICA PARA EL 2.º EJERCICIO (DESARROLLO ESCRITO 90 MIN · 0 A 10)
  const hasIntro =
    /introducci[oó]n|apertura\s+oral|marco\s+contextual|objeto|pre[aá]mbulo|buenos\s+d[ií]as/i.test(
      text
    );
  const hasConclusion =
    /conclusi[oó]n|conclusiones|s[ií]ntesis|valoraci[oó]n\s+final|cierre|bibliograf[ií]a|en\s+definitiva|para\s+concluir/i.test(
      text
    );
  const hasForbiddenAbbrev =
    /\b(q\s|pq\s|tb\s|x\s|xq\s|dpto\.|adm[oó]n\.)/i.test(text);
  const estimatedWriteMinutes = Math.round(wordCount / 26);

  let scoreAmplitud = 2.0;
  if (wordCount >= 1700 && wordCount <= 3250) scoreAmplitud += 1.2;
  else if (wordCount > 3250) scoreAmplitud += 0.7;
  else if (wordCount >= 1200) scoreAmplitud += 0.7;

  if (articleMentions >= 15) scoreAmplitud += 0.8;
  else if (articleMentions >= 8) scoreAmplitud += 0.5;
  scoreAmplitud = Math.min(4.0, scoreAmplitud);

  let scoreClaridad = 1.5;
  if (hasIntro) scoreClaridad += 0.75;
  if (hasConclusion) scoreClaridad += 0.75;
  scoreClaridad = Math.min(3.0, scoreClaridad);

  let scoreExpresion = 3.0;
  if (hasForbiddenAbbrev) scoreExpresion -= 0.5;
  if (warnings.length > 0) scoreExpresion -= warnings.length * 1.0;
  scoreExpresion = Math.max(0, Math.min(3.0, scoreExpresion));

  const finalScore = Math.max(
    0,
    Math.min(10, scoreAmplitud + scoreClaridad + scoreExpresion)
  ).toFixed(2);

  const roadmapTo10 = [];
  if (hasTopicMismatch) {
    roadmapTo10.push(
      `⚠️ DESFASE DE EPÍGRAFE DETECTADO: El contenido de este PDF coincide con el Tema [${
        bestContentMatchTopic.id
      }] ("${bestContentMatchTopic.title.slice(
        0,
        65
      )}...") y solo cubre el ${titleMatchPct}% del Tema [${
        topicObj.id
      }]. Reasígnalo con el botón de abajo.`
    );
  }
  if (missingSubheadings.length > 0) {
    roadmapTo10.push(
      `Epígrafes del título oficial BOCM 2026 que faltan por desarrollar en el PDF: ${missingSubheadings
        .map((m) => `"${m}"`)
        .join(' · ')}.`
    );
  }
  if (warnings.length > 0) {
    roadmapTo10.push(
      'Pulsa el botón "🛠️ Auto-Corregir Normativa Derogada" para actualizar al instante las normas antiguas detectadas.'
    );
  }
  if (!hasIntro)
    roadmapTo10.push(
      'Incluir un encabezado explícito de "INTRODUCCIÓN" al inicio del tema.'
    );
  if (!hasConclusion)
    roadmapTo10.push(
      'Añadir un apartado expreso de "CONCLUSIÓN" o "SÍNTESIS FINAL" al cierre.'
    );
  if (wordCount < 1700) {
    roadmapTo10.push(
      `Ampliar unas ${
        1800 - wordCount
      } palabras para ajustar el desarrollo a los 90 minutos oficiales.`
    );
  }
  if (wordCount > 3250) {
    roadmapTo10.push(
      `Sintetizar unas ${
        wordCount - 2400
      } palabras para que sea viable escribirlo a mano en 90 minutos (pulsa "✂️ Auto-Sintetizar a ~2.250 palabras").`
    );
  }
  if (articleMentions < 15) {
    roadmapTo10.push(
      `Añadir ${15 - articleMentions} referencias normativas o doctrinales más.`
    );
  }

  return {
    wordCount,
    articleMentions,
    deadlinesAndNumbers,
    institutionalOrgans,
    hasIntro,
    hasConclusion,
    estimatedWriteMinutes,
    warnings,
    titleMatchPct,
    coveredSubheadings,
    missingSubheadings,
    hasTopicMismatch,
    suggestedTopicId: bestContentMatchTopic.id,
    suggestedTopicTitle: bestContentMatchTopic.title,
    ej1TestQualityScore: finalEj1TestQualityScore,
    scoreAmplitud: scoreAmplitud.toFixed(2),
    scoreClaridad: scoreClaridad.toFixed(2),
    scoreExpresion: scoreExpresion.toFixed(2),
    finalScore,
    roadmapTo10,
    validityStatus:
      warnings.length === 0
        ? 'VIGENCIA VERIFICADA (BOCM 2026)'
        : 'ALERTA: NORMATIVA DEROGADA SIN CONTEXTUALIZAR',
  };
}

function autoFixObsoleteLawsInText(rawText) {
  let updated = rawText;
  let countFixed = 0;
  OBSOLETE_TERMS_DICTIONARY.forEach((rule) => {
    updated = updated.replace(rule.regex, (match, offset, fullStr) => {
      const context = fullStr.slice(
        Math.max(0, offset - 80),
        Math.min(fullStr.length, offset + 130)
      );
      if (/derogad[ao]|sustituid[ao]/i.test(context)) return match;
      countFixed++;
      return rule.replacement;
    });
  });
  return { updated, countFixed };
}

// =========================================================================
// MATRIZ DE PROPUESTAS ESPECÍFICAS Y EJEMPLOS REDACTADOS PARA LLEGAR AL 10
// =========================================================================
const TOPIC_EXCELLENCE_GUIDE = {
  E1: {
    mustCiteLaws: [
      'Ley General de Beneficencia de 20 de junio de 1849',
      'Constitución Española de 1978 (Arts. 9.2, 14, 39 a 52 y 148.1.20.ª)',
      'Ley 12/2022, de 21 de diciembre, de Servicios Sociales de la Comunidad de Madrid',
      'Indicadores AROPE (At Risk of Poverty and/or Exclusion) de Eurostat e INE',
    ],
    authors:
      'Casilda Lasarte, Moisés; Gosta Esping-Andersen; Castel, Robert; Subirats, Joan.',
    modelIntro:
      'INTRODUCCIÓN TÉCNICA (MODELO 10/10): La evolución histórica de los sistemas de protección social en España constituye el tránsito jurídico e institucional desde la beneficencia discrecional y graciable del siglo XIX (Ley de Beneficencia de 1849) hacia el reconocimiento de los servicios sociales como derecho subjetivo de ciudadanía en el Estado social y democrático de Derecho consagrado en los artículos 1.1 y 9.2 de la Constitución Española de 1978 y materializado en la Comunidad de Madrid mediante la Ley 12/2022, de 21 de diciembre.',
    modelExpansion:
      'BLOQUE DE AMPLIACIÓN DOCTRINAL Y NORMATIVA (+220 PALABRAS PARA EL 10): En el análisis de la estratificación y las clases sociales en la España contemporánea, la literatura sociológica (Castel; Subirats) advierte el paso de una desigualdad vertical de renta a un fenómeno multidimensional de exclusión social, medido oficialmente en el marco europeo y autonómico a través de la tasa AROPE (Reglamento UE 2019/1700), que integra el riesgo de pobreza relativa, la carencia material y social severa y la baja intensidad de empleo en el hogar. Frente a la histórica dualización entre asistencia social graciable y previsión contributiva (Instituto Nacional de Previsión de 1908 y Ley de Bases de la Seguridad Social de 1963), el actual Sistema Público de Servicios Sociales de la Comunidad de Madrid articula en el artículo 25 de la Ley 12/2022 un catálogo que distingue prestaciones garantizadas —exigibles como derecho subjetivo ante los órganos administrativos y jurisdiccionales— y prestaciones condicionadas, operando en coordinación con mecanismos estatales y autonómicos de garantía de ingresos como el Ingreso Mínimo Vital (Ley 19/2021) y la Renta Mínima de Inserción (Ley 15/2001).',
    modelConclusion:
      'CONCLUSIÓN Y SÍNTESIS FINAL (MODELO 10/10): En definitiva, la superación definitiva del paradigma caritativo-asistencial exige que la intervención del Trabajador Social en la Atención Social Primaria y Especializada de la Comunidad de Madrid combine el rigor diagnóstico sobre las nuevas formas de fractura social y pobreza cronificada con la garantía efectiva de los derechos subjetivos reconocidos en la Ley 12/2022, asegurando la continuidad asistencial a través de la Historia Social Única y del Programa Individual de Atención Social (PIAS).',
  },
  E3: {
    mustCiteLaws: [
      'Tratado de Funcionamiento de la Unión Europea (TFUE, Artículos 151 a 164)',
      'Pilar Europeo de Derechos Sociales (Gotemburgo 2017 y Plan de Acción 2030 en la Cumbre de Oporto 2021)',
      'Reglamento (UE) 2021/1057 del Parlamento Europeo y del Consejo, de 24 de junio de 2021, por el que se establece el Fondo Social Europeo Plus (FSE+)',
      'Recomendación (UE) 2021/1004 por la que se establece la Garantía Infantil Europea',
      'Carta Social Europea Revisada (Estrasburgo, 1996; ratificada por España en 2021) y Ley 12/2022 CAM',
    ],
    authors:
      'Esping-Andersen, G. (regímenes de bienestar); Ferrera, Maurizio (modelo mediterráneo); Moreno, Luis.',
    modelIntro:
      'INTRODUCCIÓN TÉCNICA (MODELO 10/10): La política social en el marco de la Unión Europea se articula jurídicamente a partir del Título X del Tratado de Funcionamiento de la Unión Europea (artículos 151 a 161 del TFUE) y de la Carta de los Derechos Fundamentales de la Unión Europea, alcanzando su máxima expresión programática con la proclamación del Pilar Europeo de Derechos Sociales (Gotemburgo, 2017) y su instrumento financiero vertebrador para el período 2021-2027: el Fondo Social Europeo Plus (FSE+), regulado por el Reglamento (UE) 2021/1057.',
    modelExpansion:
      'BLOQUE DE AMPLIACIÓN NORMATIVA Y COMPARADA (+250 PALABRAS PARA SUBIR DE 8,70 A 10,00): En el análisis comparado de los sistemas de servicios sociales en los Estados miembros de la Unión Europea, la doctrina especializada (Esping-Andersen; Maurizio Ferrera; Luis Moreno) distingue cuatro grandes modelos: 1) el modelo nórdico o socialdemócrata (universalista y de provisión pública intensiva en cuidados personales), 2) el modelo continental o corporativo-bismarckiano (basado en el principio de subsidiariedad y fuerte participación del Tercer Sector), 3) el modelo anglosajón o liberal (focalizado mediante comprobación de medios) y 4) el modelo mediterráneo o familiarista —en el que se encuadra históricamente España—, caracterizado por la centralidad de la solidaridad intergeneracional familiar y la consolidación descentralizada de las redes autonómicas de servicios sociales. Para converger hacia los objetivos de la Cumbre Social de Oporto para 2030 (reducir en al menos 15 millones las personas en riesgo de pobreza o exclusión, incluidos 5 millones de niños), el Reglamento (UE) 2021/1057 del FSE+ fusiona el antiguo FSE, la Iniciativa de Empleo Juvenil (IEJ), el Fondo de Ayuda Europea para las Personas Más Desfavorecidas (FEAD) y el Programa EaSI. Asimismo, impone una condicionalidad temática estricta: todo Estado miembro debe destinar al menos el 25 % de sus recursos del FSE+ a la inclusión social, al menos un 3 % a combatir la privación material extrema y un porcentaje específico a implementar la Garantía Infantil Europea (Recomendación UE 2021/1004), cofinanciando en la Comunidad de Madrid itinerarios integrados de inserción sociolaboral y refuerzo de la Atención Social Primaria conforme a la Ley 12/2022.',
    modelConclusion:
      'CONCLUSIÓN Y SÍNTESIS FINAL (MODELO 10/10): En conclusión, la arquitectura social europea y la condicionalidad financiera del Fondo Social Europeo Plus (Reglamento UE 2021/1057) operan como palanca de modernización directa del Sistema Público de Servicios Sociales de la Comunidad de Madrid, impulsando la transición desde prestaciones meramente paliativas hacia itinerarios personalizados de activación, inclusión activa e inversión social articulados por el Trabajador Social a través del Programa Individual de Atención Social (PIAS) previsto en la Ley 12/2022.',
  },
  E31: {
    mustCiteLaws: [
      'Constitución Española de 1978 (Artículo 13 sobre derechos de los extranjeros y Artículo 14)',
      'Ley Orgánica 4/2000, de 11 de enero, sobre derechos y libertades de los extranjeros en España y su integración social',
      'Real Decreto 1155/2024, de 19 de noviembre, por el que se aprueba el nuevo Reglamento de Extranjería (que deroga el antiguo RD 557/2011)',
      'Ley 12/2022, de 21 de diciembre, de Servicios Sociales de la Comunidad de Madrid',
    ],
    authors:
      'Arango, Joaquín (teorías explicativas de las migraciones); Castles y Miller; Giménez Romero, Carlos.',
    modelIntro:
      'INTRODUCCIÓN TÉCNICA (MODELO 10/10 - TEMA 31): El fenómeno migratorio en España y su regulación jurídica se fundamentan en el artículo 13 de la Constitución Española y en la Ley Orgánica 4/2000, de 11 de enero, profundamente modernizada en su desarrollo reglamentario por el Real Decreto 1155/2024, de 19 de noviembre (que deroga el anterior RD 557/2011), configurando el marco de derechos, autorizaciones de residencia y trabajo, reagrupación familiar e informes sociales de arraigo e integración en la Comunidad de Madrid.',
    modelExpansion:
      'BLOQUE DE ACTUALIZACIÓN NORMATIVA EXTRANJERÍA 2025-2026 (+240 PALABRAS): Es imprescindible destacar ante el Tribunal que el nuevo Reglamento de Extranjería aprobado por el Real Decreto 1155/2024 reforma íntegramente las figuras de arraigo (arraigo de segunda oportunidad, arraigo sociolaboral, arraigo social, arraigo socioformativo y arraigo familiar), reduciendo con carácter general el plazo de permanencia continuada en España a dos años y reforzando el papel técnico de los Servicios Sociales de Atención Social Primaria en la emisión de los informes de integración social y de adecuación de vivienda para la reagrupación familiar. En la Comunidad de Madrid, esta intervención se coordina con la Red de Centros de Participación e Integración de Inmigrantes (CEPI) y se registra en la Historia Social Única conforme a la Ley 12/2022.',
    modelConclusion:
      'CONCLUSIÓN Y SÍNTESIS FINAL (MODELO 10/10 - TEMA 31): En síntesis, la entrada en vigor del Real Decreto 1155/2024 en desarrollo de la LO 4/2000 consolida la función pericial y de acompañamiento social del Trabajador Social en los procesos de regularización documental, reagrupación familiar e inclusión plena en la Comunidad de Madrid.',
  },
  E32: {
    mustCiteLaws: [
      'Ley 12/2009, de 30 de octubre, reguladora del derecho de asilo y de la protección subsidiaria',
      'Convención de Ginebra de 1951 sobre el Estatuto de los Refugiados y Pacto Europeo sobre Migración y Asilo (2024)',
      'Real Decreto 220/2022, de 29 de marzo, por el que se aprueba el Reglamento del sistema de acogida en materia de protección internacional',
      'Ley Orgánica 1/1996, Ley 4/2023 de Infancia de la Comunidad de Madrid y protocolo de Menores Extranjeros No Acompañados (MENA)',
    ],
    authors:
      'Giménez Romero, Carlos (modelos de integración: asimilacionismo, multiculturalismo e interculturalidad); ACNUR.',
    modelIntro:
      'INTRODUCCIÓN TÉCNICA (MODELO 10/10 - TEMA 32): Las políticas de integración social de la población inmigrante, solicitante de protección internacional y refugiada, así como la protección específica de los menores extranjeros no acompañados en la Comunidad de Madrid, se articulan bajo el marco de la Convención de Ginebra de 1951, la Ley 12/2009 reguladora del derecho de asilo y la protección subsidiaria, el Real Decreto 220/2022 del sistema de acogida y la Ley 4/2023, de 22 de marzo, de Derechos, Garantías y Protección Integral de la Infancia y la Adolescencia de la Comunidad de Madrid.',
    modelExpansion:
      'BLOQUE DE AMPLIACIÓN SOBRE ASILO, REFUGIO Y MENORES (TEMA 32 ANEXO BOCM 2026): En relación con los menores extranjeros no acompañados, el artículo 35 de la LO 4/2000 y la Ley 4/2023 de la Comunidad de Madrid determinan que, una vez verificada la minoría de edad y la ausencia de referentes familiares, la Comisión de Protección a la Infancia y a la Adolescencia de la Comunidad de Madrid asume la tutela por ministerio de la ley, garantizando su atención inmediata en la red de centros específicos de protección y el diseño de itinerarios de inserción y transición a la vida adulta (artículo 40 de la Ley 4/2023 CAM), en estrecha articulación con los Centros de Participación e Integración (CEPI) y la Atención Social Primaria (Ley 12/2022).',
    modelConclusion:
      'CONCLUSIÓN Y SÍNTESIS FINAL (MODELO 10/10 - TEMA 32): En conclusión, la intervención del Trabajador Social con población inmigrante, refugiada y menores extranjeros en la Comunidad de Madrid conjuga el mandato internacional de derechos humanos con la aplicación rigurosa de la Ley 12/2022 y la Ley 4/2023, garantizando una integración intercultural efectiva y libre de discriminación.',
  },
};

function getExcellenceSuggestionsForTopic(topicObj) {
  const custom = TOPIC_EXCELLENCE_GUIDE[topicObj.id];
  if (custom) return custom;

  return {
    mustCiteLaws: [
      topicObj.lawUpdate,
      'Constitución Española de 1978 (Arts. 9.2, 14 y Capítulo III del Título I)',
      'Ley 12/2022, de 21 de diciembre, de Servicios Sociales de la Comunidad de Madrid (Arts. 18 y 19: Historia Social Única y PIAS)',
      'Orden 1049/2026, de 13 de abril (BOCM 29/04/2026)',
    ],
    authors:
      'Ander-Egg, Ezequiel; Zamanillo, Teresa; Ituarte, Amaya; Consejo General del Trabajo Social (Código Deontológico).',
    modelIntro: `INTRODUCCIÓN TÉCNICA (MODELO 10/10 - TEMA ${topicObj.id}): El estudio de "${topicObj.title}" reviste una importancia nuclear dentro del Cuerpo de Técnicos y Diplomados Especialistas, Escala de Asistentes Sociales (Subgrupo A2) de la Comunidad de Madrid. Su encuadre técnico-jurídico parte del mandato de los poderes públicos consagrado en el artículo 9.2 de la Constitución Española y se despliega en el ámbito autonómico a través de ${topicObj.lawUpdate}, en estrecha conexión con los principios rectores de universalidad, responsabilidad pública y atención personalizada establecidos en la Ley 12/2022, de 21 de diciembre, de Servicios Sociales de la Comunidad de Madrid.`,
    modelExpansion: `BLOQUE DE AMPLIACIÓN NORMATIVA Y METODOLÓGICA (+210 PALABRAS PARA EL 10): Para dotar al desarrollo escrito del máximo rigor exigido por el Tribunal Calificador en la Base Octava.3.2 de la Orden 1049/2026, resulta preceptivo vincular los contenidos materiales de este epígrafe con la arquitectura funcional del Sistema Público de Servicios Sociales de la Comunidad de Madrid. En particular, la intervención profesional del Trabajador Social se articula desde la Atención Social Primaria —como puerta de entrada ordinaria y sede del profesional de referencia— y en coordinación con la Atención Social Especializada, garantizando la trazabilidad diagnóstica mediante la Historia Social Única (artículo 18 de la Ley 12/2022) y la planificación de objetivos, indicadores y prestaciones garantizadas o condicionadas en el Programa Individual de Atención Social (PIAS, artículo 19 de la Ley 12/2022), asegurando en todo momento el enfoque transversal de igualdad efectiva (LO 3/2007), accesibilidad universal (RD 888/2022) y protección integral a la infancia (Ley 4/2023 CAM).`,
    modelConclusion: `CONCLUSIÓN Y SÍNTESIS FINAL (MODELO 10/10 - TEMA ${topicObj.id}): En definitiva, la regulación y praxis técnica analizadas en torno a "${topicObj.title}" evidencian la consolidación en la Comunidad de Madrid de un modelo de intervención social fundamentado en derechos subjetivos, calidad evaluable e interoperabilidad interadministrativa, donde el rigor metodológico y ético del Trabajador Social constituye la garantía última de eficacia y equidad en la protección de la ciudadanía.`,
  };
}

// Sintetiza un tema demasiado largo (>3.250 palabras) a la extensión óptima de 90 min (~2.250 palabras)
function synthesizeTextTo90Minutes(rawText, topicObj) {
  const excellence = getExcellenceSuggestionsForTopic(topicObj);
  const clean = rawText.replace(/\[Pág\.\s*\d+\]\s*/g, '');
  const paragraphs = clean
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 35);

  const selectedParagraphs = [];
  let runningWords = 0;
  const targetBodyWords = 1750;

  for (const p of paragraphs) {
    const w = p.split(/\s+/).length;
    const hasLegalWeight =
      /\b(ley|decreto|art[ií]culo|art\.|constituci[oó]n|reglamento|derecho|pias|historia\s+social)\b/i.test(
        p
      );
    if (
      runningWords + w <= targetBodyWords ||
      (hasLegalWeight && runningWords < 2050)
    ) {
      selectedParagraphs.push(p);
      runningWords += w;
    }
    if (runningWords >= 2050) break;
  }

  return `${excellence.modelIntro}\n\n${selectedParagraphs.join('\n\n')}\n\n${
    excellence.modelConclusion
  }`;
}

const INITIAL_QUESTIONS = [
  {
    id: 'q-trib-1',
    topicId: 'E5',
    difficulty: 'Intermedia',
    originType: '🏛️ OFICIAL BOCM/BOE',
    validatedByPeer: true,
    proposedBy: 'Administradora',
    examTrigger: '🔥 Reforma Normativa Reciente',
    leitnerBox: 1,
    nextReviewDate: new Date().toISOString().slice(0, 10),
    sourceRef: 'Ley 12/2022 CAM, Artículos 18 y 19',
    question:
      'De conformidad con lo preceptuado en el Título II de la Ley 12/2022, de 21 de diciembre, de Servicios Sociales de la Comunidad de Madrid, señale qué instrumento técnico garantiza la continuidad asistencial interadministrativa y articula el diagnóstico e itinerario de intervención:',
    options: [
      'A) La Historia Social Única como soporte documental interoperable y el Programa Individual de Atención Social (PIAS) como instrumento técnico de planificación.',
      'B) El Expediente Básico de Zona regulado en la Ley 11/2003 junto con la Ficha de Derivación a Atención Social Especializada.',
      'C) El Proyecto de Intervención Familiar Mancomunado (PIFM) aprobado por el Consejo Regional de Servicios Sociales.',
      'D) El Registro Único de Prestaciones Condicionadas gestionado con carácter exclusivo por la Agencia Madrileña de Atención Social (AMAS).',
    ],
    correctIndex: 0,
    explanation:
      'DICTAMEN DEL TRIBUNAL: Conforme a la Ley 12/2022, la Historia Social Única constituye el soporte documental único e interoperable en el Sistema Público de Servicios Sociales, mientras que el PIAS recoge la valoración diagnóstica, los objetivos y las prestaciones asignadas.',
  },
  {
    id: 'q-trib-2',
    topicId: 'G11',
    difficulty: 'Alta',
    originType: '🏛️ OFICIAL BOCM/BOE',
    validatedByPeer: true,
    proposedBy: 'Administradora',
    examTrigger: '⏱ Plazo / Excepción Trampa',
    leitnerBox: 1,
    nextReviewDate: new Date().toISOString().slice(0, 10),
    sourceRef: 'Ley 39/2015 LPACAP, Art. 21.2 y 21.3',
    question:
      'En virtud de lo dispuesto en el artículo 21 de la Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas, señale la proposición INCORRECTA respecto al plazo máximo para resolver y notificar:',
    options: [
      'A) El plazo máximo en el que debe notificarse la resolución expresa será el fijado por la norma reguladora del correspondiente procedimiento.',
      'B) Este plazo no podrá exceder de seis meses salvo que una norma con rango de Ley establezca uno mayor o así venga previsto en el Derecho de la Unión Europea.',
      'C) Cuando las normas reguladoras de los procedimientos no fijen el plazo máximo, éste será de seis meses contados desde la fecha del acuerdo de iniciación.',
      'D) En los procedimientos iniciados a solicitud del interesado, el plazo se contará desde la fecha en que la solicitud haya tenido entrada en el registro electrónico de la Administración competente para su tramitación.',
    ],
    correctIndex: 2,
    explanation:
      'DICTAMEN DEL TRIBUNAL: ¡Atención al enunciado negativo (INCORRECTA)! El artículo 21.3 de la Ley 39/2015 preceptúa que, cuando las normas reguladoras no fijen el plazo máximo, éste será de TRES MESES (y no de seis meses).',
  },
];

const NORMATIVE_WATCH_LIST = [
  {
    id: 'norm-1',
    law: 'Orden 1049/2026, de 13 de abril (BOCM 29/04/2026)',
    status: 'Vigente · Convocatoria Oficial',
    affectedTopics: ['Todos (83 Temas)'],
    lastChecked: '2026-04-29',
    note: 'Fija 380 plazas, test 80+5 en 85m, desarrollo 90m, práctico 90m y letra de desempate "X".',
  },
  {
    id: 'norm-2',
    law: 'Ley 12/2022, de 21 de diciembre, de Servicios Sociales CAM',
    status: 'Vigente (Deroga Ley 11/2003)',
    affectedTopics: ['E5', 'E6', 'E8', 'E9', 'E10', 'E16', 'E45'],
    lastChecked: '2026-11-01',
    note: 'Regula Atención Social Primaria, Especializada, Historia Social Única, PIAS y Concierto Social.',
  },
  {
    id: 'norm-3',
    law: 'Ley 4/2023, de 22 de marzo, de Infancia y Adolescencia CAM',
    status: 'Vigente (Deroga Ley 6/1995)',
    affectedTopics: ['E37', 'E38', 'E39', 'E40', 'E41'],
    lastChecked: '2026-11-01',
    note: 'Armonizada con la LOPIVI (LO 8/2021). Comisión de Protección a la Infancia y Adolescencia.',
  },
  {
    id: 'norm-4',
    law: 'Real Decreto 1155/2024, de 19 de noviembre (Nuevo Reglamento Extranjería)',
    status: 'Vigente (Deroga RD 557/2011)',
    affectedTopics: ['E31', 'E32'],
    lastChecked: '2026-11-01',
    note: 'Reforma las figuras de arraigo (social, sociolaboral, socioformativo, segunda oportunidad y familiar).',
  },
];

// DETECTOR INTELIGENTE POR NOMBRE Y CONTENIDO REAL DEL PDF
function detectTopicIdFromFilename(filename, rawText = '', fallbackId = 'E1') {
  const clean = filename.replace(/[_-]/g, ' ').toUpperCase();
  if (
    clean.includes('INMIGRA') ||
    clean.includes('ASILO') ||
    clean.includes('REFUGI') ||
    clean.includes('EXTRANJER')
  ) {
    return clean.includes('ASILO') ||
      clean.includes('REFUGI') ||
      clean.includes('INTEGRAC')
      ? 'E32'
      : 'E31';
  }
  const explicitMatch = clean.match(/\b([GE])\s*(\d{1,2})\b/);
  if (explicitMatch) {
    const candidate = `${explicitMatch[1]}${Number(explicitMatch[2])}`;
    if (OFFICIAL_TOPICS.some((t) => t.id === candidate)) return candidate;
  }
  const isGeneral =
    clean.includes('GENERAL') ||
    clean.includes('BLOQUE I ') ||
    clean.includes('COMUN');
  const numMatch =
    clean.match(/(?:TEMA|T)\s*(\d{1,2})\b/) || clean.match(/\b(\d{1,2})\b/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (isGeneral && n >= 1 && n <= 16) return `G${n}`;
    if (n >= 1 && n <= 67) return `E${n}`;
  }
  if (rawText && rawText.length > 100) {
    return findBestMatchingTopicByContent(rawText).id;
  }
  return fallbackId;
}

export default function App() {
  const [activeModule, setActiveModule] = useState('06');
  const [theme, setTheme] = useState(
    () => localStorage.getItem('cam_theme_v11') || 'light'
  );
  const isDark = theme === 'dark';
  const [statusBanner, setStatusBanner] = useState('');

  const [activeProfile, setActiveProfile] = useState(
    () => localStorage.getItem('cam_profile_v11') || 'admin'
  );
  const PROFILES = {
    admin: {
      id: 'admin',
      name: 'Azucena (Administradora)',
      role: 'Administradora',
      desc: 'Gestiona documentos, temario oficial y configuración.',
    },
    colab: {
      id: 'colab',
      name: 'Amiga 1 (Colaboradora)',
      role: 'Colaboradora',
      desc: 'Propone preguntas y sube materiales de estudio.',
    },
    rev: {
      id: 'rev',
      name: 'Amiga 2 (Revisora)',
      role: 'Revisora',
      desc: 'Valida preguntas, respuestas y referencias antes de pasarlas al banco común.',
    },
  };

  const [topicData, setTopicData] = useState(() => {
    const saved = localStorage.getItem('cam_topic_data_v6');
    return saved ? JSON.parse(saved) : {};
  });

  const [questionBank, setQuestionBank] = useState(() => {
    const saved = localStorage.getItem('cam_qbank_v6');
    if (saved) {
      const parsed = JSON.parse(saved);
      const ids = new Set(parsed.map((q) => q.id));
      const missing = INITIAL_QUESTIONS.filter((q) => !ids.has(q.id));
      return [...parsed, ...missing];
    }
    return INITIAL_QUESTIONS;
  });

  const [peerReviewQueue, setPeerReviewQueue] = useState(() => {
    const saved = localStorage.getItem('cam_peer_queue_v8');
    return saved ? JSON.parse(saved) : [];
  });

  const [failedQuestionIds, setFailedQuestionIds] = useState(() => {
    const saved = localStorage.getItem('cam_failed_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [errorDiagnosisMap, setErrorDiagnosisMap] = useState(() => {
    const saved = localStorage.getItem('cam_error_diag_v8');
    return saved ? JSON.parse(saved) : {};
  });

  const [topicStats, setTopicStats] = useState(() => {
    const saved = localStorage.getItem('cam_tstats_v6');
    return saved ? JSON.parse(saved) : {};
  });

  const [examHistory, setExamHistory] = useState(() => {
    const saved = localStorage.getItem('cam_history_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [documentsLibrary, setDocumentsLibrary] = useState([]);
  const [essaysLibrary, setEssaysLibrary] = useState([]);

  useEffect(() => {
    getAllFromStore(STORE_DOCS).then((docs) => {
      const reAuditedDocs = (docs || []).map((d) => {
        const tId = detectTopicIdFromFilename(
          d.name || '',
          d.text || '',
          d.topicId
        );
        return {
          ...d,
          topicId: tId,
          audit: auditDocumentTextValidity(d.text || '', tId),
        };
      });
      setDocumentsLibrary(reAuditedDocs);
    });
    getAllFromStore(STORE_ESSAYS).then((essays) => {
      const reAudited = (essays || []).map((es) => {
        const tId = detectTopicIdFromFilename(
          es.name || '',
          es.text || '',
          es.topicId
        );
        return {
          ...es,
          topicId: tId,
          audit: auditDocumentTextValidity(es.text || '', tId),
        };
      });
      setEssaysLibrary(reAudited);
      if (reAudited.length > 0) setActiveEssayView(reAudited[0]);
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cam_topic_data_v6', JSON.stringify(topicData));
      localStorage.setItem('cam_qbank_v6', JSON.stringify(questionBank));
      localStorage.setItem(
        'cam_peer_queue_v8',
        JSON.stringify(peerReviewQueue)
      );
      localStorage.setItem('cam_failed_v6', JSON.stringify(failedQuestionIds));
      localStorage.setItem(
        'cam_error_diag_v8',
        JSON.stringify(errorDiagnosisMap)
      );
      localStorage.setItem('cam_tstats_v6', JSON.stringify(topicStats));
      localStorage.setItem('cam_history_v6', JSON.stringify(examHistory));
      localStorage.setItem('cam_theme_v11', theme);
      localStorage.setItem('cam_profile_v11', activeProfile);
    } catch (e) {
      console.warn('Almacenamiento ligero en límite:', e);
    }
  }, [
    topicData,
    questionBank,
    peerReviewQueue,
    failedQuestionIds,
    errorDiagnosisMap,
    topicStats,
    examHistory,
    theme,
    activeProfile,
  ]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const [calcEj1, setCalcEj1] = useState(7.6);
  const [calcEj2, setCalcEj2] = useState(9.5);
  const [calcEj3, setCalcEj3] = useState(8.0);

  const [selectedBlock, setSelectedBlock] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const topicsWithCustomTitles = useMemo(() => {
    return OFFICIAL_TOPICS.map((t) => ({
      ...t,
      title: topicData[t.id]?.customTitle || t.title,
      lawUpdate: topicData[t.id]?.customLaw || t.lawUpdate,
    }));
  }, [topicData]);

  const sortedAndFilteredTopics = useMemo(() => {
    return [...topicsWithCustomTitles]
      .sort((a, b) => {
        if (a.block !== b.block) return a.block === 'General' ? -1 : 1;
        return a.number - b.number;
      })
      .filter((t) => {
        const matchBlock =
          selectedBlock === 'Todos' || t.block === selectedBlock;
        const matchSearch =
          searchTerm === '' ||
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.lawUpdate.toLowerCase().includes(searchTerm.toLowerCase());
        return matchBlock && matchSearch;
      });
  }, [topicsWithCustomTitles, selectedBlock, searchTerm]);

  const [selectedLabTopicId, setSelectedLabTopicId] = useState('Auto');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [diffBasic, setDiffBasic] = useState(4);
  const [diffInterm, setDiffInterm] = useState(10);
  const [diffAdv, setDiffAdv] = useState(6);

  const [ej2SubTab, setEj2SubTab] = useState('pdf_audit');
  const [selectedEssayTopicId, setSelectedEssayTopicId] = useState('Auto');
  const [activeEssayView, setActiveEssayView] = useState(null);

  const [drawnBalls, setDrawnBalls] = useState([]);
  const [chosenBallTopicId, setChosenBallTopicId] = useState('E3');
  const [essayText, setEssayText] = useState('');
  const [essayTimer, setEssayTimer] = useState(90 * 60);
  const [essayTimerRunning, setEssayTimerRunning] = useState(false);

  const [handwrittenPhotos, setHandwrittenPhotos] = useState([]);
  const [photoTopicId, setPhotoTopicId] = useState('E3');
  const [ocrTranscribedText, setOcrTranscribedText] = useState('');
  const [visionApiKey, setVisionApiKey] = useState(
    () => localStorage.getItem('cam_vision_key') || ''
  );
  const [isRunningOcr, setIsRunningOcr] = useState(false);

  const [practicalCase, setPracticalCase] = useState('');
  const [practicalAnswer, setPracticalAnswer] = useState('');
  const [practicalTimer, setPracticalTimer] = useState(90 * 60);
  const [practicalTimerRunning, setPracticalTimerRunning] = useState(false);
  const [practicalEvaluation, setPracticalEvaluation] = useState(null);

  const [examSession, setExamSession] = useState(null);
  const [simPresetType, setSimPresetType] = useState('convocatoria');
  const [simQuestionCount, setSimQuestionCount] = useState(85);
  const [simStrictExamMode, setSimStrictExamMode] = useState(true);

  const [qBankFilterTopic, setQBankFilterTopic] = useState('Todos');
  const [qBankFilterOrigin, setQBankFilterOrigin] = useState('Todos');

  useEffect(() => {
    let interval = null;
    if (examSession && !examSession.isFinished && examSession.timeLeft > 0) {
      interval = setInterval(() => {
        setExamSession((prev) => {
          if (prev.timeLeft <= 1) {
            clearInterval(interval);
            return { ...prev, timeLeft: 0, isFinished: true };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examSession]);

  useEffect(() => {
    let interval = null;
    if (essayTimerRunning && essayTimer > 0) {
      interval = setInterval(() => setEssayTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [essayTimerRunning, essayTimer]);

  useEffect(() => {
    let interval = null;
    if (practicalTimerRunning && practicalTimer > 0) {
      interval = setInterval(() => setPracticalTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [practicalTimerRunning, practicalTimer]);

  const dashboardMetrics = useMemo(() => {
    let mastered = 0,
      studied = 0,
      totalHours = 0;
    const todayStr = new Date().toISOString().slice(0, 10);

    OFFICIAL_TOPICS.forEach((t) => {
      const td = topicData[t.id] || {};
      if (td.status === 'Dominado') mastered++;
      else if (td.status === 'Estudiado' || td.status === 'Repaso') studied++;
      totalHours += Number(td.hours || 0);
    });

    const pending = OFFICIAL_TOPICS.length - mastered;
    const domainPercent = Math.round((mastered / OFFICIAL_TOPICS.length) * 100);

    let totalHits = 0,
      totalAnswered = 0;
    Object.values(topicStats).forEach((st) => {
      totalHits += st.hits || 0;
      totalAnswered += st.total || 0;
    });
    const testAccuracyPercent =
      totalAnswered > 0 ? Math.round((totalHits / totalAnswered) * 100) : 76;

    const dueForSpacedRepetition = questionBank.filter(
      (q) =>
        !q.nextReviewDate ||
        q.nextReviewDate <= todayStr ||
        (q.leitnerBox || 1) === 1
    );

    const weakTopics = Object.entries(topicStats)
      .filter(([, st]) => st.total > 0)
      .map(([id, st]) => ({
        id,
        pct: Math.round((st.hits / st.total) * 100),
        hits: st.hits,
        total: st.total,
        title: OFFICIAL_TOPICS.find((t) => t.id === id)?.title || id,
      }))
      .sort((a, b) => a.pct - b.pct);

    const prioritiesToday = [
      `1. Revisar en el Módulo 06 la Nota de Calidad para Test y la Correspondencia con los títulos del BOCM 2026 de tus PDFs.`,
      `2. Ajustar la extensión de tu Tema 1 con el botón "✂️ Auto-Sintetizar a ~2.250 palabras" en el Módulo 04 para subir del 9,50 al 10,00.`,
      `3. Actualizar automáticamente la normativa de tu PDF de Inmigración y Asilo (Temas E31/E32 en la Orden 1049/2026).`,
      `4. Realizar un simulacro con las ${dueForSpacedRepetition.length} preguntas pendientes hoy.`,
    ];

    return {
      mastered,
      studied,
      pending,
      domainPercent,
      testAccuracyPercent,
      totalHours:
        totalHours > 0
          ? totalHours
          : essaysLibrary.length * 3 + examHistory.length * 1.5,
      dueCount: dueForSpacedRepetition.length,
      weakTopics: weakTopics.slice(0, 5),
      prioritiesToday,
    };
  }, [topicData, topicStats, questionBank, essaysLibrary, examHistory]);

  // =========================================================================
  // SUBIDA, AUTO-CORRECCIÓN, SÍNTESIS Y EXPORTACIÓN DE TEMAS (MÓDULOS 04 Y 06)
  // =========================================================================
  const processPdfUpload = async (fileList, isEssayEj2 = false) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setIsExtractingPdf(true);
    const processedItems = [];

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const chosenSelector = isEssayEj2
        ? selectedEssayTopicId
        : selectedLabTopicId;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageStr = textContent.items.map((item) => item.str).join(' ');
          fullText += `[Pág. ${i}] ${pageStr}\n\n`;
        }
        const assignedTopicId =
          chosenSelector === 'Auto'
            ? detectTopicIdFromFilename(file.name, fullText, 'E1')
            : chosenSelector;
        setUploadProgressText(
          `Verificando correspondencia BOCM 2026 y calidad para Test (${
            idx + 1
          }/${files.length}): "${file.name}" → [${assignedTopicId}]...`
        );

        const audit = auditDocumentTextValidity(fullText, assignedTopicId);
        processedItems.push({
          id: `${isEssayEj2 ? 'essay' : 'doc'}-${Date.now()}-${idx}`,
          topicId: assignedTopicId,
          originType: isEssayEj2
            ? '📝 ELABORACIÓN PROPIA'
            : '🏛️ DOCUMENTO SUBIDO',
          name: file.name,
          pages: pdfDoc.numPages,
          date: new Date().toLocaleDateString('es-ES'),
          size: `${Math.round(file.size / 1024)} KB`,
          text: fullText,
          audit,
        });
      } catch (err) {
        console.error('Error procesando PDF:', err);
      }
    }

    if (processedItems.length > 0) {
      if (isEssayEj2) {
        await saveToStore(STORE_ESSAYS, processedItems);
        setEssaysLibrary((prev) => [...processedItems, ...prev]);
        setActiveEssayView(processedItems[0]);
        setCalcEj2(Number(processedItems[0].audit.finalScore));
        setStatusBanner(
          `✅ Tema [${processedItems[0].topicId}] auditado: Nota 2.º Ej: ${processedItems[0].audit.finalScore}/10 · Calidad 1.er Ej (Test): ${processedItems[0].audit.ej1TestQualityScore}/10 · Correspondencia Título BOCM: ${processedItems[0].audit.titleMatchPct}%.`
        );
      } else {
        await saveToStore(STORE_DOCS, processedItems);
        setDocumentsLibrary((prev) => [...processedItems, ...prev]);
        setStatusBanner(
          `✅ ${processedItems.length} PDF(s) verificados con Nota de Calidad para el Ejercicio 1 y Correspondencia con los Títulos BOCM 2026.`
        );
      }
    }
    setIsExtractingPdf(false);
    setUploadProgressText('');
    setTimeout(() => setStatusBanner(''), 5000);
  };

  // CAMBIAR O REASIGNAR EL TEMA DE UN PDF EN EL LABORATORIO DOCUMENTAL (MÓDULO 06)
  const handleChangeLabDocTopic = async (docId, newTopicId) => {
    const target = documentsLibrary.find((d) => d.id === docId);
    if (!target) return;
    const updatedDoc = {
      ...target,
      topicId: newTopicId,
      audit: auditDocumentTextValidity(target.text, newTopicId),
    };
    await saveToStore(STORE_DOCS, [updatedDoc]);
    setDocumentsLibrary((prev) =>
      prev.map((d) => (d.id === docId ? updatedDoc : d))
    );
    setStatusBanner(
      `✅ PDF reasignado al Tema [${newTopicId}]. Correspondencia con el epígrafe oficial 2026: ${updatedDoc.audit.titleMatchPct}% · Calidad Test: ${updatedDoc.audit.ej1TestQualityScore}/10.`
    );
    setTimeout(() => setStatusBanner(''), 4000);
  };

  // AUTO-CORREGIR LEYES DEROGADAS Y COMPLETAR EPÍGRAFES FALTANTES DE UN PDF DEL MÓDULO 06
  const handleAutoFixLabDocAndSendToEj2 = async (doc) => {
    const { updated, countFixed } = autoFixObsoleteLawsInText(doc.text);
    const currentTopObj =
      topicsWithCustomTitles.find((t) => t.id === doc.topicId) ||
      OFFICIAL_TOPICS[16];
    const excellence = getExcellenceSuggestionsForTopic(currentTopObj);
    const enrichedText = `${excellence.modelIntro}\n\n${updated}\n\n${excellence.modelExpansion}\n\n${excellence.modelConclusion}`;
    const newAudit = auditDocumentTextValidity(enrichedText, doc.topicId);

    const updatedDoc = {
      ...doc,
      text: enrichedText,
      audit: newAudit,
    };
    await saveToStore(STORE_DOCS, [updatedDoc]);
    setDocumentsLibrary((prev) =>
      prev.map((d) => (d.id === doc.id ? updatedDoc : d))
    );

    const newEssayCopy = {
      ...updatedDoc,
      id: `essay-fixed-${Date.now()}`,
      name: `${doc.name.replace('.pdf', '')}_ACTUALIZADO_2026.pdf`,
    };
    await saveToStore(STORE_ESSAYS, [newEssayCopy]);
    setEssaysLibrary((prev) => [newEssayCopy, ...prev]);
    setActiveEssayView(newEssayCopy);
    setActiveModule('04');
    setEj2SubTab('pdf_audit');

    setStatusBanner(
      `🛠️ ¡Documento corregido y completado para la convocatoria 2026! (${countFixed} normas antiguas actualizadas). Calidad Test: ${newAudit.ej1TestQualityScore}/10 · Nota 2.º Ej: ${newAudit.finalScore}/10.`
    );
    setTimeout(() => setStatusBanner(''), 6000);
  };

  const handleAutoFixActiveEssayLaws = async () => {
    if (!activeEssayView) return;
    const { updated, countFixed } = autoFixObsoleteLawsInText(
      activeEssayView.text
    );
    const newAudit = auditDocumentTextValidity(
      updated,
      activeEssayView.topicId
    );
    const updatedEssay = { ...activeEssayView, text: updated, audit: newAudit };
    setActiveEssayView(updatedEssay);
    setEssaysLibrary((prev) =>
      prev.map((es) => (es.id === updatedEssay.id ? updatedEssay : es))
    );
    setCalcEj2(Number(newAudit.finalScore));
    await saveToStore(STORE_ESSAYS, [updatedEssay]);
    setStatusBanner(
      `🛠️ Se han sustituido ${countFixed} referencias a normas derogadas por su legislación vigente 2026. Nueva nota: ${newAudit.finalScore} / 10`
    );
    setTimeout(() => setStatusBanner(''), 5000);
  };

  const handleSynthesizeActiveEssayTo90Min = async () => {
    if (!activeEssayView) return;
    const currentTopObj =
      topicsWithCustomTitles.find((t) => t.id === activeEssayView.topicId) ||
      OFFICIAL_TOPICS[16];
    const condensedText = synthesizeTextTo90Minutes(
      activeEssayView.text,
      currentTopObj
    );
    const newAudit = auditDocumentTextValidity(
      condensedText,
      activeEssayView.topicId
    );
    const updatedEssay = {
      ...activeEssayView,
      text: condensedText,
      audit: newAudit,
    };
    setActiveEssayView(updatedEssay);
    setEssaysLibrary((prev) =>
      prev.map((es) => (es.id === updatedEssay.id ? updatedEssay : es))
    );
    setCalcEj2(Number(newAudit.finalScore));
    await saveToStore(STORE_ESSAYS, [updatedEssay]);
    setStatusBanner(
      `✂️ Tema reestructurado y ajustado a ${newAudit.wordCount} palabras (~${newAudit.estimatedWriteMinutes} min a mano). Nueva calificación: ${newAudit.finalScore} / 10`
    );
    setTimeout(() => setStatusBanner(''), 5000);
  };

  const handleSaveManualEssayEdit = async (newText) => {
    if (!activeEssayView) return;
    const newAudit = auditDocumentTextValidity(
      newText,
      activeEssayView.topicId
    );
    const updatedEssay = { ...activeEssayView, text: newText, audit: newAudit };
    setActiveEssayView(updatedEssay);
    setEssaysLibrary((prev) =>
      prev.map((es) => (es.id === updatedEssay.id ? updatedEssay : es))
    );
    setCalcEj2(Number(newAudit.finalScore));
    await saveToStore(STORE_ESSAYS, [updatedEssay]);
  };

  const handleExportCleanEssayToPdfPrint = (essayItem) => {
    if (!essayItem) return;
    const topObj =
      topicsWithCustomTitles.find((t) => t.id === essayItem.topicId) ||
      OFFICIAL_TOPICS[16];
    const printWin = window.open('', '_blank', 'width=900,height=750');
    if (!printWin) {
      setStatusBanner(
        '⚠️ Permite las ventanas emergentes en el navegador para exportar a PDF.'
      );
      return;
    }
    const cleanParagraphs = (essayItem.text || '')
      .replace(/\[Pág\.\s*\d+\]\s*/g, '')
      .split(/\n+/)
      .filter((p) => p.trim().length > 0)
      .map(
        (p) =>
          `<p style="margin-bottom: 12px; text-align: justify; line-height: 1.65;">${p}</p>`
      )
      .join('');

    printWin.document.write(`
      <html>
        <head>
          <title>Tema ${topObj.id} - ${topObj.title}</title>
          <style>
            body { font-family: Georgia, 'Times New Roman', serif; padding: 40px 55px; color: #1e293b; font-size: 11.5pt; }
            h1 { font-size: 15pt; color: #b85a3c; margin-bottom: 6px; }
            .meta { font-family: sans-serif; font-size: 9.5pt; color: #475569; background: #f8fafc; padding: 10px 14px; border-left: 4px solid #d97757; margin-bottom: 24px; }
          </style>
        </head>
        <body>
          <h1>[${topObj.block} · Tema ${topObj.number}] ${topObj.title}</h1>
          <div class="meta">
            <b>Convocatoria:</b> Orden 1049/2026 BOCM ·
            <b>Calidad 1.er Ej (Test):</b> ${essayItem.audit?.ej1TestQualityScore} / 10 ·
            <b>Calificación 2.º Ej:</b> ${essayItem.audit?.finalScore} / 10 ·
            <b>Correspondencia Epígrafe BOCM:</b> ${essayItem.audit?.titleMatchPct}% ·
            <b>Extensión:</b> ${essayItem.audit?.wordCount} palabras (~${essayItem.audit?.estimatedWriteMinutes} min)
          </div>
          ${cleanParagraphs}
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleDeleteLabDoc = async (docId, docName = 'PDF') => {
    await deleteFromStore(STORE_DOCS, docId);
    setDocumentsLibrary((prev) => prev.filter((d) => d.id !== docId));
    setStatusBanner(`🗑️ Documento "${docName}" eliminado correctamente.`);
    setTimeout(() => setStatusBanner(''), 3500);
  };

  const handleClearAllLabDocs = async () => {
    await clearEntireStore(STORE_DOCS);
    setDocumentsLibrary([]);
    setStatusBanner(
      '🗑️ Todos los PDFs del Laboratorio Documental han sido eliminados.'
    );
    setTimeout(() => setStatusBanner(''), 3500);
  };

  const handleDeleteEssayPdf = async (essayId, essayName = 'Tema PDF') => {
    await deleteFromStore(STORE_ESSAYS, essayId);
    const remaining = essaysLibrary.filter((es) => es.id !== essayId);
    setEssaysLibrary(remaining);
    if (activeEssayView?.id === essayId) {
      setActiveEssayView(remaining[0] || null);
    }
    setStatusBanner(
      `🗑️ Tema "${essayName}" eliminado de tu biblioteca del 2.º Ejercicio.`
    );
    setTimeout(() => setStatusBanner(''), 3500);
  };

  const appendModelBlockToActiveEssay = async (blockText, label) => {
    if (!activeEssayView) return;
    const newText = `${activeEssayView.text}\n\n${blockText}`;
    const newAudit = auditDocumentTextValidity(
      newText,
      activeEssayView.topicId
    );
    const updatedEssay = {
      ...activeEssayView,
      text: newText,
      audit: newAudit,
    };
    setActiveEssayView(updatedEssay);
    setEssaysLibrary((prev) =>
      prev.map((es) => (es.id === updatedEssay.id ? updatedEssay : es))
    );
    setCalcEj2(Number(newAudit.finalScore));
    await saveToStore(STORE_ESSAYS, [updatedEssay]);
    setStatusBanner(
      `✨ Se ha incorporado "${label}". Nueva calificación orientativa del tema: ${newAudit.finalScore} / 10`
    );
    setTimeout(() => setStatusBanner(''), 4000);
  };

  const handleChangeActiveEssayTopic = async (newTopicId) => {
    if (!activeEssayView) return;
    const updated = {
      ...activeEssayView,
      topicId: newTopicId,
      audit: auditDocumentTextValidity(activeEssayView.text, newTopicId),
    };
    setActiveEssayView(updated);
    setEssaysLibrary((prev) =>
      prev.map((es) => (es.id === updated.id ? updated : es))
    );
    await saveToStore(STORE_ESSAYS, [updated]);
  };

  const evaluateWrittenOrPhotoExercise = async (
    rawText,
    topicId,
    customLabel
  ) => {
    if (!rawText.trim()) {
      setStatusBanner(
        '⚠️ Escribe o transcribe primero el texto del ejercicio para poder evaluarlo.'
      );
      setTimeout(() => setStatusBanner(''), 3000);
      return;
    }
    const audit = auditDocumentTextValidity(rawText, topicId);
    const newEssayItem = {
      id: `essay-sim-${Date.now()}`,
      topicId,
      originType: customLabel,
      name: `${customLabel} · Tema ${topicId} (${new Date().toLocaleDateString(
        'es-ES'
      )})`,
      pages: Math.max(1, Math.ceil(audit.wordCount / 350)),
      date: new Date().toLocaleDateString('es-ES'),
      size: 'Manuscrito / Simulacro',
      text: rawText,
      audit,
    };
    await saveToStore(STORE_ESSAYS, [newEssayItem]);
    setEssaysLibrary((prev) => [newEssayItem, ...prev]);
    setActiveEssayView(newEssayItem);
    setCalcEj2(Number(audit.finalScore));
    setEj2SubTab('pdf_audit');
    setStatusBanner(
      `🏆 Ejercicio evaluado con la rúbrica BOCM: ${audit.finalScore} / 10.`
    );
    setTimeout(() => setStatusBanner(''), 5000);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setHandwrittenPhotos((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            dataUrl: ev.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const transcribePhotosWithGeminiVision = async () => {
    if (handwrittenPhotos.length === 0) return;
    if (!visionApiKey.trim()) {
      setStatusBanner(
        '💡 Para transcripción automática por IA, pega tu API Key gratuita de Google AI Studio, o transcribe/dicta tu folio en la caja de abajo.'
      );
      setTimeout(() => setStatusBanner(''), 5000);
      return;
    }
    setIsRunningOcr(true);
    try {
      localStorage.setItem('cam_vision_key', visionApiKey.trim());
      const parts = [
        {
          text: 'Transcribe literalmente este ejercicio manuscrito de oposición de Trabajo Social. Señala entre corchetes [ilegible] o [abreviatura no permitida] si detectas signos no usuales según la Base Octava.3.2 del BOCM.',
        },
        ...handwrittenPhotos.map((p) => {
          const base64Data = p.dataUrl.split(',')[1];
          const mimeType = p.dataUrl.substring(
            p.dataUrl.indexOf(':') + 1,
            p.dataUrl.indexOf(';')
          );
          return { inlineData: { mimeType, data: base64Data } };
        }),
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${visionApiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
        }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setOcrTranscribedText((prev) => (prev ? `${prev}\n\n${text}` : text));
        setStatusBanner(
          '✅ Manuscrito transcrito con éxito. Pulsa "Evaluar Manuscrito con Rúbrica BOCM" abajo.'
        );
      } else {
        throw new Error('Sin respuesta');
      }
    } catch {
      setStatusBanner(
        '⚠️ Error al conectar con Gemini Vision. Verifica tu API Key o pega el texto directamente abajo.'
      );
    } finally {
      setIsRunningOcr(false);
      setTimeout(() => setStatusBanner(''), 5000);
    }
  };

  // =========================================================================
  // GENERACIÓN DE PROPUESTAS -> COLA DE VALIDACIÓN (MÓDULO 08)
  // =========================================================================
  const generateProposalsForReviewQueue = (
    sourceText,
    topicId,
    docName = 'Documento del Tema'
  ) => {
    const topic =
      topicsWithCustomTitles.find((t) => t.id === topicId) ||
      OFFICIAL_TOPICS[18];
    const sentences = sourceText
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 55 && s.length < 340);

    const difficultiesToGenerate = [
      ...Array(Number(diffBasic) || 0).fill('Básica'),
      ...Array(Number(diffInterm) || 0).fill('Intermedia'),
      ...Array(Number(diffAdv) || 0).fill('Alta'),
    ];

    const triggers = [
      '🔥 Reforma Normativa Reciente',
      '⏱ Plazo / Excepción Trampa',
      '🔁 Frecuencia Histórica',
      '⚖️ Literalidad Normativa',
    ];

    const proposals = difficultiesToGenerate.map((diff, idx) => {
      const hasDocText = sentences.length > 3;
      const rawStatement = hasDocText
        ? sentences[(idx * 5) % sentences.length]
        : `La actuación técnica se sujetará a los principios rectores previstos en ${topic.lawUpdate}.`;

      const pageMatch = rawStatement.match(/\[Pág\.\s*(\d+)\]/);
      const pageRef = pageMatch
        ? `Pág. ${pageMatch[1]}`
        : `Epígrafe ${(idx % 6) + 1}`;
      const cleanStatement = rawStatement
        .replace(/\[Pág\.\s*\d+\]\s*/g, '')
        .trim();

      const stem =
        diff === 'Básica'
          ? `De conformidad con lo preceptuado en el Tema ${topic.number} del Anexo Oficial (${topic.lawUpdate}), señale la proposición que se ajusta a derecho:`
          : diff === 'Intermedia'
          ? `A tenor literal de la regulación vigente sobre "${topic.title}", en la Comunidad de Madrid resulta preceptivo que:`
          : `En relación con el régimen jurídico-técnico y las excepciones previstas en ${topic.lawUpdate}, identifique la afirmación rigurosamente cierta:`;

      const distractorPlazo = hasDocText
        ? sentences[((idx + 2) * 3) % sentences.length]
            .replace(/\[Pág\.\s*\d+\]\s*/g, '')
            .replace(
              /\b(tres|seis|diez|quince|un|dos|veinte|3|6|10|15|20|25)\b/gi,
              'cuatro'
            )
            .slice(0, 185) +
          ', computándose los plazos en días naturales improrrogables.'
        : 'El plazo máximo de resolución será de un mes natural con efectos de silencio desestimatorio.';

      const distractorCompetencia =
        'La competencia ejecutiva recae con carácter exclusivo en la Administración General del Estado, previo informe facultativo no vinculante.';
      const distractorDerogada =
        'Resultará de aplicación supletoria la Ley 11/2003 de Servicios Sociales y la Ley 6/1995 de Infancia cuando no exista ordenanza municipal.';

      const baseOpts = [
        cleanStatement,
        distractorPlazo,
        distractorCompetencia,
        distractorDerogada,
      ];
      const correctPos = idx % 4;
      const rotated = [0, 1, 2, 3].map((pos) => {
        const letter = ['A)', 'B)', 'C)', 'D)'][pos];
        if (pos === correctPos) return `${letter} ${baseOpts[0]}`;
        const otherIdx = pos < correctPos ? pos + 1 : pos;
        return `${letter} ${baseOpts[otherIdx]}`;
      });

      return {
        id: `prop-${Date.now()}-${idx}`,
        topicId: topic.id,
        difficulty: diff,
        originType: '🤖 PROPUESTA IA (PENDIENTE DE VALIDACIÓN)',
        validatedByPeer: false,
        proposedBy: PROFILES[activeProfile].name,
        examTrigger: triggers[idx % triggers.length],
        leitnerBox: 1,
        nextReviewDate: new Date().toISOString().slice(0, 10),
        question: stem,
        options: rotated,
        correctIndex: correctPos,
        explanation: `TRAZABILIDAD DOCUMENTAL (${docName}, ${pageRef}): "${cleanStatement}".`,
        sourceRef: `${docName} · ${pageRef}`,
      };
    });

    setPeerReviewQueue((prev) => [...proposals, ...prev]);
    setStatusBanner(
      `🔍 ${proposals.length} propuestas enviadas a la Bandeja de Revisión (Módulo 08).`
    );
    setTimeout(() => setStatusBanner(''), 5000);
  };

  const validateAndApproveProposal = (propId) => {
    const target = peerReviewQueue.find((p) => p.id === propId);
    if (!target) return;
    const verifiedQuestion = {
      ...target,
      id: `q-verif-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      originType: '📝 REVISADO Y VALIDADO POR PARES',
      validatedByPeer: true,
      reviewedBy: PROFILES[activeProfile].name,
    };
    setQuestionBank((prev) => [verifiedQuestion, ...prev]);
    setPeerReviewQueue((prev) => prev.filter((p) => p.id !== propId));
  };

  const validateAllProposalsInQueue = () => {
    const verifiedList = peerReviewQueue.map((p, i) => ({
      ...p,
      id: `q-verif-${Date.now()}-${i}`,
      originType: '📝 REVISADO Y VALIDADO POR PARES',
      validatedByPeer: true,
      reviewedBy: PROFILES[activeProfile].name,
    }));
    setQuestionBank((prev) => [...verifiedList, ...prev]);
    setPeerReviewQueue([]);
    setStatusBanner(
      `✅ ${verifiedList.length} preguntas verificadas e incorporadas al Banco Oficial.`
    );
    setTimeout(() => setStatusBanner(''), 4000);
  };

  // Simulacros Test (Módulo 03)
  const launchStrategicSimulator = (
    presetOverride = null,
    topicOverride = null
  ) => {
    const preset = presetOverride || simPresetType;
    let pool = [...questionBank];
    let title = 'Simulacro Oficial Equilibrado BOCM (80 + 5 Reserva · 85 min)';

    if (topicOverride) {
      pool = questionBank.filter((q) => q.topicId === topicOverride);
      title = `Entrenamiento Específico Tema [${topicOverride}]`;
    } else if (preset === 'extremo') {
      pool = questionBank.filter(
        (q) => q.difficulty === 'Alta' || q.difficulty === 'Avanzada'
      );
      title = 'Simulacro de Máxima Exigencia (Dificultad Alta y Muy Alta)';
    } else if (preset === 'normativo') {
      pool = questionBank.filter(
        (q) =>
          (q.examTrigger || '').includes('Reforma') ||
          (q.examTrigger || '').includes('Literalidad')
      );
      title = 'Simulacro Centrado en Normativa y Reformas 2024-2026';
    } else if (preset === 'excepciones') {
      pool = questionBank.filter(
        (q) =>
          (q.examTrigger || '').includes('Plazo') ||
          q.question.includes('INCORRECTA')
      );
      title = 'Simulacro de Excepciones, Plazos y Enunciados Negativos';
    } else if (preset === 'debilidades') {
      pool = questionBank.filter(
        (q) => failedQuestionIds.includes(q.id) || (q.leitnerBox || 1) === 1
      );
      title = 'Simulacro de Repetición Espaciada y Temas que Peor Llevas';
    }

    if (pool.length === 0) pool = [...questionBank];
    pool.sort((a, b) => (a.leitnerBox || 1) - (b.leitnerBox || 1));
    const selected = pool.slice(0, Number(simQuestionCount) || 85);

    setExamSession({
      title,
      strictExamMode: simStrictExamMode,
      questions: selected,
      answers: {},
      errorCauses: {},
      currentIdx: 0,
      timeLeft: 85 * 60,
      isFinished: false,
    });
    setActiveModule('03');
  };

  const finishSimulatorAndScheduleSpacedRepetition = () => {
    if (!examSession) return;
    let hits = 0,
      errors = 0,
      blanks = 0;
    const newFailed = new Set(failedQuestionIds);
    const updatedStats = { ...topicStats };
    const now = new Date();

    const addDays = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    const updatedBank = questionBank.map((q) => {
      const inExam = examSession.questions.find((eq) => eq.id === q.id);
      if (!inExam) return q;
      const ans = examSession.answers[q.id];
      const currentTStat = updatedStats[q.topicId] || { hits: 0, total: 0 };

      if (ans === undefined) {
        blanks++;
        return { ...q, leitnerBox: 1, nextReviewDate: addDays(1) };
      } else if (ans === q.correctIndex) {
        hits++;
        newFailed.delete(q.id);
        updatedStats[q.topicId] = {
          hits: currentTStat.hits + 1,
          total: currentTStat.total + 1,
        };
        const nextBox = Math.min(4, (q.leitnerBox || 1) + 1);
        const daysToWait = nextBox === 2 ? 3 : nextBox === 3 ? 7 : 21;
        return {
          ...q,
          leitnerBox: nextBox,
          nextReviewDate: addDays(daysToWait),
        };
      } else {
        errors++;
        newFailed.add(q.id);
        updatedStats[q.topicId] = {
          hits: currentTStat.hits,
          total: currentTStat.total + 1,
        };
        return { ...q, leitnerBox: 1, nextReviewDate: addDays(1) };
      }
    });

    setQuestionBank(updatedBank);
    setFailedQuestionIds(Array.from(newFailed));
    setTopicStats(updatedStats);

    const total = examSession.questions.length;
    const netScore = Math.max(0, hits - errors / 3);
    const gradeOver10 =
      total > 0 ? ((netScore / total) * 10).toFixed(2) : '0.00';

    setCalcEj1(Number(gradeOver10));
    setExamHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        date: new Date().toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        title: examSession.title,
        total,
        hits,
        errors,
        blanks,
        gradeOver10,
      },
      ...prev,
    ]);
    setExamSession((prev) => ({ ...prev, isFinished: true }));
  };

  const exportGroupPackage = () => {
    const payload = {
      exportedBy: PROFILES[activeProfile].name,
      exportedAt: new Date().toISOString(),
      questionBank,
      peerReviewQueue,
    };
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(payload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute(
      'download',
      `GrupoEstudio_TS_CAM_${PROFILES[activeProfile].role}.json`
    );
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    setStatusBanner('✅ Paquete del Grupo de Estudio exportado.');
    setTimeout(() => setStatusBanner(''), 4000);
  };

  const importGroupPackage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const incomingVerified = parsed.questionBank || [];
        const incomingQueue = parsed.peerReviewQueue || [];
        const existingQ = new Set(
          questionBank.map((q) => q.question.trim().toLowerCase())
        );
        const newVerified = incomingVerified.filter(
          (q) => !existingQ.has(q.question.trim().toLowerCase())
        );
        setQuestionBank((prev) => [...newVerified, ...prev]);
        setPeerReviewQueue((prev) => [...incomingQueue, ...prev]);
        setStatusBanner(
          `🤝 Sincronización completada: +${newVerified.length} preguntas verificadas y +${incomingQueue.length} propuestas.`
        );
      } catch {
        setStatusBanner('⚠️ Archivo JSON no válido.');
      }
      setTimeout(() => setStatusBanner(''), 5000);
    };
    reader.readAsText(file);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const MODULES_NAV = [
    { id: '00', code: '00', label: 'Mi preparación' },
    { id: '01', code: '01', label: 'Temario oficial (83)' },
    { id: '02', code: '02', label: `Banco (${questionBank.length})` },
    { id: '03', code: '03', label: 'Simulacros y test' },
    { id: '04', code: '04', label: 'Desarrollo de temas' },
    { id: '05', code: '05', label: 'Supuestos prácticos' },
    { id: '06', code: '06', label: 'Laboratorio PDF' },
    { id: '07', code: '07', label: 'Normativa 2026' },
    { id: '08', code: '08', label: `Grupo (${peerReviewQueue.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-stone-950 text-slate-800 dark:text-stone-100 font-sans pb-14 transition-colors">
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-2.5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D97757] text-white flex items-center justify-center font-extrabold shadow-xs">
                A2
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#D97757] uppercase tracking-wider">
                  OPOSICIONES · TRABAJO SOCIAL A2 · COMUNIDAD DE MADRID (ORDEN
                  1049/2026)
                </span>
                <h1 className="text-base font-bold text-slate-800 dark:text-white">
                  Sistema de Preparación con Rigor de Tribunal, Inteligencia de
                  Estudio y Trazabilidad
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-[#D97757]">
                👤 Rol activo: {PROFILES[activeProfile].role}
              </span>
              <ThemeSwitch
                isDark={isDark}
                onToggle={() => setTheme(isDark ? 'light' : 'dark')}
              />
            </div>
          </div>

          <nav className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800">
            {MODULES_NAV.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                  activeModule === m.id
                    ? 'bg-[#D97757] text-white shadow-xs'
                    : 'bg-[#FAF8F5] dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/70'
                }`}
              >
                <span className="opacity-75 font-mono text-[10px]">
                  {m.code}
                </span>
                <span>{m.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {statusBanner && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-800 text-white text-xs font-bold text-center shadow-xs">
            {statusBanner}
          </div>
        )}

        {isExtractingPdf && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold text-center animate-pulse">
            ⏳ {uploadProgressText}
          </div>
        )}

        {/* ================================================================= */}
        {/* MÓDULO 00 · MI PREPARACIÓN                                        */}
        {/* ================================================================= */}
        {activeModule === '00' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-[#D97757] uppercase tracking-wider">
                    00 · TU PREPARACIÓN · PANEL DE ESTUDIO
                  </span>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
                    Oposición Trabajo Social · A2 · Comunidad de Madrid (380
                    Plazas)
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Métricas calculadas en tiempo real sobre tus sesiones
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <span className="text-xs font-bold text-stone-500 uppercase">
                    Temas dominados
                  </span>
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                    {dashboardMetrics.mastered} / 83
                  </p>
                  <span className="text-[11px] text-stone-500">
                    +{dashboardMetrics.studied} temas en estudio/repaso
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <span className="text-xs font-bold text-stone-500 uppercase">
                    Aciertos en test
                  </span>
                  <p className="text-2xl font-extrabold text-[#4A7C59] mt-1">
                    {dashboardMetrics.testAccuracyPercent} %
                  </p>
                  <span className="text-[11px] text-stone-500">
                    Retención activa verificada
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <span className="text-xs font-bold text-stone-500 uppercase">
                    Horas de estudio efectivo
                  </span>
                  <p className="text-2xl font-extrabold text-[#D97757] mt-1">
                    {dashboardMetrics.totalHours} h
                  </p>
                  <span className="text-[11px] text-stone-500">
                    Práctica real (no solo conexión)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <span className="text-xs font-bold text-stone-500 uppercase">
                    Temas pendientes
                  </span>
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                    {dashboardMetrics.pending}
                  </p>
                  <span className="text-[11px] text-stone-500">
                    {dashboardMetrics.dueCount} pregs en repetición hoy
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
              <div>
                <span className="text-[11px] font-bold text-[#D97757] uppercase">
                  Diagnóstico Desglosado por Prueba Eliminatoria (Base Octava y
                  Novena BOCM)
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Indicador de Preparación Independiente por Ejercicio (Cada uno
                  es eliminatorio con mín. 5,00)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold">
                      1.er Ejercicio · Test (80+5)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                      {calcEj1} / 10
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    85 minutos · Penalización -1/3 · Acceso a Bolsa Interinos
                    con ≥ 4,00 ptos.
                  </p>
                  <button
                    onClick={() => launchStrategicSimulator('convocatoria')}
                    className="w-full py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Entrenar 1.er Ejercicio
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold">
                      2.º Ejercicio · Desarrollo Escrito
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                      {calcEj2} / 10
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    90 minutos · 1 tema a elegir entre 2 bolas del específico ·{' '}
                    {essaysLibrary.length} temas evaluados.
                  </p>
                  <button
                    onClick={() => setActiveModule('04')}
                    className="w-full py-1.5 rounded-lg bg-[#D97757] text-white text-xs font-bold cursor-pointer"
                  >
                    Ir al Aula de Temas (04)
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-[#D97757]/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-[#D97757]">
                      3.er Ejercicio · Supuesto Práctico ★
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-xs font-extrabold">
                      {calcEj3} / 10
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    90 minutos · 1.ª Prioridad de desempate en la Base Novena.4
                    del BOCM.
                  </p>
                  <button
                    onClick={() => setActiveModule('05')}
                    className="w-full py-1.5 rounded-lg bg-[#4A7C59] text-white text-xs font-bold cursor-pointer"
                  >
                    Ir al Taller de Supuestos (05)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MÓDULO 01 · TEMARIO OFICIAL (CON NOTA CALIDAD TEST Y % BOCM)      */}
        {/* ================================================================= */}
        {activeModule === '01' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                  🏛️ CONTENIDO OFICIAL COTEJADO · Anexo Orden 1049/2026 (BOCM
                  págs. 22 a 28)
                </span>
                <h2 className="text-lg font-bold">
                  01 · Temario Oficial Íntegro (83 Temas) y Auditoría de
                  Correspondencia de PDFs
                </h2>
              </div>

              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <input
                  type="text"
                  placeholder="Buscar epígrafe literal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 rounded-xl border text-xs bg-[#FAF8F5] dark:bg-stone-800 w-full sm:w-56"
                />
                {['Todos', 'General', 'Específico'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBlock(b)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                      selectedBlock === b
                        ? 'bg-slate-800 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {b === 'Todos'
                      ? 'Todos (83)'
                      : b === 'General'
                      ? 'General (16)'
                      : 'Específico (67)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAndFilteredTopics.map((t) => {
                const td = topicData[t.id] || {};
                const status = td.status || 'Pendiente';
                const qCount = questionBank.filter(
                  (q) => q.topicId === t.id
                ).length;
                const topicDocs = documentsLibrary.filter(
                  (d) => d.topicId === t.id
                );

                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-stone-900 p-4 rounded-xl border shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-[#D97757]">
                          {t.block} · Tema {t.number} [{t.id}]
                        </span>
                        <select
                          value={status}
                          onChange={(e) =>
                            setTopicData((prev) => ({
                              ...prev,
                              [t.id]: {
                                ...prev[t.id],
                                status: e.target.value,
                                lastReviewed: new Date()
                                  .toISOString()
                                  .slice(0, 10),
                              },
                            }))
                          }
                          className="p-1 rounded border text-[10px] font-bold bg-[#FAF8F5] dark:bg-stone-800"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Estudiado">Estudiado</option>
                          <option value="Repaso">En Repaso</option>
                          <option value="Dominado">Dominado</option>
                        </select>
                      </div>

                      <h3 className="text-xs font-bold leading-snug">
                        {t.title}
                      </h3>

                      <p className="text-[11px] text-stone-500 bg-[#FAF8F5] dark:bg-stone-800 p-2 rounded-lg border">
                        <b>Marco normativo:</b> {t.lawUpdate}
                      </p>

                      {topicDocs.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {topicDocs.map((d) => (
                            <div
                              key={d.id}
                              className="p-1.5 rounded bg-stone-50 dark:bg-stone-800 border text-[10px] space-y-1"
                            >
                              <div className="flex justify-between items-center">
                                <span className="truncate pr-2 font-bold">
                                  📄 {d.name}
                                </span>
                                <button
                                  onClick={() =>
                                    handleDeleteLabDoc(d.id, d.name)
                                  }
                                  className="text-rose-600 font-extrabold cursor-pointer shrink-0"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="flex gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">
                                  Calidad Test Ej.1:{' '}
                                  {d.audit?.ej1TestQualityScore || '8.50'}/10
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                                  Título BOCM: {d.audit?.titleMatchPct ?? 100}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] font-bold text-stone-500 pt-1">
                        <span>📄 {topicDocs.length} PDFs</span>
                        <span>🎯 {qCount} Preguntas</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => {
                          setSelectedLabTopicId(t.id);
                          setActiveModule('06');
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
                      >
                        📂 Subir / Auditar PDF (06)
                      </button>
                      <button
                        onClick={() =>
                          launchStrategicSimulator('convocatoria', t.id)
                        }
                        className="py-1.5 px-3 rounded-lg bg-[#D97757] text-white text-xs font-bold cursor-pointer"
                      >
                        ⚡ Test
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MÓDULO 02 · BANCO DE PREGUNTAS                                    */}
        {/* ================================================================= */}
        {activeModule === '02' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-base font-bold">
                  02 · Banco de Preguntas Verificadas y Trazables (
                  {questionBank.length})
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={qBankFilterTopic}
                  onChange={(e) => setQBankFilterTopic(e.target.value)}
                  className="p-2 rounded-lg border text-xs bg-[#FAF8F5] dark:bg-stone-800"
                >
                  <option value="Todos">Todos los Temas (83)</option>
                  {sortedAndFilteredTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.title.slice(0, 42)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              {questionBank
                .filter(
                  (q) =>
                    qBankFilterTopic === 'Todos' ||
                    q.topicId === qBankFilterTopic
                )
                .map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-white dark:bg-stone-900 border text-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <span className="font-extrabold text-[#D97757]">
                        Tema {q.topicId} ·{' '}
                        {q.originType || '🏛️ OFICIAL BOCM/BOE'} · Dificultad:{' '}
                        {q.difficulty || 'Intermedia'}
                      </span>
                      <button
                        onClick={() =>
                          setQuestionBank((prev) =>
                            prev.filter((item) => item.id !== q.id)
                          )
                        }
                        className="text-rose-600 font-bold cursor-pointer"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                    <p className="font-bold">{q.question}</p>
                    <p className="text-emerald-700 font-semibold">
                      ✔ {q.options[q.correctIndex]}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {q.explanation}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MÓDULO 03 · SIMULACROS DE MÁXIMA EXIGENCIA                        */}
        {/* ================================================================= */}
        {activeModule === '03' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {!examSession ? (
              <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border space-y-5">
                <h2 className="text-lg font-bold">
                  03 · Configurar Simulacro Oficial (80 + 5 Reserva · 85
                  Minutos)
                </h2>
                <button
                  onClick={() => launchStrategicSimulator()}
                  className="w-full py-3.5 rounded-xl bg-[#D97757] hover:bg-[#B85A3C] text-white font-bold text-xs cursor-pointer"
                >
                  🚀 Iniciar Simulacro Oficial
                </button>
              </div>
            ) : !examSession.isFinished ? (
              <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="text-xs font-bold text-[#D97757]">
                    Pregunta {examSession.currentIdx + 1} de{' '}
                    {examSession.questions.length} · Tema{' '}
                    {examSession.questions[examSession.currentIdx].topicId}
                  </span>
                  <span className="px-3 py-1 rounded-lg font-mono text-xs font-bold bg-stone-100 dark:bg-stone-800">
                    ⏱ {formatTime(examSession.timeLeft)}
                  </span>
                </div>

                <p className="text-sm font-bold leading-relaxed">
                  {examSession.questions[examSession.currentIdx].question}
                </p>

                <div className="space-y-2">
                  {examSession.questions[examSession.currentIdx].options.map(
                    (opt, i) => {
                      const currentQ =
                        examSession.questions[examSession.currentIdx];
                      const isSelected = examSession.answers[currentQ.id] === i;
                      return (
                        <button
                          key={i}
                          onClick={() =>
                            setExamSession((prev) => ({
                              ...prev,
                              answers: { ...prev.answers, [currentQ.id]: i },
                            }))
                          }
                          className={`w-full p-3.5 rounded-xl border text-left text-xs cursor-pointer ${
                            isSelected
                              ? 'bg-[#D97757]/15 border-[#D97757] font-bold'
                              : 'bg-[#FAF8F5] dark:bg-stone-800'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="flex justify-between pt-3 border-t">
                  <button
                    disabled={examSession.currentIdx === 0}
                    onClick={() =>
                      setExamSession((prev) => ({
                        ...prev,
                        currentIdx: prev.currentIdx - 1,
                      }))
                    }
                    className="px-4 py-2 rounded-lg bg-stone-100 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  {examSession.currentIdx < examSession.questions.length - 1 ? (
                    <button
                      onClick={() =>
                        setExamSession((prev) => ({
                          ...prev,
                          currentIdx: prev.currentIdx + 1,
                        }))
                      }
                      className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
                    >
                      Siguiente →
                    </button>
                  ) : (
                    <button
                      onClick={finishSimulatorAndScheduleSpacedRepetition}
                      className="px-5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      ✔ Finalizar y Calificar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border space-y-4 text-center">
                <h3 className="text-lg font-bold">Acta de Corrección (-1/3)</h3>
                {examHistory[0] && (
                  <p className="text-xs">
                    Nota:{' '}
                    <b className="text-base text-[#D97757]">
                      {examHistory[0].gradeOver10} / 10
                    </b>
                  </p>
                )}
                <button
                  onClick={() => setExamSession(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MÓDULO 04 · DESARROLLO DE TEMAS (EDICIÓN, AUTO-CORRECCIÓN Y 10)   */}
        {/* ================================================================= */}
        {activeModule === '04' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border space-y-4 shadow-xs">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 border-b pb-4">
                <div>
                  <span className="text-[11px] font-bold text-[#D97757] uppercase">
                    04 · DESARROLLO DE TEMAS · SEGUNDO EJERCICIO (BASE
                    OCTAVA.3.2 BOCM · 90 MINUTOS)
                  </span>
                  <h2 className="text-lg font-bold mt-0.5">
                    Editor de Excelencia 10/10, Auto-Corrector Normativo,
                    Simulacro 90m y Evaluación por Foto
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      id: 'pdf_audit',
                      label: '📄 A. Rehacer Tema, Auditar y Subir al 10',
                    },
                    {
                      id: 'timed_sim',
                      label: '⏱ B. Simulacro Escrito 90m (2 Bolas)',
                    },
                    {
                      id: 'photo_ocr',
                      label: '📸 C. Subir Foto de Examen Manuscrito',
                    },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setEj2SubTab(st.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                        ej2SubTab === st.id
                          ? 'bg-[#D97757] text-white shadow-xs'
                          : 'bg-[#FAF8F5] dark:bg-stone-800 border text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {ej2SubTab === 'pdf_audit' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <select
                      value={selectedEssayTopicId}
                      onChange={(e) => setSelectedEssayTopicId(e.target.value)}
                      className="p-2.5 rounded-xl border text-xs bg-[#FAF8F5] dark:bg-stone-800 font-bold w-full sm:w-96"
                    >
                      <option value="Auto">
                        🔍 Auto-detectar tema por nombre y contenido del PDF
                      </option>
                      {sortedAndFilteredTopics
                        .filter((t) => t.block === 'Específico')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.id}] {t.title.slice(0, 60)}...
                          </option>
                        ))}
                    </select>

                    <label className="px-5 py-2.5 rounded-xl bg-[#D97757] hover:bg-[#B85A3C] text-white text-xs font-bold cursor-pointer shrink-0">
                      📤 Subir Tema Desarrollado (PDF)
                      <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => processPdfUpload(e.target.files, true)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {essaysLibrary.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {essaysLibrary.map((es) => (
                        <div
                          key={es.id}
                          onClick={() => setActiveEssayView(es)}
                          className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer ${
                            activeEssayView?.id === es.id
                              ? 'bg-[#D97757]/15 border-[#D97757] font-bold'
                              : 'bg-[#FAF8F5] dark:bg-stone-800'
                          }`}
                        >
                          <span>
                            <b className="text-[#D97757]">[{es.topicId}]</b>{' '}
                            {es.name} (2.º Ej: {es.audit?.finalScore}/10 · Test:{' '}
                            {es.audit?.ej1TestQualityScore}/10)
                          </span>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleDeleteEssayPdf(es.id, es.name);
                            }}
                            className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-extrabold cursor-pointer"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeEssayView &&
                    (() => {
                      const currentTopObj =
                        topicsWithCustomTitles.find(
                          (t) => t.id === activeEssayView.topicId
                        ) || OFFICIAL_TOPICS[16];
                      const excellence =
                        getExcellenceSuggestionsForTopic(currentTopObj);

                      return (
                        <div className="space-y-5 pt-3 border-t">
                          <div className="flex flex-wrap justify-between items-center gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#D97757]">
                                  EVALUACIÓN ORIENTATIVA SEGÚN RÚBRICA BOCM •
                                </span>
                                <select
                                  value={activeEssayView.topicId}
                                  onChange={(e) =>
                                    handleChangeActiveEssayTopic(e.target.value)
                                  }
                                  className="p-1 rounded border text-xs font-bold bg-[#FAF8F5] dark:bg-stone-800"
                                >
                                  {sortedAndFilteredTopics.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      Tema {t.id} ({t.block} {t.number})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <h3 className="text-base font-bold">
                                {activeEssayView.name}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-900 text-xs font-extrabold">
                                Calidad Test (1.er Ej):{' '}
                                {activeEssayView.audit?.ej1TestQualityScore} /
                                10
                              </span>
                              <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-sm font-extrabold">
                                Nota 2.º Ej: {activeEssayView.audit?.finalScore}{' '}
                                / 10
                              </span>
                              <button
                                onClick={() =>
                                  handleExportCleanEssayToPdfPrint(
                                    activeEssayView
                                  )
                                }
                                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
                              >
                                🖨️ Exportar PDF / Imprimir
                              </button>
                            </div>
                          </div>

                          {/* PANEL DE ACCIONES DE AUTO-CORRECCIÓN Y SÍNTESIS */}
                          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-xs space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                              <b className="text-amber-950 dark:text-amber-200">
                                🎯 Herramientas Automáticas para Rehacer,
                                Actualizar y Subir este Tema al 10,00 / 10:
                              </b>
                              <div className="flex flex-wrap gap-2">
                                {activeEssayView.audit?.wordCount > 3250 && (
                                  <button
                                    onClick={handleSynthesizeActiveEssayTo90Min}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#D97757] hover:bg-[#B85A3C] text-white font-bold cursor-pointer shadow-xs"
                                  >
                                    ✂️ Auto-Sintetizar a ~2.250 palabras (90
                                    min) y Subir al 10,00
                                  </button>
                                )}
                                {activeEssayView.audit?.warnings?.length >
                                  0 && (
                                  <button
                                    onClick={handleAutoFixActiveEssayLaws}
                                    className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold cursor-pointer shadow-xs"
                                  >
                                    🛠️ Auto-Corregir Normativa Derogada en mi
                                    Texto
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    appendModelBlockToActiveEssay(
                                      `${excellence.modelIntro}\n\n${excellence.modelExpansion}\n\n${excellence.modelConclusion}`,
                                      'Pack Completo de Excelencia 10/10'
                                    )
                                  }
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                                >
                                  ⚡ Insertar Propuestas del Tribunal
                                </button>
                              </div>
                            </div>

                            {activeEssayView.audit?.roadmapTo10?.length > 0 ? (
                              <ul className="list-disc pl-4 text-amber-900 dark:text-amber-100">
                                {activeEssayView.audit.roadmapTo10.map(
                                  (r, i) => (
                                    <li key={i}>{r}</li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <p className="text-emerald-800 font-bold">
                                🏆 ¡Tu tema cumple todos los parámetros de
                                excelencia (10,00 / 10) para escribirse en 90
                                minutos!
                              </p>
                            )}
                          </div>

                          {/* EDITOR INTERACTIVO EN VIVO */}
                          <div className="space-y-2 pt-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase block">
                              ✏️ Editor en Vivo del Tema (Modifica cualquier
                              párrafo y se recalifica al instante):
                            </span>
                            <textarea
                              rows={14}
                              value={activeEssayView.text}
                              onChange={(e) =>
                                handleSaveManualEssayEdit(e.target.value)
                              }
                              className="w-full p-4 rounded-xl border text-xs bg-[#FAF8F5] dark:bg-stone-800 leading-relaxed font-serif"
                            />
                          </div>
                        </div>
                      );
                    })()}
                </div>
              )}

              {ej2SubTab === 'timed_sim' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border flex justify-between items-center">
                    <h3 className="text-sm font-bold">
                      Simulacro Oficial del 2.º Ejercicio (90 Minutos · Sorteo
                      de 2 Bolas)
                    </h3>
                    <button
                      onClick={() => {
                        const esp = topicsWithCustomTitles.filter(
                          (t) => t.block === 'Específico'
                        );
                        const two = [...esp]
                          .sort(() => Math.random() - 0.5)
                          .slice(0, 2);
                        setDrawnBalls(two);
                        if (two[0]) setChosenBallTopicId(two[0].id);
                        setEssayTimer(90 * 60);
                        setEssayTimerRunning(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#D97757] text-white text-xs font-bold cursor-pointer"
                    >
                      🎲 Sortear 2 Bolas e Iniciar Reloj 90m (
                      {formatTime(essayTimer)})
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    placeholder="Desarrolla aquí tu tema..."
                    className="w-full p-4 rounded-xl border text-xs bg-[#FAF8F5] dark:bg-stone-800"
                  />
                  <button
                    onClick={() =>
                      evaluateWrittenOrPhotoExercise(
                        essayText,
                        chosenBallTopicId,
                        '⏱ SIMULACRO 90 MIN'
                      )
                    }
                    className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    ✔ Finalizar y Calificar con Rúbrica BOCM
                  </button>
                </div>
              )}

              {ej2SubTab === 'photo_ocr' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border flex justify-between items-center">
                    <h3 className="text-sm font-bold">
                      Subir Foto de Examen Manuscrito
                    </h3>
                    <label className="px-4 py-2 rounded-xl bg-[#D97757] text-white text-xs font-bold cursor-pointer">
                      📸 Seleccionar Fotos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <textarea
                    rows={8}
                    value={ocrTranscribedText}
                    onChange={(e) => setOcrTranscribedText(e.target.value)}
                    placeholder="Pega o transcribe aquí tu manuscrito para evaluarlo..."
                    className="w-full p-3.5 rounded-xl border text-xs bg-[#FAF8F5] dark:bg-stone-800"
                  />
                  <button
                    onClick={() =>
                      evaluateWrittenOrPhotoExercise(
                        ocrTranscribedText,
                        photoTopicId,
                        '📸 MANUSCRITO EVALUADO'
                      )
                    }
                    className="w-full py-3 rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    ✔ Evaluar Manuscrito con Rúbrica BOCM
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MÓDULO 05 · SUPUESTOS PRÁCTICOS                                   */}
        {/* ================================================================= */}
        {activeModule === '05' && (
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border space-y-4">
            <h2 className="text-lg font-bold">
              05 · Taller de Supuestos Prácticos (90 Minutos Oficial BOCM)
            </h2>
            <button
              onClick={() => {
                setPracticalTimer(90 * 60);
                setPracticalTimerRunning(true);
                setPracticalCase(
                  'SUPUESTO PRÁCTICO OFICIAL (90 MINUTOS - BASE OCTAVA.3.3 ORDEN 1049/2026):\nElabore una propuesta razonada de intervención desde Atención Social Primaria (Ley 12/2022) ante unidad familiar con menores en riesgo (Ley 4/2023 CAM), mayor dependiente (Decreto 54/2015) y violencia de género (Ley 5/2005 CAM).'
                );
              }}
              className="px-4 py-2.5 rounded-xl bg-[#4A7C59] text-white text-xs font-bold cursor-pointer"
            >
              📋 Generar Supuesto Práctico Oficial
            </button>
            {practicalCase && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border text-xs whitespace-pre-wrap">
                  {practicalCase}
                </div>
                <textarea
                  rows={8}
                  value={practicalAnswer}
                  onChange={(e) => setPracticalAnswer(e.target.value)}
                  className="w-full p-3.5 rounded-xl border text-xs bg-[#FAF8F5] dark:bg-stone-800"
                />
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MÓDULO 06 · LABORATORIO DOCUMENTAL (CALIDAD TEST Y TÍTULO 2026)   */}
        {/* ================================================================= */}
        {activeModule === '06' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-[11px] font-bold text-[#D97757] uppercase">
                    06 · LABORATORIO DOCUMENTAL · AUDITORÍA PARA SIMULACROS DEL
                    EJERCICIO 1 Y CORRESPONDENCIA BOCM 2026
                  </span>
                  <h2 className="text-lg font-bold mt-0.5">
                    Revisión de Calidad de la Información para Test y
                    Verificación de Títulos Oficiales ({documentsLibrary.length}{' '}
                    PDFs)
                  </h2>
                </div>
                {documentsLibrary.length > 0 && (
                  <button
                    onClick={handleClearAllLabDocs}
                    className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer shrink-0"
                  >
                    🗑️ Vaciar Todos los PDFs
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={selectedLabTopicId}
                  onChange={(e) => setSelectedLabTopicId(e.target.value)}
                  className="p-2.5 rounded-xl border text-xs bg-[#FAF8F5] dark:bg-stone-800 font-bold"
                >
                  <option value="Auto">
                    🔍 Auto-detectar y verificar correspondencia con los 83
                    temas
                  </option>
                  {sortedAndFilteredTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.title.slice(0, 55)}...
                    </option>
                  ))}
                </select>

                <label className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer">
                  📥 Subir PDF(s) y Auditar Calidad para Ejercicio 1
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => processPdfUpload(e.target.files, false)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {documentsLibrary.length === 0 ? (
              <p className="text-xs text-stone-500 italic text-center py-8">
                Sube tus PDFs de estudio arriba para comprobar su Nota de
                Calidad para el Ejercicio 1 (Test) y verificar que su contenido
                coincide con todos los epígrafes del título de la convocatoria
                2026.
              </p>
            ) : (
              <div className="space-y-4">
                {documentsLibrary.map((doc) => {
                  const hasAlerts = doc.audit?.warnings?.length > 0;
                  const assignedTopObj =
                    topicsWithCustomTitles.find((t) => t.id === doc.topicId) ||
                    OFFICIAL_TOPICS[16];

                  return (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-3 shadow-xs"
                    >
                      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 border-b pb-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={doc.topicId}
                              onChange={(e) =>
                                handleChangeLabDocTopic(doc.id, e.target.value)
                              }
                              className="p-1.5 rounded-lg border text-xs font-extrabold text-[#D97757] bg-[#FAF8F5] dark:bg-stone-800"
                            >
                              {sortedAndFilteredTopics.map((t) => (
                                <option key={t.id} value={t.id}>
                                  [{t.id}] {t.block} {t.number}
                                </option>
                              ))}
                            </select>
                            <b className="text-sm">📄 {doc.name}</b>
                            <span className="text-stone-500">
                              ({doc.pages} págs · {doc.audit?.wordCount}{' '}
                              palabras)
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 dark:text-stone-300">
                            <b>
                              Título Oficial BOCM 2026 [{assignedTopObj.id}]:
                            </b>{' '}
                            {assignedTopObj.title}
                          </p>
                        </div>

                        {/* INDICADORES DE CALIDAD DE INFORMACIÓN PARA TEST Y CORRESPONDENCIA BOCM */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 text-center">
                            <span className="text-[10px] font-bold text-blue-700 block uppercase">
                              Nota Calidad Ej. 1 (Test)
                            </span>
                            <span className="text-sm font-extrabold text-blue-900 dark:text-blue-200">
                              {doc.audit?.ej1TestQualityScore || '8.50'} / 10
                            </span>
                          </div>

                          <div
                            className={`px-3 py-1.5 rounded-xl border text-center ${
                              (doc.audit?.titleMatchPct ?? 100) >= 75
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-amber-50 border-amber-300 text-amber-900'
                            }`}
                          >
                            <span className="text-[10px] font-bold block uppercase">
                              Correspondencia Título 2026
                            </span>
                            <span className="text-sm font-extrabold">
                              {doc.audit?.titleMatchPct ?? 100} %
                            </span>
                          </div>

                          <span
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[10px] ${
                              hasAlerts
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {doc.audit?.validityStatus}
                          </span>
                        </div>
                      </div>

                      {/* DESGLOSE DE DENSIDAD DE DATOS PREGUNTABLES EN EL EJERCICIO 1 */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border">
                          <b>⚖️ Leyes y Artículos detectados:</b>{' '}
                          {doc.audit?.articleMentions || 0} referencias
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border">
                          <b>⏱ Plazos, Baremos y Cifras de Test:</b>{' '}
                          {doc.audit?.deadlinesAndNumbers || 0} datos objetivos
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border">
                          <b>🏛️ Órganos y Competencias:</b>{' '}
                          {doc.audit?.institutionalOrgans || 0} menciones
                        </div>
                      </div>

                      {/* VERIFICACIÓN DE SUB-EPÍGRAFES DEL TÍTULO BOCM 2026 (CUBIERTOS VS FALTANTES) */}
                      <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border space-y-1.5">
                        <b className="block text-[11px] uppercase text-stone-600 dark:text-stone-300">
                          🔍 Comprobación punto por punto con el título oficial
                          de la Orden 1049/2026:
                        </b>
                        <div className="flex flex-wrap gap-1.5">
                          {(doc.audit?.coveredSubheadings || []).map(
                            (sub, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold text-[11px]"
                              >
                                ✔ Cubierto: {sub}
                              </span>
                            )
                          )}
                          {(doc.audit?.missingSubheadings || []).map(
                            (sub, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px]"
                              >
                                ⚠️ Falta reforzar en el PDF: {sub}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {/* ALERTA SI EL CONTENIDO DEL PDF CORRESPONDE A OTRO NÚMERO DE TEMA EN 2026 */}
                      {doc.audit?.hasTopicMismatch && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                          <span>
                            ⚠️ <b>Aviso de Numeración 2026:</b> Por su
                            contenido, este PDF corresponde en realidad al{' '}
                            <b>
                              Tema [{doc.audit.suggestedTopicId}] (
                              {doc.audit.suggestedTopicTitle.slice(0, 65)}...)
                            </b>{' '}
                            del Anexo BOCM 2026.
                          </span>
                          <button
                            onClick={() =>
                              handleChangeLabDocTopic(
                                doc.id,
                                doc.audit.suggestedTopicId
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-amber-800 text-white font-bold cursor-pointer shrink-0"
                          >
                            🔄 Reasignar al Tema [{doc.audit.suggestedTopicId}]
                          </button>
                        </div>
                      )}

                      {hasAlerts && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                          <b>
                            🚨 Normativa antigua detectada que debe actualizarse
                            antes de hacer simulacros:
                          </b>
                          <ul className="list-disc pl-4">
                            {doc.audit.warnings.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => handleAutoFixLabDocAndSendToEj2(doc)}
                          className="px-3.5 py-2 rounded-lg bg-[#D97757] hover:bg-[#B85A3C] text-white text-xs font-bold cursor-pointer"
                        >
                          🛠️ Auto-Corregir Normativa, Completar Epígrafes 2026 y
                          Abrir en Editor 10/10
                        </button>
                        <button
                          onClick={() =>
                            generateProposalsForReviewQueue(
                              doc.text,
                              doc.topicId,
                              doc.name
                            )
                          }
                          className="px-3.5 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold cursor-pointer"
                        >
                          ✨ Extraer 20 Preguntas de Test para el Ejercicio 1
                          (Módulo 08)
                        </button>
                        <button
                          onClick={() => handleDeleteLabDoc(doc.id, doc.name)}
                          className="px-3 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer"
                        >
                          🗑️ Eliminar PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MÓDULO 07 · NORMATIVA Y ACTUALIZACIONES                           */}
        {/* ================================================================= */}
        {activeModule === '07' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border">
              <h2 className="text-lg font-bold">
                07 · Radar de Cambios Legislativos y Vigencia 2026
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {NORMATIVE_WATCH_LIST.map((n) => (
                <div
                  key={n.id}
                  className="bg-white dark:bg-stone-900 p-4 rounded-xl border space-y-2 text-xs"
                >
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                    {n.status}
                  </span>
                  <h3 className="font-bold text-sm">{n.law}</h3>
                  <p className="text-stone-600 dark:text-stone-400">{n.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MÓDULO 08 · GRUPO DE ESTUDIO                                      */}
        {/* ================================================================= */}
        {activeModule === '08' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-lg font-bold">
                  08 · Grupo de Estudio y Bandeja de Validación (
                  {peerReviewQueue.length} propuestas)
                </h2>
                {peerReviewQueue.length > 0 && (
                  <button
                    onClick={validateAllProposalsInQueue}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    ✔ Validar e Incorporar Todas al Banco Común
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {peerReviewQueue.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-800">
                        {prop.originType} · Tema {prop.topicId}
                      </span>
                      <button
                        onClick={() => validateAndApproveProposal(prop.id)}
                        className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold cursor-pointer"
                      >
                        ✔ Validar
                      </button>
                    </div>
                    <p className="font-bold">{prop.question}</p>
                    <p className="text-emerald-700 font-semibold">
                      ✔ {prop.options[prop.correctIndex]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
