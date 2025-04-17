import React, { useState, useMemo } from "react";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Composant pour afficher une liste de contacts avec filtres et actions
 * Version améliorée avec un design plus harmonieux et user-friendly
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.contacts - Liste des contacts à afficher
 * @param {boolean} props.isLoadingRss - Indicateur de chargement des flux RSS
 * @param {boolean} props.isImportedList - Indique si la liste provient d'un import Excel
 * @returns {JSX.Element} Liste de contacts filtrables et exportables
 */
const ContactList = ({ contacts, isLoadingRss, isImportedList = false }) => {
  // États pour le filtrage et la sélection
  const [confidenceFilter, setConfidenceFilter] = useState(0.5);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Extraction de tous les rôles uniques pour le filtre
  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    contacts.forEach((contact) => {
      // Extraire le type de poste principal (ex: Directeur, CEO, etc.)
      const mainRole = contact.role.split(" ")[0];
      if (mainRole && mainRole !== "Poste" && mainRole !== "non") {
        roles.add(mainRole);
      }
    });
    return Array.from(roles).sort();
  }, [contacts]);

  // Filtrage des contacts
  const filteredContacts = useMemo(() => {
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

      // Filtre par recherche
      const searchText = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (contact.fullName &&
          contact.fullName.toLowerCase().includes(searchText)) ||
        (contact.name && contact.name.toLowerCase().includes(searchText)) ||
        contact.role.toLowerCase().includes(searchText) ||
        (contact.department &&
          contact.department.toLowerCase().includes(searchText)) ||
        (contact.company && contact.company.toLowerCase().includes(searchText)) ||
        (contact.email && contact.email.toLowerCase().includes(searchText));

      // Filtre "sélectionnés uniquement"
      const isSelected = selectedContacts.includes(
        contact.name || contact.fullName
      );
      if (showOnlySelected && !isSelected) {
        return false;
      }

      return matchesSearch;
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
    const name = contactName.name || contactName.fullName || contactName;
    if (selectedContacts.includes(name)) {
      setSelectedContacts(
        selectedContacts.filter((selectedName) => selectedName !== name)
      );
    } else {
      setSelectedContacts([...selectedContacts, name]);
    }
  };

  // Sélection/désélection de tous les contacts filtrés
  const toggleSelectAll = () => {
    if (filteredContacts.length === selectedContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(
        filteredContacts.map((contact) => contact.name || contact.fullName)
      );
    }
  };

  // Export des contacts sélectionnés
  const exportContacts = () => {
    // Filtrer les contacts à exporter
    const contactsToExport = filteredContacts.filter(
      (contact) =>
        selectedContacts.includes(contact.name || contact.fullName) ||
        !showOnlySelected
    );

    if (contactsToExport.length === 0) {
      alert("Aucun contact à exporter.");
      return;
    }

    // Créer les entêtes CSV
    const headers = [
      "Full Name",
      "Role",
      "Email",
      "Company",
      "Department",
      "Phone",
      "Sources",
    ];

    // Créer les lignes CSV
    const rows = contactsToExport.map((contact) => [
      contact.fullName || contact.name,
      contact.role,
      contact.email || "",
      contact.company,
      contact.department || "",
      contact.phone || "",
      (contact.sources || []).map((s) => s.title).join(" | "),
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

  return (
    <>
      {isLoadingRss && (
        <div className="premium-loading-overlay">
          <LoadingSpinner size="large" />
          <p>Mise à jour des actualités et extraction des contacts...</p>
        </div>
      )}

      <div className="premium-contacts-header">
        <h2 className="premium-section-title">
          Contacts {isImportedList ? "importés" : "détectés"}
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
        <div className="premium-contacts-table-wrapper">
          <table className="premium-contacts-table">
            <thead>
              <tr>
                <th className="select-column">
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
                  <label htmlFor="selectAll" className="premium-checkbox-label visually-hidden">
                    Tout sélectionner
                  </label>
                </th>
                <th className="name-column">Full Name</th>
                <th className="role-column">Role</th>
                <th className="email-column">Email</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact, index) => (
                <tr 
                  key={`${contact.name || contact.fullName}-${index}`}
                  className={selectedContacts.includes(contact.name || contact.fullName) ? "selected-row" : ""}
                >
                  <td className="select-column">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(
                        contact.name || contact.fullName
                      )}
                      onChange={() => toggleContactSelection(contact)}
                      id={`contact-${index}`}
                      className="premium-checkbox"
                    />
                    <label
                      htmlFor={`contact-${index}`}
                      className="premium-checkbox-label visually-hidden"
                    >
                      Sélectionner {contact.name || contact.fullName}
                    </label>
                  </td>
                  <td className="name-column">{contact.fullName || contact.name}</td>
                  <td className="role-column">
                    {contact.role === "Poste non spécifié" ? (
                      <span className="premium-contact-unknown-role">
                        Rôle non spécifié
                      </span>
                    ) : (
                      contact.role
                    )}
                  </td>
                  <td className="email-column">
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="contact-email-link">
                        {contact.email}
                      </a>
                    ) : (
                      <span className="premium-contact-empty">Email non disponible</span>
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
          <div className="empty-message">
            {contacts.length === 0
              ? "Aucun contact n'a été détecté."
              : "Aucun contact ne correspond aux critères de filtrage actuels."}
          </div>
          {contacts.length > 0 && (
            <button
              className="reset-button"
              onClick={() => {
                setConfidenceFilter(0);
                setRoleFilter("all");
                setSearchTerm("");
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Style amélioré pour le tableau de contacts */}
      <style jsx>{`
        .premium-contacts-table-wrapper {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          background: var(--surface);
          margin-bottom: 24px;
        }
        
        .premium-contacts-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        .premium-contacts-table th {
          background-color: var(--glass-bg);
          color: var(--text-secondary);
          font-weight: 600;
          text-align: left;
          padding: 16px;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 1px solid var(--divider);
        }
        
        .premium-contacts-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--divider);
          vertical-align: middle;
        }
        
        .premium-contacts-table tbody tr {
          transition: background-color 0.15s ease;
        }
        
        .premium-contacts-table tbody tr:hover {
          background-color: rgba(0, 113, 243, 0.04);
        }
        
        .premium-contacts-table tbody tr.selected-row {
          background-color: rgba(0, 113, 243, 0.08);
        }
        
        .premium-contacts-table tbody tr.selected-row:hover {
          background-color: rgba(0, 113, 243, 0.12);
        }
        
        .select-column {
          width: 48px;
          text-align: center;
        }
        
        .name-column {
          width: 20%;
          min-width: 180px;
          font-weight: 500;
        }
        
        .role-column {
          width: 50%;
        }
        
        .email-column {
          width: 30%;
          min-width: 200px;
        }
        
        .contact-email-link {
          color: var(--primary);
          text-decoration: none;
          transition: color 0.15s ease;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 13px;
        }
        
        .contact-email-link:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }
        
        .premium-contact-unknown-role {
          color: var(--text-tertiary);
          font-style: italic;
        }
        
        .premium-contact-empty {
          color: var(--text-tertiary);
          font-style: italic;
          font-size: 13px;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .email-column {
            display: none;
          }
          
          .role-column {
            width: 70%;
          }
        }
        
        @media (max-width: 768px) {
          .premium-contacts-table th,
          .premium-contacts-table td {
            padding: 12px 8px;
          }
          
          .name-column {
            min-width: 120px;
          }
        }
        
        @media (max-width: 576px) {
          .premium-contacts-table-wrapper {
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
          
          .premium-contacts-table {
            font-size: 13px;
          }
          
          .role-column {
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      `}</style>
    </>
  );
};

export default ContactList;
