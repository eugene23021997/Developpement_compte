import React, { useState, useEffect } from "react";
import { contactExtractionService } from "../services/contactExtractionService";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Composant pour afficher les contacts extraits des actualités
 * @param {Object} props - Les propriétés du composant
 * @param {Array} props.combinedRelevanceMatrix - Matrice de pertinence combinée
 * @param {Object} props.data - Les données de l'application
 * @param {boolean} props.isLoadingRss - Indicateur de chargement des RSS
 * @returns {JSX.Element} Contenu de l'onglet Contacts
 */
const ContactTabContent = ({ combinedRelevanceMatrix, data, isLoadingRss }) => {
  // État pour les contacts et le filtrage
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [availableRoles, setAvailableRoles] = useState([]);

  // Extraction des contacts à partir des actualités au chargement
  useEffect(() => {
    const extractContacts = async () => {
      setLoading(true);
      try {
        // Convertir les actualités de la matrice en format adapté pour l'extraction
        const allNews = [];
        const processedNews = new Set();

        combinedRelevanceMatrix.forEach(item => {
          // Éviter les doublons
          if (!processedNews.has(item.news)) {
            processedNews.add(item.news);
            
            allNews.push({
              title: item.news,
              description: item.newsDescription || "",
              date: item.newsDate,
              link: item.newsLink || "",
              category: item.newsCategory
            });
          }
        });

        // Utiliser le service d'extraction de contacts
        const extractedContacts = contactExtractionService.extractContactsFromNews(allNews, "Schneider Electric");
        setContacts(extractedContacts);

        // Extraire les rôles disponibles pour le filtre
        const roles = new Set();
        extractedContacts.forEach(contact => {
          if (contact.role && contact.role !== "Poste non spécifié") {
            // Extraire le type principal de rôle (ex: Directeur, CEO, etc.)
            const mainRole = contact.role.split(" ")[0];
            if (mainRole) {
              roles.add(mainRole);
            }
          }
        });
        setAvailableRoles(Array.from(roles).sort());
      } catch (error) {
        console.error("Erreur lors de l'extraction des contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    extractContacts();
  }, [combinedRelevanceMatrix]);

  // Filtrer les contacts selon les critères
  const filteredContacts = contacts.filter(contact => {
    // Filtre par recherche (nom ou rôle)
    const matchesSearch = searchTerm === "" || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par rôle
    const matchesRole = filterRole === "all" || 
      (contact.role && contact.role.toLowerCase().startsWith(filterRole.toLowerCase()));
    
    return matchesSearch && matchesRole;
  });

  // Associer les offres pertinentes à chaque contact
  const contactsWithOffers = filteredContacts.map(contact => {
    const relatedOffers = new Set();
    
    // Parcourir les sources du contact (actualités où il est mentionné)
    contact.sources.forEach(source => {
      // Trouver les offres associées à cette actualité
      combinedRelevanceMatrix.forEach(item => {
        if (item.news === source.title) {
          relatedOffers.add(item.offerDetail);
        }
      });
    });
    
    return {
      ...contact,
      relatedOffers: Array.from(relatedOffers)
    };
  });

  // Trier par nom
  const sortedContacts = [...contactsWithOffers].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="premium-contacts-tab">
      {(loading || isLoadingRss) && (
        <div className="premium-loading-overlay">
          <LoadingSpinner size="large" color="primary" />
          <p>Extraction des contacts à partir des actualités...</p>
        </div>
      )}

      <h2 className="premium-section-title">
        Contacts identifiés chez Schneider Electric
        {contacts.length > 0 && ` (${contacts.length})`}
      </h2>

      {/* Filtres */}
      <div className="premium-contacts-filters" style={{
        display: "flex",
        gap: "16px",
        marginBottom: "24px",
        flexWrap: "wrap"
      }}>
        <div style={{ flex: "1", minWidth: "200px" }}>
          <label htmlFor="contactSearch" style={{ 
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Rechercher un contact
          </label>
          <input
            id="contactSearch"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom ou fonction..."
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: "var(--border-radius)",
              border: "1px solid var(--divider)",
              backgroundColor: "var(--glass-bg)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)"
            }}
          />
        </div>

        <div style={{ flex: "1", minWidth: "200px" }}>
          <label htmlFor="roleFilter" style={{ 
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Filtrer par fonction
          </label>
          <select
            id="roleFilter"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: "var(--border-radius)",
              border: "1px solid var(--divider)",
              backgroundColor: "var(--glass-bg)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%234b5563' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center"
            }}
          >
            <option value="all">Toutes les fonctions</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des contacts */}
      {sortedContacts.length > 0 ? (
        <div className="premium-contacts-list" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
          gap: "20px"
        }}>
          {sortedContacts.map((contact, index) => (
            <div 
              key={index}
              className="premium-contact-card"
              style={{
                backgroundColor: "var(--glass-bg)",
                backdropFilter: "blur(15px)",
                WebkitBackdropFilter: "blur(15px)",
                borderRadius: "var(--border-radius)",
                padding: "20px",
                boxShadow: "var(--glass-shadow-md)",
                border: "1px solid var(--glass-border)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* En-tête du contact */}
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "4px" }}>
                  {contact.name}
                </h3>
                <div style={{ 
                  fontSize: "14px", 
                  fontWeight: "500", 
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {contact.role || "Fonction non spécifiée"}
                </div>
              </div>

              {/* Offres pertinentes */}
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ 
                  fontSize: "14px", 
                  fontWeight: "500", 
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "var(--text-secondary)"
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Offres associées
                </h4>
                <div style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap"
                }}>
                  {contact.relatedOffers.length > 0 ? (
                    contact.relatedOffers.map((offer, idx) => (
                      <span 
                        key={idx}
                        style={{
                          fontSize: "12px",
                          fontWeight: "500",
                          padding: "4px 10px",
                          backgroundColor: "rgba(0, 113, 243, 0.1)",
                          color: "var(--primary)",
                          borderRadius: "100px"
                        }}
                      >
                        {offer}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "14px", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                      Aucune offre spécifique identifiée
                    </span>
                  )}
                </div>
              </div>

              {/* Sources (actualités où le contact est mentionné) */}
              <div>
                <h4 style={{ 
                  fontSize: "14px", 
                  fontWeight: "500", 
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "var(--text-secondary)"
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 7h10M7 12h10M7 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Mentionné dans
                </h4>
                <ul style={{ 
                  margin: 0, 
                  padding: 0,
                  listStyle: "none"
                }}>
                  {contact.sources.map((source, idx) => (
                    <li 
                      key={idx}
                      style={{
                        fontSize: "13px",
                        marginBottom: "6px",
                        paddingBottom: "6px",
                        borderBottom: idx < contact.sources.length - 1 ? "1px solid var(--divider)" : "none"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <div>
                          {source.link ? (
                            <a 
                              href={source.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                color: "var(--primary)",
                                textDecoration: "none",
                                fontWeight: "500"
                              }}
                            >
                              {source.title.length > 50 ? `${source.title.substring(0, 50)}...` : source.title}
                            </a>
                          ) : (
                            <span style={{ fontWeight: "500" }}>
                              {source.title.length > 50 ? `${source.title.substring(0, 50)}...` : source.title}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                          {source.date}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 21v-2a4 4 0 0 0-3-3.87"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 3.13a4 4 0 0 1 0 7.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="empty-state-text">
            {loading ? (
              "Extraction des contacts en cours..."
            ) : (
              <>
                {contacts.length === 0 ? (
                  "Aucun contact n'a été identifié dans les actualités."
                ) : (
                  "Aucun contact ne correspond à vos critères de recherche."
                )}
                <br />
                <small>
                  Essayez de modifier vos filtres ou de rafraîchir les actualités.
                </small>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactTabContent;