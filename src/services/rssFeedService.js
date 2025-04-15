/**
 * Service pour récupérer et parser les flux RSS de Schneider Electric
 * Utilise l'API RSS2JSON pour convertir les flux RSS en JSON
 */

// L'URL de l'API RSS2JSON (gratuite avec des limites, nécessite une inscription pour plus de requêtes)
const RSS2JSON_API_URL = "https://api.rss2json.com/v1/api.json";
// Entrez votre clé API si vous en créez une (permet plus de requêtes)
const RSS2JSON_API_KEY = "88vzmfaog9tacnzokqfjydvju8tbf95dn3iavrpj";

// URLs des flux RSS de Schneider Electric (à adapter selon les flux officiels disponibles)
const SCHNEIDER_RSS_FEEDS = [
  // Flux RSS officiel des communiqués de presse de Schneider Electric France
  "https://www.se.com/fr/fr/about-us/newsroom/news/rss.xml",
  // Flux RSS des actualités globales (en anglais)
  "https://www.se.com/ww/en/about-us/newsroom/news/rss.xml",
  // Blog de Schneider Electric (si disponible en RSS)
  "https://blog.se.com/feed/",
];

// Mots-clés par catégorie d'offre pour l'analyse de pertinence
const KEYWORDS_BY_CATEGORY = {
  "Finance & Risk": [
    // Finance
    "finance",
    "financier",
    "bénéfice",
    "résultat",
    "revenu",
    "chiffre d'affaires",
    "investissement",
    "dividende",
    "action",
    "bourse",
    "obligation",
    "fiscal",
    "budget",
    "trésorerie",
    "profit",
    "marge",

    // Risk
    "risque",
    "conformité",
    "compliance",
    "audit",
    "contrôle",
    "régulation",
    "fraude",
    "cybersécurité",

    // Management
    "performance",
    "gestion",
    "gouvernance",
    "indicateur",
    "tableau de bord",

    // ERP & Solutions
    "erp",
    "pgi",
    "sap",
    "oracle",
    "cfo",
    "daf",
    "directeur financier",
  ],

  Technology: [
    // Data & Analytics
    "data",
    "données",
    "analytics",
    "analyse",
    "big data",
    "lake",
    "entrepôt de données",

    // Intelligence Artificielle
    "ai",
    "ia",
    "intelligence artificielle",
    "machine learning",
    "apprentissage automatique",
    "deep learning",
    "modèle",
    "prédictif",
    "chatbot",
    "nlp",
    "computer vision",

    // Cloud
    "cloud",
    "saas",
    "iaas",
    "paas",
    "hybride",
    "aws",
    "azure",
    "gcp",
    "multicloud",
    "virtualisation",
    "conteneur",
    "docker",
    "kubernetes",

    // Cybersécurité
    "sécurité",
    "security",
    "protection",
    "données",
    "privacy",
    "rgpd",
    "gdpr",
    "confidentialité",
    "hacker",
    "piratage",
    "vulnérabilité",
    "pare-feu",

    // Applications
    "application",
    "software",
    "logiciel",
    "solution",
    "api",
    "interface",
    "mobile",
    "web",
    "digital",
    "numérique",
    "intégration",
    "microservice",

    // IT Management
    "it",
    "si",
    "système d'information",
    "infrastructure",
    "réseau",
    "serveur",
    "cio",
    "dsi",
    "directeur informatique",
    "technologie",
  ],

  Operations: [
    // Manufacturing
    "fabrication",
    "usine",
    "production",
    "assemblage",
    "qualité",
    "lean",
    "industrie 4.0",
    "iiot",
    "automatisation",
    "robotique",

    // Maintenance
    "maintenance",
    "prédictive",
    "préventive",
    "équipement",
    "asset",
    "réparation",
    "panne",
    "downtime",
    "uptime",
    "temps d'arrêt",

    // Supply Chain
    "supply chain",
    "chaîne d'approvisionnement",
    "logistique",
    "stock",
    "inventaire",
    "entrepôt",
    "warehouse",
    "distribution",
    "transport",
    "livraison",
    "expédition",
    "traçabilité",

    // Planning
    "planification",
    "prévision",
    "forecast",
    "demande",
    "demand",
    "planning",
    "s&op",
    "approvisionnement",
    "production",
    "capacité",

    // Procurement
    "achat",
    "sourcing",
    "procurement",
    "fournisseur",
    "supplier",
    "appel d'offre",
    "rfp",
    "rfq",
    "contrat",
    "négociation",
    "spend",
    "dépense",
  ],

  "People & Strategy": [
    // Talent & HR
    "rh",
    "ressources humaines",
    "talent",
    "recrutement",
    "formation",
    "compétence",
    "carrière",
    "collaborateur",
    "employé",
    "engagement",
    "culture",
    "diversité",
    "inclusion",
    "bien-être",
    "remote",
    "télétravail",

    // Change Management
    "changement",
    "transformation",
    "conduite du changement",
    "adoption",
    "résistance",
    "accompagnement",
    "transition",
    "formation",
    "communication",

    // Strategy
    "stratégie",
    "vision",
    "mission",
    "objectif",
    "roadmap",
    "business model",
    "innovation",
    "disruption",
    "croissance",
    "expansion",
    "développement",

    // Project Management
    "projet",
    "programme",
    "portefeuille",
    "agile",
    "scrum",
    "kanban",
    "livrable",
    "jalon",
    "milestone",
    "planning",
    "pmo",
    "gestion de projet",
  ],

  "Customer & Growth": [
    // Digital & Innovation
    "digital",
    "numérique",
    "innovation",
    "transformation digitale",
    "disruption",
    "technologie",
    "startup",
    "écosystème",
    "incubation",
    "accélération",

    // Customer Experience
    "client",
    "customer",
    "expérience",
    "parcours",
    "journey",
    "satisfaction",
    "nps",
    "fidélité",
    "loyalty",
    "persona",
    "user",
    "utilisateur",

    // Marketing
    "marketing",
    "marque",
    "brand",
    "campagne",
    "communication",
    "média",
    "social media",
    "réseaux sociaux",
    "seo",
    "sea",
    "acquisition",
    "content",
    "contenu",
    "automation",
    "digital marketing",

    // Sales
    "vente",
    "commercial",
    "business development",
    "pipeline",
    "lead",
    "prospect",
    "opportunité",
    "funnel",
    "conversion",
    "channel",
    "canal",
    "distribution",
    "partenaire",
    "pricing",
    "prix",
    "tarification",

    // E-commerce & CRM
    "ecommerce",
    "e-commerce",
    "marketplace",
    "plateforme",
    "online",
    "en ligne",
    "crm",
    "gestion relation client",
    "salesforce",
    "microsoft dynamics",
  ],

  "BE Capital": [
    // M&A
    "acquisition",
    "fusion",
    "merger",
    "rachat",
    "cession",
    "joint venture",
    "consolidation",
    "due diligence",
    "valorisation",
    "synergies",

    // Private Equity
    "capital",
    "private equity",
    "investissement",
    "fund",
    "fonds",
    "lbo",
    "leverage",
    "transaction",
    "deal",
    "asset",
    "actif",

    // PMI & Carve out
    "pmi",
    "post-merger",
    "intégration",
    "carve out",
    "spin off",
    "séparation",
    "restructuration",
    "réorganisation",
    "transition",
  ],
};

