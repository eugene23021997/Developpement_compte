/**
 * Service d'extraction de contacts à partir des actualités
 * Ce service analyse le contenu des articles pour identifier les personnes et leurs rôles
 */

// Expressions régulières pour identifier les noms et titres
const PATTERNS = {
  // Modèle : [Prénom Nom], [Titre/Fonction]
  PERSON_WITH_TITLE:
    /([A-Z][a-zÀ-ÿ]+(?:\s[A-Z][a-zÀ-ÿ]+)+)\s*,\s*((?:[^,.]|[dD]'|[dD]e\s)+(?:directeur|directrice|président|présidente|CEO|PDG|DG|DSI|CFO|CTO|CDO|CIO|CHRO|COO|CMO|vice-président|VP|responsable|manager|chef|head|leader|dirigeant|fondateur|fondatrice|chief|officer|executive)\s+(?:[^,.])+)/gi,

  // Pour les cas comme "M. Dupont, Directeur..."
  PERSON_WITH_TITLE_MR_MRS:
    /(?:M\.|Mme|Mlle|Mr\.|Mrs\.|Ms\.)\s+([A-Z][a-zÀ-ÿ]+(?:\s[A-Z][a-zÀ-ÿ]+)*)\s*,\s*((?:[^,.]|[dD]'|[dD]e\s)+(?:directeur|directrice|président|présidente|CEO|PDG|DG|DSI|CFO|CTO|CDO|CIO|CHRO|COO|CMO|vice-président|VP|responsable|manager|chef|head|leader|dirigeant|fondateur|fondatrice|chief|officer|executive)\s+(?:[^,.])+)/gi,

  // Motifs comme "Directeur X, Jean Dupont"
  TITLE_THEN_PERSON:
    /((?:directeur|directrice|président|présidente|CEO|PDG|DG|DSI|CFO|CTO|CDO|CIO|CHRO|COO|CMO|vice-président|VP|responsable|manager|chef|head|leader|dirigeant|fondateur|fondatrice|chief|officer|executive)\s+(?:[^,.])+),\s+([A-Z][a-zÀ-ÿ]+(?:\s[A-Z][a-zÀ-ÿ]+)+)/gi,

  // Forme simple "Jean Dupont (Directeur...)"
  PERSON_TITLE_PARENTHESIS:
    /([A-Z][a-zÀ-ÿ]+(?:\s[A-Z][a-zÀ-ÿ]+)+)\s*\(([^()]*(?:directeur|directrice|président|présidente|CEO|PDG|DG|DSI|CFO|CTO|CDO|CIO|CHRO|COO|CMO|vice-président|VP|responsable|manager|chef|head|leader|dirigeant|fondateur|fondatrice|chief|officer|executive)[^()]*)\)/gi,

  // Formes comme "X a nommé Jean Dupont au poste de Directeur..."
  NAMED_AS:
    /(?:a\s+nommé|nomme|désigne|a\s+été\s+nommé|vient\s+d[e\']être\s+nommé|a\s+promu|promeut|est\s+nommé|devient|a\s+été\s+désigné)\s+([A-Z][a-zÀ-ÿ]+(?:\s[A-Z][a-zÀ-ÿ]+)+)\s+(?:au\s+poste\s+de|comme|en\s+tant\s+que|en\s+qualité\s+de)\s+((?:[^,.]|[dD]'|[dD]e\s)+(?:directeur|directrice|président|présidente|CEO|PDG|DG|DSI|CFO|CTO|CDO|CIO|CHRO|COO|CMO|vice-président|VP|responsable|manager|chef|head|leader|dirigeant|fondateur|fondatrice|chief|officer|executive)\s+(?:[^,.])+)/gi,

  // Reconnaissance directe des titres complets comme Chief Digital Officer
  TITLE_ONLY:
    /(Chief\s+(?:Digital|Information|Technology|Financial|Executive|Marketing|Operating|Human\s+Resources|Product|Strategy|Revenue|Customer|Security)\s+Officer|C[IDTFEMOPRSXH]O|(?:directeur|directrice)\s+(?:général|générale|technique|financier|financière|commercial|commerciale|des achats|des ventes|des opérations|marketing|des systèmes d'information))/gi,

  // Liste de noms pour les personnes sans titre clairement identifié
  POTENTIAL_NAMES: /([A-Z][a-zÀ-ÿ]+(?:\s[A-Z][a-zÀ-ÿ]+){1,2})(?![a-zÀ-ÿ])/g,
};

// Liste de titres/postes à rechercher (utilisée pour l'analyse contextuelle)
const TITLES = [
  // Direction générale
  "PDG",
  "CEO",
  "Président",
  "Présidente",
  "Directeur Général",
  "Directrice Générale",
  "DG",
  "Chief Executive Officer",
  "President",
  "Chairman",
  "Chairwoman",

  // Direction finance
  "CFO",
  "Directeur Financier",
  "Directrice Financière",
  "Chief Financial Officer",
  "DAF",
  "Directeur Administratif et Financier",
  "Trésorier",
  "VP Finance",

  // Direction IT
  "CIO",
  "DSI",
  "Directeur des Systèmes d'Information",
  "Directrice des Systèmes d'Information",
  "Chief Information Officer",
  "CTO",
  "Chief Technology Officer",
  "Directeur Technique",
  "Directeur Digital",
  "Chief Digital Officer",
  "CDO",

  // Innovation & Data
  "CDO",
  "Chief Data Officer",
  "Directeur des Données",
  "Chief Innovation Officer",
  "Directeur de l'Innovation",
  "Data Officer",
  "Directeur Data",

  // Marketing & Communication
  "CMO",
  "Directeur Marketing",
  "Directrice Marketing",
  "Chief Marketing Officer",
  "Directeur de la Communication",
  "Directrice de la Communication",
  "Responsable Marketing",

  // Opérations & Supply Chain
  "COO",
  "Directeur des Opérations",
  "Directrice des Opérations",
  "Chief Operations Officer",
  "Directeur Supply Chain",
  "Directeur de la Chaîne d'Approvisionnement",
  "VP Operations",

  // Ressources Humaines
  "DRH",
  "Directeur des Ressources Humaines",
  "Directrice des Ressources Humaines",
  "CHRO",
  "Chief Human Resources Officer",
  "VP HR",
  "VP RH",

  // Sécurité
  "CSO",
  "CISO",
  "Chief Security Officer",
  "Chief Information Security Officer",
  "Directeur de la Sécurité",

  // Produit
  "CPO",
  "Chief Product Officer",
  "Directeur de Produit",
  "VP Product",

  // Stratégie
  "CSO",
  "Chief Strategy Officer",
  "Directeur de la Stratégie",
  "Head of Strategy",

  // Autres postes de direction
  "Directeur",
  "Directrice",
  "Vice-Président",
  "Vice-Présidente",
  "VP",
  "Responsable",
  "Chef de",
  "Head of",
  "Manager",
  "Dirigeant",
  "Executive",
];

// Entités connues à exclure (faux positifs)
const KNOWN_ENTITIES = [
  "Schneider Electric",
  "BearingPoint",
  "Microsoft",
  "Google",
  "Apple",
  "Amazon",
  "Accenture",
  "Capgemini",
  "Deloitte",
  "KPMG",
  "EY",
  "PWC",
  "IBM",
  "Oracle",
  "SAP",
  "Salesforce",
  "Siemens",
  "ABB",
  "General Electric",
  "Legrand",
  "Eaton",
  "France",
  "Europe",
  "États-Unis",
  "États Unis",
  "Etats-Unis",
  "Etats Unis",
  "Paris",
  "Lyon",
  "Grenoble",
  "Commission Européenne",
  "Union Européenne",
  "Nations Unies",
  "ONU",
  "Parlement",
  "evolving world",
  "industrial automation",
  "staying ahead",
  "curve",
  "Business Applications",
  "Data",
  "Analytics and AI",
  "Operations",
  "People & Strategy",
  "Demand Management",
  "The future in motion",
  "Flexible",
  "agile operations",
];

/**
 * Extrait les contacts potentiels d'un texte en utilisant différentes méthodes
 * @param {string} text - Le texte à analyser (titre + description de l'article)
 * @param {string} company - Le nom de l'entreprise pour le contexte (ex: "Schneider Electric")
 * @returns {Array} Liste des contacts trouvés avec leur nom, rôle et niveau de confiance
 */
function extractContacts(text, company = "Schneider Electric") {
  if (!text) return [];

  const contacts = [];
  const processedNames = new Set(); // Pour éviter les doublons

  // Nettoyer le texte (supprimer les tags HTML, etc.)
  const cleanText = text.replace(/<[^>]*>?/gm, "");

  // Méthode 1: Recherche de modèles précis nom+titre
  extractWithPattern(
    PATTERNS.PERSON_WITH_TITLE,
    cleanText,
    contacts,
    processedNames,
    0.9,
    company
  );
  extractWithPattern(
    PATTERNS.PERSON_WITH_TITLE_MR_MRS,
    cleanText,
    contacts,
    processedNames,
    0.85,
    company,
    1
  );
  extractWithPattern(
    PATTERNS.TITLE_THEN_PERSON,
    cleanText,
    contacts,
    processedNames,
    0.8,
    company,
    2,
    1
  );
  extractWithPattern(
    PATTERNS.PERSON_TITLE_PARENTHESIS,
    cleanText,
    contacts,
    processedNames,
    0.8,
    company
  );
  extractWithPattern(
    PATTERNS.NAMED_AS,
    cleanText,
    contacts,
    processedNames,
    0.9,
    company
  );

  // Nouvelle méthode : Extraire les titres sans nom associé
  extractTitlesOnly(
    PATTERNS.TITLE_ONLY,
    cleanText,
    contacts,
    processedNames,
    company
  );

  // Méthode 2: Recherche contextuelle pour les noms sans titre explicite
  const potentialNames = [];
  let match;
  while ((match = PATTERNS.POTENTIAL_NAMES.exec(cleanText)) !== null) {
    const name = match[1];

    // Ignorer si déjà traité ou si c'est une entité connue
    if (
      processedNames.has(name.toLowerCase()) ||
      KNOWN_ENTITIES.some(
        (entity) => name.includes(entity) || entity.includes(name)
      )
    ) {
      continue;
    }

    // Obtenir le contexte avant et après le nom (50 caractères)
    const startPos = Math.max(0, match.index - 50);
    const endPos = Math.min(cleanText.length, match.index + name.length + 50);
    const context = cleanText.substring(startPos, endPos);

    // Calculer un score de confiance basé sur le contexte
    let confidenceScore = 0.3; // Score de base

    // Indice 1: Proche de l'entreprise mentionnée
    if (context.includes(company)) {
      confidenceScore += 0.2;
    }

    // Indice 2: Contient des mots comme "nommé", "rejoint", etc.
    if (
      /nomm[ée]|rejoi[nt]|arriv[ée]|intègre|recrut[ée]|promu[e]?|désign[ée]/i.test(
        context
      )
    ) {
      confidenceScore += 0.15;
    }

    // Indice 3: Proximité d'un titre sans avoir été capturé par les regex précédentes
    const titleNearby = TITLES.some((title) =>
      context.toLowerCase().includes(title.toLowerCase())
    );
    if (titleNearby) {
      confidenceScore += 0.15;

      // Essayer d'extraire le titre à partir du contexte
      const potentialTitle = extractTitleFromContext(context, name);

      potentialNames.push({
        name,
        role: potentialTitle || "Poste non spécifié",
        confidenceScore,
        company,
        context,
      });
    } else if (confidenceScore > 0.4) {
      // Ajouter seulement si le score dépasse un certain seuil
      potentialNames.push({
        name,
        role: "Poste non spécifié",
        confidenceScore,
        company,
        context,
      });
    }

    processedNames.add(name.toLowerCase());
  }

  // Filtrer les noms potentiels et les ajouter à la liste des contacts
  potentialNames
    .filter((contact) => contact.confidenceScore >= 0.4)
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .forEach((contact) => contacts.push(contact));

  return contacts;
}

/**
 * Extrait les contacts à partir d'un modèle regex spécifique
 */
function extractWithPattern(
  pattern,
  text,
  contacts,
  processedNames,
  baseConfidence,
  company,
  nameIndex = 1,
  roleIndex = 2
) {
  pattern.lastIndex = 0; // Réinitialiser l'index du regex

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const name = match[nameIndex].trim();
    const role = match[roleIndex].trim();

    // Vérifier si ce n'est pas une entité connue
    if (
      KNOWN_ENTITIES.some(
        (entity) => name.includes(entity) || entity.includes(name)
      )
    ) {
      continue;
    }

    // Éviter les doublons
    if (!processedNames.has(name.toLowerCase())) {
      processedNames.add(name.toLowerCase());

      contacts.push({
        name,
        role,
        confidenceScore: baseConfidence,
        company,
        context: text.substring(
          Math.max(0, match.index - 30),
          Math.min(text.length, match.index + match[0].length + 30)
        ),
      });
    }
  }
}

/**
 * Extrait les titres sans nom associé
 */
function extractTitlesOnly(pattern, text, contacts, processedNames, company) {
  pattern.lastIndex = 0;

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const role = match[1].trim();

    // Vérifier si ce titre est déjà traité
    const roleKey = role.toLowerCase();
    if (processedNames.has(roleKey)) {
      continue;
    }

    // Vérifier si ce n'est pas une entité connue
    if (
      KNOWN_ENTITIES.some(
        (entity) => role.includes(entity) || entity.includes(name)
      )
    ) {
      continue;
    }

    // Ajouter comme contact avec nom manquant
    contacts.push({
      name: "-", // Utiliser un tiret quand le nom n'est pas identifié
      role: role,
      confidenceScore: 0.6,
      company,
      context: text.substring(
        Math.max(0, match.index - 30),
        Math.min(text.length, match.index + match[0].length + 30)
      ),
    });

    processedNames.add(roleKey);
  }
}

/**
 * Tente d'extraire un titre à partir du contexte d'un nom
 */
function extractTitleFromContext(context, name) {
  const namePos = context.indexOf(name);
  if (namePos === -1) return null;

  // Recherche de titre avant le nom
  const beforeName = context.substring(0, namePos).trim();
  // Recherche de titre après le nom
  const afterName = context.substring(namePos + name.length).trim();

  for (const title of TITLES) {
    // Vérifier si le titre est présent avant ou après le nom
    if (beforeName.includes(title)) {
      // Extraire la phrase contenant le titre (avant le nom)
      const titlePos = beforeName.lastIndexOf(title);
      const startPos = beforeName.lastIndexOf(".", titlePos);
      const endPos = beforeName.length;

      const extractedTitle = beforeName
        .substring(
          startPos === -1 ? Math.max(0, titlePos - 20) : startPos + 1,
          endPos
        )
        .trim();

      return extractedTitle;
    }

    if (afterName.includes(title)) {
      // Extraire la phrase contenant le titre (après le nom)
      const titlePos = afterName.indexOf(title);
      const startPos = 0;
      const endPos = afterName.indexOf(".", titlePos);

      const extractedTitle = afterName
        .substring(
          startPos,
          endPos === -1
            ? Math.min(afterName.length, titlePos + title.length + 20)
            : endPos
        )
        .trim();

      return extractedTitle;
    }
  }

  return null;
}

/**
 * Extrait les contacts de toutes les actualités
 * @param {Array} news - Liste des actualités à analyser
 * @param {string} company - Nom de l'entreprise pour le contexte
 * @returns {Array} Liste des contacts extraits
 */
function extractContactsFromNews(news, company = "Schneider Electric") {
  const allContacts = [];

  news.forEach((newsItem) => {
    // Combiner le titre et la description pour l'analyse
    const combinedText = `${newsItem.title}. ${newsItem.description}`;

    // Extraire les contacts de cette actualité
    const contacts = extractContacts(combinedText, company);

    // Ajouter les références à l'article source
    contacts.forEach((contact) => {
      contact.source = {
        title: newsItem.title,
        date: newsItem.date,
        link: newsItem.link,
      };

      allContacts.push(contact);
    });
  });

  // Dédupliquer et trier par score de confiance
  return deduplicateContacts(allContacts).sort(
    (a, b) => b.confidenceScore - a.confidenceScore
  );
}

/**
 * Déduplique les contacts en fusionnant les informations sur les mêmes personnes
 */
function deduplicateContacts(contacts) {
  const contactMap = new Map();

  contacts.forEach((contact) => {
    const nameKey = contact.name.toLowerCase();

    if (contactMap.has(nameKey)) {
      const existing = contactMap.get(nameKey);

      // Garder le rôle le plus précis
      if (
        contact.role !== "Poste non spécifié" &&
        (existing.role === "Poste non spécifié" ||
          contact.confidenceScore > existing.confidenceScore)
      ) {
        existing.role = contact.role;
      }

      // Mettre à jour le score de confiance
      existing.confidenceScore = Math.max(
        existing.confidenceScore,
        contact.confidenceScore
      );

      // Ajouter la source si elle est différente
      if (
        !existing.sources.some((source) => source.link === contact.source.link)
      ) {
        existing.sources.push(contact.source);
      }
    } else {
      // Nouveau contact
      contactMap.set(nameKey, {
        ...contact,
        sources: [contact.source],
      });

      // Supprimer la propriété source individuelle
      delete contactMap.get(nameKey).source;
    }
  });

  return Array.from(contactMap.values());
}

export const contactExtractionService = {
  extractContactsFromNews,
};
