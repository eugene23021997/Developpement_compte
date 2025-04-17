/**
 * Service unifié pour l'extraction et la gestion des contacts
 * Ce service analyse le contenu des articles pour identifier les personnes, 
 * gère l'import/export des contacts et permet l'analyse de pertinence
 */

import * as XLSX from "xlsx";

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
};

// Liste de titres/postes à rechercher (utilisée pour l'analyse contextuelle)
const TITLES = [
  // Direction générale
  "PDG", "CEO", "Président", "Présidente", "Directeur Général", "Directrice Générale", 
  "DG", "Chief Executive Officer", "President", "Chairman", "Chairwoman",

  // Direction finance
  "CFO", "Directeur Financier", "Directrice Financière", "Chief Financial Officer",
  "DAF", "Directeur Administratif et Financier", "Trésorier", "VP Finance",

  // Direction IT
  "CIO", "DSI", "Directeur des Systèmes d'Information", "Directrice des Systèmes d'Information",
  "Chief Information Officer", "CTO", "Chief Technology Officer", "Directeur Technique",
  "Directeur Digital", "Chief Digital Officer", "CDO",

  // Innovation & Data
  "CDO", "Chief Data Officer", "Directeur des Données", "Chief Innovation Officer",
  "Directeur de l'Innovation", "Data Officer", "Directeur Data",

  // Marketing & Communication
  "CMO", "Directeur Marketing", "Directrice Marketing", "Chief Marketing Officer",
  "Directeur de la Communication", "Directrice de la Communication", "Responsable Marketing",

  // Opérations & Supply Chain
  "COO", "Directeur des Opérations", "Directrice des Opérations", "Chief Operations Officer",
  "Directeur Supply Chain", "Directeur de la Chaîne d'Approvisionnement", "VP Operations",

  // Ressources Humaines
  "DRH", "Directeur des Ressources Humaines", "Directrice des Ressources Humaines",
  "CHRO", "Chief Human Resources Officer", "VP HR", "VP RH",

  // Sécurité
  "CSO", "CISO", "Chief Security Officer", "Chief Information Security Officer",
  "Directeur de la Sécurité",

  // Produit
  "CPO", "Chief Product Officer", "Directeur de Produit", "VP Product",

  // Stratégie
  "CSO", "Chief Strategy Officer", "Directeur de la Stratégie", "Head of Strategy",

  // Autres postes de direction
  "Directeur", "Directrice", "Vice-Président", "Vice-Présidente", "VP",
  "Responsable", "Chef de", "Head of", "Manager", "Dirigeant", "Executive",
];

// Entités connues à exclure (faux positifs)
const KNOWN_ENTITIES = [
  "Schneider Electric", "BearingPoint", "Microsoft", "Google", "Apple", "Amazon",
  "Accenture", "Capgemini", "Deloitte", "KPMG", "EY", "PWC", "IBM", "Oracle", "SAP",
  "Salesforce", "Siemens", "ABB", "General Electric", "Legrand", "Eaton", "France",
  "Europe", "États-Unis", "États Unis", "Etats-Unis", "Etats Unis", "Paris", "Lyon", 
  "Grenoble", "Commission Européenne", "Union Européenne", "Nations Unies", "ONU", 
  "Parlement", "evolving world", "industrial automation", "staying ahead", "curve",
  "Business Applications", "Data", "Analytics and AI", "Operations", "People & Strategy", 
  "Demand Management", "The future in motion", "Flexible", "agile operations",
];

/**
 * Classe ContactService pour gérer toutes les fonctionnalités liées aux contacts
 */
