import React, { useState, useEffect } from "react";
import { contactExtractionService } from "../services/contactExtractionService";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Composant pour afficher les contacts extraits des actualités
 * Format épuré pour usage commercial et reporting
 */
const ContactTabContent = ({ combinedRelevanceMatrix, data, isLoadingRss }) => {
  // États
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Extraction des contacts
  useEffect(() => {
    const extractContacts = async () => {
      setLoading(true);
      try {
        // Préparer les actualités pour l'extraction
        const allNews = [];
        const processedNews = new Set();

        combinedRelevanceMatrix.forEach(item => {
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

        // Extraire les contacts
        const extractedContacts = contactExtractionService.extractContactsFromNews(allNews, "Schneider Electric");
        setContacts(extractedContacts);

        // Préparer les filtres de rôle
        const roles = new Set();
        extractedContacts.forEach(contact => {
          if (contact.role && contact.role !== "Poste non spécifié") {
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

  // Filtrer les contacts
  const filteredContacts = contacts.filter(contact => {
    // Filtre par recherche
    const matchesSearch = searchTerm === "" || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par rôle
    const matchesRole = filterRole === "all" || 
      (contact.role && contact.role.toLowerCase().startsWith(filterRole.toLowerCase()));
    
    return matchesSearch && matchesRole;
  });

  // Ajouter les offres pertinentes
  const contactsWithOffers = filteredContacts.map(contact => {
    const relatedOffers = new Set();
    
    contact.sources.forEach(source => {
      combinedRelevanceMatrix.forEach(item => {
        if (item.news === source.title) {
          const offers = item.offerDetail.split(", ");
          offers.forEach(offer => relatedOffers.add(offer));
        }
      });
    });
    
    return {
      ...contact,
      relatedOffers: Array.from(relatedOffers)
    };
  });

  // Trier les contacts par nom
  const sortedContacts = [...contactsWithOffers].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Gestion de la sélection des contacts
  const toggleContact = (contact) => {
    if (selectedContacts.includes(contact.name)) {
      setSelectedContacts(selectedContacts.filter(name => name !== contact.name));
    } else {
      setSelectedContacts([...selectedContacts, contact.name]);
    }
  };

  // Export CSV des contacts sélectionnés
  const exportContacts = () => {
    const contactsToExport = sortedContacts.filter(contact => 
      selectedContacts.includes(contact.name)
    );
    
    if (contactsToExport.length === 0) {
      alert("Veuillez sélectionner des contacts à exporter");
      return;
    }
    
    // Créer le contenu CSV
    const headers = ["Nom", "Fonction", "Entreprise", "Offres associées", "Source"];
    const rows = contactsToExport.map(contact => [
      contact.name,
      contact.role,
      "Schneider Electric",
      contact.relatedOffers.join(" | "),
      contact.sources.map(s => s.title).join(" | ")
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts_schneider_${date}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="premium-contacts-tab">
      {/* Overlay de chargement */}
      {(loading || isLoadingRss) && (
        <div className="premium-loading-overlay">
          <LoadingSpinner size="large" color="primary" />
          <p>Extraction des contacts en cours...</p>
        </div>
      )}

      {/* En-tête avec actions */}
      <div className="contacts-header">
        <h2 className="contacts-title">
          Contacts identifiés chez Schneider Electric
          {contacts.length > 0 && ` (${contacts.length})`}
        </h2>
        <div className="contacts-actions">
          <button 
            className="export-button"
            onClick={exportContacts}
            disabled={selectedContacts.length === 0}
          >
            Exporter {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="contacts-filters">
        <div className="filter-group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un nom ou une fonction..."
            className="search-input"
          />
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="role-select"
          >
            <option value="all">Toutes les fonctions</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        
        {searchTerm && (
          <div className="search-filter">
            <span>Recherche: <strong>{searchTerm}</strong></span>
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Tableau des contacts */}
      {sortedContacts.length > 0 ? (
        <div className="contacts-table-container">
          <table className="contacts-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input 
                    type="checkbox" 
                    checked={selectedContacts.length === sortedContacts.length && sortedContacts.length > 0}
                    onChange={() => {
                      if (selectedContacts.length === sortedContacts.length) {
                        setSelectedContacts([]);
                      } else {
                        setSelectedContacts(sortedContacts.map(c => c.name));
                      }
                    }}
                  />
                </th>
                <th>Nom</th>
                <th>Fonction</th>
                <th>Offres associées</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {sortedContacts.map((contact, index) => (
                <tr key={index} className={selectedContacts.includes(contact.name) ? "selected-row" : ""}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedContacts.includes(contact.name)}
                      onChange={() => toggleContact(contact)}
                    />
                  </td>
                  <td>{contact.name}</td>
                  <td>{contact.role}</td>
                  <td>
                    <div className="offer-tags">
                      {contact.relatedOffers.slice(0, 2).map((offer, idx) => (
                        <span key={idx} className="offer-tag">{offer}</span>
                      ))}
                      {contact.relatedOffers.length > 2 && (
                        <span className="offer-more">+{contact.relatedOffers.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {contact.sources[0]?.link ? (
                      <a 
                        href={contact.sources[0].link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="source-link"
                      >
                        {contact.sources[0].title.length > 30 
                          ? contact.sources[0].title.substring(0, 30) + "..."
                          : contact.sources[0].title
                        }
                      </a>
                    ) : (
                      <span>
                        {contact.sources[0]?.title.length > 30 
                          ? contact.sources[0].title.substring(0, 30) + "..."
                          : contact.sources[0]?.title || "N/A"
                        }
                      </span>
                    )}
                    {contact.sources.length > 1 && (
                      <span className="source-count">+{contact.sources.length - 1}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="empty-message">
            {loading 
              ? "Extraction des contacts en cours..." 
              : contacts.length === 0 
                ? "Aucun contact n'a été identifié dans les actualités."
                : "Aucun contact ne correspond à vos critères de recherche."
            }
          </p>
          {!loading && contacts.length > 0 && (
            <button 
              className="reset-button"
              onClick={() => {
                setSearchTerm("");
                setFilterRole("all");
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactTabContent;