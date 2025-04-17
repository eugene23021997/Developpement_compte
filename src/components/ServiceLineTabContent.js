import React, { useState, useMemo } from "react";
import NewsCard from "./NewsCard";
import { InfoIcon } from "./Icons";

/**
 * Composant pour afficher l'onglet des lignes de service et leurs actualités associées
 * Modifié pour intégrer les animations des cartes d'actualités par ligne identiques à l'onglet Actualités
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.data - Les données de l'application
 * @param {Object} props.combinedRelevanceMatrix - Matrice de pertinence combinée
 * @param {string} props.selectedOffer - L'offre sélectionnée
 * @param {function} props.setSelectedOffer - Fonction pour définir l'offre sélectionnée
 * @param {number} props.relevanceFilter - Filtre de pertinence
 * @returns {JSX.Element} Contenu de l'onglet Service Lines
 */
const ServiceLineTabContent = ({
  data,
  combinedRelevanceMatrix,
  selectedOffer,
  setSelectedOffer,
  relevanceFilter,
}) => {
  // État pour suivre les lignes de service et offres développées
  const [expandedServiceLine, setExpandedServiceLine] = useState(null);
  const [expandedOffer, setExpandedOffer] = useState(null);
  
  // NOUVEAU: Gestion des lignes d'actualités développées par contexte
  const [expandedServiceLineRows, setExpandedServiceLineRows] = useState({});
  const [expandedOfferingRows, setExpandedOfferingRows] = useState({});

  /**
   * Fonction pour regrouper les actualités par offre
   * @returns {Object} Actualités regroupées par ligne de service et offre
   */
  const getNewsByOffering = () => {
    const result = {};

    // Initialiser toutes les lignes de service et offres
    Object.entries(data.completeServiceLines).forEach(
      ([serviceLine, offerings]) => {
        if (!result[serviceLine]) {
          result[serviceLine] = {
            news: [],
            offerings: {},
          };
        }

        offerings.forEach((offering) => {
          result[serviceLine].offerings[offering] = {
            news: [],
          };
        });
      }
    );

    // Remplir avec les actualités correspondantes depuis la matrice de pertinence
    combinedRelevanceMatrix.forEach((item) => {
      if (item.relevanceScore >= relevanceFilter) {
        const offerCategories = [item.offerCategory];
        const offerDetails = item.offerDetail.split(", ");

        offerCategories.forEach((category) => {
          if (result[category]) {
            // Ajouter l'actualité à la ligne de service
            const newsForServiceLine = result[category].news;
            if (!newsForServiceLine.some((news) => news.news === item.news)) {
              newsForServiceLine.push({
                news: item.news,
                newsDate: item.newsDate,
                newsCategory: item.newsCategory,
                newsDescription: item.newsDescription,
                newsLink: item.newsLink,
                relevanceScore: item.relevanceScore,
                offers: [
                  {
                    category: item.offerCategory,
                    detail: item.offerDetail,
                    relevanceScore: item.relevanceScore,
                  },
                ],
              });
            }

            // Ajouter l'actualité aux offres spécifiques
            offerDetails.forEach((detail) => {
              const matchingOfferings = Object.keys(
                result[category].offerings
              ).filter(
                (offering) =>
                  offering.includes(detail) || detail.includes(offering)
              );

              matchingOfferings.forEach((offering) => {
                const newsForOffering =
                  result[category].offerings[offering].news;
                if (!newsForOffering.some((news) => news.news === item.news)) {
                  newsForOffering.push({
                    news: item.news,
                    newsDate: item.newsDate,
                    newsCategory: item.newsCategory,
                    newsDescription: item.newsDescription,
                    newsLink: item.newsLink,
                    relevanceScore: item.relevanceScore,
                    offers: [
                      {
                        category: item.offerCategory,
                        detail: item.offerDetail,
                        relevanceScore: item.relevanceScore,
                      },
                    ],
                  });
                }
              });
            });
          }
        });
      }
    });

    return result;
  };

  // Obtenir les actualités regroupées par ligne de service et offre
  const newsByOffering = getNewsByOffering();

  /**
   * Fonction pour trier les actualités par date (de la plus récente à la plus ancienne)
   * @param {Array} news - Liste d'actualités à trier
   * @returns {Array} Liste d'actualités triées par date
   */
  const sortNewsByDate = (news) => {
    return [...news].sort((a, b) => {
      // Convertir les dates au format "DD Mmm. YYYY" en objets Date
      const parseCustomDate = (dateString) => {
        // Mapping des mois abrégés en français vers leurs indices (0-11)
        const monthMap = {
          "Janv.": 0,
          "Févr.": 1,
          Mars: 2,
          "Avr.": 3,
          Mai: 4,
          Juin: 5,
          "Juil.": 6,
          Août: 7,
          "Sept.": 8,
          "Oct.": 9,
          "Nov.": 10,
          "Déc.": 11,
        };

        const parts = dateString.split(" ");

        if (parts.length !== 3) {
          console.error(`Format de date non reconnu: ${dateString}`);
          return new Date(0);
        }

        const day = parseInt(parts[0], 10);
        const month = monthMap[parts[1]];
        const year = parseInt(parts[2], 10);

        if (isNaN(day) || month === undefined || isNaN(year)) {
          console.error(`Impossible de parser la date: ${dateString}`);
          return new Date(0);
        }

        return new Date(year, month, day);
      };

      const dateA = parseCustomDate(a.newsDate);
      const dateB = parseCustomDate(b.newsDate);

      return dateB - dateA; // De la plus récente à la plus ancienne
    });
  };

  /**
   * Calcule l'indice de la ligne selon la taille d'écran actuelle
   * @param {number} index - L'index de la carte dans la grille
   * @param {string} context - Contexte ('serviceLine' ou 'offering')
   * @returns {number} Indice de la ligne
   */
  const getRowIndex = (index, context = 'serviceLine') => {
    // Déterminer la taille de la grille en fonction de la largeur de l'écran
    const gridColumns = window.innerWidth >= 1280 ? 3 : 
                       window.innerWidth >= 768 ? 2 : 1;
    
    // Calculer l'indice de la ligne
    return Math.floor(index / gridColumns);
  };

  /**
   * Gère le clic pour déplier/replier une rangée de cartes dans la ligne de service
   * @param {string} serviceLine - La ligne de service concernée
   * @param {number} rowIndex - L'indice de la ligne à déplier/replier
   */
  const handleServiceLineRowToggle = (serviceLine, rowIndex) => {
    setExpandedServiceLineRows(prev => {
      const currentRows = prev[serviceLine] || [];
      
      // Si la ligne est déjà dépliée, la replier
      if (currentRows.includes(rowIndex)) {
        return {
          ...prev,
          [serviceLine]: currentRows.filter(r => r !== rowIndex)
        };
      } 
      // Sinon, la déplier
      else {
        return {
          ...prev,
          [serviceLine]: [...currentRows, rowIndex]
        };
      }
    });
  };

  /**
   * Gère le clic pour déplier/replier une rangée de cartes dans une offre
   * @param {string} serviceLine - La ligne de service parente
   * @param {string} offering - L'offre concernée
   * @param {number} rowIndex - L'indice de la ligne à déplier/replier
   */
  const handleOfferingRowToggle = (serviceLine, offering, rowIndex) => {
    const offeringKey = `${serviceLine}_${offering}`;
    
    setExpandedOfferingRows(prev => {
      const currentRows = prev[offeringKey] || [];
      
      // Si la ligne est déjà dépliée, la replier
      if (currentRows.includes(rowIndex)) {
        return {
          ...prev,
          [offeringKey]: currentRows.filter(r => r !== rowIndex)
        };
      } 
      // Sinon, la déplier
      else {
        return {
          ...prev,
          [offeringKey]: [...currentRows, rowIndex]
        };
      }
    });
  };

  /**
   * Vérifie si une carte d'actualité est dépliée dans la ligne de service
   * @param {string} serviceLine - La ligne de service
   * @param {number} index - L'index de la carte
   * @returns {boolean} Vrai si la carte est dépliée
   */
  const isServiceLineNewsExpanded = (serviceLine, index) => {
    const rowIndex = getRowIndex(index);
    const expandedRows = expandedServiceLineRows[serviceLine] || [];
    return expandedRows.includes(rowIndex);
  };

  /**
   * Vérifie si une carte d'actualité est dépliée dans une offre
   * @param {string} serviceLine - La ligne de service parente
   * @param {string} offering - L'offre concernée
   * @param {number} index - L'index de la carte
   * @returns {boolean} Vrai si la carte est dépliée
   */
  const isOfferingNewsExpanded = (serviceLine, offering, index) => {
    const offeringKey = `${serviceLine}_${offering}`;
    const rowIndex = getRowIndex(index);
    const expandedRows = expandedOfferingRows[offeringKey] || [];
    return expandedRows.includes(rowIndex);
  };

  return (
    <div className="premium-service-lines-content">
      <h2 className="premium-section-title">
        Lignes de service et offres avec leurs actualités associées
      </h2>

      {/* Afficher les lignes de service et leurs offres */}
      {Object.entries(newsByOffering)
        .filter(([serviceLine, _]) => {
          return selectedOffer === "all" || serviceLine === selectedOffer;
        })
        .map(([serviceLine, serviceLineData]) => (
          <div
            key={serviceLine}
            className="premium-service-line-card"
            style={{
              marginBottom: "24px",
              backgroundColor: "var(--glass-bg)",
              backdropFilter: "blur(15px)",
              WebkitBackdropFilter: "blur(15px)",
              borderRadius: "var(--border-radius-lg)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--glass-shadow-md)",
              overflow: "hidden",
            }}
          >
            {/* En-tête de la ligne de service */}
            <div
              className="premium-service-line-header"
              style={{
                padding: "16px",
                borderBottom: "1px solid var(--divider)",
                cursor: "pointer",
                backgroundColor:
                  expandedServiceLine === serviceLine
                    ? "rgba(0, 113, 243, 0.05)"
                    : "transparent",
                transition: "background-color 0.2s ease",
              }}
              onClick={() =>
                setExpandedServiceLine(
                  expandedServiceLine === serviceLine ? null : serviceLine
                )
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    style={{
                      width: "16px",
                      height: "16px",
                      transition: "transform 0.2s ease",
                      transform:
                        expandedServiceLine === serviceLine
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {serviceLine}
                </h3>

                {/* Badge indiquant le nombre d'actualités */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>
                    {serviceLineData.news.length} actualité
                    {serviceLineData.news.length !== 1 ? "s" : ""}
                  </span>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor:
                        serviceLineData.news.length > 0
                          ? "var(--success)"
                          : "var(--warning)",
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Contenu de la ligne de service (visible si développé) */}
            {expandedServiceLine === serviceLine && (
              <div
                className="premium-service-line-content"
                style={{ padding: "16px" }}
              >
                {/* Afficher les actualités associées à la ligne de service */}
                {serviceLineData.news.length > 0 ? (
                  <div style={{ marginBottom: "24px" }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        marginBottom: "16px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Actualités associées à {serviceLine}
                    </h4>
                    <div className="premium-news-grid">
                      {sortNewsByDate(serviceLineData.news).map(
                        (news, index) => (
                          <NewsCard
                            key={`${serviceLine}-news-${index}`}
                            news={news}
                            expanded={isServiceLineNewsExpanded(serviceLine, index)}
                            onToggle={() => handleServiceLineRowToggle(
                              serviceLine, 
                              getRowIndex(index)
                            )}
                          />
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--warning-light)",
                      borderRadius: "var(--border-radius)",
                      marginBottom: "24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <InfoIcon />
                    <span>
                      Aucune actualité n'est associée à cette ligne de service
                      selon les critères de filtrage actuels.
                    </span>
                  </div>
                )}

                {/* Afficher les offres de cette ligne de service */}
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "16px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Offres de {serviceLine}
                </h4>

                {Object.entries(serviceLineData.offerings).map(
                  ([offering, offeringData]) => (
                    <div
                      key={offering}
                      className="premium-offering-card"
                      style={{
                        marginBottom: "12px",
                        backgroundColor:
                          expandedOffer === offering
                            ? "rgba(255, 255, 255, 0.9)"
                            : "rgba(255, 255, 255, 0.5)",
                        borderRadius: "var(--border-radius)",
                        boxShadow:
                          expandedOffer === offering
                            ? "var(--shadow-md)"
                            : "var(--shadow-sm)",
                        border: "1px solid rgba(0, 0, 0, 0.03)",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setExpandedOffer(
                          expandedOffer === offering ? null : offering
                        )
                      }
                    >
                      {/* En-tête de l'offre */}
                      <div
                        style={{
                          padding: "16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom:
                            expandedOffer === offering &&
                            offeringData.news.length > 0
                              ? "1px solid var(--divider)"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <svg
                            style={{
                              width: "14px",
                              height: "14px",
                              transition: "transform 0.2s ease",
                              transform:
                                expandedOffer === offering
                                  ? "rotate(90deg)"
                                  : "rotate(0deg)",
                            }}
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9 18L15 12L9 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>{offering}</span>
                        </div>

                        {/* Badge indiquant le nombre d'actualités */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <span>
                            {offeringData.news.length} actualité
                            {offeringData.news.length !== 1 ? "s" : ""}
                          </span>
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor:
                                offeringData.news.length > 0
                                  ? "var(--success)"
                                  : "var(--warning)",
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Actualités associées à l'offre (visible si développé) */}
                      {expandedOffer === offering &&
                        offeringData.news.length > 0 && (
                          <div style={{ padding: "16px" }}>
                            <div className="premium-news-grid">
                              {sortNewsByDate(offeringData.news).map(
                                (news, index) => (
                                  <NewsCard
                                    key={`${serviceLine}-${offering}-news-${index}`}
                                    news={news}
                                    expanded={isOfferingNewsExpanded(serviceLine, offering, index)}
                                    onToggle={() => handleOfferingRowToggle(
                                      serviceLine, 
                                      offering, 
                                      getRowIndex(index)
                                    )}
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Message si aucune actualité (visible si développé) */}
                      {expandedOffer === offering &&
                        offeringData.news.length === 0 && (
                          <div
                            style={{
                              padding: "16px",
                              backgroundColor: "var(--warning-light)",
                              borderRadius:
                                "0 0 var(--border-radius) var(--border-radius)",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <InfoIcon />
                            <span>
                              Aucune actualité n'est associée à cette offre
                              selon les critères de filtrage actuels.
                            </span>
                          </div>
                        )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ))}

      {/* Message si aucune ligne de service ne correspond aux filtres */}
      {Object.keys(newsByOffering).filter(
        (serviceLine) =>
          selectedOffer === "all" || serviceLine === selectedOffer
      ).length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="empty-state-text">
            Aucune ligne de service ne correspond à vos critères de recherche.
            <br />
            <small>
              Essayez de modifier vos filtres ou de rafraîchir les actualités.
            </small>
          </div>
        </div>
      )}

      {/* Style pour la gestion des lignes */}
      <style jsx>{`
        @media (min-width: 768px) and (max-width: 1279px) {
          .premium-news-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1280px) {
          .premium-news-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .premium-news-grid {
          display: grid;
          gap: 24px;
        }
      `}</style>
    </div>
  );
};

export default ServiceLineTabContent;
