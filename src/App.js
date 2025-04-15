// App.js
import React, { useState, useEffect, useMemo } from "react";
import "./styles.css";

// Composant principal
const MatrixApp = () => {
  const [activeTab, setActiveTab] = useState("matrix");
  const [expandedServiceLine, setExpandedServiceLine] = useState(null);
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [relevanceFilter, setRelevanceFilter] = useState(0);
  const [offersWithNewsButNoOpp, setOffersWithNewsButNoOpp] = useState([]);
  const [yearFilter, setYearFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);

  // Données
  const data = useMemo(
    () => ({
      // Principales offres de BearingPoint
      bpOffers: {
        "BE Capital": ["Capital M&A", "PMI & Carve out"],
        "Customer & Growth": [
          "Digital Strategy & Innovation",
          "Customer Experience",
          "Marketing Transformation",
          "Sales Transformation & Pricing",
          "eCommerce",
          "Data & CRM",
        ],
        "Finance & Risk": [
          "Finance Excellence",
          "Future ERP",
          "Performance Management",
          "Risk Management",
          "Compliance",
          "CFO 4.0 Strategy",
        ],
        Operations: [
          "Product Lifecycle Management",
          "Manufacturing & Maintenance",
          "Logistics Execution",
          "Digital Twin Supply Chain",
          "Demand Management & Planning",
          "Sourcing & Procurement",
        ],
        "People & Strategy": [
          "Talent Management & HR",
          "Change Management",
          "Real Estate & New Ways of Working",
          "Business Strategy",
          "Operational & Process Excellence",
          "Program & Project Mgt",
        ],
        Technology: [
          "Cloud & Sourcing",
          "CIO Advisory",
          "Business Applications",
          "Data, Analytics and AI",
          "Data Security & Privacy",
        ],
      },

      // Structure complète des offres par ligne de service
      completeServiceLines: {
        "Customer & Growth": [
          "Digital Strategy & Innovation",
          "Customer Experience",
          "Marketing Transformation",
          "Sales Transformation & Pricing",
          "eCommerce",
          "Data & CRM",
        ],
        "Finance & Risk": [
          "Finance Excellence",
          "Future ERP",
          "Performance Management",
          "Risk Management",
          "Compliance",
          "CFO 4.0 Strategy",
        ],
        Operations: [
          "Product Lifecycle Management",
          "Manufacturing & Maintenance",
          "Logistics Execution",
          "Digital Twin Supply Chain",
          "Demand Management & Planning",
          "Sourcing & Procurement",
        ],
        "People & Strategy": [
          "Talent Management & HR",
          "Change Management",
          "Real Estate & New Ways of Working",
          "Business Strategy",
          "Operational & Process Excellence",
          "Program & Project Mgt",
        ],
        Technology: [
          "Cloud & Sourcing",
          "CIO Advisory",
          "Business Applications",
          "Data, Analytics and AI",
          "Data Security & Privacy",
        ],
        "BE Capital": ["Capital M&A", "PMI & Carve out"],
      },

      // Actualités de Schneider Electric
      schneiderNews: [
        {
          date: "06 Avr. 2025",
          title: "Fins de carrière à la carte chez Schneider Electric",
          category: "RH, Social",
          description:
            "Accord sur le compte épargne temps permettant aux salariés à trois ans de la retraite de travailler moins.",
        },
        {
          date: "25 Mars 2025",
          title:
            "Schneider Electric débloque 700M$ pour le développement de l'IA aux USA",
          category: "Investissement, Technologie, IA",
          description:
            "Modernisation de sites existants pour répondre à la croissance de l'IA et la demande énergétique.",
        },
        {
          date: "25 Févr. 2025",
          title:
            "Malmené en bourse, Schneider Electric rassurant pour les centres de données",
          category: "Finance, Data Centers",
          description:
            "Chute en bourse suite à des rumeurs d'annulation de contrats avec Microsoft.",
        },
        {
          date: "20 Févr. 2025",
          title:
            "Bénéfice record pour Schneider Electric, tiré par l'efficacité énergétique",
          category: "Finance, Efficacité énergétique",
          description:
            "Forte demande pour les produits liés à l'efficacité énergétique, notamment dans le segment des datacenters.",
        },
        {
          date: "11 Janv. 2025",
          title:
            "Olivier Blum est le nouveau directeur général de Schneider Electric",
          category: "Direction, Gouvernance",
          description:
            "Remplacement de Peter Herweck pour cause de désaccords.",
        },
        {
          date: "04 Déc. 2024",
          title:
            "Schneider Electric et Nvidia développent de nouveaux systèmes de refroidissement",
          category: "Partenariat, Data Centers, IA",
          description:
            "Collaboration pour des systèmes de refroidissement pour centres de données d'IA générative.",
        },
        {
          date: "05 Nov. 2024",
          title: "Schneider Electric victime d'une nouvelle fuite de données",
          category: "Cybersécurité, Sécurité",
          description:
            "Plateforme de développement piratée, attaque par ransomware ayant entraîné le vol de données.",
        },
        {
          date: "30 Oct. 2024",
          title:
            "470M€ d'amendes pour des ententes dans la distribution de matériel électrique",
          category: "Juridique, Conformité",
          description:
            "Amende avec Legrand, Rexel et Sonepar pour ententes sur les prix.",
        },
        {
          date: "17 Oct. 2024",
          title: "Schneider Electric acquiert Motivair pour 850M$",
          category: "Acquisition, Data Centers",
          description:
            "Renforcement sur le segment du refroidissement par fluides dans les data centers.",
        },
        {
          date: "17 Sept. 2024",
          title:
            "Schneider Electric entre dans l'économie circulaire des appareils électriques",
          category: "Développement durable, Économie circulaire",
          description:
            "Réparation et maintenance d'équipements électriques dans des usines à Grenoble.",
        },
      ],

      // Matrice de pertinence précalculée
      relevanceMatrix: [
        {
          news: "Malmené en bourse, Schneider Electric rassurant pour les centres de données",
          newsDate: "25 Févr. 2025",
          newsCategory: "Finance, Data Centers",
          offerCategory: "Finance & Risk",
          relevanceScore: 3,
          offerDetail: "Performance Management, Risk Management",
        },
        {
          news: "Schneider Electric victime d'une nouvelle fuite de données",
          newsDate: "05 Nov. 2024",
          newsCategory: "Cybersécurité, Sécurité",
          offerCategory: "Technology",
          relevanceScore: 3,
          offerDetail: "Data Security & Privacy",
        },
        {
          news: "470M€ d'amendes pour des ententes dans la distribution de matériel électrique",
          newsDate: "30 Oct. 2024",
          newsCategory: "Juridique, Conformité",
          offerCategory: "Finance & Risk",
          relevanceScore: 3,
          offerDetail: "Compliance",
        },
        {
          news: "Schneider Electric acquiert Motivair pour 850M$",
          newsDate: "17 Oct. 2024",
          newsCategory: "Acquisition, Data Centers",
          offerCategory: "BE Capital",
          relevanceScore: 3,
          offerDetail: "Capital M&A, PMI & Carve out",
        },
        {
          news: "Fins de carrière à la carte chez Schneider Electric",
          newsDate: "06 Avr. 2025",
          newsCategory: "RH, Social",
          offerCategory: "People & Strategy",
          relevanceScore: 2,
          offerDetail: "Talent Management & HR",
        },
        {
          news: "Schneider Electric débloque 700M$ pour le développement de l'IA aux USA",
          newsDate: "25 Mars 2025",
          newsCategory: "Investissement, Technologie, IA",
          offerCategory: "Technology",
          relevanceScore: 2,
          offerDetail: "Data, Analytics and AI",
        },
        {
          news: "Bénéfice record pour Schneider Electric, tiré par l'efficacité énergétique",
          newsDate: "20 Févr. 2025",
          newsCategory: "Finance, Efficacité énergétique",
          offerCategory: "Finance & Risk",
          relevanceScore: 2,
          offerDetail: "Finance Excellence, Performance Management",
        },
        {
          news: "Olivier Blum est le nouveau directeur général de Schneider Electric",
          newsDate: "11 Janv. 2025",
          newsCategory: "Direction, Gouvernance",
          offerCategory: "People & Strategy",
          relevanceScore: 2,
          offerDetail: "Change Management",
        },
        {
          news: "Schneider Electric et Nvidia développent de nouveaux systèmes de refroidissement",
          newsDate: "04 Déc. 2024",
          newsCategory: "Partenariat, Data Centers, IA",
          offerCategory: "Technology",
          relevanceScore: 2,
          offerDetail: "Data, Analytics and AI",
        },
        {
          news: "Schneider Electric entre dans l'économie circulaire des appareils électriques",
          newsDate: "17 Sept. 2024",
          newsCategory: "Développement durable, Économie circulaire",
          offerCategory: "Operations",
          relevanceScore: 2,
          offerDetail: "Manufacturing & Maintenance",
        },
        {
          news: "Schneider Electric entre dans l'économie circulaire des appareils électriques",
          newsDate: "17 Sept. 2024",
          newsCategory: "Développement durable, Économie circulaire",
          offerCategory: "People & Strategy",
          relevanceScore: 1,
          offerDetail: "Business Strategy",
        },
      ],

      // Opportunités (version condensée, à compléter avec les données complètes)
      rawOpportunities: [
        {
          id: "173406",
          name: "PQL framework",
          status: "14 - Booked",
          closeDate: "24/10/2024",
          estimatedValue: 30000,
          grossRevenue: 30000,
          serviceLine: "People & Strategy",
          accountManager: "Francois Rovere",
          cm1: "62,78",
          comment:
            "Analyser le système actuel de gestion qualité des projets et proposer une nouvelle mouture sur la base de benchmarks",
          serviceOffering: "Operational & Process Excellence",
        },
        {
          id: "163646",
          name: "Data Excellence Enablement SellOn Dec. 2023",
          status: "14 - Booked",
          closeDate: "21/02/2024",
          estimatedValue: 11000,
          grossRevenue: 11000,
          serviceLine: "Technology",
          accountManager: "Marsida Lekaj",
          cm1: "69,76",
          comment: "Data Excellence support for 2023",
          serviceOffering: "Data, Analytics and AI",
        },
        {
          id: "163656",
          name: "Data Excellence Enablement 2024",
          status: "15 - Lost",
          closeDate: "01/01/2024",
          estimatedValue: 130000,
          grossRevenue: 150000,
          serviceLine: "Technology",
          accountManager: "Marsida Lekaj",
          cm1: "",
          comment: "Data Excellence support for 2023",
          serviceOffering: "Data, Analytics and AI",
        },
        {
          id: "152390",
          name: "Data Excellence Enablement 2023",
          status: "14 - Booked",
          closeDate: "07/02/2023",
          estimatedValue: 180560,
          grossRevenue: 261360,
          serviceLine: "Technology",
          accountManager: "Saskia Vercruyssen",
          cm1: "75,7",
          comment: "Data Excellence support for 2023",
          serviceOffering: "Data, Analytics and AI",
        },
        {
          id: "152607",
          name: "Green Premium Reboot",
          status: "15 - Lost",
          closeDate: "06/01/2023",
          estimatedValue: 108800,
          grossRevenue: 128000,
          serviceLine: "People & Strategy",
          accountManager: "Florent Duval",
          cm1: "",
          comment: "Reboot of green premium sustainable offer",
          serviceOffering: "Business Strategy",
        },
        {
          id: "152341",
          name: "Configurator study - extension Phase 2",
          status: "14 - Booked",
          closeDate: "25/11/2022",
          estimatedValue: 57740,
          grossRevenue: 57740,
          serviceLine: "Customer & Growth",
          accountManager: "Catherine Bouev",
          cm1: "63,94",
          comment: "sellon on the configurator study",
          serviceOffering: "Sales Transformation & Pricing",
        },
        {
          id: "151732",
          name: "Typology Governance Study",
          status: "15 - Lost",
          closeDate: "16/11/2022",
          estimatedValue: 190000,
          grossRevenue: 190000,
          serviceLine: "Customer & Growth",
          accountManager: "Guillaume Billoir",
          cm1: "",
          comment: "RFP to launch study on data governance typology",
          serviceOffering: "Sales Transformation & Pricing",
        },
        {
          id: "151274",
          name: "Data Excellence Enablement - 2022 Sell on 2",
          status: "14 - Booked",
          closeDate: "22/11/2022",
          estimatedValue: 56750,
          grossRevenue: 77000,
          serviceLine: "Technology",
          accountManager: "Saskia Vercruyssen",
          cm1: "71,22",
          comment:
            "A deliverable based team associated to the completion of the Data Excellende for 2022",
          serviceOffering: "Data, Analytics and AI",
        },
        {
          id: "151074",
          name: "Configurators study extension",
          status: "14 - Booked",
          closeDate: "31/10/2022",
          estimatedValue: 57320,
          grossRevenue: 57320,
          serviceLine: "Customer & Growth",
          accountManager: "Catherine Bouev",
          cm1: "63,19",
          comment: "Configurators study extension",
          serviceOffering: "Sales Transformation & Pricing",
        },
        {
          id: "149544",
          name: "Customer Workspace MVP extension",
          status: "14 - Booked",
          closeDate: "14/09/2022",
          estimatedValue: 17204,
          grossRevenue: 17204,
          serviceLine: "Customer & Growth",
          accountManager: "Catherine Bouev",
          cm1: "63,99",
          comment: "Customer Workspace",
          serviceOffering: "Sales Transformation & Pricing",
        },
        {
          id: "146065",
          name: "Configurators study",
          status: "14 - Booked",
          closeDate: "27/04/2022",
          estimatedValue: 263000,
          grossRevenue: 263000,
          serviceLine: "Customer & Growth",
          accountManager: "Catherine Bouev",
          cm1: "63,19",
          comment: "Configurators study",
          serviceOffering: "Sales Transformation & Pricing",
        },
        {
          id: "145653",
          name: "Data Excellence Enablement - 2022 Sell on",
          status: "14 - Booked",
          closeDate: "30/04/2022",
          estimatedValue: 165625,
          grossRevenue: 221575,
          serviceLine: "Technology",
          accountManager: "Manu Timmermans",
          cm1: "67,86",
          comment:
            "A deliverable-based surge team associated to the completion of the Data Excellence for the 2022 priority Franchisees.",
          serviceOffering: "Data, Analytics and AI",
        },
        {
          id: "137552",
          name: "Data Excellence Enablement",
          status: "14 - Booked",
          closeDate: "30/04/2021",
          estimatedValue: 109550,
          grossRevenue: 190000,
          serviceLine: "Technology",
          accountManager: "Laurent Fayet",
          cm1: "68,99",
          comment:
            "A deliverable-based surge team associated to the completion of the Data Excellence for the 2021 priority Franchisees.",
          serviceOffering: "Data, Analytics and AI",
        },
        {
          id: "134404",
          name: "Sales Life simplification assistance",
          status: "14 - Booked",
          closeDate: "31/12/2020",
          estimatedValue: 177650,
          grossRevenue: 177650,
          serviceLine: "Customer & Growth",
          accountManager: "Olivier Faulque",
          cm1: "61,21",
          comment: "",
          serviceOffering: "Digital Strategy & Innovation",
        },
        {
          id: "125131",
          name: "ORLM-phase 7( 2020)",
          status: "14 - Booked",
          closeDate: "31/12/2019",
          estimatedValue: 619520,
          grossRevenue: 625000,
          serviceLine: "People & Strategy",
          accountManager: "Guillaume Billoir",
          cm1: "63,01",
          comment:
            "Suite mission de Guillaume Billoir avec Francois Martin Festa",
          serviceOffering: "Sales Transformation & Pricing",
        },
        {
          id: "122721",
          name: "ORLM- phase 6 - Digital lock",
          status: "14 - Booked",
          closeDate: "30/09/2019",
          estimatedValue: 252110,
          grossRevenue: 253500,
          serviceLine: "People & Strategy",
          accountManager: "Guillaume Billoir",
          cm1: "59,29",
          comment:
            "Suite du job ORLM à partir du 8 juillet jusqu'au 20 dec 2019 avec Guillaume Billoir",
          serviceOffering: "Sales Transformation & Pricing",
        },
        {
          id: "122334",
          name: "DDG Event Platform Implementation Support",
          status: "15 - Lost",
          closeDate: "22/01/2019",
          estimatedValue: 66000,
          grossRevenue: 66000,
          serviceLine: "People & Strategy",
          accountManager: "Marjolein Biermans",
          cm1: "",
          comment: "Implémentation d'une plateforme d'événements marketing",
          serviceOffering: "Marketing Transformation",
        },
        {
          id: "121975",
          name: "eCommerce RFI support",
          status: "14 - Booked",
          closeDate: "25/10/2019",
          estimatedValue: 63504,
          grossRevenue: 63504,
          serviceLine: "People & Strategy",
          accountManager: "Marjolein Biermans",
          cm1: "63,1",
          comment: "",
          serviceOffering: "Customer Experience",
        },
        {
          id: "121334",
          name: "ORLM Phase 5",
          status: "14 - Booked",
          closeDate: "30/06/2019",
          estimatedValue: 80740,
          grossRevenue: 81400,
          serviceLine: "People & Strategy",
          accountManager: "Guillaume Billoir",
          cm1: "60,40",
          comment: "",
          serviceOffering: "Sales Transformation & Pricing",
        },
        {
          id: "119945",
          name: "Sell-on 9 : Solar – extension Q1/19",
          status: "14 - Booked",
          closeDate: "30/04/2019",
          estimatedValue: 85031,
          grossRevenue: 85031,
          serviceLine: "Finance & Risk",
          accountManager: "Valerie Guichard-Douche",
          cm1: "64,00",
          comment: "",
          serviceOffering: "CFO 4.0 Strategy",
        },
        {
          id: "118222",
          name: "Experience Client Digitale",
          status: "15 - Lost",
          closeDate: "13/03/2019",
          estimatedValue: 100000,
          grossRevenue: 100000,
          serviceLine: "People & Strategy",
          accountManager: "Patrice Begoc",
          cm1: "",
          comment: "",
          serviceOffering: "Customer Experience",
        },
        {
          id: "118152",
          name: "Sell-on 8 : Solar – extension Q1/19",
          status: "14 - Booked",
          closeDate: "28/02/2019",
          estimatedValue: 303416,
          grossRevenue: 432373,
          serviceLine: "Finance & Risk",
          accountManager: "Valerie Guichard-Douche",
          cm1: "64,40",
          comment: "",
          serviceOffering: "CFO 4.0 Strategy",
        },
        {
          id: "116271",
          name: "MA Offer launch customer journey mapping",
          status: "15 - Lost",
          closeDate: "01/02/2018",
          estimatedValue: 50000,
          grossRevenue: 50000,
          serviceLine: "People & Strategy",
          accountManager: "Marjolein Biermans",
          cm1: "",
          comment: "Cartographie du parcours client pour lancement d'offre MA",
          serviceOffering: "Marketing Transformation",
        },
        {
          id: "116035",
          name: "Active Manager for Contact Centers",
          status: "15 - Lost",
          closeDate: "05/09/2019",
          estimatedValue: 150000,
          grossRevenue: 150000,
          serviceLine: "People & Strategy",
          accountManager: "Patrice Begoc",
          cm1: "",
          comment: "",
          serviceOffering: "Service Transformation",
        },
        {
          id: "115859",
          name: "SE DCX-GDPR readiness support",
          status: "15 - Lost",
          closeDate: "04/09/2019",
          estimatedValue: 150000,
          grossRevenue: 150000,
          serviceLine: "Finance & Risk",
          accountManager: "Philippe Mannent",
          cm1: "",
          comment: "",
          serviceOffering: "Compliance",
        },
      ],
    }),
    []
  );

  // Fonction auxiliaire pour extraire l'année d'une date au format "DD/MM/YYYY"
  const extractYear = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return parts[2];
    }
    return null;
  };

  // État dérivé - Mapper les opportunités par offre de service
  const [opportunitiesByOffering, setOpportunitiesByOffering] = useState({});
  const [offeringStats, setOfferingStats] = useState({});
  const [serviceLineStats, setServiceLineStats] = useState({});
  const [yearlyStats, setYearlyStats] = useState({});
  const [offeringToServiceLine, setOfferingToServiceLine] = useState({});

  // Initialisation des données dérivées
  useEffect(() => {
    // Mapper les offres à leurs lignes de service
    const offeringToServiceLineMap = {};
    Object.entries(data.completeServiceLines).forEach(
      ([serviceLine, offerings]) => {
        offerings.forEach((offering) => {
          offeringToServiceLineMap[offering] = serviceLine;
        });
      }
    );
    setOfferingToServiceLine(offeringToServiceLineMap);

    // Mapper les opportunités par offre
    const oppByOffering = {};
    Object.values(data.completeServiceLines)
      .flat()
      .forEach((offering) => {
        oppByOffering[offering] = [];
      });

    data.rawOpportunities.forEach((opp) => {
      if (opp.serviceOffering) {
        if (!oppByOffering[opp.serviceOffering]) {
          oppByOffering[opp.serviceOffering] = [];
        }
        oppByOffering[opp.serviceOffering].push(opp);
      }
    });
    setOpportunitiesByOffering(oppByOffering);

    // Calculer les statistiques par offre
    const statsPerOffering = {};
    Object.entries(oppByOffering).forEach(([offering, opportunities]) => {
      const bookedOpps = opportunities.filter((opp) =>
        opp.status.includes("Booked")
      );
      const lostOpps = opportunities.filter((opp) =>
        opp.status.includes("Lost")
      );

      statsPerOffering[offering] = {
        totalOpportunities: opportunities.length,
        bookedOpportunities: bookedOpps.length,
        lostOpportunities: lostOpps.length,
        winRate:
          opportunities.length > 0
            ? ((bookedOpps.length / opportunities.length) * 100).toFixed(1)
            : "0.0",
        totalEstimatedValue: opportunities.reduce(
          (sum, opp) => sum + opp.estimatedValue,
          0
        ),
        totalBookedValue: bookedOpps.reduce(
          (sum, opp) => sum + opp.estimatedValue,
          0
        ),
      };
    });
    setOfferingStats(statsPerOffering);

    // Calculer les statistiques par ligne de service
    const statsPerServiceLine = {};
    Object.entries(offeringToServiceLineMap).forEach(
      ([offering, serviceLine]) => {
        if (!statsPerServiceLine[serviceLine]) {
          statsPerServiceLine[serviceLine] = {
            totalOpportunities: 0,
            bookedOpportunities: 0,
            lostOpportunities: 0,
            totalEstimatedValue: 0,
            totalBookedValue: 0,
            offerings: [],
          };
        }

        if (!statsPerServiceLine[serviceLine].offerings.includes(offering)) {
          statsPerServiceLine[serviceLine].offerings.push(offering);
        }

        if (statsPerOffering[offering]) {
          statsPerServiceLine[serviceLine].totalOpportunities +=
            statsPerOffering[offering].totalOpportunities;
          statsPerServiceLine[serviceLine].bookedOpportunities +=
            statsPerOffering[offering].bookedOpportunities;
          statsPerServiceLine[serviceLine].lostOpportunities +=
            statsPerOffering[offering].lostOpportunities;
          statsPerServiceLine[serviceLine].totalEstimatedValue +=
            statsPerOffering[offering].totalEstimatedValue;
          statsPerServiceLine[serviceLine].totalBookedValue +=
            statsPerOffering[offering].totalBookedValue;
        }
      }
    );
    setServiceLineStats(statsPerServiceLine);

    // Calculer les statistiques annuelles
    const statsByYear = {};
    data.rawOpportunities.forEach((opp) => {
      const year = extractYear(opp.closeDate);
      if (year) {
        if (!statsByYear[year]) {
          statsByYear[year] = {
            totalOpportunities: 0,
            bookedOpportunities: 0,
            totalValue: 0,
            bookedValue: 0,
          };
        }
        statsByYear[year].totalOpportunities++;
        statsByYear[year].totalValue += opp.estimatedValue;

        if (opp.status.includes("Booked")) {
          statsByYear[year].bookedOpportunities++;
          statsByYear[year].bookedValue += opp.estimatedValue;
        }
      }
    });
    setYearlyStats(statsByYear);

    // Identifier les offres mentionnées dans les actualités mais sans opportunités en cours
    const offersInNews = new Set();

    data.relevanceMatrix.forEach((item) => {
      const detailOfferings = item.offerDetail.split(", ");
      detailOfferings.forEach((detailOffer) => {
        Object.entries(data.completeServiceLines).forEach(
          ([serviceLine, offerings]) => {
            offerings.forEach((offering) => {
              if (
                detailOffer.includes(offering) ||
                offering.includes(detailOffer)
              ) {
                offersInNews.add(offering);
              }
            });
          }
        );
      });
    });

    const offersMissingOpps = Array.from(offersInNews).filter(
      (offer) => !oppByOffering[offer] || oppByOffering[offer].length === 0
    );

    setOffersWithNewsButNoOpp(offersMissingOpps);
    setIsLoading(false);
  }, [data]);

  // Filtrer la matrice par offre, terme de recherche et score de pertinence
  const filteredMatrix = useMemo(() => {
    return data.relevanceMatrix.filter((item) => {
      const matchesOffer =
        selectedOffer === "all" || item.offerCategory === selectedOffer;
      const matchesSearch =
        item.news.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.newsCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.offerDetail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRelevance = item.relevanceScore >= relevanceFilter;

      return matchesOffer && matchesSearch && matchesRelevance;
    });
  }, [data.relevanceMatrix, selectedOffer, searchTerm, relevanceFilter]);

  // Grouper les résultats par actualité
  const groupedByNews = useMemo(() => {
    const grouped = {};
    filteredMatrix.forEach((item) => {
      if (!grouped[item.news]) {
        grouped[item.news] = {
          news: item.news,
          newsDate: item.newsDate,
          newsCategory: item.newsCategory,
          offers: [],
        };
      }

      grouped[item.news].offers.push({
        category: item.offerCategory,
        detail: item.offerDetail,
        relevanceScore: item.relevanceScore,
        hasOpportunities: Array.from(item.offerDetail.split(", ")).some(
          (detail) =>
            Object.keys(opportunitiesByOffering).some(
              (key) =>
                (detail.includes(key) || key.includes(detail)) &&
                opportunitiesByOffering[key].length > 0
            )
        ),
      });
    });
    return grouped;
  }, [filteredMatrix, opportunitiesByOffering]);

  // Filtrer les opportunités par année
  const filteredOpportunities = (opportunities) => {
    if (yearFilter === "all") return opportunities;
    return opportunities.filter((opp) => {
      const year = extractYear(opp.closeDate);
      return year === yearFilter;
    });
  };

  // Trier les opportunités
  const sortOpportunities = (opportunities) => {
    return [...opportunities].sort((a, b) => {
      let valueA, valueB;

      if (sortBy === "date") {
        valueA = a.closeDate ? a.closeDate.split("/").reverse().join("") : "";
        valueB = b.closeDate ? b.closeDate.split("/").reverse().join("") : "";
      } else if (sortBy === "value") {
        valueA = a.estimatedValue;
        valueB = b.estimatedValue;
      } else if (sortBy === "name") {
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
      } else if (sortBy === "cm1") {
        valueA = parseFloat(a.cm1.replace(",", ".")) || 0;
        valueB = parseFloat(b.cm1.replace(",", ".")) || 0;
      }

      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  };

  // Gestion du chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-medium text-gray-600">
          Chargement des données...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Matrice Offres BearingPoint / Actualités Schneider Electric
      </h1>
      <h2 className="text-sm text-center text-gray-500 mb-6">Version 5.0</h2>

      {/* Tabs */}
      <div className="mb-6 flex border-b">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "matrix"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("matrix")}
        >
          Matrice Actualités / Offres
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "opportunities"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("opportunities")}
        >
          Opportunités par Offre
        </button>
      </div>

      {activeTab === "matrix" && (
        <>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Filtrer par offre BearingPoint:
              </label>
              <select
                className="w-full p-2 border rounded"
                value={selectedOffer}
                onChange={(e) => setSelectedOffer(e.target.value)}
              >
                <option value="all">Toutes les offres</option>
                {Object.keys(data.bpOffers).map((offer) => (
                  <option key={offer} value={offer}>
                    {offer}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Recherche:
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="Rechercher une actualité, catégorie ou offre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Score de pertinence minimum:
              </label>
              <select
                className="w-full p-2 border rounded"
                value={relevanceFilter}
                onChange={(e) => setRelevanceFilter(parseInt(e.target.value))}
              >
                <option value="0">Tous les scores</option>
                <option value="1">1 et plus</option>
                <option value="2">2 et plus</option>
                <option value="3">3 et plus</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-100 p-4 mb-4 rounded">
            <p className="text-sm font-medium">
              Explication du score de pertinence:
            </p>
            <p className="text-xs">
              3 = Très pertinent | 2 = Pertinent | 1 = Légèrement pertinent
            </p>
          </div>

          {Object.values(groupedByNews).length > 0 ? (
            <div className="space-y-6">
              {Object.values(groupedByNews).map((group, index) => (
                <div
                  key={index}
                  className="border rounded shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  <div className="bg-gray-50 p-4">
                    <h2 className="text-lg font-semibold">{group.news}</h2>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">{group.newsDate}</span>
                      <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs">
                        {group.newsCategory}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      Offres BearingPoint pertinentes:
                    </h3>
                    <div className="space-y-2">
                      {group.offers.map((offer, offerIdx) => (
                        <div
                          key={offerIdx}
                          className="flex items-center justify-between bg-white p-3 border rounded hover:border-blue-300 transition-colors duration-200"
                        >
                          <div>
                            <span className="font-medium">
                              {offer.category}
                            </span>
                            <span className="text-sm text-gray-600 block">
                              {offer.detail}
                            </span>
                            {!offer.hasOpportunities && (
                              <span className="mt-1 inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                ⚠️ Pas d'opportunité en cours
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`ml-2 rounded-full w-8 h-8 flex items-center justify-center text-white font-medium
                              ${
                                offer.relevanceScore === 3
                                  ? "bg-green-500"
                                  : offer.relevanceScore === 2
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                              }`}
                            >
                              {offer.relevanceScore}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucun résultat trouvé pour les critères sélectionnés.
            </div>
          )}

          {/* Liste des offres sans opportunités mais mentionnées dans les actualités */}
          {offersWithNewsButNoOpp.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">
                Offres mentionnées dans les actualités sans opportunités actives
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                <ul className="list-disc pl-4 space-y-1">
                  {offersWithNewsButNoOpp.map((offer, idx) => (
                    <li key={idx} className="font-medium">
                      {offer}
                      <span className="text-gray-600 ml-2">
                        ({offeringToServiceLine[offer]})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "opportunities" && (
        <div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Filtrer par ligne de service ou offre:
              </label>
              <select
                className="w-full p-2 border rounded"
                value={selectedOffer}
                onChange={(e) => setSelectedOffer(e.target.value)}
              >
                <option value="all">Toutes les offres</option>
                {Object.keys(serviceLineStats).map((serviceLine) => (
                  <option key={serviceLine} value={serviceLine}>
                    {serviceLine}
                  </option>
                ))}
                {Object.keys(offeringStats)
                  .filter(
                    (offering) => offeringStats[offering].totalOpportunities > 0
                  )
                  .sort()
                  .map((offering) => (
                    <option key={offering} value={offering}>
                      -- {offering}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Filtrer par année:
              </label>
              <select
                className="w-full p-2 border rounded"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">Toutes les années</option>
                {Object.keys(yearlyStats)
                  .sort()
                  .reverse()
                  .map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Trier par:
              </label>
              <div className="flex">
                <select
                  className="w-3/5 p-2 border rounded-l"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date</option>
                  <option value="value">Valeur</option>
                  <option value="name">Nom</option>
                  <option value="cm1">CM1%</option>
                </select>
                <button
                  className="w-2/5 bg-gray-100 border border-l-0 rounded-r p-2 flex items-center justify-center"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? "Croissant ↑" : "Décroissant ↓"}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">
              Statistiques des opportunités
            </h2>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                {Object.keys(yearlyStats)
                  .sort((a, b) => parseInt(b) - parseInt(a))
                  .slice(0, 5)
                  .map((year) => (
                    <div
                      key={year}
                      className={`bg-white p-2 rounded shadow hover:shadow-md cursor-pointer transition-shadow duration-200 ${
                        yearFilter === year ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => setYearFilter(year)}
                    >
                      <div className="font-bold">{year}</div>
                      <div>
                        Opportunités: {yearlyStats[year].totalOpportunities}
                      </div>
                      <div>
                        Gagnées: {yearlyStats[year].bookedOpportunities}
                      </div>
                      <div className="truncate">
                        Valeur: {yearlyStats[year].totalValue.toLocaleString()}{" "}
                        €
                      </div>
                      <div className="truncate">
                        Taux:{" "}
                        {(
                          (yearlyStats[year].bookedOpportunities /
                            yearlyStats[year].totalOpportunities) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ligne de service / Offre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Opps
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gagnées
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perdues
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taux de succès
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur Estimée
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(serviceLineStats)
                    .filter(
                      ([serviceLine, _]) =>
                        selectedOffer === "all" ||
                        serviceLine === selectedOffer ||
                        (Object.keys(offeringStats).includes(selectedOffer) &&
                          offeringToServiceLine[selectedOffer] === serviceLine)
                    )
                    .map(([serviceLine, stats]) => (
                      <React.Fragment key={serviceLine}>
                        {/* Ligne de service */}
                        <tr
                          className="bg-gray-100 hover:bg-gray-200 cursor-pointer font-medium"
                          onClick={() =>
                            setExpandedServiceLine(
                              expandedServiceLine === serviceLine
                                ? null
                                : serviceLine
                            )
                          }
                        >
                          <td className="px-4 py-2 flex items-center">
                            <span
                              className={`mr-2 transition-transform duration-200 ${
                                expandedServiceLine === serviceLine
                                  ? "transform rotate-90"
                                  : ""
                              }`}
                            >
                              ▶
                            </span>
                            {serviceLine}
                          </td>
                          <td className="px-4 py-2">
                            {stats.totalOpportunities}
                          </td>
                          <td className="px-4 py-2">
                            {stats.bookedOpportunities}
                          </td>
                          <td className="px-4 py-2">
                            {stats.lostOpportunities}
                          </td>
                          <td className="px-4 py-2">
                            {stats.totalOpportunities > 0
                              ? (
                                  (stats.bookedOpportunities /
                                    stats.totalOpportunities) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %
                          </td>
                          <td className="px-4 py-2">
                            {stats.totalEstimatedValue.toLocaleString()} €
                          </td>
                        </tr>

                        {/* Offres par ligne de service avec leurs opportunités */}
                        {expandedServiceLine === serviceLine && (
                          <>
                            {stats.offerings
                              .filter((offering) => {
                                if (
                                  Object.keys(offeringStats).includes(
                                    selectedOffer
                                  ) &&
                                  offeringToServiceLine[selectedOffer] ===
                                    serviceLine
                                ) {
                                  return offering === selectedOffer;
                                }
                                return true;
                              })
                              .sort()
                              .map((offering) => {
                                const offerStats = offeringStats[offering] || {
                                  totalOpportunities: 0,
                                  bookedOpportunities: 0,
                                  lostOpportunities: 0,
                                  winRate: "0.0",
                                  totalEstimatedValue: 0,
                                  totalBookedValue: 0,
                                };

                                // Vérifier si cette offre apparaît dans les actualités
                                const isInNews = data.relevanceMatrix.some(
                                  (item) =>
                                    item.offerDetail
                                      .split(", ")
                                      .some(
                                        (detail) =>
                                          detail === offering ||
                                          detail.includes(offering) ||
                                          offering.includes(detail)
                                      )
                                );

                                const rowClass =
                                  isInNews &&
                                  offerStats.totalOpportunities === 0
                                    ? "bg-yellow-50 hover:bg-yellow-100 font-medium"
                                    : offerStats.totalOpportunities === 0
                                    ? "text-gray-400 hover:bg-gray-50"
                                    : "hover:bg-gray-50 cursor-pointer";

                                return (
                                  <React.Fragment key={offering}>
                                    <tr
                                      className={rowClass}
                                      onClick={() =>
                                        offerStats.totalOpportunities > 0
                                          ? setExpandedOffer(
                                              expandedOffer === offering
                                                ? null
                                                : offering
                                            )
                                          : null
                                      }
                                    >
                                      <td className="px-4 py-2 pl-8 flex items-center">
                                        {offerStats.totalOpportunities > 0 && (
                                          <span
                                            className={`mr-2 transition-transform duration-200 ${
                                              expandedOffer === offering
                                                ? "transform rotate-90"
                                                : ""
                                            }`}
                                          >
                                            ▶
                                          </span>
                                        )}
                                        {offering}
                                        {isInNews &&
                                          offerStats.totalOpportunities ===
                                            0 && (
                                            <span className="ml-2 text-xs text-yellow-700">
                                              ⚠️ Actualité sans opportunité
                                            </span>
                                          )}
                                      </td>
                                      <td className="px-4 py-2">
                                        {offerStats.totalOpportunities || 0}
                                      </td>
                                      <td className="px-4 py-2">
                                        {offerStats.bookedOpportunities || 0}
                                      </td>
                                      <td className="px-4 py-2">
                                        {offerStats.lostOpportunities || 0}
                                      </td>
                                      <td className="px-4 py-2">
                                        {offerStats.winRate || "0.0"}%
                                      </td>
                                      <td className="px-4 py-2">
                                        {(
                                          offerStats.totalEstimatedValue || 0
                                        ).toLocaleString()}{" "}
                                        €
                                      </td>
                                    </tr>

                                    {/* Détail des opportunités directement sous chaque offre */}
                                    {expandedOffer === offering &&
                                      offerStats.totalOpportunities > 0 && (
                                        <tr>
                                          <td colSpan="6" className="px-0 py-2">
                                            <div className="mx-8 mb-4">
                                              <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-sm font-medium text-blue-600">
                                                  Détail des opportunités
                                                </h4>
                                                <span className="text-sm text-gray-500">
                                                  {yearFilter === "all"
                                                    ? "Toutes années"
                                                    : `Année ${yearFilter}`}
                                                </span>
                                              </div>
                                              <div className="space-y-3">
                                                {sortOpportunities(
                                                  filteredOpportunities(
                                                    opportunitiesByOffering[
                                                      offering
                                                    ]
                                                  )
                                                ).map((opp) => (
                                                  <div
                                                    key={opp.id}
                                                    className={`border p-3 rounded hover:shadow-sm transition-shadow duration-200 ${
                                                      opp.status.includes(
                                                        "Booked"
                                                      )
                                                        ? "border-green-200 bg-green-50"
                                                        : "border-red-200 bg-red-50"
                                                    }`}
                                                  >
                                                    <div className="flex justify-between">
                                                      <span className="font-medium">
                                                        {opp.name}
                                                      </span>
                                                      <span
                                                        className={`text-sm px-2 py-1 rounded-full ${
                                                          opp.status.includes(
                                                            "Booked"
                                                          )
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}
                                                      >
                                                        {opp.status.includes(
                                                          "Booked"
                                                        )
                                                          ? "Gagné"
                                                          : "Perdu"}
                                                      </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                                                      <div>
                                                        <span className="text-gray-500">
                                                          ID:
                                                        </span>{" "}
                                                        {opp.id}
                                                      </div>
                                                      <div>
                                                        <span className="text-gray-500">
                                                          Date de clôture:
                                                        </span>{" "}
                                                        {opp.closeDate}
                                                      </div>
                                                      <div>
                                                        <span className="text-gray-500">
                                                          Valeur estimée:
                                                        </span>{" "}
                                                        {opp.estimatedValue.toLocaleString()}{" "}
                                                        €
                                                      </div>
                                                      <div>
                                                        <span className="text-gray-500">
                                                          Manager:
                                                        </span>{" "}
                                                        {opp.accountManager ||
                                                          "-"}
                                                      </div>
                                                      <div>
                                                        <span className="text-gray-500">
                                                          CM1%:
                                                        </span>{" "}
                                                        {opp.cm1 || "-"}
                                                      </div>
                                                      <div>
                                                        <span className="text-gray-500">
                                                          Revenu brut:
                                                        </span>{" "}
                                                        {opp.grossRevenue.toLocaleString()}{" "}
                                                        €
                                                      </div>
                                                      <div className="md:col-span-2">
                                                        <span className="text-gray-500">
                                                          Ligne de service:
                                                        </span>{" "}
                                                        {opp.serviceLine}
                                                      </div>
                                                      {opp.comment && (
                                                        <div className="md:col-span-2">
                                                          <span className="text-gray-500">
                                                            Commentaire:
                                                          </span>{" "}
                                                          {opp.comment}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                  </React.Fragment>
                                );
                              })}
                          </>
                        )}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Analyse basée sur les offres BearingPoint, les actualités Schneider
          Electric et les opportunités depuis 2018
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Version 5.0 - Dernière mise à jour: 15/04/2025
        </p>
      </div>
    </div>
  );
};

export default MatrixApp;
