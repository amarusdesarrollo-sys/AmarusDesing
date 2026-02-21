import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type {
  HistoriaContent,
  PoliticasContent,
  HomeContent,
  EquipoCierreContent,
  ContactoContent,
} from "@/types";

const COLLECTION_NAME = "content";

/** Obtiene contenido de Historia (fallback a valores por defecto) */
export async function getHistoriaContent(): Promise<HistoriaContent> {
  try {
    const ref = doc(db, COLLECTION_NAME, "historia");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        title: "¿Cómo llegamos aquí?",
        paragraphs: [
          "Nos conocimos viajando hace ya unos años, hoy en día, aparte de ser los creadores de AmarusDesign, somos mama y papa de Amaru. Que como el nombre ya indica es la razón por la que hemos creado esta empresa.",
          "Amaru lleva un nombre Aimara porque nos conocimos a orillas del Lago Titicaca.",
          "Durante años seguimos en la ruta, vendiendo nuestras artesanías, en ocasiones ya siendo una familia. Por diferentes razones volvimos a Europa para trabajar de forma convencional, siempre con la ilusión de volver a nuestro lado más creativo.",
          "El tiempo ha pasado y casi sin planearlo, hemos vuelto a nuestra esencia creando este proyecto.",
          "Un sueño para resolver un sustento económico, pero a la vez armoniosa con la familia, que nos permita disfrutar de la crianza de nuestro hijo e incluso integrarlo en nuestro día a día.",
          "Invertimos nuestra energía y cariño, en atender a nuestros clientes cómo se merecen, siempre sin perder el amor al detalle. Buscamos reinventarnos cada día, incluyendo en nuestro equipo a más artesanos que comparten nuestra pasión por los minerales.",
        ],
      };
    }
    const d = snap.data();
    return {
      title: d.title ?? "¿Cómo llegamos aquí?",
      subtitle: d.subtitle,
      imagePublicId: d.imagePublicId,
      imageUrl: d.imageUrl,
      paragraphs: Array.isArray(d.paragraphs) ? d.paragraphs : [],
    };
  } catch (error) {
    console.error("Error loading historia content:", error);
    // Retornar valores por defecto en caso de error
    return {
      title: "¿Cómo llegamos aquí?",
      paragraphs: [
        "Nos conocimos viajando hace ya unos años, hoy en día, aparte de ser los creadores de AmarusDesign, somos mama y papa de Amaru. Que como el nombre ya indica es la razón por la que hemos creado esta empresa.",
        "Amaru lleva un nombre Aimara porque nos conocimos a orillas del Lago Titicaca.",
        "Durante años seguimos en la ruta, vendiendo nuestras artesanías, en ocasiones ya siendo una familia. Por diferentes razones volvimos a Europa para trabajar de forma convencional, siempre con la ilusión de volver a nuestro lado más creativo.",
        "El tiempo ha pasado y casi sin planearlo, hemos vuelto a nuestra esencia creando este proyecto.",
        "Un sueño para resolver un sustento económico, pero a la vez armoniosa con la familia, que nos permita disfrutar de la crianza de nuestro hijo e incluso integrarlo en nuestro día a día.",
        "Invertimos nuestra energía y cariño, en atender a nuestros clientes cómo se merecen, siempre sin perder el amor al detalle. Buscamos reinventarnos cada día, incluyendo en nuestro equipo a más artesanos que comparten nuestra pasión por los minerales.",
      ],
    };
  }
}

