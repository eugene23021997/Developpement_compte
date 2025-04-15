import React, { useState, useEffect, useMemo, useRef } from "react";
import { dataService } from "./services/dataService";
import { rssFeedService } from "./services/rssFeedService";
import MatrixTabContent from "./components/MatrixTabContent";
import OpportunitiesTabContent from "./components/OpportunitiesTabContent";
import LoadingSpinner from "./components/LoadingSpinner";
import "./premium-styles-enhanced.css";

const App = () => {
  const [activeTab, setActiveTab] = useState("matrix");
  const [selectedOffer, setSelectedOffer] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [relevanceFilter, setRelevanceFilter] = useState(0);
  const [offersWithNewsButNoOpp, setOffersWithNewsButNoOpp] = useState([]);
  const [yearFilter, setYearFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [rssNews, setRssNews] = useState([]);
  const [isLoadingRss, setIsLoadingRss] = useState(false);
  const [rssRelevanceMatrix, setRssRelevanceMatrix] = useState([]);
  const [showRssOnly, setShowRssOnly] = useState(false);
  const [lastRssUpdate, setLastRssUpdate] = useState(null);
  const searchInputRef = useRef(null);

  // États pour les données calculées
  const [opportunitiesByOffering, setOpportunitiesByOffering] = useState({});
  const [offeringStats, setOfferingStats] = useState({});
  const [serviceLineStats, setServiceLineStats] = useState({});
  const [yearlyStats, setYearlyStats] = useState({});
  const [offeringToServiceLine, setOfferingToServiceLine] = useState({});
  const [expandedServiceLine, setExpandedServiceLine] = useState(null);
  const [expandedOffer, setExpandedOffer] = useState(null);

  // Récupération des données
  const data = useMemo(() => dataService.getData(), []);

  // Détecter le scroll pour changer le style de la navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Focus sur le champ de recherche lorsqu'il est affiché
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Fonction auxiliaire pour extraire l'année d'une date au format "DD/MM/YYYY"
  const extractYear = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return parts[2];
    }
    return null;
  };

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

    // Charger le flux RSS au démarrage
    fetchRssNews();
  }, [data]);

  // Récupération des actualités RSS
  const fetchRssNews = async () => {
    setIsLoadingRss(true);
    try {
      // Récupérer les actualités RSS
      const news = await rssFeedService.getAllNews();
      setRssNews(news);

      // Analyser la pertinence des actualités par rapport aux offres
      const relevanceMatrix = rssFeedService.analyzeNewsRelevance(
        news,
        data.completeServiceLines
      );
      setRssRelevanceMatrix(relevanceMatrix);

      // Mettre à jour la date de dernière mise à jour
      setLastRssUpdate(new Date());
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des actualités RSS:",
        error
      );
    } finally {
      setIsLoadingRss(false);
    }
  };

  // Fusionner la matrice de pertinence des actualités stockées avec celles du flux RSS
  const combinedRelevanceMatrix = useMemo(() => {
    if (showRssOnly) {
      return rssRelevanceMatrix;
    } else {
      return [...data.relevanceMatrix, ...rssRelevanceMatrix];
    }
  }, [data.relevanceMatrix, rssRelevanceMatrix, showRssOnly]);

  // Filtrer la matrice par offre, terme de recherche et score de pertinence
  const filteredMatrix = useMemo(() => {
    return combinedRelevanceMatrix.filter((item) => {
      const matchesOffer =
        selectedOffer === "all" || item.offerCategory === selectedOffer;
      const matchesSearch =
        !searchTerm ||
        item.news.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.newsCategory &&
          item.newsCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.offerDetail &&
          item.offerDetail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.newsDescription &&
          item.newsDescription
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
      const matchesRelevance = item.relevanceScore >= relevanceFilter;

      return matchesOffer && matchesSearch && matchesRelevance;
    });
  }, [combinedRelevanceMatrix, selectedOffer, searchTerm, relevanceFilter]);

  // Grouper les résultats par actualité
  const groupedByNews = useMemo(() => {
    const grouped = {};
    filteredMatrix.forEach((item) => {
      if (!grouped[item.news]) {
        grouped[item.news] = {
          news: item.news,
          newsDate: item.newsDate,
          newsCategory: item.newsCategory || "Actualité",
          newsDescription: item.newsDescription || "",
          newsLink: item.newsLink || "",
          isRss: item.newsLink ? true : false, // Si un lien existe, c'est une actualité RSS
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
        valueA = parseFloat(a.cm1?.replace(",", ".")) || 0;
        valueB = parseFloat(b.cm1?.replace(",", ".")) || 0;
      }

      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  };

  // Fermer le menu et la recherche quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest(".premium-menu-container")) {
        setShowMenu(false);
      }
      if (
        showSearch &&
        !event.target.closest(".search-container") &&
        !event.target.closest(".search-toggle")
      ) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu, showSearch]);

  // Si chargement en cours
  if (isLoading) {
    return (
      <div className="premium-loading">
        <div className="premium-spinner"></div>
        <div className="premium-loading-text">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div className="premium-app">
      {/* Navigation principale */}
      <nav className={`premium-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="premium-navbar-container">
          <div className="premium-navbar-brand">
            <div className="premium-logo">
              <svg
                width="20"
                height="20"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M40 0C17.909 0 0 17.909 0 40C0 62.091 17.909 80 40 80C62.091 80 80 62.091 80 40C80 17.909 62.091 0 40 0ZM40 3.846C60 3.846 76.154 20 76.154 40C76.154 60 60 76.154 40 76.154C20 76.154 3.846 60 3.846 40C3.846 20 20 3.846 40 3.846Z"
                  fill="currentColor"
                />
                <path
                  d="M40 17.778C37.7908 17.778 36 19.5688 36 21.778V50.578L26.3234 40.9014C24.7658 39.3438 22.2342 39.3438 20.6766 40.9014C19.119 42.459 19.119 44.9906 20.6766 46.5482L37.1766 62.988C38.7342 64.5456 41.2658 64.5456 42.8234 62.988L59.2828 46.5482C60.8404 44.9906 60.8404 42.459 59.2828 40.9014C57.7252 39.3438 55.1936 39.3438 53.636 40.9014L44 50.578V21.778C44 19.5688 42.2092 17.778 40 17.778Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="premium-brand-name">BearingPoint</span>
          </div>

          <div className="premium-navbar-menu">
            <button
              className={`premium-nav-link ${
                activeTab === "matrix" ? "active" : ""
              }`}
              onClick={() => setActiveTab("matrix")}
            >
              Matrice
            </button>
            <button
              className={`premium-nav-link ${
                activeTab === "opportunities" ? "active" : ""
              }`}
              onClick={() => setActiveTab("opportunities")}
            >
              Opportunités
            </button>
          </div>

          <div className="premium-navbar-actions">
            <button
              className={`premium-action-button search-toggle ${
                showSearch ? "active" : ""
              }`}
              onClick={() => {
                setShowSearch(!showSearch);
                if (showMenu) setShowMenu(false);
              }}
              title="Rechercher"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 21L16.65 16.65"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Bouton de rafraîchissement des actualités RSS */}
            <button
              className={`premium-action-button ${
                isLoadingRss ? "active" : ""
              }`}
              onClick={fetchRssNews}
              disabled={isLoadingRss}
              title="Rafraîchir les actualités"
            >
              {isLoadingRss ? (
                <LoadingSpinner size="small" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M23 4V10H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1 20V14H7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.51 9.00001C4.01717 7.56586 4.87913 6.2899 6.01547 5.27495C7.1518 4.26 8.52547 3.54233 10.0083 3.1851C11.4911 2.82788 13.0348 2.84181 14.5091 3.22531C15.9834 3.6088 17.3421 4.34536 18.456 5.38801L23 10M1 14L5.544 18.612C6.65794 19.6547 8.01658 20.3912 9.49087 20.7747C10.9652 21.1582 12.5089 21.1721 13.9917 20.8149C15.4745 20.4577 16.8482 19.74 17.9845 18.7251C19.1209 17.7101 19.9828 16.4342 20.49 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            <button
              className={`premium-action-button ${showMenu ? "active" : ""}`}
              onClick={() => {
                setShowMenu(!showMenu);
                if (showSearch) setShowSearch(false);
              }}
              title="Menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 12H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 6H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 18H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Barre de recherche */}
          {showSearch && (
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-search-input"
                />
                {searchTerm && (
                  <button
                    className="search-clear-button"
                    onClick={() => setSearchTerm("")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Menu déroulant */}
          {showMenu && (
            <div className="premium-menu-container">
              <div className="premium-menu">
                <div className="premium-menu-section">
                  <h3 className="premium-menu-title">Filtres</h3>

                  <div className="premium-menu-group">
                    <span className="premium-menu-label">Ligne de service</span>
                    <div className="premium-menu-items">
                      <button
                        onClick={() => {
                          setSelectedOffer("all");
                          setShowMenu(false);
                        }}
                        className={selectedOffer === "all" ? "active" : ""}
                      >
                        Toutes les offres
                      </button>
                      {Object.keys(serviceLineStats).map((serviceLine) => (
                        <button
                          key={serviceLine}
                          onClick={() => {
                            setSelectedOffer(serviceLine);
                            setShowMenu(false);
                          }}
                          className={
                            selectedOffer === serviceLine ? "active" : ""
                          }
                        >
                          {serviceLine}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="premium-menu-group">
                    <span className="premium-menu-label">Actualités</span>
                    <div className="premium-menu-items">
                      <button
                        onClick={() => {
                          setShowRssOnly(false);
                          setShowMenu(false);
                        }}
                        className={!showRssOnly ? "active" : ""}
                      >
                        Toutes les actualités
                      </button>
                      <button
                        onClick={() => {
                          setShowRssOnly(true);
                          setShowMenu(false);
                        }}
                        className={showRssOnly ? "active" : ""}
                      >
                        Actualités RSS seulement
                      </button>
                    </div>
                  </div>

                  <div className="premium-menu-group">
                    <span className="premium-menu-label">
                      Score de pertinence
                    </span>
                    <div className="premium-menu-items">
                      <button
                        onClick={() => {
                          setRelevanceFilter(0);
                          setShowMenu(false);
                        }}
                        className={relevanceFilter === 0 ? "active" : ""}
                      >
                        Tous les scores
                      </button>
                      <button
                        onClick={() => {
                          setRelevanceFilter(1);
                          setShowMenu(false);
                        }}
                        className={relevanceFilter === 1 ? "active" : ""}
                      >
                        1 et plus
                      </button>
                      <button
                        onClick={() => {
                          setRelevanceFilter(2);
                          setShowMenu(false);
                        }}
                        className={relevanceFilter === 2 ? "active" : ""}
                      >
                        2 et plus
                      </button>
                      <button
                        onClick={() => {
                          setRelevanceFilter(3);
                          setShowMenu(false);
                        }}
                        className={relevanceFilter === 3 ? "active" : ""}
                      >
                        3 seulement
                      </button>
                    </div>
                  </div>

                  <div className="premium-menu-group">
                    <span className="premium-menu-label">Années</span>
                    <div className="premium-menu-items">
                      <button
                        onClick={() => {
                          setYearFilter("all");
                          setShowMenu(false);
                        }}
                        className={yearFilter === "all" ? "active" : ""}
                      >
                        Toutes les années
                      </button>
                      {Object.keys(yearlyStats)
                        .sort((a, b) => parseInt(b) - parseInt(a))
                        .map((year) => (
                          <button
                            key={year}
                            onClick={() => {
                              setYearFilter(year);
                              setShowMenu(false);
                            }}
                            className={yearFilter === year ? "active" : ""}
                          >
                            {year}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="premium-menu-section">
                  <h3 className="premium-menu-title">Légende</h3>
                  <div className="premium-menu-relevance">
                    <div className="premium-relevance-item">
                      <div className="premium-relevance-badge relevance-3">
                        3
                      </div>
                      <span>Très pertinent</span>
                    </div>
                    <div className="premium-relevance-item">
                      <div className="premium-relevance-badge relevance-2">
                        2
                      </div>
                      <span>Pertinent</span>
                    </div>
                    <div className="premium-relevance-item">
                      <div className="premium-relevance-badge relevance-1">
                        1
                      </div>
                      <span>Légèrement pertinent</span>
                    </div>
                  </div>

                  {lastRssUpdate && (
                    <div className="premium-rss-info">
                      <h3 className="premium-menu-title">Actualités RSS</h3>
                      <p className="premium-rss-update">
                        Dernière mise à jour: {lastRssUpdate.toLocaleString()}
                      </p>
                      <p className="premium-rss-count">
                        {rssNews.length} actualités chargées
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="premium-main">
        <div className="premium-banner">
          <div className="premium-banner-content">
            <h1>Matrice BearingPoint / Schneider Electric</h1>
            <p className="premium-banner-subtitle">
              Analyse de l'adéquation entre actualités et offres
            </p>
          </div>
        </div>

        <div className="premium-container">
          <div className="premium-filters">
            <div className="premium-filter-controls">
              <div className="premium-selector">
                <label htmlFor="serviceLineSelect">Ligne de service:</label>
                <select
                  id="serviceLineSelect"
                  value={selectedOffer}
                  onChange={(e) => setSelectedOffer(e.target.value)}
                  className="premium-select"
                >
                  <option value="all">Toutes les offres</option>
                  {Object.keys(serviceLineStats).map((serviceLine) => (
                    <option key={serviceLine} value={serviceLine}>
                      {serviceLine}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === "matrix" && (
                <>
                  <div className="premium-selector">
                    <label htmlFor="relevanceSelect">Pertinence minimum:</label>
                    <select
                      id="relevanceSelect"
                      value={relevanceFilter}
                      onChange={(e) =>
                        setRelevanceFilter(parseInt(e.target.value))
                      }
                      className="premium-select"
                    >
                      <option value="0">Tous les scores</option>
                      <option value="1">1 et plus</option>
                      <option value="2">2 et plus</option>
                      <option value="3">3 seulement</option>
                    </select>
                  </div>

                  <div className="premium-selector">
                    <label htmlFor="newsSourceSelect">Source:</label>
                    <select
                      id="newsSourceSelect"
                      value={showRssOnly ? "rss" : "all"}
                      onChange={(e) => setShowRssOnly(e.target.value === "rss")}
                      className="premium-select"
                    >
                      <option value="all">Toutes les actualités</option>
                      <option value="rss">Actualités RSS seulement</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === "opportunities" && (
                <div className="premium-selector">
                  <label htmlFor="yearSelect">Année:</label>
                  <select
                    id="yearSelect"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="premium-select"
                  >
                    <option value="all">Toutes les années</option>
                    {Object.keys(yearlyStats)
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {activeTab === "opportunities" && (
                <div className="premium-selector">
                  <label htmlFor="sortSelect">Trier par:</label>
                  <div className="premium-sort-controls">
                    <select
                      id="sortSelect"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="premium-select sort-select"
                    >
                      <option value="date">Date</option>
                      <option value="value">Valeur</option>
                      <option value="name">Nom</option>
                      <option value="cm1">CM1%</option>
                    </select>
                    <button
                      className="premium-sort-button"
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                    >
                      {sortOrder === "asc" ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 19V5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5 12L12 5L19 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 5V19"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M19 12L12 19L5 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Bouton de rafraîchissement des actualités RSS */}
              {activeTab === "matrix" && (
                <div className="premium-selector">
                  <label htmlFor="refreshRss">Actualités RSS:</label>
                  <button
                    id="refreshRss"
                    className="premium-button"
                    onClick={fetchRssNews}
                    disabled={isLoadingRss}
                  >
                    {isLoadingRss ? (
                      <>
                        <LoadingSpinner size="small" />
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ marginRight: "8px" }}
                        >
                          <path
                            d="M23 4V10H17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M1 20V14H7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3.51 9.00001C4.01717 7.56586 4.87913 6.2899 6.01547 5.27495C7.1518 4.26 8.52547 3.54233 10.0083 3.1851C11.4911 2.82788 13.0348 2.84181 14.5091 3.22531C15.9834 3.6088 17.3421 4.34536 18.456 5.38801L23 10M1 14L5.544 18.612C6.65794 19.6547 8.01658 20.3912 9.49087 20.7747C10.9652 21.1582 12.5089 21.1721 13.9917 20.8149C15.4745 20.4577 16.8482 19.74 17.9845 18.7251C19.1209 17.7101 19.9828 16.4342 20.49 15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Rafraîchir
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {searchTerm && (
              <div className="premium-search-results">
                <div className="premium-search-term">
                  <span>Recherche: </span>
                  <strong>{searchTerm}</strong>
                  <button
                    className="premium-clear-search"
                    onClick={() => setSearchTerm("")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Affichage d'un badge pour indiquer que l'on ne voit que les actualités RSS */}
            {showRssOnly && (
              <div className="premium-rss-banner">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 11C6.38695 11 8.67613 11.9482 10.364 13.636C12.0518 15.3239 13 17.6131 13 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 4C8.24346 4 12.3131 5.68571 15.3137 8.68629C18.3143 11.6869 20 15.7565 20 20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 20C5.55228 20 6 19.5523 6 19C6 18.4477 5.55228 18 5 18C4.44772 18 4 18.4477 4 19C4 19.5523 4.44772 20 5 20Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Affichage des actualités RSS uniquement</span>
                <button onClick={() => setShowRssOnly(false)}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 6L18 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="premium-content">
            {activeTab === "matrix" ? (
              <MatrixTabContent
                groupedByNews={groupedByNews}
                offersWithNewsButNoOpp={offersWithNewsButNoOpp}
                offeringToServiceLine={offeringToServiceLine}
                isLoadingRss={isLoadingRss}
              />
            ) : (
              <OpportunitiesTabContent
                data={data}
                selectedOffer={selectedOffer}
                setSelectedOffer={setSelectedOffer}
                yearFilter={yearFilter}
                setYearFilter={setYearFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                serviceLineStats={serviceLineStats}
                offeringStats={offeringStats}
                yearlyStats={yearlyStats}
                opportunitiesByOffering={opportunitiesByOffering}
                offeringToServiceLine={offeringToServiceLine}
                extractYear={extractYear}
                filteredOpportunities={filteredOpportunities}
                sortOpportunities={sortOpportunities}
                expandedServiceLine={expandedServiceLine}
                setExpandedServiceLine={setExpandedServiceLine}
                expandedOffer={expandedOffer}
                setExpandedOffer={setExpandedOffer}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="premium-footer">
        <div className="premium-footer-content">
          <p>
            Analyse basée sur les offres BearingPoint, les actualités Schneider
            Electric et les opportunités depuis 2018
          </p>
          {lastRssUpdate && (
            <p>
              Dernière mise à jour des actualités RSS:{" "}
              {lastRssUpdate.toLocaleString()}
            </p>
          )}
          <p className="premium-version">
            Version 6.0 - Dernière mise à jour: 15/04/2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
