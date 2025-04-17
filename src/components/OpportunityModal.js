import React, { useEffect, useState } from "react";
import { prospectionService } from "../services/prospectionService";

/**
 * Composant modal pour afficher les détails d'une opportunité de prospection
 * et permettre sa sélection individuelle
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.opportunity - L'opportunité à afficher
 * @param {boolean} props.isOpen - Si la modal est ouverte ou non
 * @param {Function} props.onClose - Fonction appelée à la fermeture
 * @param {Array} props.contacts - Liste des contacts disponibles pour l'opportunité
 * @returns {JSX.Element|null} Composant modal ou null si fermé
 */
const OpportunityModal = ({ opportunity, isOpen, onClose, contacts = [] }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [matchingContacts, setMatchingContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'opportunité est déjà sélectionnée
  useEffect(() => {
    if (opportunity) {
      const selected = prospectionService.isOpportunitySelected(opportunity);
      setIsSelected(selected);
      
      // Identifier les contacts pertinents
      findMatchingContacts();
    }
  }, [opportunity]);

  // Fonction pour trouver les contacts pertinents pour cette opportunité
  const findMatchingContacts = () => {
    if (!opportunity || !contacts.length) {
      setMatchingContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Extraire les mots clés de l'offre et de l'actualité
    const offerKeywords = opportunity.detail.toLowerCase().split(/[\s,&]+/);
    const newsKeywords = `${opportunity.news} ${opportunity.newsDescription || ""}`.toLowerCase().split(/[\s,&]+/);
    
    // Filtrer les mots-clés significatifs (plus de 3 caractères)
    const significantOfferKeywords = offerKeywords.filter(k => k.length > 3);
    const significantNewsKeywords = newsKeywords.filter(k => k.length > 3);
    
    // Trouver les contacts dont le rôle correspond aux mots-clés
    const relevantContacts = contacts.filter(contact => {
      if (!contact.role) return false;
      
      const roleText = contact.role.toLowerCase();
      
      // Vérifier la correspondance avec l'offre
      const matchesOffer = significantOfferKeywords.some(keyword => 
        roleText.includes(keyword)
      );
      
      // Vérifier la correspondance avec l'actualité
      const matchesNews = significantNewsKeywords.some(keyword => 
        roleText.includes(keyword)
      );
      
      // Vérifier les rôles de direction pour les opportunités de haut niveau
      const isHighLevelRole = roleText.includes("directeur") || 
                             roleText.includes("director") || 
                             roleText.includes("chief") || 
                             roleText.includes("head") ||
                             roleText.includes("président") ||
                             roleText.includes("ceo") ||
                             roleText.includes("cfo") ||
                             roleText.includes("cio") ||
                             roleText.includes("cto");
      
      return matchesOffer || matchesNews || isHighLevelRole;
    });
    
    // Trier par pertinence (estimation simple basée sur la quantité de correspondances)
    const scoredContacts = relevantContacts.map(contact => {
      const roleText = contact.role.toLowerCase();
      let score = 0;
      
      // Augmenter le score pour chaque mot-clé d'offre correspondant
      significantOfferKeywords.forEach(keyword => {
        if (roleText.includes(keyword)) score += 2;
      });
      
      // Augmenter le score pour chaque mot-clé d'actualité correspondant
      significantNewsKeywords.forEach(keyword => {
        if (roleText.includes(keyword)) score += 1;
      });
      
      // Bonus pour les rôles de direction
      if (roleText.includes("directeur") || roleText.includes("director")) score += 3;
      if (roleText.includes("chief") || roleText.includes("head")) score += 3;
      if (roleText.includes("président") || roleText.includes("ceo")) score += 5;
      
      return {
        ...contact,
        relevanceScore: score
      };
    });
    
    // Trier par score de pertinence décroissant
    scoredContacts.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Prendre les 10 contacts les plus pertinents au maximum
    setMatchingContacts(scoredContacts.slice(0, 10));
    setLoading(false);
  };

  // Gérer la sélection/désélection d'une opportunité
  const handleToggleSelection = () => {
    if (isSelected) {
      prospectionService.deselectOpportunity(opportunity);
    } else {
      prospectionService.selectOpportunity(opportunity);
    }
    setIsSelected(!isSelected);
  };

  // Si la modal n'est pas ouverte ou qu'il n'y a pas d'opportunité, ne rien afficher
  if (!isOpen || !opportunity) return null;

  return (
    <div className="opportunity-modal-overlay" onClick={onClose}>
      <div className="opportunity-modal" onClick={e => e.stopPropagation()}>
        {/* En-tête de la modal */}
        <div className="opportunity-modal-header">
          <h2>Détails de l'opportunité</h2>
          <button className="opportunity-modal-close" onClick={onClose} aria-label="Fermer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Corps de la modal */}
        <div className="opportunity-modal-body">
          {/* Section d'information sur l'opportunité */}
          <section className="opportunity-info-section">
            <div className="opportunity-header">
              <div className="opportunity-category-badge">{opportunity.category}</div>
              <div className={`relevance-badge relevance-${opportunity.relevanceScore}`}>
                {opportunity.relevanceScore}
              </div>
            </div>
            
            <h3 className="opportunity-detail">{opportunity.detail}</h3>
            
            <div className="opportunity-news">
              <h4>Actualité associée:</h4>
              <div className="news-content">
                <h5>{opportunity.news}</h5>
                <p className="news-description">{opportunity.newsDescription}</p>
                {opportunity.newsLink && (
                  <a 
                    href={opportunity.newsLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="news-link"
                  >
                    Lire l'article complet
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                      <path d="M15 3h6v6"></path>
                      <path d="M10 14L21 3"></path>
                    </svg>
                  </a>
                )}
                <p className="news-date">Date: {opportunity.newsDate}</p>
              </div>
            </div>
            
            <div className="opportunity-actions">
              <button 
                className={`opportunity-toggle-button ${isSelected ? 'selected' : ''}`}
                onClick={handleToggleSelection}
              >
                {isSelected ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17L4 12"></path>
                    </svg>
                    Opportunité sélectionnée
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 12L12 17L7 12M12 17V3"></path>
                    </svg>
                    Ajouter aux opportunités de prospection
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Section des contacts recommandés */}
          <section className="contacts-recommendation-section">
            <h4>Contacts recommandés pour cette opportunité</h4>
            
            {loading ? (
              <div className="contacts-loading">
                <div className="spinner"></div>
                <p>Recherche des contacts pertinents...</p>
              </div>
            ) : matchingContacts.length > 0 ? (
              <div className="matching-contacts-list">
                {matchingContacts.map((contact, index) => (
                  <div key={index} className="contact-card">
                    <div className="contact-avatar">
                      {(contact.fullName || contact.name || "").charAt(0).toUpperCase()}
                    </div>
                    <div className="contact-info">
                      <div className="contact-name">
                        {contact.fullName || contact.name}
                      </div>
                      <div className="contact-role">{contact.role}</div>
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="contact-email">
                          {contact.email}
                        </a>
                      )}
                    </div>
                    <div className="contact-score">
                      <div className={`contact-relevance-badge ${
                        contact.relevanceScore > 7 ? 'high' : 
                        contact.relevanceScore > 4 ? 'medium' : 'low'
                      }`}>
                        {Math.min(99, contact.relevanceScore * 10)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-contacts-message">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>Aucun contact pertinent n'a été trouvé pour cette opportunité.</p>
                <p className="suggestion">Essayez d'importer plus de contacts ou de raffiner les données d'opportunité.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Styles CSS pour la modal */}
      <style jsx>{`
        .opportunity-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(5px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }
        
        .opportunity-modal {
          background-color: white;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease-out;
        }
        
        .opportunity-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }
        
        .opportunity-modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .opportunity-modal-close {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        
        .opportunity-modal-close:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: #111827;
        }
        
        .opportunity-modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        
        .opportunity-info-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .opportunity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .opportunity-category-badge {
          padding: 6px 12px;
          background-color: rgba(0, 113, 243, 0.1);
          color: #0071f3;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .relevance-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-weight: 600;
          font-size: 14px;
          color: white;
        }
        
        .relevance-1 {
          background: linear-gradient(135deg, #9ca3af, #6b7280);
        }
        
        .relevance-2 {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        
        .relevance-3 {
          background: linear-gradient(135deg, #059669, #047857);
        }
        
        .opportunity-detail {
          font-size: 22px;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }
        
        .opportunity-news {
          background-color: rgba(0, 0, 0, 0.02);
          border-radius: 12px;
          padding: 16px;
        }
        
        .opportunity-news h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 500;
          color: #4b5563;
        }
        
        .news-content {
          padding-left: 12px;
          border-left: 3px solid rgba(0, 113, 243, 0.3);
        }
        
        .news-content h5 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .news-description {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #4b5563;
          line-height: 1.5;
        }
        
        .news-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: #0071f3;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .news-link:hover {
          color: #2086f5;
          text-decoration: underline;
        }
        
        .news-date {
          margin: 12px 0 0 0;
          font-size: 12px;
          color: #6b7280;
        }
        
        .opportunity-actions {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }
        
        .opportunity-toggle-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 15px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .opportunity-toggle-button:not(.selected) {
          background-color: rgba(236, 72, 153, 0.1);
          color: #ec4899;
        }
        
        .opportunity-toggle-button:not(.selected):hover {
          background-color: rgba(236, 72, 153, 0.2);
          transform: translateY(-1px);
        }
        
        .opportunity-toggle-button.selected {
          background-color: rgba(236, 72, 153, 0.8);
          color: white;
        }
        
        .opportunity-toggle-button.selected:hover {
          background-color: rgba(236, 72, 153, 0.9);
        }
        
        .contacts-recommendation-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .contacts-recommendation-section h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #4b5563;
        }
        
        .contacts-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 0;
          color: #6b7280;
        }
        
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 113, 243, 0.1);
          border-radius: 50%;
          border-top-color: #0071f3;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }
        
        .matching-contacts-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .contact-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background-color: rgba(0, 0, 0, 0.01);
          transition: background-color 0.2s ease;
        }
        
        .contact-card:hover {
          background-color: rgba(0, 0, 0, 0.03);
        }
        
        .contact-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0071f3, #6d28d9);
          color: white;
          font-size: 16px;
          font-weight: 600;
        }
        
        .contact-info {
          flex: 1;
        }
        
        .contact-name {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .contact-role {
          font-size: 13px;
          color: #6b7280;
        }
        
        .contact-email {
          display: block;
          font-size: 12px;
          color: #0071f3;
          text-decoration: none;
          margin-top: 4px;
        }
        
        .contact-email:hover {
          text-decoration: underline;
        }
        
        .contact-score {
          display: flex;
          align-items: center;
        }
        
        .contact-relevance-badge {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .contact-relevance-badge.high {
          background-color: rgba(5, 150, 105, 0.1);
          color: #059669;
        }
        
        .contact-relevance-badge.medium {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .contact-relevance-badge.low {
          background-color: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }
        
        .no-contacts-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 0;
          color: #6b7280;
          text-align: center;
        }
        
        .no-contacts-message svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .no-contacts-message p {
          margin: 0 0 8px 0;
        }
        
        .suggestion {
          font-size: 14px;
          opacity: 0.7;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
          .opportunity-modal {
            width: 100%;
            max-width: none;
            border-radius: 0;
            max-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
};

export default OpportunityModal;