class ContactService {
  /**
   * Extrait les contacts potentiels d'un texte en utilisant différentes méthodes
   * @param {string} text - Le texte à analyser (titre + description de l'article)
   * @param {string} company - Le nom de l'entreprise pour le contexte
   * @returns {Array} Liste des contacts trouvés avec leur nom, rôle et niveau de confiance
   */
  extractContacts(text, company = "Schneider Electric") {
    if (!text) return [];

    const contacts = [];
    const processedNames = new Set(); // Pour éviter les doublons

    // Nettoyer le texte (supprimer les tags HTML, etc.)
    const cleanText = text.replace(/<[^>]*>?/gm, "");

    // Méthode 1: Recherche de modèles précis nom+titre
    this._extractWithPattern(PATTERNS.PERSON_WITH_TITLE, cleanText, contacts, processedNames, 0.9, company);
    this._extractWithPattern(PATTERNS.PERSON_WITH_TITLE_MR_MRS, cleanText, contacts, processedNames, 0.85, company, 1);
    this._extractWithPattern(PATTERNS.TITLE_THEN_PERSON, cleanText, contacts, processedNames, 0.8, company, 2, 1);

    // Extraire les titres sans nom associé
    this._extractTitlesOnly(cleanText, contacts, processedNames, company);

    // Méthode 2: Recherche contextuelle pour les noms sans titre explicite
    this._extractContextualNames(cleanText, contacts, processedNames, company);

    return contacts;
  }

  /**
   * Méthode privée pour extraire les contacts à partir d'un modèle regex spécifique
   */
  _extractWithPattern(
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
   * Méthode privée pour extraire les titres sans nom associé
   */
  _extractTitlesOnly(text, contacts, processedNames, company) {
    TITLES.forEach((role) => {
      const regex = new RegExp(`\\b${role}\\b`, "gi");
      regex.lastIndex = 0;

      let match;
      while ((match = regex.exec(text)) !== null) {
        const detectedRole = match[0].trim();

        // Vérifier si ce titre est déjà traité
        const roleKey = detectedRole.toLowerCase();
        if (processedNames.has(roleKey)) {
          continue;
        }

        // Vérifier si ce n'est pas une entité connue
        if (
          KNOWN_ENTITIES.some(
            (entity) => detectedRole.includes(entity) || entity.includes(entity)
          )
        ) {
          continue;
        }

        // Ajouter comme contact avec nom manquant
        contacts.push({
          name: "Nom non identifié",
          role: detectedRole,
          confidenceScore: 0.6,
          company,
          context: text.substring(
            Math.max(0, match.index - 30),
            Math.min(text.length, match.index + match[0].length + 30)
          ),
        });

        processedNames.add(roleKey);
      }
    });
  }

  /**
   * Méthode privée pour extraire les noms basés sur le contexte
   */
  _extractContextualNames(text, contacts, processedNames, company) {
    // Regex pour détecter les noms propres potentiels
    const nameRegex = /([A-Z][a-zÀ-ÿ]+(?:\s[A-Z][a-zÀ-ÿ]+){1,2})(?![a-zÀ-ÿ])/g;
    nameRegex.lastIndex = 0;

    let match;
    while ((match = nameRegex.exec(text)) !== null) {
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
      const endPos = Math.min(text.length, match.index + name.length + 50);
      const context = text.substring(startPos, endPos);

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
        const potentialTitle = this._extractTitleFromContext(context, name);

        if (confidenceScore >= 0.4) {
          contacts.push({
            name,
            role: potentialTitle || "Poste non spécifié",
            confidenceScore,
            company,
            context,
          });
          processedNames.add(name.toLowerCase());
        }
      } else if (confidenceScore > 0.4) {
        // Ajouter seulement si le score dépasse un certain seuil
        contacts.push({
          name,
          role: "Poste non spécifié",
          confidenceScore,
          company,
          context,
        });
        processedNames.add(name.toLowerCase());
      }
    }
  }