// Fonction pour récupérer les actualités d'un flux RSS
async function fetchRssFeed(rssUrl) {
  try {
    // L'URL complète pour l'API RSS2JSON
    const apiUrl = `${RSS2JSON_API_URL}?rss_url=${encodeURIComponent(rssUrl)}${
      RSS2JSON_API_KEY ? `&api_key=${RSS2JSON_API_KEY}` : ""
    }`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `Erreur lors de la récupération du flux RSS: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.status !== "ok") {
      throw new Error(
        `Erreur de l'API RSS2JSON: ${data.message || "Erreur inconnue"}`
      );
    }

    return data.items || [];
  } catch (error) {
    console.error("Erreur lors de la récupération du flux RSS:", error);
    return [];
  }
}

// Normaliser le format des actualités pour correspondre à notre structure de données
function normalizeNewsItem(item, source) {
  // Extraire la date et la formater comme "06 Avr. 2025"
  const pubDate = new Date(item.pubDate);
  const day = pubDate.getDate().toString().padStart(2, "0");

  // Tableau des mois en français abrégés
  const months = [
    "Janv.",
    "Févr.",
    "Mars",
    "Avr.",
    "Mai",
    "Juin",
    "Juil.",
    "Août",
    "Sept.",
    "Oct.",
    "Nov.",
    "Déc.",
  ];
  const month = months[pubDate.getMonth()];
  const year = pubDate.getFullYear();

  // Formater la date
  const formattedDate = `${day} ${month} ${year}`;

  // Extraire les catégories
  let categories = item.categories || [];
  if (typeof categories === "string") {
    categories = categories.split(",").map((cat) => cat.trim());
  }

  // Normaliser les catégories en français si possible
  const categoriesStr = categories.join(", ");

  return {
    date: formattedDate,
    title: item.title,
    category: categoriesStr || "Actualité",
    description: item.description?.replace(/<[^>]*>?/gm, "") || "", // Enlever les balises HTML
    link: item.link,
    source: source,
  };
}

