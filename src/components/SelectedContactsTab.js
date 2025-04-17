import React, { useState, useEffect, useMemo } from "react";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Composant pour afficher les contacts sélectionnés en fonction des opportunités 
 * de prospection identifiées dans les actualités
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.contacts - Liste de tous les contacts disponibles
 * @param {Array} props.selectedOpportunities - Opportunités de prospection sélectionnées
 * @param {boolean} props.isLoading - État de chargement
 * @returns {JSX.Element} L'onglet des contacts sélectionnés
 */
const SelectedContactsTab = ({ contacts = [], selectedOpportunities = [], isLoading = false }) => {
  // État pour les filtres et l'interface
  const [filterRole, setFilterRole] = useState("all");
  const [filterRelevance, setFilterRelevance] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  
  // Liste des rôles standardisés
  const standardRoles = [
    "CEO / PDG", 
    "CFO / Directeur Financier", 
    "CIO / DSI", 
    "CTO / Directeur Technique",
    "CDO / Directeur Digital",
    "COO / Directeur des Opérations",
    "CMO / Directeur Marketing",
    "CHRO / DRH",
    "Directeur Stratégie",
    "Directeur Commercial",
    "VP / Vice-Président"
  ];
  
  // Normaliser les contacts avec leurs rôles standardisés
  const normalizeContacts = (contactsList) => {
    return contactsList.map(contact => {
      const roleLower = (contact.role || "").toLowerCase();
      let normalizedRole = "Autre";
      
      if (roleLower.includes("pdg") || roleLower.includes("ceo") || 
          roleLower.includes("président") || roleLower.includes("directeur général")) {
        normalizedRole = "CEO / PDG";
      } else if (roleLower.includes("cfo") || roleLower.includes("financier")) {
        normalizedRole = "CFO / Directeur Financier";
      } else if (roleLower.includes("cio") || roleLower.includes("dsi") || 
                roleLower.includes("informatique") || roleLower.includes("information")) {
        normalizedRole = "CIO / DSI";
      } else if (roleLower.includes("cto") || roleLower.includes("technique") || 
                roleLower.includes("technology")) {
        normalizedRole = "CTO / Directeur Technique";
      } else if (roleLower.includes("cdo") || roleLower.includes("digital")) {
        normalizedRole = "CDO / Directeur Digital";
      } else if (roleLower.includes("coo") || roleLower.includes("opération")) {
        normalizedRole = "COO / Directeur des Opérations";
      } else if (roleLower.includes("cmo") || roleLower.includes("marketing")) {
        normalizedRole = "CMO / Directeur Marketing";
      } else if (roleLower.includes("rh") || roleLower.includes("ressources humaines") || 
                roleLower.includes("chro")) {
        normalizedRole = "CHRO / DRH";
      } else if (roleLower.includes("stratégie") || roleLower.includes("strategy")) {
        normalizedRole = "Directeur Stratégie";
      } else if (roleLower.includes("commercial") || roleLower.includes("vente") || 
                roleLower.includes("sales")) {
        normalizedRole = "Directeur Commercial";
      } else if (roleLower.includes("vp") || roleLower.includes("vice-président")) {
        normalizedRole = "VP / Vice-Président";
      }
      
      // Générer un ID unique pour chaque contact
      const contactId = `contact-${contact.fullName || contact.name}-${contact.email || Math.random().toString(36).substring(7)}`;
      
      return {
        ...contact,
        id: contactId,
        normalizedRole,
        relevanceScore: contact.relevanceScore || 0.5, // Score par défaut si absent
      };
    });
  };
  
  // Calculer la pertinence d'un contact pour une opportunité spécifique
  const calculateRelevance = (contact, opportunity) => {
    // Une opportunité est définie par {category, detail, relevanceScore}
    const roleLower = (contact.role || "").toLowerCase();
    const detailLower = (opportunity.detail || "").toLowerCase();
    
    // Score de base basé sur le score de l'opportunité (1-3)
    let score = opportunity.relevanceScore / 3; // Normalisation entre 0.33 et 1
    
    // Correspondance de rôle avec l'opportunité
    const roleRelevance = standardRoles.findIndex(role => {
      const roleParts = role.toLowerCase().split(" / ");
      return roleParts.some(part => detailLower.includes(part));
    });
    
    if (roleRelevance >= 0) {
      score += 0.3; // Bonus si le rôle est pertinent pour l'opportunité
    }
    
    // Correspondance entre le rôle du contact et l'opportunité
    if (detailLower.includes(roleLower) || roleLower.includes(detailLower)) {
      score += 0.2;
    }
    
    // Bonus pour les postes de direction
    if (["CEO / PDG", "CIO / DSI", "CTO / Directeur Technique", "CDO / Directeur Digital"].includes(contact.normalizedRole)) {
      score += 0.1;
    }
    
    // Plafonner le score à 1
    return Math.min(score, 1);
  };
  
  // Associer les contacts aux opportunités
  const contactsByOpportunity = useMemo(() => {
    if (!contacts.length || !selectedOpportunities.length) return [];
    
    const normalizedContacts = normalizeContacts(contacts);
    
    // Pour chaque opportunité, trouver les contacts pertinents
    return selectedOpportunities.map(opportunity => {
      // Calculer un score de pertinence pour chaque contact par rapport à cette opportunité
      const relevantContacts = normalizedContacts.map(contact => {
        const opportunityRelevance = calculateRelevance(contact, opportunity);
        return {
          ...contact,
          opportunityRelevance
        };
      })
      // Filtrer seulement les contacts suffisamment pertinents (score > 0.4)
      .filter(contact => contact.opportunityRelevance > 0.4)
      // Trier par pertinence décroissante
      .sort((a, b) => b.opportunityRelevance - a.opportunityRelevance);
      
      return {
        opportunity,
        contacts: relevantContacts
      };
    });
  }, [contacts, selectedOpportunities]);
  
  // Compter le nombre total de contacts uniques
  const uniqueContactsCount = useMemo(() => {
    const uniqueIds = new Set();
    contactsByOpportunity.forEach(group => {
      group.contacts.forEach(contact => {
        uniqueIds.add(contact.id);
      });
    });
    return uniqueIds.size;
  }, [contactsByOpportunity]);
  
  // Filtrer les groupes d'opportunités selon les critères actuels
  const filteredGroups = useMemo(() => {
    return contactsByOpportunity.filter(group => {
      // Filtrer les contacts dans chaque groupe
      const filteredContacts = group.contacts.filter(contact => {
        // Filtre par rôle
        const matchesRole = filterRole === "all" || contact.normalizedRole === filterRole;
        
        // Filtre par niveau de pertinence
        const matchesRelevance = filterRelevance === "all" || 
                               (filterRelevance === "high" && contact.opportunityRelevance >= 0.7) ||
                               (filterRelevance === "medium" && contact.opportunityRelevance >= 0.5 && contact.opportunityRelevance < 0.7) ||
                               (filterRelevance === "low" && contact.opportunityRelevance < 0.5);
        
        // Filtre par terme de recherche
        const matchesSearch = !searchTerm || 
                            (contact.fullName && contact.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (contact.role && contact.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesRole && matchesRelevance && matchesSearch;
      });
      
      // Ne conserver que les groupes ayant au moins un contact après filtrage
      return filteredContacts.length > 0;
    }).map(group => ({
      ...group,
      // Mettre à jour la liste des contacts filtrés
      contacts: group.contacts.filter(contact => {
        const matchesRole = filterRole === "all" || contact.normalizedRole === filterRole;
        const matchesRelevance = filterRelevance === "all" || 
                               (filterRelevance === "high" && contact.opportunityRelevance >= 0.7) ||
                               (filterRelevance === "medium" && contact.opportunityRelevance >= 0.5 && contact.opportunityRelevance < 0.7) ||
                               (filterRelevance === "low" && contact.opportunityRelevance < 0.5);
        const matchesSearch = !searchTerm || 
                            (contact.fullName && contact.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (contact.role && contact.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesRole && matchesRelevance && matchesSearch;
      })
    }));
  }, [contactsByOpportunity, filterRole, filterRelevance, searchTerm]);
  
  // Gérer la sélection d'un contact (basculement)
  const toggleContactSelection = (contactId) => {
    setSelectedContactIds(prevSelected => 
      prevSelected.includes(contactId)
        ? prevSelected.filter(id => id !== contactId)
        : [...prevSelected, contactId]
    );
  };
  
  // Sélectionner/désélectionner tous les contacts d'un groupe d'opportunité
  const toggleGroupSelection = (opportunityId) => {
    const group = filteredGroups.find(g => 
      g.opportunity.category + g.opportunity.detail === opportunityId
    );
    
    if (!group) return;
    
    const groupContactIds = group.contacts.map(c => c.id);
    const allSelected = groupContactIds.every(id => selectedContactIds.includes(id));
    
    if (allSelected) {
      // Désélectionner tous les contacts du groupe
      setSelectedContactIds(prev => prev.filter(id => !groupContactIds.includes(id)));
    } else {
      // Sélectionner tous les contacts du groupe
      setSelectedContactIds(prev => {
        const newSelection = [...prev];
        groupContactIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };
  
  // Générer un lien LinkedIn pour le contact
  const generateLinkedInSearchUrl = (name) => {
    if (!name) return '#';
    const encodedName = encodeURIComponent(name);
    return `https://www.linkedin.com/search/results/people/?keywords=${encodedName}&company=Schneider%20Electric`;
  };
  
  // Obtenir une couleur de badge basée sur le score de pertinence
  const getRelevanceBadgeClass = (score) => {
    if (score >= 0.7) return "high-relevance";
    if (score >= 0.5) return "medium-relevance";
    return "low-relevance";
  };
  
  // Exportation des contacts sélectionnés en CSV
  const exportSelectedContacts = () => {
    if (selectedContactIds.length === 0) {
      alert("Veuillez sélectionner au moins un contact à exporter");
      return;
    }
    
    // Collecter tous les contacts sélectionnés
    const selectedContacts = [];
    contactsByOpportunity.forEach(group => {
      group.contacts.forEach(contact => {
        if (selectedContactIds.includes(contact.id) && !selectedContacts.some(c => c.id === contact.id)) {
          // Ajouter le contact avec les opportunités associées
          const contactWithOpportunity = {
            ...contact,
            opportunityCategory: group.opportunity.category,
            opportunityDetail: group.opportunity.detail
          };
          selectedContacts.push(contactWithOpportunity);
        }
      });
    });
    
    // Créer l'en-tête CSV
    const headers = ["Nom", "Rôle", "Email", "Téléphone", "Pertinence", "Opportunité", "Catégorie"];
    
    // Créer les lignes
    const rows = selectedContacts.map(contact => [
      contact.fullName || contact.name || "",
      contact.role || "",
      contact.email || "",
      contact.phone || "",
      Math.round(contact.opportunityRelevance * 100) + "%",
      contact.opportunityDetail || "",
      contact.opportunityCategory || ""
    ]);
    
    // Assembler le contenu CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    // Télécharger le fichier CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts_prospection_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Déterminer quels groupes sont vides après filtrage
  const hasFilteredContacts = filteredGroups.length > 0;
  
  // Extraire les rôles uniques présents dans les contacts
  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    contactsByOpportunity.forEach(group => {
      group.contacts.forEach(contact => {
        roles.add(contact.normalizedRole);
      });
    });
    return Array.from(roles);
  }, [contactsByOpportunity]);
  
  return (
    <div className="selected-contacts-tab">
      {isLoading ? (
        <div className="premium-loading-overlay">
          <LoadingSpinner size="large" />
          <p>Analyse des contacts pertinents pour les opportunités sélectionnées...</p>
        </div>
      ) : (
        <>
          {/* En-tête */}
          <div className="selected-contacts-header">
            <div className="header-title">
              <h2>Contacts recommandés pour les opportunités sélectionnées</h2>
              <span className="contacts-count">
                {uniqueContactsCount} contacts identifiés pour {selectedOpportunities.length} opportunités
              </span>
            </div>
            
            <div className="header-actions">
              <button 
                className="export-button"
                onClick={exportSelectedContacts}
                disabled={selectedContactIds.length === 0}
              >
                <svg 
                  width="16" 
                  height="16"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Exporter {selectedContactIds.length} contacts
              </button>
            </div>
          </div>
          
          {/* Filtres */}
          <div className="selected-contacts-filters">
            <div className="filter-group">
              <label htmlFor="role-filter">Filtrer par rôle</label>
              <select 
                id="role-filter"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les rôles</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="relevance-filter">Pertinence</label>
              <select 
                id="relevance-filter"
                value={filterRelevance}
                onChange={(e) => setFilterRelevance(e.target.value)}
                className="filter-select"
              >
                <option value="all">Toutes les pertinences</option>
                <option value="high">Élevée (70%+)</option>
                <option value="medium">Moyenne (50-70%)</option>
                <option value="low">Faible (&lt;50%)</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="contact-search">Rechercher</label>
              <div className="search-input-wrapper">
                <input 
                  id="contact-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, rôle, email..."
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm("")}
                    aria-label="Effacer la recherche"
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Contenu principal: liste des opportunités et contacts associés */}
          {hasFilteredContacts ? (
            <div className="selected-contacts-content">
              {filteredGroups.map((group, groupIndex) => {
                const opportunityId = group.opportunity.category + group.opportunity.detail;
                const isExpanded = expandedGroup === opportunityId;
                const areAllSelected = group.contacts.every(contact => 
                  selectedContactIds.includes(contact.id)
                );
                
                return (
                  <div 
                    key={opportunityId} 
                    className={`opportunity-group ${isExpanded ? 'expanded' : ''}`}
                  >
                    {/* En-tête du groupe d'opportunité */}
                    <div 
                      className="opportunity-header"
                      onClick={() => setExpandedGroup(isExpanded ? null : opportunityId)}
                    >
                      <div className="opportunity-header-main">
                        <div className="expand-icon">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polyline points={isExpanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                          </svg>
                        </div>
                        
                        <div className="opportunity-title">
                          <h3>{group.opportunity.detail}</h3>
                          <span className="opportunity-category">{group.opportunity.category}</span>
                        </div>
                        
                        <div className="relevance-score">
                          <div className={`relevance-badge relevance-${group.opportunity.relevanceScore}`}>
                            {group.opportunity.relevanceScore}
                          </div>
                        </div>
                      </div>
                      
                      <div className="opportunity-header-actions">
                        <div className="contacts-count-badge">
                          {group.contacts.length} contact{group.contacts.length > 1 ? 's' : ''}
                        </div>
                        
                        <div className="select-all-container">
                          <input 
                            type="checkbox"
                            id={`select-all-${opportunityId}`}
                            checked={areAllSelected && group.contacts.length > 0}
                            onChange={() => toggleGroupSelection(opportunityId)}
                            className="select-all-checkbox"
                          />
                          <label 
                            htmlFor={`select-all-${opportunityId}`}
                            className="select-all-label"
                          >
                            {areAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Liste des contacts pour cette opportunité */}
                    {isExpanded && (
                      <div className="contacts-list">
                        {group.contacts.map((contact, contactIndex) => (
                          <div 
                            key={contact.id} 
                            className={`contact-card ${selectedContactIds.includes(contact.id) ? 'selected' : ''}`}
                          >
                            <div className="contact-select">
                              <input 
                                type="checkbox"
                                id={contact.id}
                                checked={selectedContactIds.includes(contact.id)}
                                onChange={() => toggleContactSelection(contact.id)}
                                className="contact-checkbox"
                              />
                              <label htmlFor={contact.id} className="visually-hidden">
                                Sélectionner {contact.fullName || contact.name}
                              </label>
                            </div>
                            
                            <div className="contact-info">
                              <div className="contact-main">
                                <h4 className="contact-name">
                                  <a 
                                    href={generateLinkedInSearchUrl(contact.fullName || contact.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="linkedin-link"
                                    title="Rechercher sur LinkedIn"
                                  >
                                    {contact.fullName || contact.name}
                                    <svg 
                                      width="14" 
                                      height="14" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                      className="linkedin-icon"
                                    >
                                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                      <rect x="2" y="9" width="4" height="12"></rect>
                                      <circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                  </a>
                                </h4>
                                <div className="contact-role">
                                  <span className="normalized-role">{contact.normalizedRole}</span>
                                  {contact.role !== contact.normalizedRole && (
                                    <span className="original-role">{contact.role}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="contact-details">
                                {contact.email && (
                                  <a 
                                    href={`mailto:${contact.email}`}
                                    className="contact-email"
                                    title="Envoyer un email"
                                  >
                                    <svg 
                                      width="14" 
                                      height="14" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    >
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                      <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    {contact.email}
                                  </a>
                                )}
                                
                                {contact.phone && (
                                  <a 
                                    href={`tel:${contact.phone}`}
                                    className="contact-phone"
                                    title="Appeler"
                                  >
                                    <svg 
                                      width="14" 
                                      height="14" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                    >
                                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                    {contact.phone}
                                  </a>
                                )}
                              </div>
                            </div>
                            
                            <div className="contact-relevance">
                              <div className={`relevance-percentage ${getRelevanceBadgeClass(contact.opportunityRelevance)}`}>
                                {Math.round(contact.opportunityRelevance * 100)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              {selectedOpportunities.length === 0 ? (
                <>
                  <div className="empty-icon">
                    <svg 
                      width="64" 
                      height="64" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M5.52 19c.64-2.2 1.84-3 3.22-3h6.52c1.38 0 2.58.8 3.22 3"/>
                      <circle cx="12" cy="10" r="3"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <h3>Aucune opportunité sélectionnée</h3>
                  <p>Sélectionnez des opportunités de prospection dans les onglets "Actualités" ou "Service Lines".</p>
                </>
              ) : searchTerm || filterRole !== "all" || filterRelevance !== "all" ? (
                <>
                  <div className="empty-icon">
                    <svg 
                      width="64" 
                      height="64" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                  </div>
                  <h3>Aucun contact ne correspond à vos critères</h3>
                  <p>Essayez de modifier vos filtres pour voir plus de résultats.</p>
                  <button 
                    className="reset-filters-button"
                    onClick={() => {
                      setFilterRole("all");
                      setFilterRelevance("all");
                      setSearchTerm("");
                    }}
                  >
                    Réinitialiser les filtres
                  </button>
                </>
              ) : (
                <>
                  <div className="empty-icon">
                    <svg 
                      width="64" 
                      height="64" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <h3>Aucun contact pertinent trouvé</h3>
                  <p>Nous n'avons pas trouvé de contacts pertinents pour les opportunités sélectionnées.</p>
                </>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Styles spécifiques à ce composant */}
      <style jsx>{`
        .selected-contacts-tab {
          position: relative;
        }
        
        .selected-contacts-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        
        .header-title h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--text-primary);
        }
        
        .contacts-count {
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .export-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--primary);
          color: white;
          border: none;
          border-radius: var(--border-radius);
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .export-button:hover {
          background-color: var(--primary-hover);
        }
        
        .export-button:disabled {
          background-color: var(--text-tertiary);
          cursor: not-allowed;
        }
        
        .selected-contacts-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
          background-color: var(--glass-bg);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: var(--border-radius);
          padding: 16px;
          border: 1px solid var(--glass-border);
        }
        
        .filter-group {
          flex: 1;
          min-width: 200px;
        }
        
        .filter-group label {
          display: block;
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        
        .filter-select {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border-radius: var(--border-radius);
          border: 1px solid var(--divider);
          background-color: var(--surface);
          color: var(--text-primary);
          font-size: 14px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath fill='%234B5563' d='M.558.975 5 5.975l4.442-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          cursor: pointer;
        }
        
        .search-input-wrapper {
          position: relative;
        }
        
        .search-input {
          width: 100%;
          height: 40px;
          padding: 0 36px 0 12px;
          border-radius: var(--border-radius);
          border: 1px solid var(--divider);
          background-color: var(--surface);
          color: var(--text-primary);
          font-size: 14px;
        }
        
        .clear-search {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .clear-search:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: var(--text-primary);
        }
        
        .selected-contacts-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .opportunity-group {
          background-color: var(--glass-bg);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: var(--border-radius);
          border: 1px solid var(--glass-border);
          overflow: hidden;
          transition: all 0.2s ease;
        }
        
        .opportunity-group.expanded {
          box-shadow: var(--glass-shadow-md);
        }
        
        .opportunity-header {
          padding: 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .opportunity-header:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        .opportunity-header-main {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .expand-icon {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        
        .expanded .expand-icon {
          transform: rotate(180deg);
        }
        
        .opportunity-title {
          flex: 1;
        }
        
        .opportunity-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .opportunity-category {
          display: inline-block;
          margin-top: 4px;
          font-size: 13px;
          color: var(--text-tertiary);
        }
        
        .relevance-score {
          flex-shrink: 0;
        }
        
        .relevance-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-weight: 600;
          font-size: 12px;
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
        
        .opportunity-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .contacts-count-badge {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .select-all-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .select-all-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        .select-all-label {
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .contacts-list {
          border-top: 1px solid var(--divider);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .contact-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background-color: var(--surface);
          border-radius: var(--border-radius);
          transition: all 0.2s ease;
        }
        
        .contact-card:hover {
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }
        
        .contact-card.selected {
          background-color: rgba(0, 113, 243, 0.05);
          border: 1px solid rgba(0, 113, 243, 0.1);
        }
        
        .contact-select {
          flex-shrink: 0;
        }
        
        .contact-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .contact-info {
          flex: 1;
          min-width: 0; /* Pour permettre text-overflow */
        }
        
        .contact-main {
          margin-bottom: 8px;
        }
        
        .contact-name {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .linkedin-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-primary);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .linkedin-link:hover {
          color: var(--primary);
        }
        
        .linkedin-icon {
          opacity: 0.5;
        }
        
        .linkedin-link:hover .linkedin-icon {
          opacity: 1;
        }
        
        .contact-role {
          display: flex;
          flex-direction: column;
        }
        
        .normalized-role {
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .original-role {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        
        .contact-details {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 13px;
        }
        
        .contact-email,
        .contact-phone {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          text-decoration: none;
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s ease;
        }
        
        .contact-email:hover,
        .contact-phone:hover {
          color: var(--primary);
        }
        
        .contact-relevance {
          flex-shrink: 0;
        }
        
        .relevance-percentage {
          padding: 4px 8px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .high-relevance {
          background-color: rgba(5, 150, 105, 0.1);
          color: #059669;
        }
        
        .medium-relevance {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .low-relevance {
          background-color: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }
        
        .empty-state {
          text-align: center;
          padding: 64px 0;
          color: var(--text-secondary);
        }
        
        .empty-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
        }
        
        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--text-primary);
        }
        
        .empty-state p {
          font-size: 15px;
          margin: 0 0 24px 0;
        }
        
        .reset-filters-button {
          padding: 8px 16px;
          background-color: transparent;
          border: 1px solid var(--divider);
          border-radius: var(--border-radius);
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .reset-filters-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: var(--text-primary);
        }
        
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .selected-contacts-header {
            flex-direction: column;
            gap: 16px;
          }
          
          .filter-group {
            min-width: 100%;
          }
          
          .contact-card {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .contact-select {
            align-self: flex-start;
            margin-bottom: 8px;
          }
          
          .contact-relevance {
            align-self: flex-end;
            margin-top: -40px;
          }
        }
      `}</style>
    </div>
  );
};

export default SelectedContactsTab;