  /**
   * Méthode privée pour extraire un titre à partir du contexte d'un nom
   */
  _extractTitleFromContext(context, name) {
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
  extractContactsFromNews(news, company = "Schneider Electric") {
    const allContacts = [];

    news.forEach((newsItem) => {
      // Combiner le titre et la description pour l'analyse
      const combinedText = `${newsItem.title || newsItem.news}. ${newsItem.description || newsItem.newsDescription || ""}`;

      // Extraire les contacts de cette actualité
      const contacts = this.extractContacts(combinedText, company);

      // Ajouter les références à l'article source
      contacts.forEach((contact) => {
        contact.source = {
          title: newsItem.title || newsItem.news,
          date: newsItem.date || newsItem.newsDate,
          link: newsItem.link || newsItem.newsLink || "",
        };

        allContacts.push(contact);
      });
    });

    // Dédupliquer et trier par score de confiance
    return this._deduplicateContacts(allContacts).sort(
      (a, b) => b.confidenceScore - a.confidenceScore
    );
  }

  /**
   * Méthode privée pour dédupliquer les contacts en fusionnant les informations sur les mêmes personnes
   */
  _deduplicateContacts(contacts) {
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

  /**
   * Importe des contacts depuis un fichier Excel, CSV ou autre format
   * @param {File} file - L'objet File à importer
   * @returns {Promise<Array>} - Les contacts importés
   */
  async importContacts(file) {
    try {
      console.log(`Tentative d'importation du fichier: ${file.name}`);
      
      // Vérifier si c'est un fichier CSV
      if (file.name.toLowerCase().endsWith('.csv')) {
        return this._importCSV(file);
      } 
      // Sinon, essayer comme un fichier Excel
      else {
        return this._importExcel(file);
      }
    } catch (error) {
      console.error("Erreur lors de l'importation des contacts:", error);
      throw error;
    }
  }

  /**
   * Méthode pour mieux analyser les en-têtes Excel ou CSV
   * @param {Array} headers - Les en-têtes du fichier
   * @returns {Object} - Mappages des en-têtes vers les indices de colonnes
   */
  _createHeaderMap(headers) {
    const headerMap = {
      name: -1,
      firstName: -1,
      lastName: -1,
      role: -1,
      company: -1,
      email: -1,
      department: -1,
      phone: -1
    };
    
    // Chercher les correspondances exactes d'abord
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase().trim();
      
      // Correspondances exactes pour Role
      if (headerLower === "role") {
        headerMap.role = index;
      }
      // Correspondances exactes pour les autres champs
      else if (headerLower === "fullname" || headerLower === "full name") {
        headerMap.name = index;
      }
      else if (headerLower === "firstname" || headerLower === "first name" || headerLower === "prénom" || headerLower === "prenom") {
        headerMap.firstName = index;
      }
      else if (headerLower === "lastname" || headerLower === "last name" || headerLower === "nom") {
        headerMap.lastName = index;
      }
      else if (headerLower === "email" || headerLower === "courriel" || headerLower === "mail") {
        headerMap.email = index;
      }
      else if (headerLower === "company" || headerLower === "entreprise") {
        headerMap.company = index;
      }
      else if (headerLower === "department" || headerLower === "département" || headerLower === "departement") {
        headerMap.department = index;
      }
      else if (headerLower === "phone" || headerLower === "téléphone" || headerLower === "telephone") {
        headerMap.phone = index;
      }
    });
    
    // Si on n'a pas trouvé de correspondance exacte, essayer des correspondances partielles
    if (headerMap.role === -1) {
      headers.forEach((header, index) => {
        const headerLower = header.toLowerCase().trim();
        
        // Éviter d'utiliser des champs comme 'businessfunction'
        // Chercher uniquement les en-têtes contenant "role" mais pas d'autres mots clés suspects
        if (headerLower.includes("role") && 
            !headerLower.includes("business") && 
            !headerLower.includes("function") && 
            !headerLower.includes("id")) {
          headerMap.role = index;
        }
        
        // Autres correspondances partielles
        if (headerMap.name === -1 && headerLower.includes("name") && 
            !headerLower.includes("first") && !headerLower.includes("last")) {
          headerMap.name = index;
        }
        
        // Pour les autres champs
        if (headerMap.firstName === -1 && 
            (headerLower.includes("first") && headerLower.includes("name") || 
             headerLower.includes("prénom") || headerLower.includes("prenom"))) {
          headerMap.firstName = index;
        }
        
        if (headerMap.lastName === -1 && 
            (headerLower.includes("last") && headerLower.includes("name") || 
             headerLower.includes("nom") && !headerLower.includes("prénom"))) {
          headerMap.lastName = index;
        }
        
        if (headerMap.email === -1 && (headerLower.includes("mail") || headerLower.includes("courriel"))) {
          headerMap.email = index;
        }
        
        if (headerMap.department === -1 && 
            (headerLower.includes("depart") || headerLower.includes("service"))) {
          headerMap.department = index;
        }
        
        if (headerMap.phone === -1 && 
            (headerLower.includes("phone") || headerLower.includes("tel"))) {
          headerMap.phone = index;
        }
      });
    }
    
    console.log("Mappage d'en-têtes détecté:", headerMap);
    return headerMap;
  }

