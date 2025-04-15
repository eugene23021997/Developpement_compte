import React, { useState } from "react";

/**
 * Composant pour afficher les contacts extraits des actualités
 * Permet de visualiser, filtrer et exporter les contacts pour la prospection
 */
const ContactsTabContent = ({ contacts, isLoadingRss }) => {
  const [confidenceFilter, setConfidenceFilter] = useState(0.5);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Extraction de tous les rôles uniques pour le filtre
  const uniqueRoles = React.useMemo(() => {
    const roles = new Set();
    contacts.forEach((contact) => {
      // Extraire le type de poste principal (ex: Directeur, CEO, etc.)
      const mainRole = contact.role.split(" ")[0];
      if (mainRole && mainRole !== "Poste") {
        roles.add(mainRole);
      }
    });
    return Array.from(roles).sort();
  }, [contacts]);

  // Filtrage des contacts
  const filteredContacts = React.useMemo(() => {
    return contacts.filter((contact) => {
      // Filtre par score de confiance
      if (contact.confidenceScore < confidenceFilter) {
        return false;
      }

      // Filtre par rôle
      if (
        roleFilter !== "all" &&
        !contact.role.toLowerCase().includes(roleFilter.toLowerCase())
      ) {
        return false;
      }

      // Filtre par recherche (nom ou rôle)
      if (
        searchTerm &&
        !contact.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !contact.role.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Filtre "sélectionnés uniquement"
      if (showOnlySelected && !selectedContacts.includes(contact.name)) {
        return false;
      }

      return true;
    });
  }, [
    contacts,
    confidenceFilter,
    roleFilter,
    searchTerm,
    selectedContacts,
    showOnlySelected,
  ]);

  // Sélection/désélection d'un contact
  const toggleContactSelection = (contactName) => {
    if (selectedContacts.includes(contactName)) {
      setSelectedContacts(
        selectedContacts.filter((name) => name !== contactName)
      );
    } else {
      setSelectedContacts([...selectedContacts, contactName]);
    }
  };

  // Sélection/désélection de tous les contacts filtrés
  const toggleSelectAll = () => {
    if (filteredContacts.length === selectedContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((contact) => contact.name));
    }
  };

  // Export des contacts sélectionnés au format CSV
  const exportContacts = () => {
    const contactsToExport = filteredContacts.filter(
      (contact) => selectedContacts.includes(contact.name) || !showOnlySelected
    );

    if (contactsToExport.length === 0) {
      alert("Aucun contact à exporter.");
      return;
    }

    // Créer les entêtes CSV
    const headers = [
      "Nom",
      "Rôle",
      "Entreprise",
      "Score de confiance",
      "Sources",
    ];

    // Créer les lignes CSV
    const rows = contactsToExport.map((contact) => [
      contact.name,
      contact.role,
      contact.company,
      contact.confidenceScore.toFixed(2),
      contact.sources.map((s) => s.title).join(" | "),
    ]);

    // Assembler le contenu CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `contacts_schneider_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rendu de l'interface
  return (
    <>
      {isLoadingRss && (
        <div className="premium-loading-overlay">
          <div className="premium-spinner"></div>
          <p>Mise à jour des actualités et extraction des contacts...</p>
        </div>
      )}

      <div className="premium-contacts-header">
        <h2 className="premium-section-title">
          Contacts détectés dans les actualités
          {contacts.length > 0 && (
            <span className="contacts-count">({contacts.length})</span>
          )}
        </h2>

        <div className="premium-contacts-actions">
          <button
            className="premium-export-button"
            onClick={exportContacts}
            disabled={showOnlySelected && selectedContacts.length === 0}
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
            {showOnlySelected
              ? `Exporter ${selectedContacts.length} contacts`
              : `Exporter tous les contacts (${filteredContacts.length})`}
          </button>
        </div>
      </div>

      <div className="premium-filters">
        <div className="premium-filter-controls">
          <div className="premium-selector">
            <label htmlFor="confidenceFilter">
              Score de confiance minimum:
            </label>
            <select
              id="confidenceFilter"
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
              className="premium-select"
            >
              <option value="0">Tous les scores</option>
              <option value="0.3">Faible (0.3+)</option>
              <option value="0.5">Moyen (0.5+)</option>
              <option value="0.7">Élevé (0.7+)</option>
              <option value="0.9">Très élevé (0.9+)</option>
            </select>
          </div>

          <div className="premium-selector">
            <label htmlFor="roleFilter">Rôle:</label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="premium-select"
            >
              <option value="all">Tous les rôles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="premium-selector">
            <label htmlFor="searchContact">Recherche:</label>
            <input
              id="searchContact"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un nom ou un rôle..."
              className="premium-select"
            />
          </div>

          <div className="premium-selector">
            <label htmlFor="showSelected">Affichage:</label>
            <div className="premium-checkbox-container">
              <input
                id="showSelected"
                type="checkbox"
                checked={showOnlySelected}
                onChange={() => setShowOnlySelected(!showOnlySelected)}
                className="premium-checkbox"
              />
              <label htmlFor="showSelected" className="premium-checkbox-label">
                Afficher uniquement les contacts sélectionnés (
                {selectedContacts.length})
              </label>
            </div>
          </div>
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
      </div>

      {filteredContacts.length > 0 ? (
        <div className="premium-contacts-container">
          <div className="premium-contacts-header-row">
            <div className="premium-contact-checkbox">
              <input
                type="checkbox"
                checked={
                  selectedContacts.length === filteredContacts.length &&
                  filteredContacts.length > 0
                }
                onChange={toggleSelectAll}
                id="selectAll"
                className="premium-checkbox"
              />
              <label htmlFor="selectAll" className="premium-checkbox-label">
                Tout sélectionner
              </label>
            </div>
            <div className="premium-contact-name-header">Nom</div>
            <div className="premium-contact-role-header">Rôle</div>
            <div className="premium-contact-score-header">Confiance</div>
            <div className="premium-contact-sources-header">Sources</div>
          </div>

          <div className="premium-contacts-list">
            {filteredContacts.map((contact, index) => (
              <div
                key={`${contact.name}-${index}`}
                className={`premium-contact-card ${
                  selectedContacts.includes(contact.name) ? "selected" : ""
                }`}
              >
                <div className="premium-contact-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.name)}
                    onChange={() => toggleContactSelection(contact.name)}
                    id={`contact-${index}`}
                    className="premium-checkbox"
                  />
                  <label
                    htmlFor={`contact-${index}`}
                    className="premium-checkbox-label visually-hidden"
                  >
                    Sélectionner {contact.name}
                  </label>
                </div>

                <div className="premium-contact-name">
                  <span>{contact.name}</span>
                  <span className="premium-contact-company">
                    {contact.company}
                  </span>
                </div>

                <div className="premium-contact-role">
                  {contact.role === "Poste non spécifié" ? (
                    <span className="premium-contact-unknown-role">
                      Rôle non spécifié
                    </span>
                  ) : (
                    contact.role
                  )}
                </div>

                <div className="premium-contact-score">
                  <div
                    className={`premium-confidence-badge ${getConfidenceClass(
                      contact.confidenceScore
                    )}`}
                    title={`Score de confiance: ${(
                      contact.confidenceScore * 100
                    ).toFixed(0)}%`}
                  >
                    {(contact.confidenceScore * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="premium-contact-sources">
                  {contact.sources.map((source, srcIdx) => (
                    <div key={srcIdx} className="premium-contact-source">
                      {source.link ? (
                        <a
                          href={source.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="premium-contact-source-link"
                          title={source.title}
                        >
                          {truncateText(source.title, 60)}
                          <span className="premium-contact-source-date">
                            {source.date}
                          </span>
                        </a>
                      ) : (
                        <span title={source.title}>
                          {truncateText(source.title, 60)}
                          <span className="premium-contact-source-date">
                            {source.date}
                          </span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
          {contacts.length === 0 ? (
            <div className="empty-state-text">
              Aucun contact n'a été détecté dans les actualités.
              <br />
              <small>
                Essayez de rafraîchir les actualités ou ajustez les filtres.
              </small>
            </div>
          ) : (
            <div className="empty-state-text">
              Aucun contact ne correspond aux critères de filtrage actuels.
              <br />
              <button
                className="premium-button premium-button-small"
                onClick={() => {
                  setConfidenceFilter(0);
                  setRoleFilter("all");
                  setSearchTerm("");
                  setShowOnlySelected(false);
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// Utilitaire pour tronquer un texte
function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

// Utilitaire pour déterminer la classe CSS basée sur le score de confiance
function getConfidenceClass(score) {
  if (score >= 0.9) return "confidence-very-high";
  if (score >= 0.7) return "confidence-high";
  if (score >= 0.5) return "confidence-medium";
  return "confidence-low";
}

export default ContactsTabContent;
