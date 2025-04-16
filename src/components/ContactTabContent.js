import React, { useState, useEffect, useCallback } from "react";
import { contactExtractionService } from "../services/contactExtractionService";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Composant amélioré pour afficher les contacts extraits des actualités et importés depuis Excel
 * Format épuré pour usage commercial et reporting
 */
const ContactTabContent = ({ combinedRelevanceMatrix, data, isLoadingRss }) => {
  // États
  const [contacts, setContacts] = useState([]);
  const [excelContacts, setExcelContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [missingRoles, setMissingRoles] = useState([]);
  const [missingRoleContacts, setMissingRoleContacts] = useState([]);
  const [fileImported, setFileImported] = useState(false);
  const [showMissingRoles, setShowMissingRoles] = useState(false);

  // Référence au fichier input (caché)
  const fileInputRef = React.useRef(null);

  // Extraction des contacts à partir des actualités
  useEffect(() => {
    const extractContacts = async () => {
      setLoading(true);
      try {
        // Préparer les actualités pour l'extraction
        const allNews = [];
        const processedNews = new Set();

        combinedRelevanceMatrix.forEach((item) => {
          if (!processedNews.has(item.news)) {
            processedNews.add(item.news);

            allNews.push({
              title: item.news,
              description: item.newsDescription || "",
              date: item.newsDate,
              link: item.newsLink || "",
              category: item.newsCategory,
            });
          }
        });

        // Extraire les contacts
        const extractedContacts =
          contactExtractionService.extractContactsFromNews(
            allNews,
            "Schneider Electric"
          );
        setContacts(extractedContacts);

        // Préparer les filtres de rôle
        const roles = new Set();
        extractedContacts.forEach((contact) => {
          if (contact.role && contact.role !== "Poste non spécifié") {
            const mainRole = contact.role.split(" ")[0];
            if (mainRole) {
              roles.add(mainRole);
            }
          }
        });
        setAvailableRoles(Array.from(roles).sort());

        // Identifier les rôles manquants à partir des actualités
        identifyMissingRoles(extractedContacts, allNews);
      } catch (error) {
        console.error("Erreur lors de l'extraction des contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    extractContacts();
  }, [combinedRelevanceMatrix]);

  // Identifier les fonctions (rôles) mentionnées dans les actualités mais sans contact associé
  const identifyMissingRoles = (extractedContacts, allNews) => {
    const allRoles = new Set();
    const rolesWithContacts = new Set();

    // Extraire les mots-clés liés aux fonctions/postes depuis les actualités
    const roleKeywords = [
      "Directeur",
      "Directrice",
      "Manager",
      "Chief",
      "Officer",
      "Head",
      "Responsable",
      "VP",
      "Vice",
      "Président",
      "PDG",
      "CEO",
      "COO",
      "CFO",
      "DSI",
      "CIO",
      "CISO",
      "CTO",
      "CDO",
      "CMO",
      "DRH",
      "DG",
    ];

    // Parcourir toutes les actualités pour trouver des mentions de rôles
    allNews.forEach((news) => {
      const fullText = `${news.title} ${news.description}`;

      roleKeywords.forEach((keyword) => {
        // Recherche de motifs comme "Directeur des Opérations" ou "Chief Digital Officer"
        const regex = new RegExp(
          `${keyword}\\s+(?:de|des|du|de la|d'|of|for)?\\s+[A-Z][a-zÀ-ÿ]+(?:\\s+[A-Z][a-zÀ-ÿ]+)*`,
          "gi"
        );
        const matches = fullText.match(regex);

        if (matches) {
          matches.forEach((match) => {
            allRoles.add(match.trim());
          });
        }
      });
    });

    // Identifier les rôles qui ont déjà des contacts
    extractedContacts.forEach((contact) => {
      if (contact.role && contact.role !== "Poste non spécifié") {
        Array.from(allRoles).forEach((role) => {
          if (
            role.toLowerCase().includes(contact.role.toLowerCase()) ||
            contact.role.toLowerCase().includes(role.toLowerCase())
          ) {
            rolesWithContacts.add(role);
          }
        });
      }
    });

    // Identifier les rôles sans contacts
    const missingRolesList = Array.from(allRoles).filter(
      (role) =>
        !Array.from(rolesWithContacts).some(
          (r) =>
            role.toLowerCase().includes(r.toLowerCase()) ||
            r.toLowerCase().includes(role.toLowerCase())
        )
    );

    setMissingRoles(missingRolesList);
  };

  // Importer des contacts depuis un fichier Excel ou CSV
  const importExcelContacts = useCallback(
    async (file) => {
      setImportLoading(true);
      try {
        // Détecter l'extension du fichier
        const fileExtension = file.split(".").pop().toLowerCase();
        console.log(`Type de fichier détecté: ${fileExtension}`);

        const fileContent = await window.fs.readFile(file, {
          encoding: "utf8",
        });
        console.log(
          `Contenu du fichier récupéré, taille: ${fileContent.length}`
        );

        // Approche différente selon le type de fichier
        if (fileExtension === "csv") {
          // Utiliser Papa Parse pour les fichiers CSV
          import("papaparse")
            .then((Papa) => {
              const parseResult = Papa.default.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(),
              });

              if (parseResult.errors.length > 0) {
                console.error(
                  "Erreurs lors du parsing CSV:",
                  parseResult.errors
                );
                alert(
                  `Erreur lors du parsing CSV: ${parseResult.errors[0].message}`
                );
                setImportLoading(false);
                return;
              }

              processImportedData(parseResult.data);
            })
            .catch((err) => {
              console.error("Erreur lors du chargement de Papa Parse:", err);
              alert(
                "Erreur lors du chargement de la bibliothèque de parsing CSV."
              );
              setImportLoading(false);
            });
        } else if (["xlsx", "xls"].includes(fileExtension)) {
          // Pour les fichiers Excel, essayer d'utiliser SheetJS s'il est disponible
          try {
            // Essayer de charger dynamiquement la bibliothèque XLSX
            const XLSX = await import("xlsx");

            // Convertir la chaîne de caractères en ArrayBuffer
            const buf = new ArrayBuffer(fileContent.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < fileContent.length; i++) {
              view[i] = fileContent.charCodeAt(i) & 0xff;
            }

            const workbook = XLSX.read(buf, {
              type: "array",
              cellDates: true,
            });

            // Rechercher l'onglet CRM_Contacts ou utiliser le premier onglet si non trouvé
            const sheetName = workbook.SheetNames.includes("CRM_Contacts")
              ? "CRM_Contacts"
              : workbook.SheetNames[0];

            console.log(`Utilisation de l'onglet: ${sheetName}`);

            // Récupérer la feuille
            const worksheet = workbook.Sheets[sheetName];

            // Convertir la feuille en JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            processImportedData(jsonData);
          } catch (xlsxError) {
            console.error("Erreur avec SheetJS:", xlsxError);

            // Fallback: essayer d'analyser comme un CSV si SheetJS échoue
            import("papaparse")
              .then((Papa) => {
                alert(
                  "Le fichier Excel n'a pas pu être traité directement. Tentative d'analyse comme CSV..."
                );

                const parseResult = Papa.default.parse(fileContent, {
                  header: true,
                  skipEmptyLines: true,
                });

                processImportedData(parseResult.data);
              })
              .catch((err) => {
                console.error("Erreur lors du fallback CSV:", err);
                alert(
                  "Impossible de traiter le fichier. Veuillez utiliser un format CSV simple."
                );
                setImportLoading(false);
              });
          }
        } else {
          // Format non supporté
          alert(
            `Format de fichier non supporté: ${fileExtension}. Veuillez utiliser un fichier Excel (.xlsx, .xls) ou CSV (.csv)`
          );
          setImportLoading(false);
        }
      } catch (error) {
        console.error("Erreur lors de l'importation des contacts:", error);
        alert(
          `Une erreur s'est produite lors de l'importation des contacts: ${error.message}`
        );
        setImportLoading(false);
      }
    },
    [missingRoles]
  );

  // Fonction pour traiter les données importées (commune à Excel et CSV)
  const processImportedData = useCallback(
    (data) => {
      try {
        console.log("Données importées:", data.slice(0, 2)); // Log des 2 premières lignes pour debug

        if (!data || data.length === 0) {
          alert("Le fichier importé ne contient pas de données.");
          setImportLoading(false);
          return;
        }

        // Analyser les en-têtes disponibles
        const firstRow = data[0];
        const availableHeaders = Object.keys(firstRow);
        console.log("En-têtes disponibles:", availableHeaders);

        // Créer des correspondances pour les champs importants
        const headerMap = {
          role: availableHeaders.find((h) =>
            /fonction|function|title|poste|role|job/i.test(h)
          ),
          department: availableHeaders.find((h) =>
            /département|department|dept|direction/i.test(h)
          ),
          email: availableHeaders.find((h) =>
            /email|mail|courriel|e-mail/i.test(h)
          ),
          phone: availableHeaders.find((h) =>
            /téléphone|telephone|phone|mobile|tél/i.test(h)
          ),
          business: availableHeaders.find((h) =>
            /business|bu|business unit|unité/i.test(h)
          ),
          company: availableHeaders.find((h) =>
            /entreprise|company|société|organization|organisation/i.test(h)
          ),
          industry: availableHeaders.find((h) =>
            /industry|industrie|secteur|sector/i.test(h)
          ),
        };

        console.log("Correspondance des en-têtes:", headerMap);

        // Normaliser les données
        const normalizedContacts = data
          .map((row) => {
            // Extraire les valeurs avec gestion des cas où les champs n'existent pas
            const getField = (key) => {
              const headerKey = headerMap[key];
              return headerKey && row[headerKey] ? row[headerKey] : "";
            };

            return {
              // Ne pas inclure le nom comme demandé
              role: getField("role") || "Poste non spécifié",
              company: getField("company") || "Schneider Electric",
              confidenceScore: 1.0, // Score maximum pour les contacts importés
              sources: [],
              importedFromExcel: true,
              department: getField("department"),
              phone: getField("phone"),
              email: getField("email"),
              business: getField("business"),
              industry: getField("industry"),
            };
          })
          .filter(
            (contact) =>
              // Filtrer les lignes vides ou avec seulement des informations non significatives
              contact.role !== "Poste non spécifié" ||
              contact.email ||
              contact.department ||
              contact.business
          );

        // Ajouter les contacts importés et marquer l'import comme réussi
        setExcelContacts(normalizedContacts);
        setFileImported(true);

        // Identifier les rôles manquants qui pourraient être comblés par les contacts importés
        matchMissingRolesWithImportedContacts(normalizedContacts);

        alert(
          `${normalizedContacts.length} contacts ont été importés avec succès!`
        );
      } catch (error) {
        console.error(
          "Erreur lors du traitement des données importées:",
          error
        );
        alert(`Erreur lors du traitement des données: ${error.message}`);
      } finally {
        setImportLoading(false);
      }
    },
    [matchMissingRolesWithImportedContacts]
  );

  // Faire correspondre les rôles manquants avec les contacts importés
  const matchMissingRolesWithImportedContacts = (importedContacts) => {
    const matchedContacts = [];

    missingRoles.forEach((role) => {
      const matchingContacts = importedContacts.filter((contact) => {
        const roleText = role.toLowerCase();
        const contactRole = (contact.role || "").toLowerCase();
        return contactRole.includes(roleText) || roleText.includes(contactRole);
      });

      if (matchingContacts.length > 0) {
        matchingContacts.forEach((contact) => {
          matchedContacts.push({
            ...contact,
            relevantRole: role,
          });
        });
      }
    });

    setMissingRoleContacts(matchedContacts);
  };

  // Déclencher l'ouverture du sélecteur de fichier
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Gérer la sélection du fichier
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Créer un FileReader pour lire le contenu du fichier
        const fileReader = new FileReader();

        fileReader.onload = function (event) {
          const fileContent = event.target.result;

          // Si c'est un CSV, le parser manuellement
          if (file.name.toLowerCase().endsWith(".csv")) {
            // Fonction simple pour parser un CSV
            const parseCSV = (csvText) => {
              // Séparer les lignes
              const lines = csvText
                .split(/\r?\n/)
                .filter((line) => line.trim());

              // Détecter le séparateur (virgule ou point-virgule)
              const firstLine = lines[0];
              const separator = firstLine.includes(";") ? ";" : ",";

              // Extraire les en-têtes (première ligne)
              const headers = lines[0]
                .split(separator)
                .map((header) => header.trim().replace(/"/g, ""));

              // Créer un tableau d'objets avec les données
              const data = [];
              for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(separator);

                // Ignorer les lignes vides ou incomplètes
                if (values.length !== headers.length) {
                  continue;
                }

                const row = {};
                for (let j = 0; j < headers.length; j++) {
                  row[headers[j]] = values[j].replace(/"/g, "").trim();
                }

                data.push(row);
              }

              return {
                data,
                errors: [],
              };
            };

            const parseResult = parseCSV(fileContent);

            if (parseResult.errors && parseResult.errors.length > 0) {
              console.error("Erreurs lors du parsing CSV:", parseResult.errors);
              alert(`Erreur lors du parsing CSV: ${parseResult.errors[0]}`);
              return;
            }

            processImportedData(parseResult.data);
          } else {
            // Pour les fichiers Excel, on doit les convertir d'abord
            alert(
              "Les fichiers Excel (.xlsx/.xls) ne sont pas supportés directement. " +
                "Veuillez convertir votre fichier Excel au format CSV et réessayer. " +
                "Pour cela: dans Excel, cliquez sur Fichier > Enregistrer sous > CSV."
            );
          }
        };

        fileReader.onerror = function () {
          alert("Erreur lors de la lecture du fichier.");
        };

        // Lire le fichier comme texte
        fileReader.readAsText(file);

        // Réinitialiser l'élément input pour permettre de sélectionner le même fichier
        e.target.value = null;
      } catch (error) {
        console.error("Erreur lors du traitement du fichier:", error);
        alert(`Une erreur s'est produite: ${error.message}`);
        e.target.value = null;
      }
    }
  };

  // Filtrer les contacts
  const getFilteredContacts = () => {
    // Combiner les contacts extraits et importés
    const allContacts = [
      ...contacts,
      ...excelContacts.filter(
        (ec) =>
          !contacts.some((c) => {
            // Éviter les doublons (si la fonction et l'entreprise sont identiques)
            return c.role === ec.role && c.company === ec.company;
          })
      ),
    ];

    return allContacts.filter((contact) => {
      // Filtre par recherche
      const matchesSearch =
        searchTerm === "" ||
        contact.role.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtre par rôle
      const matchesRole =
        filterRole === "all" ||
        (contact.role &&
          contact.role.toLowerCase().startsWith(filterRole.toLowerCase()));

      return matchesSearch && matchesRole;
    });
  };

  // Ajouter les offres pertinentes
  const contactsWithOffers = () => {
    const filteredContacts = getFilteredContacts();

    return filteredContacts.map((contact) => {
      const relatedOffers = new Set();

      // Pour les contacts extraits des actualités
      if (contact.sources) {
        contact.sources.forEach((source) => {
          combinedRelevanceMatrix.forEach((item) => {
            if (item.news === source.title) {
              const offers = item.offerDetail.split(", ");
              offers.forEach((offer) => relatedOffers.add(offer));
            }
          });
        });
      }

      // Pour les contacts importés, essayer de trouver des offres pertinentes
      // basées sur leur rôle ou département
      if (contact.importedFromExcel) {
        const roleAndDept =
          `${contact.role} ${contact.department} ${contact.business}`.toLowerCase();

        combinedRelevanceMatrix.forEach((item) => {
          const offers = item.offerDetail.split(", ");
          offers.forEach((offer) => {
            if (
              roleAndDept.includes(offer.toLowerCase()) ||
              offer.toLowerCase().includes(contact.role.toLowerCase())
            ) {
              relatedOffers.add(offer);
            }
          });
        });
      }

      return {
        ...contact,
        relatedOffers: Array.from(relatedOffers),
      };
    });
  };

  // Trier les contacts par pertinence (score de confiance, puis nombre d'offres associées)
  const sortedContacts = () => {
    const contactsWithInfo = contactsWithOffers();

    return [...contactsWithInfo].sort((a, b) => {
      // D'abord par score de confiance
      if (b.confidenceScore !== a.confidenceScore) {
        return b.confidenceScore - a.confidenceScore;
      }

      // Puis par nombre d'offres associées
      const aOffers = a.relatedOffers ? a.relatedOffers.length : 0;
      const bOffers = b.relatedOffers ? b.relatedOffers.length : 0;

      if (bOffers !== aOffers) {
        return bOffers - aOffers;
      }

      // Enfin par rôle
      return a.role.localeCompare(b.role);
    });
  };

  // Gestion de la sélection des contacts
  const toggleContact = (contactIndex) => {
    const allSortedContacts = sortedContacts();
    const contact = allSortedContacts[contactIndex];

    if (selectedContacts.includes(contactIndex)) {
      setSelectedContacts(
        selectedContacts.filter((idx) => idx !== contactIndex)
      );
    } else {
      setSelectedContacts([...selectedContacts, contactIndex]);
    }
  };

  // Export CSV des contacts sélectionnés
  const exportContacts = () => {
    const allSortedContacts = sortedContacts();
    const contactsToExport = selectedContacts.map(
      (index) => allSortedContacts[index]
    );

    if (contactsToExport.length === 0) {
      alert("Veuillez sélectionner des contacts à exporter");
      return;
    }

    // Créer le contenu CSV
    const headers = [
      "Fonction",
      "Entreprise",
      "Offres associées",
      "Email",
      "Téléphone",
      "Département",
      "Business Unit",
      "Industrie",
      "Source",
    ];
    const rows = contactsToExport.map((contact) => [
      contact.role,
      contact.company,
      contact.relatedOffers.join(" | "),
      contact.email || "",
      contact.phone || "",
      contact.department || "",
      contact.business || "",
      contact.industry || "",
      contact.sources
        ? contact.sources.map((s) => s.title).join(" | ")
        : "Importé",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
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

  // Onglets pour alterner entre contacts et rôles manquants
  const renderTabs = () => (
    <div className="contacts-tabs">
      <button
        className={`contacts-tab-button ${!showMissingRoles ? "active" : ""}`}
        onClick={() => setShowMissingRoles(false)}
      >
        Contacts identifiés
      </button>
      <button
        className={`contacts-tab-button ${showMissingRoles ? "active" : ""}`}
        onClick={() => setShowMissingRoles(true)}
      >
        Rôles manquants {missingRoles.length > 0 && `(${missingRoles.length})`}
      </button>
    </div>
  );

  // Rendu du contenu principal
  return (
    <div className="premium-contacts-tab">
      {/* Overlay de chargement */}
      {(loading || importLoading || isLoadingRss) && (
        <div className="premium-loading-overlay">
          <LoadingSpinner size="large" color="primary" />
          <p>
            {importLoading
              ? "Importation des contacts..."
              : "Extraction des contacts en cours..."}
          </p>
        </div>
      )}

      {/* En-tête avec actions */}
      <div className="contacts-header">
        <h2 className="contacts-title">
          Contacts Schneider Electric
          {contacts.length > 0 &&
            !showMissingRoles &&
            ` (${contacts.length + excelContacts.length})`}
          {showMissingRoles && ` - Rôles à rechercher (${missingRoles.length})`}
        </h2>
        <div className="contacts-actions">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
          />
          <button className="import-button" onClick={handleImportClick}>
            {fileImported
              ? "Mettre à jour les contacts"
              : "Importer contacts (Excel)"}
          </button>
          <button
            className="export-button"
            onClick={exportContacts}
            disabled={selectedContacts.length === 0}
          >
            Exporter {selectedContacts.length} contact
            {selectedContacts.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>

      {/* Onglets */}
      {renderTabs()}

      {/* Filtres (uniquement sur l'onglet des contacts) */}
      {!showMissingRoles && (
        <div className="contacts-filters">
          <div className="filter-group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une fonction..."
              className="search-input"
            />

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="role-select"
            >
              <option value="all">Toutes les fonctions</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {searchTerm && (
            <div className="search-filter">
              <span>
                Recherche: <strong>{searchTerm}</strong>
              </span>
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contenu des onglets */}
      {showMissingRoles ? (
        /* Affichage des rôles manquants */
        <div className="missing-roles-container">
          {missingRoles.length === 0 ? (
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
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="empty-message">
                Aucun rôle manquant identifié dans les actualités.
              </p>
            </div>
          ) : (
            <>
              <p className="missing-roles-info">
                Les rôles suivants ont été mentionnés dans les actualités mais
                aucun contact n'a été identifié.
                {missingRoleContacts.length > 0 &&
                  ` ${missingRoleContacts.length} contacts potentiels ont été trouvés dans l'import Excel.`}
              </p>

              <div className="missing-roles-list">
                {missingRoles.map((role, index) => {
                  // Trouver des contacts potentiels pour ce rôle
                  const potentialContacts = missingRoleContacts.filter(
                    (c) => c.relevantRole === role
                  );

                  return (
                    <div key={index} className="missing-role-item">
                      <div className="missing-role-header">
                        <h3>{role}</h3>
                        {potentialContacts.length > 0 && (
                          <span className="potential-matches-badge">
                            {potentialContacts.length} contact
                            {potentialContacts.length > 1 ? "s" : ""} trouvé
                            {potentialContacts.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {potentialContacts.length > 0 && (
                        <div className="potential-contacts">
                          {potentialContacts.map((contact, idx) => (
                            <div key={idx} className="potential-contact-card">
                              <div className="potential-contact-info">
                                <div>
                                  <span className="potential-contact-role">
                                    {contact.role}
                                  </span>
                                  {contact.department && (
                                    <span className="potential-contact-dept">
                                      {contact.department}
                                    </span>
                                  )}
                                </div>
                                <div className="potential-contact-details">
                                  {contact.email && (
                                    <span className="potential-contact-email">
                                      {contact.email}
                                    </span>
                                  )}
                                  {contact.phone && (
                                    <span className="potential-contact-phone">
                                      {contact.phone}
                                    </span>
                                  )}
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
            </>
          )}
        </div>
      ) : /* Tableau des contacts */
      sortedContacts().length > 0 ? (
        <div className="contacts-table-container">
          <table className="contacts-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={
                      selectedContacts.length === sortedContacts().length &&
                      sortedContacts().length > 0
                    }
                    onChange={() => {
                      if (selectedContacts.length === sortedContacts().length) {
                        setSelectedContacts([]);
                      } else {
                        setSelectedContacts(
                          Array.from(Array(sortedContacts().length).keys())
                        );
                      }
                    }}
                  />
                </th>
                <th>Fonction</th>
                <th>Offres associées</th>
                {/* Colonnes supplémentaires pour les contacts importés */}
                <th>Email</th>
                <th>Téléphone</th>
                <th>Business Unit</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {sortedContacts().map((contact, index) => (
                <tr
                  key={index}
                  className={
                    selectedContacts.includes(index) ? "selected-row" : ""
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(index)}
                      onChange={() => toggleContact(index)}
                    />
                  </td>
                  <td>
                    <div className="contact-role">
                      <span className="role-title">{contact.role}</span>
                      {contact.department && (
                        <span className="role-department">
                          {contact.department}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="offer-tags">
                      {contact.relatedOffers.slice(0, 2).map((offer, idx) => (
                        <span key={idx} className="offer-tag">
                          {offer}
                        </span>
                      ))}
                      {contact.relatedOffers.length > 2 && (
                        <span className="offer-more">
                          +{contact.relatedOffers.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{contact.email || "-"}</td>
                  <td>{contact.phone || "-"}</td>
                  <td>{contact.business || "-"}</td>
                  <td>
                    {contact.importedFromExcel ? (
                      <span className="import-badge">Importé</span>
                    ) : contact.sources && contact.sources[0] ? (
                      <>
                        {contact.sources[0].link ? (
                          <a
                            href={contact.sources[0].link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-link"
                          >
                            {contact.sources[0].title.length > 30
                              ? contact.sources[0].title.substring(0, 30) +
                                "..."
                              : contact.sources[0].title}
                          </a>
                        ) : (
                          <span>
                            {contact.sources[0].title.length > 30
                              ? contact.sources[0].title.substring(0, 30) +
                                "..."
                              : contact.sources[0].title}
                          </span>
                        )}
                        {contact.sources.length > 1 && (
                          <span className="source-count">
                            +{contact.sources.length - 1}
                          </span>
                        )}
                      </>
                    ) : (
                      "-"
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
          <p className="empty-message">
            {loading
              ? "Extraction des contacts en cours..."
              : contacts.length === 0 && excelContacts.length === 0
              ? "Aucun contact n'a été identifié. Importez des contacts depuis un fichier Excel."
              : "Aucun contact ne correspond à vos critères de recherche."}
          </p>
          {!loading && contacts.length + excelContacts.length > 0 && (
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

      {/* Styles spécifiques pour ce composant */}
      <style jsx>{`
        .contacts-tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--divider);
        }

        .contacts-tab-button {
          padding: 12px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .contacts-tab-button.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .missing-roles-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .missing-roles-info {
          padding: 16px;
          background-color: rgba(0, 113, 243, 0.05);
          border-bottom: 1px solid var(--divider);
          font-size: 14px;
        }

        .missing-roles-list {
          padding: 16px;
        }

        .missing-role-item {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--divider);
        }

        .missing-role-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .missing-role-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .missing-role-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .potential-matches-badge {
          background-color: rgba(5, 150, 105, 0.1);
          color: var(--success);
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 100px;
        }

        .potential-contacts {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .potential-contact-card {
          background-color: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 6px;
          padding: 12px;
          transition: all 0.2s ease;
        }

        .potential-contact-card:hover {
          background-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .potential-contact-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .potential-contact-role {
          font-weight: 500;
          display: block;
        }

        .potential-contact-dept {
          font-size: 12px;
          color: var(--text-tertiary);
          display: block;
          margin-top: 2px;
        }

        .potential-contact-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }

        .potential-contact-email,
        .potential-contact-phone {
          color: var(--text-secondary);
        }

        .import-button {
          background-color: var(--primary);
          opacity: 0.9;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s;
        }

        .import-button:hover {
          opacity: 1;
        }

        .contact-role {
          display: flex;
          flex-direction: column;
        }

        .role-title {
          font-weight: 500;
        }

        .role-department {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }

        .import-badge {
          background-color: rgba(59, 130, 246, 0.1);
          color: var(--primary);
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 100px;
        }
      `}</style>
    </div>
  );
};

export default ContactTabContent;