// Fonction pour récupérer toutes les actualités de tous les flux RSS
async function getAllNews() {
  try {
    // Récupérer les actualités de tous les flux en parallèle
    const newsPromises = SCHNEIDER_RSS_FEEDS.map((feed) =>
      fetchRssFeed(feed).then((items) =>
        items.map((item) => normalizeNewsItem(item, feed))
      )
    );

    // Attendre que toutes les requêtes soient terminées
    const newsArrays = await Promise.all(newsPromises);

    // Fusionner tous les tableaux d'actualités
    const allNews = newsArrays.flat();

    // Trier par date (du plus récent au plus ancien)
    return allNews.sort((a, b) => {
      const dateA = new Date(a.date.split(" ").reverse().join(" "));
      const dateB = new Date(b.date.split(" ").reverse().join(" "));
      return dateB - dateA;
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de toutes les actualités:",
      error
    );
    return [];
  }
}

// Fonction pour lancer une analyse de pertinence des actualités par rapport aux offres
function analyzeNewsRelevance(news, offers) {
  const relevanceMatrix = [];

  // Pour chaque actualité
  news.forEach((newsItem) => {
    // Texte de l'actualité en minuscules pour la recherche
    const newsText =
      `${newsItem.title} ${newsItem.description} ${newsItem.category}`.toLowerCase();

    // Pour chaque catégorie d'offre
    Object.entries(KEYWORDS_BY_CATEGORY).forEach(([category, keywords]) => {
      // Compter combien de mots clés sont présents dans l'actualité
      let matchCount = 0;
      let matchedKeywords = [];

      keywords.forEach((keyword) => {
        if (newsText.includes(keyword.toLowerCase())) {
          matchCount++;
          matchedKeywords.push(keyword);
        }
      });

      // Calculer un score de pertinence de 1 à 3
      let relevanceScore = 0;
      if (matchCount > 3) {
        relevanceScore = 3; // Très pertinent
      } else if (matchCount > 1) {
        relevanceScore = 2; // Pertinent
      } else if (matchCount > 0) {
        relevanceScore = 1; // Légèrement pertinent
      }

      // Si au moins un mot clé a été trouvé, ajouter à la matrice
      if (relevanceScore > 0) {
        // Trouver les offres détaillées correspondantes
        const matchedOffers = [];

        // Parcourir les offres détaillées pour trouver celles qui correspondent aux mots clés
        Object.entries(offers).forEach(([serviceLine, serviceOfferings]) => {
          if (serviceLine === category) {
            serviceOfferings.forEach((offering) => {
              // Vérifier si le nom de l'offre contient l'un des mots clés correspondants
              const offeringLower = offering.toLowerCase();
              if (
                matchedKeywords.some((keyword) =>
                  offeringLower.includes(keyword.toLowerCase())
                )
              ) {
                matchedOffers.push(offering);
              }
            });
          }
        });

        relevanceMatrix.push({
          news: newsItem.title,
          newsDate: newsItem.date,
          newsCategory: newsItem.category,
          newsDescription: newsItem.description,
          newsLink: newsItem.link,
          offerCategory: category,
          relevanceScore: relevanceScore,
          offerDetail: matchedOffers.join(", ") || category,
        });
      }
    });
  });

  return relevanceMatrix;
}

/**
 * Récupère et analyse complètement les actualités RSS
 * - Récupère les actualités de tous les flux RSS
 * - Analyse leur pertinence par rapport aux offres
 * - Extrait les contacts potentiels
 * @param {Object} offers - Structure des offres BearingPoint
 * @returns {Object} Résultats de l'analyse (actualités, matrice de pertinence, contacts)
 */
async function getAnalyzedNews(offers) {
  try {
    // Récupérer toutes les actualités
    const news = await getAllNews();

    // Analyser la pertinence par rapport aux offres
    const relevanceMatrix = analyzeNewsRelevance(news, offers);

    // Extraire les contacts potentiels
    const contacts = contactExtractionService.extractContactsFromNews(
      news,
      "Schneider Electric"
    );

    return {
      news,
      relevanceMatrix,
      contacts,
    };
  } catch (error) {
    console.error("Erreur lors de l'analyse des actualités:", error);
    return {
      news: [],
      relevanceMatrix: [],
      contacts: [],
    };
  }
}

// Exporter les fonctions du service
export const rssFeedService = {
  getAllNews,
  analyzeNewsRelevance,
  getAnalyzedNews,
};