/** Guarda contenido de Historia */
export async function updateHistoriaContent(
  content: HistoriaContent
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, "historia");
  await setDoc(
    ref,
    {
      ...content,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

/** Obtiene contenido de Políticas */
export async function getPoliticasContent(): Promise<PoliticasContent> {
  try {
    const ref = doc(db, COLLECTION_NAME, "politicas");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        heroTitle: "POLÍTICAS DE LA TIENDA Y ENVÍOS",
        intro:
          "En AmarusDesign queremos que nuestros clientes reciban el mejor servicio durante su compra para que siempre quieran volver con nosotros. Por eso creemos que las políticas de nuestra tienda deben ser justas, claras y transparentes. A continuación encontrarás una lista con nuestras políticas. Si hay alguna información que no se encuentre en la lista, contáctanos y te ayudaremos.",
        sections: [
          {
            title: "ENVÍOS Y ENTREGAS",
            content:
              "Cada pieza está empaquetada con amor y listo para ser un gran regalo para cualquier ocasión.\n\nLos envíos se realizan desde España mediante correos certificado, de esta manera usted puede asegurarse de que recibirá su paquete en sus manos y tendrá un reembolso completo si su paquete se extraviase.",
          },
          {
            title: "NUESTRA POLÍTICA DE DEVOLUCIONES",
            content:
              "Aceptamos cambios y devoluciones. Ponte en contacto con nosotros en los 14 días posteriores a la entrega. Devuélveme los artículos en los 30 días posteriores a la entrega.\n\nNo acepto cancelaciones. Ponte en contacto conmigo si tienes algún problema con tu pedido.",
          },
          {
            title: "LA PRIVACIDAD EN AMARUSDESIGN",
            content:
              "Tus datos están seguros. Respetamos la legislación vigente en protección de datos personales (RGPD, LOPD-GDD).",
          },
        ],
      };
    }
    const d = snap.data();
    return {
      heroTitle: d.heroTitle ?? "POLÍTICAS DE LA TIENDA Y ENVÍOS",
      heroImagePublicId: d.heroImagePublicId,
      heroImageUrl: d.heroImageUrl,
      intro: d.intro ?? "",
      sections: Array.isArray(d.sections) ? d.sections : [],
    };
  } catch (error) {
    console.error("Error loading politicas content:", error);
    return {
      heroTitle: "POLÍTICAS DE LA TIENDA Y ENVÍOS",
      intro:
        "En AmarusDesign queremos que nuestros clientes reciban el mejor servicio durante su compra para que siempre quieran volver con nosotros. Por eso creemos que las políticas de nuestra tienda deben ser justas, claras y transparentes. A continuación encontrarás una lista con nuestras políticas. Si hay alguna información que no se encuentre en la lista, contáctanos y te ayudaremos.",
      sections: [
        {
          title: "ENVÍOS Y ENTREGAS",
          content:
            "Cada pieza está empaquetada con amor y listo para ser un gran regalo para cualquier ocasión.\n\nLos envíos se realizan desde España mediante correos certificado, de esta manera usted puede asegurarse de que recibirá su paquete en sus manos y tendrá un reembolso completo si su paquete se extraviase.",
        },
        {
          title: "NUESTRA POLÍTICA DE DEVOLUCIONES",
          content:
            "Aceptamos cambios y devoluciones. Ponte en contacto con nosotros en los 14 días posteriores a la entrega.",
        },
        {
          title: "LA PRIVACIDAD EN AMARUSDESIGN",
          content: "Tus datos están seguros. Respetamos la legislación vigente en protección de datos personales (RGPD, LOPD-GDD).",
        },
      ],
    };
  }
}

/** Guarda contenido de Políticas */
export async function updatePoliticasContent(
  content: PoliticasContent
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, "politicas");
  await setDoc(
    ref,
    {
      ...content,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

/** Obtiene contenido de Home */
export async function getHomeContent(): Promise<HomeContent> {
  try {
    const ref = doc(db, COLLECTION_NAME, "home");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        proyectoFamiliar: {
          title: "CONOCE NUESTRO PROYECTO FAMILIAR",
          paragraphs: [
            "Con mucha ilusión presentamos nuestro proyecto, que representa nuestra filosofía de vida",
            '"La felicidad solo es real si es compartida"',
            "Por ello y muchas razones más incluimos a más artesan@s amig@s en AmarusDesign",
            "Ofreciéndote así más variedad, conociendo siempre el origen de tu joya, ropa o accesorio",
          ],
        },
        historia: {
          title: "¿Cómo llegamos aquí?",
          paragraphs: [],
        },
      };
    }
    const d = snap.data();
    const pf = d.proyectoFamiliar ?? {};
    const hist = d.historia ?? {};
    return {
      proyectoFamiliar: {
        title: pf.title ?? "CONOCE NUESTRO PROYECTO FAMILIAR",
        paragraphs: Array.isArray(pf.paragraphs) ? pf.paragraphs : [],
      },
      historia: {
        title: hist.title ?? "¿Cómo llegamos aquí?",
        imagePublicId: hist.imagePublicId,
        imageUrl: hist.imageUrl,
        paragraphs: Array.isArray(hist.paragraphs) ? hist.paragraphs : [],
      },
    };
  } catch (error) {
    console.error("Error loading home content:", error);
    return {
      proyectoFamiliar: {
        title: "CONOCE NUESTRO PROYECTO FAMILIAR",
        paragraphs: [
          "Con mucha ilusión presentamos nuestro proyecto, que representa nuestra filosofía de vida",
          '"La felicidad solo es real si es compartida"',
          "Por ello y muchas razones más incluimos a más artesan@s amig@s en AmarusDesign",
          "Ofreciéndote así más variedad, conociendo siempre el origen de tu joya, ropa o accesorio",
        ],
      },
      historia: {
        title: "¿Cómo llegamos aquí?",
        paragraphs: [],
      },
    };
  }
}

