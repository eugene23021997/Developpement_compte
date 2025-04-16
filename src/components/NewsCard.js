import React, { useState } from "react";

/**
 * Composant pour afficher une carte d'actualité avec argumentaires de pertinence
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.news - L'actualité à afficher
 * @returns {JSX.Element} Carte d'actualité
 */
const NewsCard = ({ news }) => {
  const {
    news: title,
    newsDate,
    newsCategory,
    newsDescription,
    newsLink,
    offers,
  } = news;

  // État pour l'expansion de la carte
  const [expanded, setExpanded] = useState(false);
  // État pour suivre quelle offre est sélectionnée pour voir son argumentaire
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(null);

  // Fonction pour déterminer si une offre a un fort potentiel commercial
  const isHighPotentialOffer = (offer) => {
    return offer.relevanceScore === 3 && !offer.hasOpportunities;
  };

  // Trouver les offres à fort potentiel
  const highPotentialOffers = offers ? offers.filter(isHighPotentialOffer) : [];
  const hasHighPotential = highPotentialOffers.length > 0;

  // Fonction pour basculer l'expansion
  const toggleExpanded = () => {
    setExpanded(!expanded);
    // Réinitialiser l'offre sélectionnée lors de la fermeture
    if (expanded) {
      setSelectedOfferIndex(null);
    }
  };

  // Fonction pour gérer le clic sur une offre et afficher son argumentaire
  const handleOfferClick = (index, event) => {
    event.stopPropagation(); // Empêcher la propagation du clic à la carte
    setSelectedOfferIndex(selectedOfferIndex === index ? null : index);
  };

  // Extraction des mots-clés à partir de la catégorie (maximum 3)
  const extractKeywords = (categoryString) => {
    if (!categoryString) return [];

    // Diviser la chaîne par virgules et nettoyer les espaces
    const keywords = categoryString.split(",").map((k) => k.trim());

    // Retourner au maximum 3 mots-clés
    return keywords.slice(0, 3);
  };

  // Obtenir les mots-clés (max 3)
  const keywords = extractKeywords(newsCategory);

  // Générer un argumentaire de pertinence court et précis
  const generateRelevanceArgument = (offer) => {
    // Pour l'actualité sur la fuite de données de Schneider Electric
    if (
      title.includes("fuite de données") ||
      title.includes("cybersécurité") ||
      newsCategory.includes("Cybersécurité")
    ) {
      if (
        offer.category === "Technology" &&
        offer.detail.includes("Data Security")
      ) {
        return '→ Pertinence 3/3: Fuite de données Schneider = besoin immédiat en sécurité des données.\n→ Mots-clés dans l\'article: "piratée", "ransomware", "vol de données".\n→ Opportunité: audit de sécurité et plan de remédiation.';
      }
      if (
        offer.category === "Finance & Risk" &&
        offer.detail.includes("Compliance")
      ) {
        return '→ Pertinence 3/3: Incident de sécurité = risques RGPD pour Schneider.\n→ Article mentionne: "vol de données" = obligation légale de notification.\n→ Opportunité: accompagnement conformité post-incident.';
      }
      if (
        offer.category === "Technology" &&
        offer.detail.includes("CIO Advisory")
      ) {
        return '→ Pertinence 2/3: Incident sur "plateforme de développement" mentionné.\n→ Besoin de revue de la gouvernance IT et sécurité DevOps.\n→ Opportunité: conseil en transformation sécurisée des SI.';
      }
    }

    // Pour les actualités sur les data centers ou l'IA
    else if (
      title.includes("data centers") ||
      title.includes("centres de données") ||
      title.includes("IA") ||
      keywords.includes("Data Centers") ||
      keywords.includes("IA")
    ) {
      if (
        offer.category === "Technology" &&
        offer.detail.includes("Data, Analytics")
      ) {
        return '→ Pertinence 3/3: Article mentionne "700M$ pour l\'IA" et "data centers".\n→ Besoin explicite d\'expertise en architectures de données pour l\'IA.\n→ Opportunité: conseil en data platforms pour IA générative.';
      }
      if (
        offer.category === "Operations" &&
        offer.detail.includes("Digital Twin")
      ) {
        return '→ Pertinence 2/3: Article cite investissements dans "systèmes de refroidissement".\n→ Les data centers mentionnés nécessitent une gestion énergétique optimisée.\n→ Opportunité: modélisation digitale pour efficience énergétique.';
      }
    }

    // Pour les actualités sur les acquisitions/fusions
    else if (
      title.includes("acquiert") ||
      title.includes("acquisition") ||
      keywords.includes("Acquisition")
    ) {
      if (
        offer.category === "BE Capital" &&
        offer.detail.includes("Capital M&A")
      ) {
        return "→ Pertinence 3/3: Acquisition Motivair pour 850M$ mentionnée.\n→ Besoin explicite d'intégration dans secteur data centers.\n→ Opportunité: conseil en intégration post-acquisition.";
      }
      if (
        offer.category === "BE Capital" &&
        offer.detail.includes("PMI & Carve out")
      ) {
        return "→ Pertinence 3/3: Article cite \"acquisition\" comme fait central.\n→ Enjeu d'intégration de Motivair (850M$) dans l'écosystème Schneider.\n→ Opportunité: accompagnement PMI spécialisé data centers.";
      }
    }

    // Pour les actualités sur la conformité/réglementation
    else if (
      title.includes("amende") ||
      title.includes("entente") ||
      keywords.includes("Juridique") ||
      keywords.includes("Conformité")
    ) {
      if (
        offer.category === "Finance & Risk" &&
        offer.detail.includes("Compliance")
      ) {
        return '→ Pertinence 3/3: Article cite "470M€ d\'amendes" pour ententes sur les prix.\n→ Défaillance identifiée des mécanismes anti-trust.\n→ Opportunité: programme de mise en conformité anti-trust.';
      }
      if (
        offer.category === "Finance & Risk" &&
        offer.detail.includes("Risk Management")
      ) {
        return "→ Pertinence 2/3: Sanction financière majeure (470M€) mentionnée.\n→ Besoin implicite de cartographie des risques de non-conformité.\n→ Opportunité: dispositif d'identification et prévention des risques.";
      }
    }

    // Pour les actualités financières
    else if (
      title.includes("bénéfice") ||
      title.includes("finance") ||
      keywords.includes("Finance")
    ) {
      if (
        offer.category === "Finance & Risk" &&
        offer.detail.includes("Finance Excellence")
      ) {
        return '→ Pertinence 2/3: L\'article mentionne "bénéfice record" chez Schneider.\n→ Contexte favorable pour optimiser les processus financiers.\n→ Opportunité: modernisation de la fonction finance.';
      }
      if (
        offer.category === "Finance & Risk" &&
        offer.detail.includes("Performance Management")
      ) {
        return '→ Pertinence 2/3: Article cite "efficacité énergétique" comme driver de performance.\n→ Besoin de pilotage fin des segments à forte croissance.\n→ Opportunité: redéfinition des KPIs et tableaux de bord.';
      }
    }

    // Pour les actualités sur l'économie circulaire/développement durable
    else if (
      title.includes("économie circulaire") ||
      title.includes("durable") ||
      keywords.includes("Développement durable") ||
      keywords.includes("Économie circulaire")
    ) {
      if (
        offer.category === "Operations" &&
        offer.detail.includes("Manufacturing")
      ) {
        return "→ Pertinence 3/3: Article centré sur l'économie circulaire des équipements.\n→ Mention explicite de \"réparation et maintenance\" à Grenoble.\n→ Opportunité: transformation des processus industriels vers l'économie circulaire.";
      }
      if (
        offer.category === "People & Strategy" &&
        offer.detail.includes("Business Strategy")
      ) {
        return '→ Pertinence 2/3: Article évoque "économie circulaire" comme nouvelle orientation.\n→ Transformation du modèle d\'affaires implicite.\n→ Opportunité: conseil en stratégie économie de fonctionnalité.';
      }
    }

    // Argumentaires par défaut basés sur le niveau de pertinence
    if (offer.relevanceScore === 3) {
      return `→ Pertinence 3/3: L'article traite directement de ${keywords[0]}.\n→ Mots-clés liés à notre offre ${offer.detail} présents dans l'actualité.\n→ Opportunité: proposition directe sur cette problématique prioritaire.`;
    } else if (offer.relevanceScore === 2) {
      return `→ Pertinence 2/3: L'article aborde indirectement notre domaine d'expertise.\n→ Lien identifié entre ${keywords[0]} et notre offre ${offer.detail}.\n→ Opportunité: approche complémentaire aux enjeux principaux.`;
    } else {
      return `→ Pertinence 1/3: Thématique périphérique à notre expertise.\n→ Connexion contextuelle possible avec notre offre ${offer.detail}.\n→ Opportunité: point d'entrée pour une discussion plus large.`;
    }
  };

  return (
    <div
      className={`premium-news-card ${
        hasHighPotential ? "high-potential" : ""
      }`}
      onClick={toggleExpanded}
      style={{
        cursor: "pointer",
        borderLeft: hasHighPotential ? "4px solid #ec4899" : "none",
        transition: "all 0.2s ease",
      }}
    >
      <div className="premium-news-card-content">
        {/* En-tête de la carte - Épuré */}
        <div
          className="premium-news-meta"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="premium-news-date">{newsDate}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Indicateur visuel discret d'opportunité de prospection */}
            {hasHighPotential && (
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#ec4899",
                  boxShadow: "0 0 5px rgba(236, 72, 153, 0.5)",
                }}
                title="Opportunité de prospection"
              ></div>
            )}
          </div>
        </div>

        {/* Titre de l'actualité */}
        <h3 className="premium-news-title" style={{ marginTop: "8px" }}>
          {newsLink ? (
            <a
              href={newsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-news-link"
              onClick={(e) => e.stopPropagation()} // Empêcher l'expansion au clic sur le lien
            >
              {title}
              <svg
                className="premium-external-link-icon"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 3h6v6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 14L21 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ) : (
            title
          )}
        </h3>

        {/* Affichage des mots-clés (max 3) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "12px",
          }}
        >
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="premium-badge"
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                backgroundColor: "rgba(59, 130, 246, 0.1)", // bleu clair
                color: "#3b82f6",
                borderRadius: "20px",
              }}
            >
              {keyword}
            </span>
          ))}
        </div>

        {/* Description courte (visible uniquement en mode expanded) */}
        {newsDescription && expanded && (
          <p
            className="premium-news-description"
            style={{
              marginTop: "12px",
              transition: "all 0.3s ease",
            }}
          >
            {newsDescription}
          </p>
        )}

        {/* Indicateur de prospection simplifié */}
        {hasHighPotential && !expanded && (
          <div
            style={{
              color: "#ec4899",
              fontSize: "14px",
              fontWeight: "500",
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16L16 11H13V8L9 13H12V16Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Opportunité de prospection identifiée
          </div>
        )}

        {/* Indicateur d'expansion */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "12px",
            color: "var(--text-tertiary)",
          }}
        >
          {expanded ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 15L12 9L6 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Contenu détaillé (visible uniquement en mode expanded) */}
        {expanded && offers && offers.length > 0 && (
          <div
            className="premium-offers-section"
            style={{
              marginTop: "16px",
              padding: "16px",
              backgroundColor: "rgba(0, 0, 0, 0.02)",
              borderRadius: "8px",
            }}
          >
            <h4 className="premium-section-title">
              Offres associées à cette actualité
            </h4>

            {/* Afficher d'abord les offres à fort potentiel */}
            {highPotentialOffers.length > 0 && (
              <div
                style={{
                  marginBottom: "16px",
                  marginTop: "12px",
                }}
              >
                <h5
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    color: "#ec4899",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 16L16 11H13V8L9 13H12V16Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Offres à fort potentiel de prospection
                </h5>

                {highPotentialOffers.map((offer, index) => {
                  const offerIndex = offers.indexOf(offer);
                  const isSelected = selectedOfferIndex === offerIndex;

                  return (
                    <div
                      key={`high-potential-${index}`}
                      onClick={(e) => handleOfferClick(offerIndex, e)}
                      style={{
                        padding: "12px",
                        marginBottom: "8px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        borderLeft: "3px solid #ec4899",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        transform: isSelected ? "translateX(4px)" : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontWeight: "600" }}>
                          {offer.category}
                        </span>
                        <div
                          className={`premium-relevance-badge relevance-${offer.relevanceScore}`}
                          title="Niveau de pertinence"
                        >
                          {offer.relevanceScore}
                        </div>
                      </div>
                      <div style={{ marginBottom: "8px" }}>{offer.detail}</div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#ec4899",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Aucun projet en cours - Potentiel business inexploité
                      </div>

                      {/* Argumentaire de pertinence - visible uniquement lorsque l'offre est sélectionnée */}
                      {isSelected && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px",
                            backgroundColor: "rgba(236, 72, 153, 0.05)",
                            borderRadius: "6px",
                            border: "1px dashed rgba(236, 72, 153, 0.2)",
                            fontSize: "13px",
                            animation: "fadeIn 0.3s ease",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginBottom: "8px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M21 11.5C21 16.75 16.75 21 11.5 21C6.25 21 2 16.75 2 11.5C2 6.25 6.25 2 11.5 2"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M22 22L20 20"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M15.5 8H15.51"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M17.5 5C18.3284 5 19 4.32843 19 3.5C19 2.67157 18.3284 2 17.5 2C16.6716 2 16 2.67157 16 3.5C16 4.32843 16.6716 5 17.5 5Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Argumentaire de pertinence
                          </div>
                          {generateRelevanceArgument(offer)}
                        </div>
                      )}

                      {/* Indicateur discret de clic */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "var(--text-tertiary)",
                          fontStyle: "italic",
                        }}
                      >
                        {isSelected
                          ? "Cliquez pour masquer l'argumentaire"
                          : "Cliquez pour afficher l'argumentaire"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Afficher ensuite les autres offres dans un format plus compact */}
            {offers.filter((offer) => !isHighPotentialOffer(offer)).length >
              0 && (
              <>
                <h5
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    marginTop: "16px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Autres offres associées
                </h5>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  {offers
                    .filter((offer) => !isHighPotentialOffer(offer))
                    .map((offer, index) => {
                      const offerIndex = offers.indexOf(offer);
                      const isSelected = selectedOfferIndex === offerIndex;

                      return (
                        <div
                          key={index}
                          onClick={(e) => handleOfferClick(offerIndex, e)}
                          style={{
                            padding: "10px",
                            backgroundColor: "white",
                            borderRadius: "8px",
                            fontSize: "13px",
                            cursor: "pointer",
                            border: isSelected
                              ? "1px solid rgba(59, 130, 246, 0.3)"
                              : "1px solid transparent",
                            boxShadow: isSelected
                              ? "0 2px 12px rgba(59, 130, 246, 0.1)"
                              : "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <span style={{ fontWeight: "500" }}>
                              {offer.category}
                            </span>
                            <div
                              className={`premium-relevance-badge relevance-${offer.relevanceScore}`}
                              style={{ transform: "scale(0.8)" }}
                            >
                              {offer.relevanceScore}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {offer.detail}
                          </div>

                          {/* Marqueur discret indiquant qu'on peut cliquer */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              marginTop: "6px",
                              fontSize: "11px",
                              color: "var(--text-tertiary)",
                              fontStyle: "italic",
                            }}
                          >
                            {isSelected ? "Masquer" : "Argumentaire"}
                          </div>

                          {/* Argumentaire de pertinence - visible uniquement lorsque sélectionné */}
                          {isSelected && (
                            <div
                              style={{
                                marginTop: "8px",
                                padding: "8px",
                                backgroundColor: "rgba(59, 130, 246, 0.05)",
                                borderRadius: "6px",
                                border: "1px dashed rgba(59, 130, 246, 0.2)",
                                fontSize: "12px",
                                animation: "fadeIn 0.3s ease",
                              }}
                            >
                              {generateRelevanceArgument(offer)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Style pour l'animation d'apparition */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NewsCard;