  /**
   * Importe des contacts depuis un fichier CSV
   * @param {File} file - L'objet File CSV
   * @returns {Promise<Array>} - Les contacts importés
   */
  async _importCSV(file) {
    try {
      // Lire le fichier CSV avec l'API FileReader
      const fileContent = await this._readFileAsText(file);
      
      // Séparer les lignes
      const lines = fileContent.split('\n');
      if (lines.length <= 1) {
        throw new Error("Le fichier CSV ne contient pas suffisamment de données");
      }
      
      // Récupérer les en-têtes (première ligne) et nettoyer
      const headers = lines[0].split(',').map(header => header.trim());
      
      // Créer un mappage des en-têtes avec la nouvelle méthode
      const headerMap = this._createHeaderMap(headers);
      
      console.log("Mappage d'en-têtes CSV détecté:", headerMap);
      
      // Vérifier si nous avons trouvé un en-tête de rôle
      if (headerMap.role === -1) {
        console.warn("Attention: Aucune colonne 'Role' trouvée, certaines données pourraient être incorrectes");
      }
      
      // Traiter chaque ligne
      const contacts = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(value => value.trim());
        
        // Créer le contact
        const contact = {
          fullName: '',
          role: 'Poste non spécifié',
          company: 'Schneider Electric',
          email: '',
          department: '',
          phone: '',
          confidenceScore: 1.0,
          sources: []
        };
        
        // Construire le nom complet
        if (headerMap.name >= 0 && values[headerMap.name]) {
          contact.fullName = values[headerMap.name];
        }
        else if (headerMap.firstName >= 0 && headerMap.lastName >= 0) {
          const firstName = values[headerMap.firstName] || '';
          const lastName = values[headerMap.lastName] || '';
          contact.fullName = `${firstName} ${lastName}`.trim();
        }
        
        // Récupérer le bon rôle
        if (headerMap.role >= 0 && values[headerMap.role]) {
          contact.role = values[headerMap.role];
        }
        
        // Remplir les autres champs
        if (headerMap.company >= 0 && values[headerMap.company]) {
          contact.company = values[headerMap.company];
        }
        if (headerMap.email >= 0 && values[headerMap.email]) {
          contact.email = values[headerMap.email];
        }
        if (headerMap.department >= 0 && values[headerMap.department]) {
          contact.department = values[headerMap.department];
        }
        if (headerMap.phone >= 0 && values[headerMap.phone]) {
          contact.phone = values[headerMap.phone];
        }
        
        // Ajouter seulement si nous avons un nom et que ce n'est pas une ligne vide
        if (contact.fullName) {
          contacts.push(contact);
        }
      }
      
      return contacts;
      
    } catch (error) {
      console.error("Erreur lors de l'importation du CSV:", error);
      throw new Error(`Erreur lors de l'importation du CSV: ${error.message}`);
    }
  }

  /**
   * Importe des contacts depuis un fichier Excel
   * @param {File} file - L'objet File Excel
   * @returns {Promise<Array>} - Les contacts importés
   */
  async _importExcel(file) {
    try {
      // Lire le fichier comme ArrayBuffer
      const arrayBuffer = await this._readFileAsArrayBuffer(file);
      
      // Lire le fichier Excel avec XLSX
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        cellDates: true,
        cellNF: true,
        cellStyles: true
      });
      
      // Vérifier que le workbook existe
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Format de fichier Excel non valide ou vide");
      }
      
      // Trouver la première feuille qui contient "Contact" ou utiliser la première
      let sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('contact')) || workbook.SheetNames[0];
      
      // Récupérer la feuille
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir les en-têtes en format normal pour utiliser notre nouvelle méthode
      const headers = [];
      
      // Obtenir la plage de travail
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Récupérer les en-têtes de la première ligne
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v) {
          headers.push(cell.v.toString());
        } else {
          headers.push(""); // Pour maintenir les indices alignés
        }
      }
      
      // Créer le mappage des en-têtes avec notre méthode améliorée
      const headerMap = this._createHeaderMap(headers);
      
      console.log("Mappage d'en-têtes Excel détecté:", headerMap);
      
      // Convertir la feuille en JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: "A",
        range: range.s.r // Partir de la ligne d'en-tête
      });
      
      // Supprimer la ligne d'en-tête
      if (jsonData.length > 0) jsonData.shift();
      
      // Normaliser les données en utilisant notre mappage
      const contacts = jsonData
        .map((row) => {
          // Récupérer les valeurs selon notre mappage
          const fullNameCol = headers[headerMap.name];
          const roleCol = headers[headerMap.role];
          const firstNameCol = headers[headerMap.firstName];
          const lastNameCol = headers[headerMap.lastName];
          const emailCol = headers[headerMap.email];
          const departmentCol = headers[headerMap.department];
          const companyCol = headers[headerMap.company];
          const phoneCol = headers[headerMap.phone];
          
          // Générer le nom complet
          let fullName = "";
          if (fullNameCol && row[fullNameCol]) {
            fullName = row[fullNameCol];
          } else if (firstNameCol && lastNameCol) {
            const firstName = row[firstNameCol] || "";
            const lastName = row[lastNameCol] || "";
            fullName = `${firstName} ${lastName}`.trim();
          }
          
          // Créer le contact
          const contact = {
            fullName,
            role: (roleCol && row[roleCol]) ? row[roleCol] : "Poste non spécifié",
            company: (companyCol && row[companyCol]) ? row[companyCol] : "Schneider Electric",
            email: (emailCol && row[emailCol]) || "",
            department: (departmentCol && row[departmentCol]) || "",
            phone: (phoneCol && row[phoneCol]) || "",
            confidenceScore: 1.0,
            importedFromExcel: true,
            sources: []
          };
          
          return contact;
        })
        .filter((contact) => {
          // Filtrer les lignes vides ou invalides
          return (
            contact.fullName && (
              contact.role !== "Poste non spécifié" ||
              contact.email ||
              contact.department
            )
          );
        });
      
      return contacts;
      
    } catch (error) {
      console.error("Erreur lors de l'importation Excel:", error);
      throw new Error(`Erreur lors de l'importation Excel: ${error.message}`);
    }
  }

  /**
   * Méthode utilitaire pour lire un fichier comme texte
   * @param {File} file - Le fichier à lire
   * @returns {Promise<string>} - Le contenu du fichier
   */
  _readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsText(file);
    });
  }

  /**
   * Méthode utilitaire pour lire un fichier comme ArrayBuffer
   * @param {File} file - Le fichier à lire
   * @returns {Promise<ArrayBuffer>} - Le contenu du fichier
   */
  _readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Analyse la pertinence des contacts par rapport aux actualités
   * @param {Array} contacts - Les contacts importés
   * @param {Array} relevanceMatrix - La matrice de pertinence des actualités
   * @returns {Array} - Les contacts avec un score de pertinence
   */
  analyzeContactRelevance(contacts, relevanceMatrix) {
    return contacts.map((contact) => {
      const relatedOffers = new Set();
      const relatedNews = new Set();
      let maxRelevanceScore = 0;

      // Chercher des correspondances dans les informations du contact
      const contactInfo =
        `${contact.role} ${contact.department || ""} ${contact.business || ""} ${contact.industry || ""}`.toLowerCase();

      relevanceMatrix.forEach((item) => {
        // Vérifier si les détails de l'offre correspondent au profil du contact
        const offerDetails = item.offerDetail.toLowerCase();
        const newsText = `${item.news} ${
          item.newsDescription || ""
        }`.toLowerCase();

        // Vérifier les correspondances directes entre la fonction du contact et les détails de l'offre
        const hasOfferMatch = offerDetails.split(", ").some(
          (detail) =>
            contactInfo.includes(detail.trim()) ||
            // Vérifier les termes clés de la fonction
            [
              "directeur",
              "manager",
              "responsable",
              "chef",
              "head",
              "président",
              "vp",
            ].some(
              (term) =>
                contactInfo.includes(term) &&
                detail.toLowerCase().includes(term)
            )
        );

        // Vérifier les correspondances entre la fonction du contact et le texte de l'actualité
        const hasNewsMatch =
          newsText.includes(contact.role.toLowerCase()) ||
          (contact.department &&
            newsText.includes(contact.department.toLowerCase())) ||
          (contact.business &&
            newsText.includes(contact.business.toLowerCase()));

        if (hasOfferMatch || hasNewsMatch) {
          item.offerDetail
            .split(", ")
            .forEach((offer) => relatedOffers.add(offer));
          relatedNews.add(item.news);

          // Mettre à jour le score de pertinence maximum
          if (item.relevanceScore > maxRelevanceScore) {
            maxRelevanceScore = item.relevanceScore;
          }
        }
      });

      // Ajouter les actualités comme sources
      const sources = Array.from(relatedNews).map((newsTitle) => {
        const newsItem = relevanceMatrix.find(
          (item) => item.news === newsTitle
        );
        return {
          title: newsTitle,
          date: newsItem?.newsDate || "",
          link: newsItem?.newsLink || "",
        };
      });

      // Mettre à jour le contact avec les informations de pertinence
      return {
        ...contact,
        relatedOffers: Array.from(relatedOffers),
        sources,
        relevanceScore:
          sources.length > 0 ? maxRelevanceScore * 0.33 + 0.67 : 0.67, // Ajuster le score de confiance
      };
    });
  }

  /**
   * Identifie les rôles mentionnés dans les actualités
   * @param {Array} relevanceMatrix - La matrice de pertinence des actualités
   * @returns {Array} - Les rôles identifiés dans les actualités
   */
  identifyRolesInNews(relevanceMatrix) {
    const roles = new Set();

    // Liste des mots-clés de fonction à rechercher
    const functionKeywords = [
      "Directeur", "Directrice", "Director", "Responsable", "Head of", 
      "Chef de", "Manager", "Président", "President", "CEO", "COO", 
      "CFO", "CTO", "CIO", "CISO", "CDO", "CMO", "CSO", 
      "Vice-président", "Vice President", "VP",
    ];

    // Expressions régulières pour capter les fonctions dans le texte
    const functionRegexes = [
      // Format: "Directeur de X"
      new RegExp(
        `(${functionKeywords.join("|")})\\s+(?:de|des|du|de la|d'|of|for)?\\s+[A-Z][a-zÀ-ÿ]+(?:\\s+[A-Z][a-zÀ-ÿ]+)*`,
        "gi"
      ),
      // Format: "X Director/Manager"
      new RegExp(
        `[A-Z][a-zÀ-ÿ]+(?:\\s+[A-Z][a-zÀ-ÿ]+)*\\s+(${functionKeywords.join("|")})`,
        "gi"
      ),
    ];

    relevanceMatrix.forEach((item) => {
      const newsText = `${item.news} ${item.newsDescription || ""}`;

      // Appliquer chaque regex
      functionRegexes.forEach((regex) => {
        const matches = newsText.match(regex);
        if (matches) {
          matches.forEach((match) => roles.add(match.trim()));
        }
      });
    });

    return Array.from(roles);
  }

  /**
   * Trouve les contacts pertinents pour les rôles identifiés
   * @param {Array} contacts - Les contacts disponibles
   * @param {Array} roles - Les rôles identifiés dans les actualités
   * @returns {Object} - Mapping des rôles vers les contacts pertinents
   */
  matchContactsToRoles(contacts, roles) {
    const rolesToContacts = {};

    roles.forEach((role) => {
      const matchingContacts = contacts.filter((contact) => {
        const roleText = role.toLowerCase();
        const contactInfo =
          `${contact.role} ${contact.department || ""} ${contact.business || ""}`.toLowerCase();

        return (
          contactInfo.includes(roleText) ||
          roleText.includes(contact.role.toLowerCase()) ||
          // Correspondance de fonction spécifique (ex: Directeur = Director)
          (roleText.includes("directeur") && contactInfo.includes("director")) ||
          (roleText.includes("director") && contactInfo.includes("directeur")) ||
          (roleText.includes("responsable") && contactInfo.includes("head")) ||
          (roleText.includes("head of") && contactInfo.includes("responsable"))
        );
      });

      if (matchingContacts.length > 0) {
        rolesToContacts[role] = matchingContacts;
      }
    });

    return rolesToContacts;
  }

  /**
   * Identifie les rôles manquants (mentionnés dans les actualités mais sans contact correspondant)
   * @param {Array} roles - Les rôles identifiés dans les actualités
   * @param {Object} rolesToContacts - Mapping des rôles vers les contacts
   * @returns {Array} - Les rôles manquants
   */
  identifyMissingRoles(roles, rolesToContacts) {
    return roles.filter((role) => !rolesToContacts[role]);
  }
}

// Exporter une instance unique du service
export const contactService = new ContactService();