/** Guarda contenido de Home */
export async function updateHomeContent(content: HomeContent): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, "home");
  await setDoc(
    ref,
    {
      ...content,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

/** Obtiene contenido de cierre de Equipo */
export async function getEquipoCierreContent(): Promise<EquipoCierreContent> {
  try {
    const ref = doc(db, COLLECTION_NAME, "equipoCierre");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        title: "Amarus Design",
        paragraphs: [
          "Espontánea como la vida misma ha surgido este hermoso proyecto en el que incluimos familias artesan@s de diferentes partes del mundo. Basado en la confianza y en la amistad, compartimos nuestro trabajo,",
          "Son tiempos de CAMBIOS, es hora de innovar dejando atrás la competitividad.",
          "En nuestra tienda no solo encontrará joyas hechos por nosotros sino también por nuestro equipo. Invertimos parte de nuestras ganancias en otros artistas para así poder ofrecerte diversidad y calidad, con piedras naturales preseleccionadas por nosotros.",
          "Creemos en que la unión es la fuerza y ofrecer productos de otr@s compañer@s solo puede enriquecer nuestra marca, en cada artículo aclararemos quién ha sido su creador.",
        ],
      };
    }
    const d = snap.data();
    return {
      title: d.title ?? "Amarus Design",
      paragraphs: Array.isArray(d.paragraphs) ? d.paragraphs : [],
    };
  } catch (error) {
    console.error("Error loading equipo cierre content:", error);
    return {
      title: "Amarus Design",
      paragraphs: [
        "Espontánea como la vida misma ha surgido este hermoso proyecto en el que incluimos familias artesan@s de diferentes partes del mundo. Basado en la confianza y en la amistad, compartimos nuestro trabajo,",
        "Son tiempos de CAMBIOS, es hora de innovar dejando atrás la competitividad.",
        "En nuestra tienda no solo encontrará joyas hechos por nosotros sino también por nuestro equipo. Invertimos parte de nuestras ganancias en otros artistas para así poder ofrecerte diversidad y calidad, con piedras naturales preseleccionadas por nosotros.",
        "Creemos en que la unión es la fuerza y ofrecer productos de otr@s compañer@s solo puede enriquecer nuestra marca, en cada artículo aclararemos quién ha sido su creador.",
      ],
    };
  }
}

/** Guarda contenido de cierre de Equipo */
export async function updateEquipoCierreContent(
  content: EquipoCierreContent
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, "equipoCierre");
  await setDoc(
    ref,
    {
      ...content,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

/** Obtiene contenido de Contacto (hero) */
export async function getContactoContent(): Promise<ContactoContent> {
  try {
    const ref = doc(db, COLLECTION_NAME, "contacto");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        heroTitle: "CONTACTO",
        heroSubtitle:
          "¿Tienes alguna pregunta? Estamos aquí para ayudarte. Contáctanos y te responderemos lo antes posible.",
      };
    }
    const d = snap.data();
    return {
      heroTitle: d.heroTitle ?? "CONTACTO",
      heroSubtitle: d.heroSubtitle ?? "",
    };
  } catch (error) {
    console.error("Error loading contacto content:", error);
    return {
      heroTitle: "CONTACTO",
      heroSubtitle:
        "¿Tienes alguna pregunta? Estamos aquí para ayudarte. Contáctanos y te responderemos lo antes posible.",
    };
  }
}

/** Guarda contenido de Contacto */
export async function updateContactoContent(
  content: ContactoContent
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, "contacto");
  await setDoc(
    ref,
    {
      ...content,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}
