import React, { useState, useEffect } from "react";
import { prospectionService } from "../services/prospectionService";
import OpportunityModal from "./OpportunityModal";

/**
 * Composant pour afficher une carte d'actualité avec possibilité de voir les détails des opportunités
 * Modifié pour utiliser une fenêtre modale au lieu d'un dépliant
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.news - L'actualité à afficher
 * @param {Array} props.contacts - Liste des contacts disponibles
 * @returns {JSX.Element} Carte d'actualité
 */
const NewsCard = ({ news, contacts = [] }) => {
  const {
    news: title,
    newsDate,
    newsCategory,
    newsDescription,
    newsLink,
    offers,
  } = news;

  // État pour le modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  
  // État pour les offres sélectionnées comme opportunités de prospection
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);

  // Récupérer les opportunités sélectionnées et vérifier si nos offres sont dedans
  useEffect(() => {
    const checkSelectedOpportunities = () => {
      if (!offers) return;
      
      const currentlySelected = prospectionService.getSelectedOpportunities();
      
      const selectedOffers = offers.filter(offer => 
        currentlySelected.some(
          opp => opp.category === offer.category && opp.detail === offer.detail
        )
      );
      
      setSelectedOpportunities(selectedOffers.map(offer => ({
        category: offer.category,
        detail: offer.detail
      })));
    };
    
    // Vérifier les opportunités déjà sélectionnées
    checkSelectedOpportunities();
    
    // S'abonner aux changements futurs
    const unsubscribe = prospectionService.subscribe(() => {
      checkSelectedOpportunities();
    });
    
    return () => unsubscribe();
  }, [offers]);

  // Fonction pour déterminer si une offre a un fort potentiel commercial
  const isHighPotentialOffer = (offer) => {
    return offer.relevanceScore === 3 && !offer.hasOpportunities;
  };

  // Trouver les offres à fort potentiel commercial
  const highPotentialOffers = offers ? offers.filter(isHighPotentialOffer) : [];
  const hasHighPotential = highPotentialOffers.length > 0;
  
  // Vérifier si une offre est sélectionnée comme opportunité
  const isOpportunitySelected = (offer) => {
    return selectedOpportunities.some(
      opp => opp.category === offer.category && opp.detail === offer.detail
    );
  };

  // Ouvrir le modal pour une offre spécifique
  const openOfferDetails = (offer) => {
    const opportunityData = {
      ...offer,
      news: title,
      newsDate: newsDate,
      newsDescription: newsDescription,
      newsLink: newsLink
    };
    
    setSelectedOffer(opportunityData);
    setIsModalOpen(true);
  };

  // Extraire et limiter les mots-clés à 3 maximum
  const getKeywords = (categoryString) => {
    if (!categoryString) return [];
    // Diviser la chaîne par virgules, nettoyer les espaces et limiter à 3
    return categoryString
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .slice(0, 3);
  };

  return (
    <>
      <div
        className={`premium-news-card ${hasHighPotential ? "high-potential" : ""}`}
        style={{
          cursor: "pointer",
          borderLeft: hasHighPotential ? "4px solid #ec4899" : "none",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="premium-news-card-content">
          {/* En-tête de la carte - Date et indicateur de potentiel */}
          <div
            className="premium-news-meta"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="premium-news-date">{newsDate}</span>

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
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" 
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

          {/* Affichage des mots-clés simplifiés - limités à 3 */}
          {newsCategory && (
            <div style={{ marginTop: "12px" }}>
              <div className="premium-keywords-container">
                {getKeywords(newsCategory).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="premium-keyword-badge"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.05)",
                      color: "var(--text-secondary)",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description courte (aperçu) */}
          {newsDescription && (
            <p
              className="premium-news-description"
              style={{
                marginTop: "12px",
                display: "-webkit-box",
                WebkitLineClamp: "2",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {newsDescription}
            </p>
          )}

          {/* Section des offres associées */}
          {offers && offers.length > 0 && (
            <div className="news-offers-section" style={{ marginTop: "16px" }}>
              <h4 style={{
                fontSize: "14px",
                margin: "0 0 8px 0",
                fontWeight: "500",
                color: "var(--text-secondary)",
              }}>
                Offres associées:
              </h4>
              
              <div className="offers-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: "8px",
              }}>
                {offers.map((offer, index) => (
                  <button
                    key={index}
                    className={`offer-pill ${isOpportunitySelected(offer) ? 'selected' : ''} ${
                      isHighPotentialOffer(offer) ? 'high-potential' : ''
                    }`}
                    onClick={() => openOfferDetails(offer)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      border: "none",
                      backgroundColor: isOpportunitySelected(offer) 
                        ? "rgba(236, 72, 153, 0.2)"
                        : isHighPotentialOffer(offer)
                        ? "rgba(236, 72, 153, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                      color: isOpportunitySelected(offer) || isHighPotentialOffer(offer)
                        ? "#ec4899"
                        : "var(--text-secondary)",
                      transition: "all 0.2s ease",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {isOpportunitySelected(offer) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17L4 12"></path>
                      </svg>
                    )}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {offer.detail.length > 20 ? offer.detail.substring(0, 18) + "..." : offer.detail}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Indicateur "Voir plus" */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "16px",
              color: "var(--text-tertiary)",
            }}
          >
            <button
              onClick={() => openOfferDetails(offers[0])}
              style={{
                background: "none",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--text-tertiary)",
                fontSize: "13px",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "6px",
                transition: "all 0.2s ease",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
                <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" />
              </svg>
              Voir détails
            </button>
          </div>
        </div>
      </div>

      {/* Modal pour les détails d'opportunité */}
      <OpportunityModal
        opportunity={selectedOffer}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOffer(null);
        }}
        contacts={contacts}
      />

      {/* Styles locaux */}
      <style jsx>{`
        .news-offers-section {
          transition: all 0.3s ease;
        }
        
        .offer-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .offer-pill.high-potential {
          background-color: rgba(236, 72, 153, 0.1);
        }
        
        .offer-pill.selected {
          background-color: rgba(236, 72, 153, 0.2);
          box-shadow: 0 2px 5px rgba(236, 72, 153, 0.2);
        }
      `}</style>
    </>
  );
};

export default NewsCard;
